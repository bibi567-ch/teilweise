const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    changeLog: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    value: {
      type: Number,
      enum: [1, -1],
      required: true,
    },
  },
  { timestamps: true }
);

const promptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'El contenido del prompt es obligatorio'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Desarrollo',
        'Marketing',
        'Diseño',
        'Educación',
        'Análisis de Datos',
        'Productividad',
        'Creatividad',
        'Otro',
      ],
      default: 'Otro',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    versions: [versionSchema],
    votes: [voteSchema],
    score: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index
promptSchema.index({ title: 'text', description: 'text', content: 'text', tags: 'text' });

// Recalculate score helper
promptSchema.methods.recalculateScore = function () {
  this.score = this.votes.reduce((acc, v) => acc + v.value, 0);
  this.likesCount = this.votes.filter((v) => v.value === 1).length;
};

module.exports = mongoose.model('Prompt', promptSchema);
