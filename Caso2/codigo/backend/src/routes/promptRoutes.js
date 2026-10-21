const express = require('express');
const router = express.Router();
const {
  createPrompt,
  getPrompts,
  getPromptById,
  addVersion,
  votePrompt,
  updatePrompt,
  deletePrompt,
} = require('../controllers/promptController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getPrompts).post(createPrompt);
router.route('/:id').get(getPromptById).put(updatePrompt).delete(deletePrompt);
router.post('/:id/versions', addVersion);
router.post('/:id/vote', votePrompt);

module.exports = router;
