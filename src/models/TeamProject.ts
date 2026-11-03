import mongoose from 'mongoose';

const teamProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    team: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Review', 'Completed', 'Paused'],
      default: 'Planning',
    },
    membersInvolved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

teamProjectSchema.index({ team: 1, createdAt: -1 });

export const TeamProject =
  mongoose.models.TeamProject ||
  mongoose.model('TeamProject', teamProjectSchema);
