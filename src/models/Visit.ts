import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
  {
    path: { type: String, default: '/' },
  },
  { timestamps: true }
);

visitSchema.index({ createdAt: -1 });

export const Visit = mongoose.models.Visit || mongoose.model('Visit', visitSchema);