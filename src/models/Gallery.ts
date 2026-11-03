import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true }, // For photos: image link | For videos: thumbnail or preview link
  mediaUrl: { type: String }, // Used specifically for direct video files or player links
  album: { type: String, required: true },
  caption: { type: String, default: '' },
  mediaType: { type: String, enum: ['Photo', 'Video'], default: 'Photo' },
  uploadSource: { type: String, enum: ['Direct', 'GoogleDrive'], default: 'Direct' },
  views: { type: Number, default: 0 }
}, { timestamps: true });

gallerySchema.index({ album: 1 });
gallerySchema.index({ mediaType: 1 });
gallerySchema.index({ createdAt: -1 });

export const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);