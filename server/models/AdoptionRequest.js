const mongoose = require("mongoose");

const adoptionRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    elephant: { type: mongoose.Schema.Types.ObjectId, ref: "Elephant", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// helpful indexes
adoptionRequestSchema.index({ status: 1, createdAt: -1 });
adoptionRequestSchema.index({ user: 1, elephant: 1, status: 1 });

module.exports = mongoose.model("AdoptionRequest", adoptionRequestSchema);
