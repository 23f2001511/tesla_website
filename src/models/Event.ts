import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  category: 'workshop' | 'hackathon' | 'talk' | 'bootcamp' | 'hands-on lab' | 'competition';
  date: string;
  time: string;
  venue: string;
  description: string;
  status: 'upcoming' | 'past';
  registrationLink?: string;
  isFeatured: boolean;
  coverImage?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['workshop', 'hackathon', 'talk', 'bootcamp', 'hands-on lab', 'competition'],
      default: 'workshop',
      required: true,
    },
    date: { type: String, required: true, trim: true }, // e.g. "28 MAY 2026" or "28 OCT"
    time: { type: String, required: true, trim: true }, // e.g. "10:00 — 16:00"
    venue: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['upcoming', 'past'],
      default: 'upcoming',
      required: true,
    },
    registrationLink: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    coverImage: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Event =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
