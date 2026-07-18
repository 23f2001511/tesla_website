import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  teamMembers: [{ type: String }],
  
  // New Fields Added
  coverImage: { type: String, required: true },
  gallery: [{ type: String }],
  venue: { type: String, default: '' },
  achievementDate: { type: Date, required: true },
  organizer: { type: String, default: '' },
  tags: [{ type: String }],
  eventLink: { type: String, default: '' },
  
  isFeatured: { type: Boolean, default: false },
  
  // Status Workflow
  status: { type: String, enum: ['Pending', 'Published', 'Rejected'], default: 'Pending' },
  
  // Attribution
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploaderName: { type: String, required: true },
}, { timestamps: true });

achievementSchema.index({ createdAt: -1 });
achievementSchema.index({ status: 1 });
achievementSchema.index({ category: 1 });

export const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);