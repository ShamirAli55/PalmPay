const express = require('express');
const router  = express.Router();
const { getUser, listUsers } = require('../controllers/userController');

router.get('/',         listUsers); // GET /api/users
router.get('/:clerkId', getUser);   // GET /api/users/:clerkId

module.exports = router;
