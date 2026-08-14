import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  title: string;
  type: 'NOTES' | 'PYQ' | 'LAB' | 'SLIDES' | 'BOOK';
  subject: string;
  semester: string;
  fileUrl: string;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['NOTES', 'PYQ', 'LAB', 'SLIDES', 'BOOK'],
      default: 'NOTES',
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    semester: { type: String, required: true, default: 'Sem 1' },
    fileUrl: { type: String, default: '#' },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Resource =
  mongoose.models.Resource ||
  mongoose.model<IResource>('Resource', ResourceSchema);
