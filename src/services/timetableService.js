const dynamoClient = require("../config/dynamoClient");

const TIMETABLE_TABLE = "TimeTable";

/**
 * Add a single slot to timetable
 */
async function addSingleSlot(
  yearSection,
  day,
  slot,
  subject,
  faculty,
  room,
  type
) {
  try {
    const normalizedFaculty = faculty;

    // Validate slot number
    if (slot < 1 || slot > 7) {
      throw new Error("Slot number must be between 1 and 7");
    }

    // Validate type
    if (type !== "Theory" && type !== "LAB") {
      throw new Error('Type must be either "Theory" or "LAB"');
    }

    // Check if SECTION slot already exists (yearSection + day + slot)
    const existingSlot = await dynamoClient.get({
      TableName: TIMETABLE_TABLE,
      Key: {
        PK: yearSection,
        SK: `${day}#${slot}`,
      },
      ConsistentRead: true,
    });

    if (existingSlot.Item) {
      throw new Error(
        `Section clash: ${yearSection} already has a class on ${day} at slot ${slot}`
      );
    }

    // Check FACULTY clash: same faculty + same DAY and SLOT in ANY section
    // Use SK (PK/SK key) to avoid type issues with the slot attribute
    const facultyClashScan = await dynamoClient.scan({
      TableName: TIMETABLE_TABLE,
      FilterExpression:
        "#faculty = :faculty AND begins_with(#sk, :daySlotPrefix)",
      ExpressionAttributeNames: {
        "#faculty": "faculty",
        "#sk": "SK",
      },
      ExpressionAttributeValues: {
        ":faculty": normalizedFaculty,
        ":daySlotPrefix": `${day}#${slot}`,
      },
      Limit: 1,
      ConsistentRead: true,
    });

    if (facultyClashScan.Items && facultyClashScan.Items.length > 0) {
      const clash = facultyClashScan.Items[0];
      throw new Error(
        `Faculty clash: ${faculty} is already assigned to ${clash.yearSection} on ${clash.day} at slot ${clash.slot}`
      );
    }

    // Create timetable entry
    const timetableEntry = {
      PK: yearSection,
      SK: `${day}#${slot}`,
      yearSection: yearSection,
      day: day,
      slot: slot,
      subject: subject,
      faculty: faculty,
      room: room,
      type: type,
    };

    await dynamoClient.put({
      TableName: TIMETABLE_TABLE,
      Item: timetableEntry,
    });

    return {
      message: "Timetable slot added successfully",
      data: timetableEntry,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Add batch slots for a day
 */
async function addBatchForDay(yearSection, day, slots) {
  try {
    const results = [];
    const errors = [];
    const facultySlotSeen = new Set(); // To catch clashes within the same batch request

    for (const slotData of slots) {
      try {
        const { slot, subject, faculty, room, type } = slotData;
        const normalizedFaculty = faculty;
        const batchKey = `${normalizedFaculty}::${day}#${slot}`;

        // Validate slot number
        if (slot < 1 || slot > 7) {
          errors.push(`Slot ${slot} is invalid (must be 1-7)`);
          continue;
        }

        // Validate type
        if (type !== "Theory" && type !== "LAB") {
          errors.push(`Slot ${slot} has invalid type`);
          continue;
        }

        // Check if SECTION slot already exists (yearSection + day + slot)
        const existingSlot = await dynamoClient.get({
          TableName: TIMETABLE_TABLE,
          Key: {
            PK: yearSection,
            SK: `${day}#${slot}`,
          },
          ConsistentRead: true,
        });

        if (existingSlot.Item) {
          errors.push(
            `Section clash: ${yearSection} already has a class on ${day} at slot ${slot}`
          );
          continue;
        }

        // Check FACULTY clash within the same batch request (in-memory)
        if (facultySlotSeen.has(batchKey)) {
          errors.push(
            `Faculty clash for slot ${slot} within batch: ${normalizedFaculty} is already assigned in this batch on ${day} at slot ${slot}`
          );
          continue;
        }

        // Check FACULTY clash: same faculty + same DAY and SLOT in ANY section (persisted DB)
        const facultyClashScan = await dynamoClient.scan({
          TableName: TIMETABLE_TABLE,
          FilterExpression:
            "#faculty = :faculty AND begins_with(#sk, :daySlotPrefix)",
          ExpressionAttributeNames: {
            "#faculty": "faculty",
            "#sk": "SK",
          },
          ExpressionAttributeValues: {
            ":faculty": normalizedFaculty,
            ":daySlotPrefix": `${day}#${slot}`,
          },
          Limit: 1,
          ConsistentRead: true,
        });

        if (facultyClashScan.Items && facultyClashScan.Items.length > 0) {
          const clash = facultyClashScan.Items[0];
          errors.push(
            `Faculty clash for slot ${slot}: ${faculty} is already assigned to ${clash.yearSection} on ${clash.day} at slot ${clash.slot}`
          );
          continue;
        }

        // If all validations pass, create timetable entry and insert immediately
        const timetableEntry = {
          PK: yearSection,
          SK: `${day}#${slot}`,
          yearSection: yearSection,
          day: day,
          slot: slot,
          subject: subject,
          faculty: faculty,
          room: room,
          type: type,
        };

        await dynamoClient.put({
          TableName: TIMETABLE_TABLE,
          Item: timetableEntry,
        });

        results.push(timetableEntry);
        facultySlotSeen.add(batchKey);
      } catch (error) {
        errors.push(`Error processing slot ${slotData.slot}: ${error.message}`);
      }
    }

    return {
      message: `Batch operation completed. ${results.length} slots added, ${errors.length} errors`,
      added: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update a timetable slot
 */
async function updateSlot(yearSection, day, slot, updates) {
  try {
    // Check if slot exists
    const existingSlot = await dynamoClient.get({
      TableName: TIMETABLE_TABLE,
      Key: {
        PK: yearSection,
        SK: `${day}#${slot}`,
      },
    });

    if (!existingSlot.Item) {
      throw new Error(
        `Slot not found for ${yearSection} on ${day} at slot ${slot}`
      );
    }

    // Prepare update expression
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (updates.subject !== undefined) {
      updateExpression.push("#subject = :subject");
      expressionAttributeNames["#subject"] = "subject";
      expressionAttributeValues[":subject"] = updates.subject;
    }

    if (updates.faculty !== undefined) {
      updateExpression.push("#faculty = :faculty");
      expressionAttributeNames["#faculty"] = "faculty";
      expressionAttributeValues[":faculty"] = updates.faculty;
    }

    if (updates.room !== undefined) {
      updateExpression.push("#room = :room");
      expressionAttributeNames["#room"] = "room";
      expressionAttributeValues[":room"] = updates.room;
    }

    if (updates.type !== undefined) {
      if (updates.type !== "Theory" && updates.type !== "LAB") {
        throw new Error('Type must be either "Theory" or "LAB"');
      }
      updateExpression.push("#type = :type");
      expressionAttributeNames["#type"] = "type";
      expressionAttributeValues[":type"] = updates.type;
    }

    if (updateExpression.length === 0) {
      throw new Error("No fields to update");
    }

    // If faculty is being updated, ensure there is no FACULTY clash for this day + slot
    if (
      updates.faculty !== undefined &&
      updates.faculty !== existingSlot.Item.faculty
    ) {
      const facultyClashScan = await dynamoClient.scan({
        TableName: TIMETABLE_TABLE,
        FilterExpression:
          "#faculty = :faculty AND begins_with(#sk, :daySlotPrefix) AND #pk <> :pk",
        ExpressionAttributeNames: {
          "#faculty": "faculty",
          "#sk": "SK",
          "#pk": "PK",
        },
        ExpressionAttributeValues: {
          ":faculty": updates.faculty,
          ":daySlotPrefix": `${day}#${slot}`,
          ":pk": yearSection,
        },
        Limit: 1,
        ConsistentRead: true,
      });

      if (facultyClashScan.Items && facultyClashScan.Items.length > 0) {
        const clash = facultyClashScan.Items[0];
        throw new Error(
          `Faculty clash: ${updates.faculty} is already assigned to ${clash.yearSection} on ${clash.day} at slot ${clash.slot}`
        );
      }
    }

    // Update the item
    await dynamoClient.update({
      TableName: TIMETABLE_TABLE,
      Key: {
        PK: yearSection,
        SK: `${day}#${slot}`,
      },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    // Get updated item
    const updatedSlot = await dynamoClient.get({
      TableName: TIMETABLE_TABLE,
      Key: {
        PK: yearSection,
        SK: `${day}#${slot}`,
      },
    });

    return {
      message: "Timetable slot updated successfully",
      data: updatedSlot.Item,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a timetable slot
 */
async function deleteSlot(yearSection, day, slot) {
  try {
    // Check if slot exists
    const existingSlot = await dynamoClient.get({
      TableName: TIMETABLE_TABLE,
      Key: {
        PK: yearSection,
        SK: `${day}#${slot}`,
      },
    });

    if (!existingSlot.Item) {
      throw new Error(
        `Slot not found for ${yearSection} on ${day} at slot ${slot}`
      );
    }

    // Delete the item
    await dynamoClient.delete({
      TableName: TIMETABLE_TABLE,
      Key: {
        PK: yearSection,
        SK: `${day}#${slot}`,
      },
    });

    return {
      message: "Timetable slot deleted successfully",
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get weekly timetable for a year section
 */
async function getWeeklyTimetable(yearSection) {
  try {
    // Query all items for this year section
    const result = await dynamoClient.query({
      TableName: TIMETABLE_TABLE,
      KeyConditionExpression: "PK = :yearSection",
      ExpressionAttributeValues: {
        ":yearSection": yearSection,
      },
    });

    if (!result.Items || result.Items.length === 0) {
      return {
        message: "No timetable found for this year section",
        data: [],
      };
    }

    // Sort by day and slot
    const daysOrder = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    const sortedItems = result.Items.sort((a, b) => {
      const dayA = daysOrder.indexOf(a.day);
      const dayB = daysOrder.indexOf(b.day);

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      return a.slot - b.slot;
    });

    // Group by day
    const weeklyTimetable = {};
    sortedItems.forEach((item) => {
      if (!weeklyTimetable[item.day]) {
        weeklyTimetable[item.day] = [];
      }
      weeklyTimetable[item.day].push({
        slot: item.slot,
        subject: item.subject,
        faculty: item.faculty,
        room: item.room,
        type: item.type,
      });
    });

    return {
      message: "Weekly timetable retrieved successfully",
      yearSection: yearSection,
      data: weeklyTimetable,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get timetable for a specific day
 */
async function getDayTimetable(yearSection, day) {
  try {
    // Query items for this year section and day
    const result = await dynamoClient.query({
      TableName: TIMETABLE_TABLE,
      KeyConditionExpression: "PK = :yearSection AND begins_with(SK, :day)",
      ExpressionAttributeValues: {
        ":yearSection": yearSection,
        ":day": `${day}#`,
      },
    });

    if (!result.Items || result.Items.length === 0) {
      return {
        message: `No timetable found for ${yearSection} on ${day}`,
        data: [],
      };
    }

    // Sort by slot (ascending)
    const sortedItems = result.Items.sort((a, b) => a.slot - b.slot);

    const dayTimetable = sortedItems.map((item) => ({
      slot: item.slot,
      subject: item.subject,
      faculty: item.faculty,
      room: item.room,
      type: item.type,
    }));

    return {
      message: `Timetable for ${day} retrieved successfully`,
      yearSection: yearSection,
      day: day,
      data: dayTimetable,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all slots assigned to a specific faculty (across all year sections and days)
 * NOTE: This uses a table scan with a filter, so it is intended for admin-only usage.
 */
async function getSlotsByFaculty(faculty) {
  try {
    const normalizedFaculty = faculty.trim();

    if (!normalizedFaculty) {
      throw new Error("Faculty name is required");
    }

    let lastEvaluatedKey = undefined;
    const allItems = [];

    // Scan the entire timetable table and filter by faculty
    do {
      const result = await dynamoClient.scan({
        TableName: TIMETABLE_TABLE,
        FilterExpression: "#faculty = :faculty",
        ExpressionAttributeNames: {
          "#faculty": "faculty",
        },
        ExpressionAttributeValues: {
          ":faculty": normalizedFaculty,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });

      if (result.Items && result.Items.length > 0) {
        allItems.push(...result.Items);
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    if (allItems.length === 0) {
      return {
        message: `No timetable slots found for faculty '${normalizedFaculty}'`,
        faculty: normalizedFaculty,
        data: [],
      };
    }

    // Sort results: yearSection -> day -> slot
    const daysOrder = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    const sortedItems = allItems.sort((a, b) => {
      // yearSection (PK)
      if (a.PK !== b.PK) {
        return a.PK.localeCompare(b.PK);
      }

      // day
      const dayA = daysOrder.indexOf(a.day);
      const dayB = daysOrder.indexOf(b.day);

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      // slot
      return (a.slot || 0) - (b.slot || 0);
    });

    const data = sortedItems.map((item) => ({
      yearSection: item.yearSection || item.PK,
      day: item.day,
      slot: item.slot,
      subject: item.subject,
      faculty: item.faculty,
      room: item.room,
      type: item.type,
    }));

    return {
      message: `Timetable slots for faculty '${normalizedFaculty}' retrieved successfully`,
      faculty: normalizedFaculty,
      totalSlots: data.length,
      data,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get daily teaching load for a faculty (how many slots assigned on a given day)
 */
async function getFacultyDailyLoad(faculty, day) {
  try {
    const normalizedFaculty = faculty.trim();
    const normalizedDay = day.trim().toUpperCase();

    if (!normalizedFaculty || !normalizedDay) {
      throw new Error("Faculty and day are required");
    }

    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    if (!validDays.includes(normalizedDay)) {
      throw new Error(
        "Invalid day. Must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY"
      );
    }

    let lastEvaluatedKey = undefined;
    let count = 0;

    // Scan all timetable entries for this faculty on the given day
    do {
      const result = await dynamoClient.scan({
        TableName: TIMETABLE_TABLE,
        FilterExpression:
          "#faculty = :faculty AND begins_with(#sk, :dayPrefix)",
        ExpressionAttributeNames: {
          "#faculty": "faculty",
          "#sk": "SK",
        },
        ExpressionAttributeValues: {
          ":faculty": normalizedFaculty,
          ":dayPrefix": `${normalizedDay}#`,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });

      if (result.Items && result.Items.length > 0) {
        count += result.Items.length;
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const MAX_SLOTS_PER_DAY = 5;
    const remaining = Math.max(MAX_SLOTS_PER_DAY - count, 0);

    return {
      message: `Daily load for faculty '${normalizedFaculty}' on ${normalizedDay} calculated successfully`,
      faculty: normalizedFaculty,
      day: normalizedDay,
      assignedSlots: count,
      remainingSlots: remaining,
      maxSlotsPerDay: MAX_SLOTS_PER_DAY,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get the next upcoming class for a given subject in a year section,
 * based on the current server day and time.
 */
async function getNextClassForSubject(yearSection, subject) {
  try {
    if (!yearSection || !subject) {
      throw new Error("yearSection and subject are required");
    }

    const normalizedSubject = subject.trim().toUpperCase();

    // Query all items for this year section
    const result = await dynamoClient.query({
      TableName: TIMETABLE_TABLE,
      KeyConditionExpression: "PK = :yearSection",
      ExpressionAttributeValues: {
        ":yearSection": yearSection,
      },
    });

    if (!result.Items || result.Items.length === 0) {
      return {
        message: `No timetable found for yearSection '${yearSection}'`,
        yearSection,
        subject: normalizedSubject,
        nextClass: null,
      };
    }

    // Filter by subject (case-insensitive)
    const subjectSlots = result.Items.filter(
      (item) =>
        item.subject &&
        typeof item.subject === "string" &&
        item.subject.trim().toUpperCase() === normalizedSubject
    );

    if (subjectSlots.length === 0) {
      return {
        message: `No classes scheduled for subject '${normalizedSubject}' in yearSection '${yearSection}'`,
        yearSection,
        subject: normalizedSubject,
        nextClass: null,
      };
    }

    const daysOrder = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    // Slot start times (in minutes from 00:00 of a day)
    const slotStartMinutes = {
      1: 9 * 60 + 0, // 9:00
      2: 9 * 60 + 55, // 9:55
      3: 11 * 60 + 5, // 11:05
      4: 12 * 60 + 0, // 12:00
      5: 13 * 60 + 45, // 13:45
      6: 14 * 60 + 40, // 14:40
      7: 15 * 60 + 35, // 15:35
    };

    const now = new Date();
    const nowHour = now.getHours();
    const nowMin = now.getMinutes();

    // Map JS getDay() (0=Sun..6=Sat) to our daysOrder index (0=Mon..6=Sun)
    const jsDay = now.getDay(); // 0-6, Sun-Sat
    let currentDayIndex;
    if (jsDay === 0) {
      // Sunday
      currentDayIndex = 6;
    } else {
      currentDayIndex = jsDay - 1; // Mon=0, Tue=1, ...
    }

    const currentTotalMinutes =
      currentDayIndex * 24 * 60 + nowHour * 60 + nowMin;

    let nextThisWeek = null;
    let minFutureDelta = Number.POSITIVE_INFINITY;

    let earliestOverall = null;
    let minOverallMinutes = Number.POSITIVE_INFINITY;

    for (const item of subjectSlots) {
      if (!item.day || !item.slot || !slotStartMinutes[item.slot]) continue;

      const dayIdx = daysOrder.indexOf(item.day);
      if (dayIdx === -1) continue;

      const startMinutes = slotStartMinutes[item.slot];
      const totalMinutes = dayIdx * 24 * 60 + startMinutes;

      // Track earliest occurrence in the timetable (for "next week" case)
      if (totalMinutes < minOverallMinutes) {
        minOverallMinutes = totalMinutes;
        earliestOverall = item;
      }

      // If this occurrence is still in the future this week
      if (totalMinutes >= currentTotalMinutes) {
        const delta = totalMinutes - currentTotalMinutes;
        if (delta < minFutureDelta) {
          minFutureDelta = delta;
          nextThisWeek = item;
        }
      }
    }

    let chosen;
    let isNextWeek = false;

    if (nextThisWeek) {
      chosen = nextThisWeek;
    } else {
      // No future occurrence left in this week; pick earliest in next week
      chosen = earliestOverall;
      isNextWeek = true;
    }

    if (!chosen) {
      return {
        message: `No upcoming classes found for subject '${normalizedSubject}' in yearSection '${yearSection}'`,
        yearSection,
        subject: normalizedSubject,
        nextClass: null,
      };
    }

    return {
      message: `Next class for subject '${normalizedSubject}' in yearSection '${yearSection}' retrieved successfully`,
      yearSection,
      subject: normalizedSubject,
      nextClass: {
        day: chosen.day,
        slot: chosen.slot,
        subject: chosen.subject,
        faculty: chosen.faculty,
        room: chosen.room,
        type: chosen.type,
        isNextWeek,
      },
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  addSingleSlot,
  addBatchForDay,
  updateSlot,
  deleteSlot,
  getWeeklyTimetable,
  getDayTimetable,
  getSlotsByFaculty,
  getNextClassForSubject,
  getFacultyDailyLoad,
};
