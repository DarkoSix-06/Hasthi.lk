const express = require("express");
const { protect } = require("../middleware/auth");
const {
  requestAdoption,
  listRequests,
  approveRequest,
  rejectRequest,
  listMyRequests,
  listMyAdoptedElephants, // <-- added
} = require("../controllers/adoptionController");

const router = express.Router();

// user
router.post("/", protect, requestAdoption);
router.get("/mine", protect, listMyRequests);
router.get("/mine/elephants", protect, listMyAdoptedElephants); // <-- added

// admin
router.get("/", protect, listRequests);
router.patch("/:id/approve", protect, approveRequest);
router.patch("/:id/reject", protect, rejectRequest);

module.exports = router;
