import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  category: string;
  author: string;
  authorRole: string;
  readTime: string;
  content: string;
  coverImage?: string;
  tags: string[];
  status: 'Draft' | 'Published';
  publishedDate: string;
  views: number;
  authorId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    category: { type: String, required: true, default: 'TECH' },
    author: { type: String, required: true, default: 'Tesla Team' },
    authorRole: { type: String, default: 'Member' },
    readTime: { type: String, default: '5 MIN' },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Published',
    },
    publishedDate: { type: String, default: '' },
    views: { type: Number, default: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const Blog =
  mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
