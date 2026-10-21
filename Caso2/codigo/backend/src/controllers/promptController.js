const Prompt = require('../models/Prompt');

// @desc    Create prompt
// @route   POST /api/prompts
// @access  Private
const createPrompt = async (req, res, next) => {
  try {
    const { title, description, content, category, tags, isPublic } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Título y contenido son obligatorios',
      });
    }

    const prompt = await Prompt.create({
      title,
      description: description || '',
      content,
      author: req.user._id,
      category: category || 'Otro',
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      versions: [
        {
          versionNumber: 1,
          content,
          changeLog: 'Versión inicial',
          createdBy: req.user._id,
        },
      ],
      currentVersion: 1,
    });

    const populated = await Prompt.findById(prompt._id).populate('author', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all prompts (public + own private)
// @route   GET /api/prompts
// @access  Private
const getPrompts = async (req, res, next) => {
  try {
    const { category, tag, search, sort = '-score' } = req.query;

    let query = {
      $or: [{ isPublic: true }, { author: req.user._id }],
    };

    if (category) query.category = category;
    if (tag) query.tags = tag.toLowerCase();
    if (search) {
      query.$text = { $search: search };
    }

    const prompts = await Prompt.find(query)
      .populate('author', 'name email')
      .sort(sort)
      .limit(50);

    res.json({
      success: true,
      count: prompts.length,
      data: prompts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prompt
// @route   GET /api/prompts/:id
// @access  Private
const getPromptById = async (req, res, next) => {
  try {
    const prompt = await Prompt.findById(req.params.id)
      .populate('author', 'name email')
      .populate('versions.createdBy', 'name')
      .populate('votes.user', 'name');

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt no encontrado',
      });
    }

    // Check access
    if (!prompt.isPublic && prompt.author._id.toString() !== req.user._id.toString() && req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver este prompt privado',
      });
    }

    // Increment views
    prompt.views += 1;
    await prompt.save();

    res.json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new version
// @route   POST /api/prompts/:id/versions
// @access  Private (owner or admin)
const addVersion = async (req, res, next) => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt no encontrado',
      });
    }

    if (prompt.author.toString() !== req.user._id.toString() && req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo el autor puede agregar versiones',
      });
    }

    const { content, changeLog } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'El contenido es obligatorio',
      });
    }

    const newVersion = prompt.currentVersion + 1;
    prompt.versions.push({
      versionNumber: newVersion,
      content,
      changeLog: changeLog || `Versión ${newVersion}`,
      createdBy: req.user._id,
    });
    prompt.currentVersion = newVersion;
    prompt.content = content;

    await prompt.save();

    const populated = await Prompt.findById(prompt._id)
      .populate('author', 'name')
      .populate('versions.createdBy', 'name');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on prompt
// @route   POST /api/prompts/:id/vote
// @access  Private
const votePrompt = async (req, res, next) => {
  try {
    const { value } = req.body; // 1 or -1
    if (![1, -1].includes(value)) {
      return res.status(400).json({
        success: false,
        message: 'El valor del voto debe ser 1 o -1',
      });
    }

    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt no encontrado',
      });
    }

    // Remove previous vote by same user
    prompt.votes = prompt.votes.filter(
      (v) => v.user.toString() !== req.user._id.toString()
    );

    prompt.votes.push({
      user: req.user._id,
      value,
    });

    prompt.recalculateScore();
    await prompt.save();

    res.json({
      success: true,
      data: {
        score: prompt.score,
        likesCount: prompt.likesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update prompt metadata
// @route   PUT /api/prompts/:id
// @access  Private (owner/admin)
const updatePrompt = async (req, res, next) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt no encontrado',
      });
    }

    if (prompt.author.toString() !== req.user._id.toString() && req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado',
      });
    }

    const { title, description, category, tags, isPublic } = req.body;
    if (title) prompt.title = title;
    if (description !== undefined) prompt.description = description;
    if (category) prompt.category = category;
    if (tags) prompt.tags = tags;
    if (isPublic !== undefined) prompt.isPublic = isPublic;

    await prompt.save();

    const populated = await Prompt.findById(prompt._id).populate('author', 'name email');

    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prompt
// @route   DELETE /api/prompts/:id
// @access  Private (owner/admin)
const deletePrompt = async (req, res, next) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt no encontrado',
      });
    }

    if (prompt.author.toString() !== req.user._id.toString() && req.user.role !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado',
      });
    }

    await prompt.deleteOne();

    res.json({
      success: true,
      message: 'Prompt eliminado',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrompt,
  getPrompts,
  getPromptById,
  addVersion,
  votePrompt,
  updatePrompt,
  deletePrompt,
};
