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
    // Check if slot already exists
    const existingSlot = await dynamoClient.get({
      TableName: TIMETABLE_TABLE,
      Key: {
        PK: yearSection,
        SK: `${day}#${slot}`,
      },
    });

    if (existingSlot.Item) {
      throw new Error(
        `Slot already exists for ${yearSection} on ${day} at slot ${slot}`
      );
    }

    // Validate slot number
    if (slot < 1 || slot > 7) {
      throw new Error("Slot number must be between 1 and 7");
    }

    // Validate type
    if (type !== "Theory" && type !== "LAB") {
      throw new Error('Type must be either "Theory" or "LAB"');
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

    for (const slotData of slots) {
      try {
        const { slot, subject, faculty, room, type } = slotData;

        // Check if slot already exists
        const existingSlot = await dynamoClient.get({
          TableName: TIMETABLE_TABLE,
          Key: {
            PK: yearSection,
            SK: `${day}#${slot}`,
          },
        });

        if (existingSlot.Item) {
          errors.push(`Slot ${slot} already exists`);
          continue;
        }

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

        results.push(timetableEntry);
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

module.exports = {
  addSingleSlot,
  addBatchForDay,
  updateSlot,
  deleteSlot,
  getWeeklyTimetable,
  getDayTimetable,
};
