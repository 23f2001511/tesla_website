import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryItem extends Document {
  caption: string;
  imageUrl: string;
  category?: string;
  colSpan: 'md:col-span-4' | 'md:col-span-8' | 'md:col-span-6' | 'md:col-span-12';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GalleryItemSchema = new Schema<IGalleryItem>(
  {
    caption: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    colSpan: {
      type: String,
      enum: ['md:col-span-4', 'md:col-span-8', 'md:col-span-6', 'md:col-span-12'],
      default: 'md:col-span-4',
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GalleryItem =
  mongoose.models.GalleryItem ||
  mongoose.model<IGalleryItem>('GalleryItem', GalleryItemSchema);
