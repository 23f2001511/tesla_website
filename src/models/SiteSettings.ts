import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  clubName: string;
  tagline: string;
  contactEmail: string;
  location: string;
  discordUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  labHours: string;
  announcement: {
    active: boolean;
    text: string;
    link: string;
  };
  impactStats: {
    activeMembers: string;
    projectsShipped: string;
    hackathonWins: string;
    placementRate: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    clubName: { type: String, default: 'TESLA Technical Club' },
    tagline: {
      type: String,
      default:
        'Engineers, coders, designers, and builders shipping real-world work on campus.',
    },
    contactEmail: { type: String, default: 'teslaclub@college.edu' },
    location: { type: String, default: 'CSE Block, Campus' },
    discordUrl: { type: String, default: 'https://discord.gg/tesla' },
    githubUrl: { type: String, default: 'https://github.com' },
    linkedinUrl: { type: String, default: 'https://linkedin.com' },
    instagramUrl: { type: String, default: 'https://instagram.com' },
    twitterUrl: { type: String, default: 'https://twitter.com' },
    labHours: { type: String, default: 'Lab open 16:00–21:00' },
    announcement: {
      active: { type: Boolean, default: false },
      text: { type: String, default: 'Registrations now open for HACK-TESLA 2026!' },
      link: { type: String, default: '/events' },
    },
    impactStats: {
      activeMembers: { type: String, default: '500+' },
      projectsShipped: { type: String, default: '40+' },
      hackathonWins: { type: String, default: '28' },
      placementRate: { type: String, default: '96%' },
    },
  },
  { timestamps: true }
);

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
