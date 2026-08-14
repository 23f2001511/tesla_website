import mongoose, { Schema, Document } from 'mongoose';

export interface ITrack {
  trackId: string;
  name: string;
  prize: string;
  desc: string;
}

export interface IFlagshipEvent extends Document {
  edition: string;
  tagline: string;
  headline: string;
  description: string;
  dates: string;
  format: string;
  venue: string;
  teamSize: string;
  prizePool: string;
  registrationLink: string;
  isActive: boolean;
  tracks: ITrack[];
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema = new Schema<ITrack>(
  {
    trackId: { type: String, required: true },
    name: { type: String, required: true },
    prize: { type: String, required: true },
    desc: { type: String, required: true },
  },
  { _id: false }
);

const FlagshipEventSchema = new Schema<IFlagshipEvent>(
  {
    edition: { type: String, required: true, default: "HACK-TESLA '26" },
    tagline: {
      type: String,
      default: '36 HOURS. NATIONAL LEVEL.\n₹7.8L+ PRIZE POOL.',
    },
    headline: { type: String, default: 'BUILD. BREAK. SHIP.' },
    description: {
      type: String,
      default:
        'Bring a laptop, a team, and 36 hours of stubbornness. Mentors from Google, Microsoft and top startups will be on the floor.',
    },
    dates: { type: String, default: 'OCT 24–26, 2026' },
    format: { type: String, default: '36-HOUR SPRINT' },
    venue: { type: String, default: 'AUDITORIUM + ONLINE' },
    teamSize: { type: String, default: '2–4 MEMBERS' },
    prizePool: { type: String, default: '₹7.8L+' },
    registrationLink: { type: String, default: '/events' },
    isActive: { type: Boolean, default: true },
    tracks: [TrackSchema],
  },
  { timestamps: true }
);

export const FlagshipEvent =
  mongoose.models.FlagshipEvent ||
  mongoose.model<IFlagshipEvent>('FlagshipEvent', FlagshipEventSchema);
