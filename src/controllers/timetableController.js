const timetableService = require("../services/timetableService");

/**
 * Add single slot
 */
async function addSingleSlot(req, res) {
  try {
    const { year_section, day, slot, subject, faculty, room, type } = req.body;

    // Validation
    if (
      !year_section ||
      !day ||
      !slot ||
      !subject ||
      !faculty ||
      !room ||
      !type
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: year_section, day, slot, subject, faculty, room, type",
      });
    }

    // Validate day
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];
    if (!validDays.includes(day.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid day. Must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY",
      });
    }

    const result = await timetableService.addSingleSlot(
      year_section.toUpperCase(),
      day.toUpperCase(),
      parseInt(slot),
      subject,
      faculty,
      room,
      type
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Add batch slots for a day
 */
async function addBatchForDay(req, res) {
  try {
    const { year_section, day, slots } = req.body;

    // Validation
    if (
      !year_section ||
      !day ||
      !slots ||
      !Array.isArray(slots) ||
      slots.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "year_section, day, and slots array are required",
      });
    }

    // Validate day
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];
    if (!validDays.includes(day.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid day. Must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY",
      });
    }

    // Validate each slot
    for (const slot of slots) {
      if (
        !slot.slot ||
        !slot.subject ||
        !slot.faculty ||
        !slot.room ||
        !slot.type
      ) {
        return res.status(400).json({
          success: false,
          message: "Each slot must have: slot, subject, faculty, room, type",
        });
      }
    }

    const result = await timetableService.addBatchForDay(
      year_section.toUpperCase(),
      day.toUpperCase(),
      slots
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Update slot
 */
async function updateSlot(req, res) {
  try {
    const { year_section, day, slot, subject, faculty, room, type } = req.body;

    // Validation
    if (!year_section || !day || !slot) {
      return res.status(400).json({
        success: false,
        message: "year_section, day, and slot are required",
      });
    }

    // At least one field to update
    const updates = {};
    if (subject !== undefined) updates.subject = subject;
    if (faculty !== undefined) updates.faculty = faculty;
    if (room !== undefined) updates.room = room;
    if (type !== undefined) updates.type = type;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field to update is required: subject, faculty, room, or type",
      });
    }

    // Validate day
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];
    if (!validDays.includes(day.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid day",
      });
    }

    const result = await timetableService.updateSlot(
      year_section.toUpperCase(),
      day.toUpperCase(),
      parseInt(slot),
      updates
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Delete slot
 */
async function deleteSlot(req, res) {
  try {
    const { year_section, day, slot } = req.query;

    // Validation
    if (!year_section || !day || !slot) {
      return res.status(400).json({
        success: false,
        message: "year_section, day, and slot query parameters are required",
      });
    }

    // Validate day
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];
    if (!validDays.includes(day.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid day",
      });
    }

    const result = await timetableService.deleteSlot(
      year_section.toUpperCase(),
      day.toUpperCase(),
      parseInt(slot)
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get weekly timetable
 */
async function getWeeklyTimetable(req, res) {
  try {
    const { yearSection } = req.params;

    if (!yearSection) {
      return res.status(400).json({
        success: false,
        message: "yearSection parameter is required",
      });
    }

    const result = await timetableService.getWeeklyTimetable(
      yearSection.toUpperCase()
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get day timetable
 */
async function getDayTimetable(req, res) {
  try {
    const { yearSection, day } = req.params;

    if (!yearSection || !day) {
      return res.status(400).json({
        success: false,
        message: "yearSection and day parameters are required",
      });
    }

    // Validate day
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];
    if (!validDays.includes(day.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid day",
      });
    }

    const result = await timetableService.getDayTimetable(
      yearSection.toUpperCase(),
      day.toUpperCase()
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  addSingleSlot,
  addBatchForDay,
  updateSlot,
  deleteSlot,
  getWeeklyTimetable,
  getDayTimetable,
};
