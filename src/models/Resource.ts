import mongoose from 'mongoose';

const resourceFileSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  type: { type: String, enum: ['Note', 'PYQ'], required: true },
  views: { type: Number, default: 0 },       // Live file preview counter
  downloads: { type: Number, default: 0 },   // Live file download counter
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const resourceSchema = new mongoose.Schema({
  department: { 
    type: String, 
    required: true
  },
  semester: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 8 
  },
  subjectName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  subjectCode: { 
    type: String, 
    trim: true 
  },
  files: [resourceFileSchema]
}, { timestamps: true });

resourceSchema.index({ department: 1, semester: 1 });

export const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);