const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { enrollPalm, verifyPalm, verifyPalmMulti } = require('../controllers/palmController');

router.post('/enroll',       upload.single('file'),         enrollPalm);       // POST /api/palm/enroll
router.post('/verify',       upload.single('file'),         verifyPalm);       // POST /api/palm/verify
router.post('/verify-multi', upload.array('files', 5),      verifyPalmMulti);  // POST /api/palm/verify-multi

module.exports = router;
