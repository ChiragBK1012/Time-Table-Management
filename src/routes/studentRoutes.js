const express = require("express");
const router = express.Router();
const studentAuthController = require("../controllers/studentAuthController");
const timetableController = require("../controllers/timetableController");
const studentAuthMiddleware = require("../middleware/studentAuth");

// Authentication routes (no middleware)
router.post("/register", studentAuthController.registerStudent);
router.post("/login", studentAuthController.loginStudent);
router.post("/logout", studentAuthController.logoutStudent);

// Timetable routes (protected with student middleware)
router.get(
    "/timetable/weekly/:yearSection",
    studentAuthMiddleware,
    timetableController.getWeeklyTimetable
);
router.get(
    "/timetable/day/:yearSection/:day",
    studentAuthMiddleware,
    timetableController.getDayTimetable
);
router.get(
    "/timetable/next-class/:yearSection/:subject",
    studentAuthMiddleware,
    timetableController.getNextClassForSubject
);

module.exports = router;
