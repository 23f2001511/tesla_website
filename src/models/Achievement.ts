import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "1st Prize in Inter-NIT Hackathon"
  description: { type: String, required: true }, // Details of the victory
  category: { 
    type: String, 
    enum: ['Hackathon', 'Open Source', 'Project Milestone', 'Research Paper', 'Other'], 
    required: true 
  },
  teamMembers: [{ type: String, required: true }], // Name of students who won
  eventLink: { type: String, default: '' }, // Certificate or event URL
  year: { type: String, required: true, default: '2026' }, // Academic Year
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

achievementSchema.index({ createdAt: -1 });

export const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);