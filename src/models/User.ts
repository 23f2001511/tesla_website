import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    year: { type: String, default: '' }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    github: { type: String, default: '' },
    demo: { type: String, default: '' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    // Existing Role System
    role: {
      type: String,
      enum: [
        'Admin',
        'PI',
        'President',
        'OfficeBearer',
        'TeamLeader',
        'TeamMember',
        'Alumni'
      ],
      default: 'TeamMember'
},

    // Tesla Club Team
    team: {
      type: String,
      default: ''
    },

    // Position / Designation
    designation: {
      type: String,
      default: ''
    },

    // Custom Permissions
    permissions: [
      {
        type: String
      }
    ],

    // Academic Information
    rollNo: {
      type: String,
      default: ''
    },

    branch: {
      type: String,
      default: ''
    },

    year: {
      type: String,
      default: ''
    },

    batch: {
      type: Number
    },

    // Profile
    bio: {
      type: String,
      default: ''
    },

    profileImage: {
      type: String,
      default: ''
    },

    portfolio: {
      type: String,
      default: ''
    },

    // Skills
    skills: [
      {
        type: String
      }
    ],

    // Achievements
    achievements: [achievementSchema],

    // Projects
    projects: [projectSchema],

    // Social Links
    socialLinks: {
      linkedin: {
        type: String,
        default: ''
      },

      github: {
        type: String,
        default: ''
      },

      instagram: {
        type: String,
        default: ''
      }
    },

    // Visibility
    isPublic: {
      type: Boolean,
      default: true
    },

    // Member Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'alumni'],
      default: 'active'
    },

    // Verification
    isVerified: {
      type: Boolean,
      default: false
    },

    // Preferences
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true
      },

      theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark'
      }
    }
  },
  {
    timestamps: true
  }
);

export const User =
  mongoose.models.User || mongoose.model('User', userSchema);