import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  date:        { type: Date,   required: true },
  venue:       { type: String, required: true },
  speaker:     { type: String },
  poster:      { type: String },
  category:    { type: String, required: true },
  seatLimit:   { type: Number },
  isFeatured:  { type: Boolean, default: false },

  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  waitlist:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Proposal / approval fields ──────────────────────────────────────────
  approvalStatus: {
    type:    String,
    enum:    ['pending', 'approved', 'rejected'],
    default: 'approved',          // admin-created events are auto-approved
  },
  requestedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  requestNote:  { type: String, default: '' },
  adminRemarks: { type: String, default: '' },
  submittedAt:  { type: Date,   default: null },
}, { timestamps: true });

eventSchema.index({ date: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ approvalStatus: 1 });

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);