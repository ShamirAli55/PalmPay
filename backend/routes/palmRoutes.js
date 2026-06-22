const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { enrollPalm, verifyPalm } = require('../controllers/palmController');

router.post('/enroll', upload.single('file'), enrollPalm); // POST /api/palm/enroll
router.post('/verify', upload.single('file'), verifyPalm); // POST /api/palm/verify

module.exports = router;
