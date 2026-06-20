# main.py — PalmPay Auth API with MongoDB
import json, numpy as np, torch, io
from pathlib import Path
from PIL import Image
import torchvision.transforms as T
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from datetime import datetime
import os

# ── Config ───────────────────────────────────────────────────────────────────
CONFIG_PATH = "palm_config.json"
if not os.path.exists(CONFIG_PATH):
    default_cfg = {
        "threshold": 0.8,
        "img_size": 224,
        "normalize": {"mean": [0.5], "std": [0.5]}
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(default_cfg, f)

with open(CONFIG_PATH) as f:
    cfg = json.load(f)

THRESHOLD = cfg["threshold"]
IMG_SIZE  = cfg["img_size"]
# Use environment variable for MongoDB URI if available
MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://shamir:shamir123@cluster0.actcg02.mongodb.net/palmpay_wallet?appName=Cluster0")

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

# ── Routes ───────────────────────────────────────────────────────────────────
@app.post("/enroll/{user_id}")
async def enroll(user_id: str, file: UploadFile = File(...)):
    """
    Call 2-3 times with different palm images to build a robust template.
    Each call appends one embedding to the user's document.
    """
    data = await file.read()
    emb  = embed_image(data).tolist()

    users_col.update_one(
        {"user_id": user_id},
        {
            "$push": {"embeddings": emb},
            "$set":  {"updated_at": datetime.utcnow()},
            "$setOnInsert": {"created_at": datetime.utcnow(), "user_id": user_id},
        },
        upsert=True,
    )

    doc = users_col.find_one({"user_id": user_id})
    return {"status": "enrolled", "samples": len(doc["embeddings"])}


@app.post("/verify/{user_id}")
async def verify(user_id: str, file: UploadFile = File(...)):
    """
    Returns accepted: true/false + similarity score.
    """
    doc = users_col.find_one({"user_id": user_id})
    if not doc or not doc.get("embeddings"):
        raise HTTPException(status_code=404, detail="User not enrolled")

    data  = await file.read()
    probe = embed_image(data)

    sims  = [cosine(probe, e) for e in doc["embeddings"]]
    best  = max(sims)

    return {
        "accepted":   bool(best >= THRESHOLD),
        "similarity": round(best, 4),
        "threshold":  THRESHOLD,
    }


@app.delete("/unenroll/{user_id}")
async def unenroll(user_id: str):
    """Remove all palm data for a user."""
    result = users_col.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "removed", "user_id": user_id}


@app.get("/config")
def get_config():
    return cfg

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
