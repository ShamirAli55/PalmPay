const multer = require('multer');

<<<<<<< HEAD
// ─── File size and type limits for palm images ─────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are accepted.`), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 30, // Max 30 files for multi-frame verify
    },
    fileFilter,
});

// ─── Multer error handler middleware ─────────────────────────────────────────
upload.handleError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10 MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files uploaded.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ message: err.message || 'Invalid file upload' });
    }
    next();
};
=======
const upload = multer({ storage: multer.memoryStorage() });
>>>>>>> origin/main

module.exports = upload;
