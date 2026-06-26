const express = require('express');
const router = express.Router();
const { getUser, listUsers, updateProfile } = require('../controllers/userController');

router.get('/',         listUsers); // GET /api/users
router.get('/:clerkId', getUser);   // GET /api/users/:clerkId
router.post('/update',  updateProfile);

module.exports = router;
