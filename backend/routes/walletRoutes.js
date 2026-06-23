const express = require('express');
const router  = express.Router();
const {
    getWallet,
    getBanks,
    addBank,
    removeBank,
    getCards,
    freezeCard,
    updateCardSettings,
    issueCard,
} = require('../controllers/walletController');

router.get('/:clerkId',                  getWallet);          // GET  /api/wallet/:clerkId
router.get('/:clerkId/banks',            getBanks);           // GET  /api/wallet/:clerkId/banks
router.post('/:clerkId/banks',           addBank);            // POST /api/wallet/:clerkId/banks
router.delete('/banks/:bankId',          removeBank);         // DELETE /api/wallet/banks/:bankId
router.get('/:clerkId/cards',            getCards);           // GET  /api/wallet/:clerkId/cards
router.post('/cards/issue',              issueCard);          // POST /api/wallet/cards/issue
router.patch('/cards/:cardId/freeze',    freezeCard);         // PATCH /api/wallet/cards/:cardId/freeze
router.patch('/cards/:cardId/settings',  updateCardSettings); // PATCH /api/wallet/cards/:cardId/settings

module.exports = router;
