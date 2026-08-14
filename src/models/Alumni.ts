import mongoose, { Schema, Document } from 'mongoose';

export interface IAlumni extends Document {
  name: string;
  role: string;
  company: string;
  batch: string;
  city: string;
  avatar?: string;
  linkedin?: string;
  mentorshipAvailable: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlumniSchema = new Schema<IAlumni>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true, uppercase: true },
    company: { type: String, required: true, trim: true, uppercase: true },
    batch: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, uppercase: true },
    avatar: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    mentorshipAvailable: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Alumni =
  mongoose.models.Alumni || mongoose.model<IAlumni>('Alumni', AlumniSchema);
