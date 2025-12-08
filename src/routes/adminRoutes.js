const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");
const timetableController = require("../controllers/timetableController");
const adminAuthMiddleware = require("../middleware/adminAuth");

// Authentication routes (no middleware)
router.post("/register", adminAuthController.registerAdmin);
router.post("/login", adminAuthController.loginAdmin);
router.post("/logout", adminAuthController.logoutAdmin);

// Timetable routes (protected with admin middleware)
router.post(
  "/timetable/addSingleSlot",
  adminAuthMiddleware,
  timetableController.addSingleSlot
);
router.post(
  "/timetable/addBatchForDay",
  adminAuthMiddleware,
  timetableController.addBatchForDay
);
router.put(
  "/timetable/updateSlot",
  adminAuthMiddleware,
  timetableController.updateSlot
);
router.delete(
  "/timetable/deleteSlot",
  adminAuthMiddleware,
  timetableController.deleteSlot
);

module.exports = router;
