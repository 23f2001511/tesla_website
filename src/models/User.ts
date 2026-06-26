import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    year:        { type: String, default: '' },
    category: {
      type: String,
      enum: ['Hackathon', 'Open Source', 'Project Milestone', 'Research Paper', 'Certification', 'Internship', 'Placement', 'Other'],
      default: 'Other',
    },
    teamMembers: [{ type: String }],   // names of teammates
    eventLink:   { type: String, default: '' },   // certificate / event URL
    coverImage:  { type: String, default: '' },   // poster / certificate image
    isFeatured:  { type: Boolean, default: false },
  },
  { _id: true }   // keep _id so we can delete by id
);

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    github:      { type: String, default: '' },
    demo:        { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Role
    role: {
      type: String,
      enum: ['Admin', 'PI', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember', 'Alumni'],
      default: 'TeamMember',
    },

    team:        { type: String, default: '' },
    designation: { type: String, default: '' },

    permissions: [{ type: String }],

    // Academic
    rollNo: { type: String, default: '' },
    branch: { type: String, default: '' },
    year:   { type: String, default: '' },
    batch:  { type: Number },

    // Alumni
    company:        { type: String, default: '' },
    currentRole:    { type: String, default: '' },
    graduationYear: { type: Number },
    location:       { type: String, default: '' },

    // Profile
    bio:          { type: String, default: '' },
    profileImage: { type: String, default: '' },
    portfolio:    { type: String, default: '' },

    skills:       [{ type: String }],
    achievements: [achievementSchema],
    projects:     [projectSchema],

    socialLinks: {
      linkedin:  { type: String, default: '' },
      github:    { type: String, default: '' },
      instagram: { type: String, default: '' },
    },

    isPublic:   { type: Boolean, default: true },
    status:     { type: String, enum: ['active', 'inactive', 'alumni'], default: 'active' },
    isVerified: { type: Boolean, default: false },

    preferences: {
      emailNotifications: { type: Boolean, default: true },
      theme:              { type: String, enum: ['dark', 'light'], default: 'dark' },
    },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);