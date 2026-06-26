# main.py — PalmPay Auth API with MongoDB
import json, numpy as np, torch, io
from pathlib import Path
from PIL import Image
import torchvision.transforms as T
from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from datetime import datetime
import os

# ── Config ───────────────────────────────────────────────────────────────────
CONFIG_PATH = "palm_config.json"
if not os.path.exists(CONFIG_PATH):
    default_cfg = {
        "threshold": 0.82,
        "img_size": 128,
        "normalize": {"mean": [0.5], "std": [0.5]},
        "eer_percent": 1.52
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(default_cfg, f)

with open(CONFIG_PATH) as f:
    cfg = json.load(f)

# ── Thresholds ────────────────────────────────────────────────────────────────
# THRESHOLD: minimum cosine similarity to ACCEPT a user (anti false-positive)
# REJECT_FLOOR: if similarity is below this against anyone, it's clearly a bad scan
THRESHOLD   = cfg["threshold"]        # default 0.82
IMG_SIZE    = cfg["img_size"]         # default 128
MAX_SAMPLES = cfg.get("max_samples", 5)  # how many enrollment images to average
# Use environment variable for MongoDB URI if available
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/palmpay_wallet")

# ── MongoDB ──────────────────────────────────────────────────────────────────
client     = MongoClient(MONGO_URI)
db         = client["palmpay_wallet"]
users_col  = db["palm_embeddings"]

# ── Model ────────────────────────────────────────────────────────────────────
# Load model if it exists, otherwise use a placeholder or dummy implementation for embedding
MODEL_PATH = "palm_embedder_scripted.pt"
if os.path.exists(MODEL_PATH):
    model = torch.jit.load(MODEL_PATH, map_location="cpu")
    model.eval()
else:
    print(f"Warning: {MODEL_PATH} not found. Using dummy embeddings.")
    model = None

tf = T.Compose([
    T.Resize((IMG_SIZE, IMG_SIZE)),
    T.Grayscale(num_output_channels=1),
    T.ToTensor(),
    T.Normalize(mean=cfg["normalize"]["mean"], std=cfg["normalize"]["std"]),
])

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="PalmPay Auth API")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

# ── Helpers ──────────────────────────────────────────────────────────────────
def embed_image(file_bytes: bytes) -> np.ndarray:
    img    = Image.open(io.BytesIO(file_bytes)).convert("L")
    tensor = tf(img).unsqueeze(0)
    
    if model:
        with torch.no_grad():
            emb = model(tensor).numpy()[0]
    else:
        # Dummy embedding for testing if model is missing
        emb = np.random.rand(128).astype(np.float32)
        # Normalize dummy embedding
        emb = emb / np.linalg.norm(emb)
        
    return emb

def cosine(a, b):
    return float(np.dot(a, np.array(b)))   # both L2-normed

def mean_template(embeddings: list) -> list:
    """Average multiple L2-normed embeddings into a single mean template."""
    arr = np.array(embeddings)          # shape: (N, D)
    mean = arr.mean(axis=0)             # centroid
    norm = np.linalg.norm(mean)
    if norm < 1e-9:
        return mean.tolist()
    return (mean / norm).tolist()       # re-normalise so cosine still works

# ── Routes ───────────────────────────────────────────────────────────────────
@app.post("/enroll/{user_id}")
async def enroll(user_id: str, file: UploadFile = File(...)):
    """
    Multi-sample enrollment: call this endpoint up to MAX_SAMPLES times.
    Each call accumulates one embedding. Once MAX_SAMPLES are collected the
    mean template is computed and stored — making it robust to pose/lighting.
    Returns how many samples have been collected so far.
    """
    data = await file.read()
    emb  = embed_image(data).tolist()

    doc = users_col.find_one({"user_id": user_id}) or {}
    raw_samples = doc.get("raw_samples", [])   # individual scans
    raw_samples.append(emb)

    # Keep at most MAX_SAMPLES; drop the oldest if more arrive after that
    if len(raw_samples) > MAX_SAMPLES:
        raw_samples = raw_samples[-MAX_SAMPLES:]

    # Recompute the averaged template from all collected samples
    template = mean_template(raw_samples)

    users_col.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "raw_samples":  raw_samples,   # keep originals for future re-avg
                "embeddings":   [template],    # single averaged template for verify
                "updated_at":   datetime.utcnow(),
            },
            "$setOnInsert": {"created_at": datetime.utcnow(), "user_id": user_id},
        },
        upsert=True,
    )

    return {
        "status":      "enrolled" if len(raw_samples) >= MAX_SAMPLES else "collecting",
        "samples":     len(raw_samples),
        "max_samples": MAX_SAMPLES,
        "ready":       len(raw_samples) >= MAX_SAMPLES,
        "message":     f"Sample {len(raw_samples)}/{MAX_SAMPLES} captured."
                       + (" Template finalised!" if len(raw_samples) >= MAX_SAMPLES else
                          f" {MAX_SAMPLES - len(raw_samples)} more needed."),
    }


@app.post("/verify/{user_id}")
async def verify(user_id: str, file: UploadFile = File(...)):
    """
    Single-frame verify (fallback). Prefer /verify-multi for better accuracy.
    """
    doc = users_col.find_one({"user_id": user_id})
    if not doc or not doc.get("embeddings"):
        raise HTTPException(status_code=404, detail="User not enrolled")

    data  = await file.read()
    probe = embed_image(data)

    sims = [cosine(probe, e) for e in doc["embeddings"]]
    best = max(sims)
    return {
        "accepted":   bool(best >= THRESHOLD),
        "similarity": round(best, 4),
        "threshold":  THRESHOLD,
        "frames":     1,
    }


@app.post("/verify-multi/{user_id}")
async def verify_multi(user_id: str, files: List[UploadFile] = File(...)):
    """
    Multi-frame verify: accepts 2-5 frames captured during one 'long scan'.
    Each frame is embedded independently, then the probes are averaged into a
    single mean-probe before comparison — same robustness as multi-sample
    enrollment, completely transparent to the user.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No frames provided")

    doc = users_col.find_one({"user_id": user_id})
    if not doc or not doc.get("embeddings"):
        raise HTTPException(status_code=404, detail="User not enrolled")

    # Embed every received frame
    probe_embs = []
    for f in files:
        data = await f.read()
        probe_embs.append(embed_image(data))

    # Average the probe embeddings → one robust probe vector
    mean_probe = np.array(probe_embs).mean(axis=0)
    norm = np.linalg.norm(mean_probe)
    if norm > 1e-9:
        mean_probe = mean_probe / norm

    # Compare averaged probe against stored template(s)
    sims = [cosine(mean_probe, e) for e in doc["embeddings"]]
    best = max(sims)

    return {
        "accepted":   bool(best >= THRESHOLD),
        "similarity": round(best, 4),
        "threshold":  THRESHOLD,
        "frames":     len(probe_embs),
    }


@app.delete("/unenroll/{user_id}")
async def unenroll(user_id: str):
    """Remove all palm data for a user."""
    result = users_col.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "removed", "user_id": user_id}


@app.delete("/reset/{user_id}")
async def reset(user_id: str):
    """Wipe all samples + template so user can re-enroll from scratch."""
    users_col.delete_one({"user_id": user_id})
    return {"status": "reset", "user_id": user_id, "message": "Re-enroll now"}


@app.delete("/dangerously-wipe-all-palm-data")
async def wipe_all():
    """WIPE ENTIRE BIOMETRIC DATABASE. Use only when resetting the system."""
    count = users_col.count_documents({})
    users_col.drop()
    return {"status": "wiped", "count": count, "message": "All biometric signatures deleted."}


@app.get("/config")
def get_config():
    return {**cfg, "threshold": THRESHOLD, "max_samples": MAX_SAMPLES}


@app.post("/debug/{user_id}")
async def debug_similarity(user_id: str, file: UploadFile = File(...)):
    """
    POST any image and get the raw similarity score against the stored template.
    Use this to tune THRESHOLD without guessing.
    """
    doc = users_col.find_one({"user_id": user_id})
    if not doc or not doc.get("embeddings"):
        raise HTTPException(status_code=404, detail="User not enrolled")

    data  = await file.read()
    probe = embed_image(data)

    sims  = [cosine(probe, e) for e in doc["embeddings"]]
    best  = max(sims)
    num_raw = len(doc.get("raw_samples", []))

    return {
        "similarity":       round(best, 4),
        "threshold":        THRESHOLD,
        "would_accept":     bool(best >= THRESHOLD),
        "stored_samples":   num_raw,
        "gap_to_threshold": round(THRESHOLD - best, 4),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

