const mongoose = require("mongoose");
const AdoptionRequest = require("../models/AdoptionRequest");
const Elephant = require("../models/Elephant");
const User = require("../models/User");

// User (role: "user"): create adoption request
exports.requestAdoption = async (req, res, next) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can request adoption" });
    }
    const { elephantId, note } = req.body;
    if (!elephantId) return res.status(400).json({ message: "elephantId is required" });

    const ele = await Elephant.findById(elephantId).lean();
    if (!ele) return res.status(404).json({ message: "Elephant not found" });
    if (ele.adopter) return res.status(400).json({ message: "Elephant already adopted" });

    // prevent duplicate pending request for same user-elephant
    const existing = await AdoptionRequest.findOne({
      user: req.user.id,
      elephant: elephantId,
      status: "pending",
    }).lean();
    if (existing) return res.status(400).json({ message: "You already have a pending request for this elephant" });

    const reqDoc = await AdoptionRequest.create({
      user: req.user.id,
      elephant: elephantId,
      note: (note || "").trim(),
    });

    res.status(201).json({ request: reqDoc });
  } catch (e) { next(e); }
};

// Admin: list requests (optionally by status)
exports.listRequests = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
    const { status } = req.query;
    const match = {};
    if (status) match.status = status;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "u" } },
      { $unwind: "$u" },
      { $lookup: { from: "elephants", localField: "elephant", foreignField: "_id", as: "e" } },
      { $unwind: "$e" },
      {
        $project: {
          _id: 1, status: 1, note: 1, createdAt: 1, updatedAt: 1,
          userId: "$u._id", userName: "$u.name", userEmail: "$u.email",
          elephantId: "$e._id", elephantName: "$e.name", elephantLocation: "$e.location",
        }
      }
    ];

    const requests = await AdoptionRequest.aggregate(pipeline);
    res.json({ requests });
  } catch (e) { next(e); }
};

// Admin: approve
exports.approveRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role !== "admin") {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;
    const reqDoc = await AdoptionRequest.findById(id).session(session);
    if (!reqDoc) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: "Request not found" }); }
    if (reqDoc.status !== "pending") { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: "Only pending requests can be approved" }); }

    const ele = await Elephant.findById(reqDoc.elephant).session(session);
    if (!ele) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: "Elephant not found" }); }
    if (ele.adopter) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: "Elephant already adopted" }); }

    // assign adopter
    ele.adopter = reqDoc.user;
    ele.adoptedAt = new Date();
    await ele.save({ session });

    reqDoc.status = "approved";
    await reqDoc.save({ session });

    // Optional: auto-reject other pending requests for this elephant
    await AdoptionRequest.updateMany(
      { _id: { $ne: reqDoc._id }, elephant: ele._id, status: "pending" },
      { $set: { status: "rejected" } },
      { session }
    );

    await session.commitTransaction(); session.endSession();
    res.json({ message: "Adoption approved", requestId: reqDoc._id, elephantId: ele._id, userId: reqDoc.user });
  } catch (e) {
    await session.abortTransaction(); session.endSession();
    next(e);
  }
};

// Admin: reject
exports.rejectRequest = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
    const { id } = req.params;
    const reqDoc = await AdoptionRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: "Request not found" });
    if (reqDoc.status !== "pending") return res.status(400).json({ message: "Only pending requests can be rejected" });
    reqDoc.status = "rejected";
    await reqDoc.save();
    res.json({ message: "Adoption request rejected", requestId: reqDoc._id });
  } catch (e) { next(e); }
};

// User: list my requests
exports.listMyRequests = async (req, res, next) => {
  try {
    if (req.user.role !== "user") return res.status(403).json({ message: "User only" });
    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: "elephants", localField: "elephant", foreignField: "_id", as: "e" } },
      { $unwind: "$e" },
      { $project: { _id: 1, status: 1, note: 1, createdAt: 1, elephantId: "$e._id", elephantName: "$e.name" } }
    ];
    const requests = await AdoptionRequest.aggregate(pipeline);
    res.json({ requests });
  } catch (e) { next(e); }
};

// NEW: User: list my adopted elephants (only those approved => elephants with adopter = me)
exports.listMyAdoptedElephants = async (req, res, next) => {
  try {
    if (req.user.role !== "user") return res.status(403).json({ message: "User only" });

    const elephants = await Elephant.find({ adopter: req.user.id })
      .select("_id name age gender location notes adoptedAt")
      .sort({ adoptedAt: -1, createdAt: -1 })
      .lean();

    res.json({ elephants });
  } catch (e) { next(e); }
};
