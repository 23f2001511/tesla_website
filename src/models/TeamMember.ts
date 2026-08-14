import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamMember extends Document {
  name: string;
  role: string;
  category: 'Core' | 'Executive' | 'Faculty';
  tag: string;
  avatar?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  email?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Core', 'Executive', 'Faculty'],
      default: 'Core',
      required: true,
    },
    tag: { type: String, required: true, uppercase: true, trim: true, default: 'MEM' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    email: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TeamMember =
  mongoose.models.TeamMember ||
  mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
