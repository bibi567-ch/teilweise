const Thesis = require('../models/Thesis');
const User = require('../models/User');

// @desc    Create new thesis
// @route   POST /api/thesis
// @access  Private (estudiante, administrador)
const createThesis = async (req, res, next) => {
  try {
    const { title, abstract, career, keywords } = req.body;

    const thesis = await Thesis.create({
      title,
      abstract,
      student: req.user._id,
      career: career || req.user.career,
      keywords: keywords || [],
      versions: [
        {
          versionNumber: 1,
          title,
          description: abstract || '',
          uploadedBy: req.user._id,
          status: 'borrador',
        },
      ],
      currentVersion: 1,
      status: 'borrador',
    });

    const populated = await Thesis.findById(thesis._id)
      .populate('student', 'name email role')
      .populate('advisors', 'name email')
      .populate('tribunal', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all thesis (filtered by role)
// @route   GET /api/thesis
// @access  Private
const getTheses = async (req, res, next) => {
  try {
    let query = {};

    // Students see only their theses
    if (req.user.role === 'estudiante') {
      query.student = req.user._id;
    }
    // Tribunal sees theses where they are assigned
    if (req.user.role === 'tribunal') {
      query.tribunal = req.user._id;
    }
    // Admin sees all

    const theses = await Thesis.find(query)
      .populate('student', 'name email career')
      .populate('advisors', 'name email')
      .populate('tribunal', 'name email')
      .populate('versions.uploadedBy', 'name')
      .populate('reviews.reviewer', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: theses.length,
      data: theses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single thesis by ID
// @route   GET /api/thesis/:id
// @access  Private
const getThesisById = async (req, res, next) => {
  try {
    const thesis = await Thesis.findById(req.params.id)
      .populate('student', 'name email career role')
      .populate('advisors', 'name email')
      .populate('tribunal', 'name email')
      .populate('versions.uploadedBy', 'name email')
      .populate('reviews.reviewer', 'name email role');

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: 'Tesis no encontrada',
      });
    }

    // Authorization check
    const isStudentOwner =
      req.user.role === 'estudiante' &&
      thesis.student._id.toString() === req.user._id.toString();
    const isAssignedTribunal =
      req.user.role === 'tribunal' &&
      thesis.tribunal.some(
        (member) => member._id.toString() === req.user._id.toString()
      );

    if (!isStudentOwner && !isAssignedTribunal && req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver esta tesis',
      });
    }

    res.json({
      success: true,
      data: thesis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new version to thesis
// @route   POST /api/thesis/:id/versions
// @access  Private (estudiante owner or admin)
const addVersion = async (req, res, next) => {
  try {
    const thesis = await Thesis.findById(req.params.id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: 'Tesis no encontrada',
      });
    }

    if (
      req.user.role === 'estudiante' &&
      thesis.student.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para modificar esta tesis',
      });
    }

    const { title, description, fileUrl, fileName, observations } = req.body;
    const newVersionNumber = thesis.currentVersion + 1;

    thesis.versions.push({
      versionNumber: newVersionNumber,
      title: title || thesis.title,
      description: description || '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      uploadedBy: req.user._id,
      observations: observations || '',
      status: 'enviado',
    });

    thesis.currentVersion = newVersionNumber;
    thesis.status = 'enviado';
    if (title) thesis.title = title;

    await thesis.save();

    const populated = await Thesis.findById(thesis._id)
      .populate('student', 'name email')
      .populate('versions.uploadedBy', 'name');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to thesis
// @route   POST /api/thesis/:id/reviews
// @access  Private (tribunal, administrador)
const addReview = async (req, res, next) => {
  try {
    const thesis = await Thesis.findById(req.params.id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: 'Tesis no encontrada',
      });
    }

    if (
      req.user.role === 'tribunal' &&
      !thesis.tribunal.some((member) => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Solo los miembros asignados pueden revisar esta tesis',
      });
    }

    const { score, comments, decision, version } = req.body;

    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Los comentarios son obligatorios',
      });
    }

    thesis.reviews.push({
      reviewer: req.user._id,
      version: version || thesis.currentVersion,
      score: score || null,
      comments,
      decision: decision || 'pendiente',
    });

    // Update status based on decision
    if (decision === 'aprobado') {
      thesis.status = 'aprobado';
    } else if (decision === 'rechazado') {
      thesis.status = 'rechazado';
    } else if (decision === 'observado') {
      thesis.status = 'observado';
    } else {
      thesis.status = 'en_revision';
    }

    await thesis.save();

    const populated = await Thesis.findById(thesis._id)
      .populate('reviews.reviewer', 'name email role')
      .populate('student', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign tribunal/advisors
// @route   PUT /api/thesis/:id/assign
// @access  Private (administrador)
const assignMembers = async (req, res, next) => {
  try {
    const { advisors, tribunal } = req.body;
    const thesis = await Thesis.findById(req.params.id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: 'Tesis no encontrada',
      });
    }

    if (advisors) thesis.advisors = advisors;
    if (tribunal) thesis.tribunal = tribunal;

    await thesis.save();

    const populated = await Thesis.findById(thesis._id)
      .populate('student', 'name email')
      .populate('advisors', 'name email')
      .populate('tribunal', 'name email');

    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update thesis status / final grade
// @route   PUT /api/thesis/:id
// @access  Private
const updateThesis = async (req, res, next) => {
  try {
    let thesis = await Thesis.findById(req.params.id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: 'Tesis no encontrada',
      });
    }

    const isAdmin = req.user.role === 'administrador';
    if (!isAdmin && thesis.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para modificar esta tesis',
      });
    }

    // Basic update fields
    const { title, abstract, status, finalGrade, keywords } = req.body;

    if (!isAdmin && (status !== undefined || finalGrade !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Solo un administrador puede modificar el estado o la nota final',
      });
    }

    if (title) thesis.title = title;
    if (abstract !== undefined) thesis.abstract = abstract;
    if (status) thesis.status = status;
    if (finalGrade !== undefined) thesis.finalGrade = finalGrade;
    if (keywords) thesis.keywords = keywords;

    await thesis.save();

    const populated = await Thesis.findById(thesis._id)
      .populate('student', 'name email')
      .populate('advisors', 'name email')
      .populate('tribunal', 'name email');

    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createThesis,
  getTheses,
  getThesisById,
  addVersion,
  addReview,
  assignMembers,
  updateThesis,
};
