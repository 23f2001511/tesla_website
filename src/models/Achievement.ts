import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  title: string;
  category: string;
  year: string;
  description?: string;
  verified: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'HACKATHON', uppercase: true },
    year: { type: String, required: true, default: '2024' },
    description: { type: String, default: '' },
    verified: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Achievement =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>('Achievement', AchievementSchema);
