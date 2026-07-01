import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  coverImage: { type: String },
  isFeatured: { type: Boolean, default: false },
  status: { type: String, enum: ['Draft', 'Pending', 'Published', 'Rejected'], default: 'Draft' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  tags: [{ type: String }]
}, { timestamps: true });

blogSchema.index({ createdAt: -1 });
blogSchema.index({ status: 1 });

export const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
