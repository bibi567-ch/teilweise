const express = require('express');
const router = express.Router();
const {
  createThesis,
  getTheses,
  getThesisById,
  addVersion,
  addReview,
  assignMembers,
  updateThesis,
} = require('../controllers/thesisController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getTheses)
  .post(authorize('estudiante', 'administrador'), createThesis);

router
  .route('/:id')
  .get(getThesisById)
  .put(authorize('estudiante', 'administrador'), updateThesis);

router.post('/:id/versions', authorize('estudiante', 'administrador'), addVersion);
router.post('/:id/reviews', authorize('tribunal', 'administrador'), addReview);
router.put('/:id/assign', authorize('administrador'), assignMembers);

module.exports = router;
