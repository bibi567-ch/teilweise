const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    observations: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado', 'observado'],
      default: 'borrador',
    },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    comments: {
      type: String,
      required: true,
    },
    decision: {
      type: String,
      enum: ['aprobado', 'rechazado', 'observado', 'pendiente'],
      default: 'pendiente',
    },
  },
  { timestamps: true }
);

const thesisSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    abstract: {
      type: String,
      default: '',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    advisors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tribunal: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
    versions: [versionSchema],
    reviews: [reviewSchema],
    status: {
      type: String,
      enum: ['borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado', 'observado', 'finalizado'],
      default: 'borrador',
    },
    career: {
      type: String,
      default: '',
    },
    keywords: [String],
    finalGrade: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
thesisSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });

module.exports = mongoose.model('Thesis', thesisSchema);
