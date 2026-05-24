const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customAlias: {
      type: String,
      default: null,
      trim: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    clickHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        referrer: { type: String, default: 'Direct' },
        userAgent: { type: String, default: '' },
      },
    ],
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: 'anonymous',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups
urlSchema.index({ shortCode: 1 });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for full short URL
urlSchema.virtual('shortUrl').get(function () {
  return `${process.env.BASE_URL}/${this.shortCode}`;
});

urlSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Url', urlSchema);
