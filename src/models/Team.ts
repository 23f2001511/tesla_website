import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    // Team Name
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Team Description
    description: {
      type: String,
      default: ''
    },

    // Team Lead
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Team Members
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Team Status
    isActive: {
      type: Boolean,
      default: true
    },

    // Team Created By
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Team =
  mongoose.models.Team || mongoose.model('Team', teamSchema);