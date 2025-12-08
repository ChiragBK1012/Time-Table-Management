const dynamoClient = require("../config/dynamoClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const USERS_TABLE = "Users";

/**
 * Register a new admin user
 */
async function registerAdmin(email, password, name) {
  try {
    // Check if admin already exists
    const existingAdmin = await dynamoClient.get({
      TableName: USERS_TABLE,
      Key: {
        PK: `ADMIN#${email}`,
      },
    });

    if (existingAdmin.Item) {
      throw new Error("Admin with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = {
      PK: `ADMIN#${email}`,
      userType: "ADMIN",
      email: email,
      name: name,
      hashed_password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await dynamoClient.put({
      TableName: USERS_TABLE,
      Item: admin,
    });

    return { message: "Admin registered successfully", email: email };
  } catch (error) {
    throw error;
  }
}

/**
 * Register a new student user
 */
async function registerStudent(usn, password, name) {
  try {
    // Check if student already exists
    const existingStudent = await dynamoClient.get({
      TableName: USERS_TABLE,
      Key: {
        PK: `STUDENT#${usn}`,
      },
    });

    if (existingStudent.Item) {
      throw new Error("Student with this USN already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student user
    const student = {
      PK: `STUDENT#${usn}`,
      userType: "STUDENT",
      usn: usn,
      name: name,
      hashed_password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await dynamoClient.put({
      TableName: USERS_TABLE,
      Item: student,
    });

    return { message: "Student registered successfully", usn: usn };
  } catch (error) {
    throw error;
  }
}

/**
 * Login admin user
 */
async function loginAdmin(email, password) {
  try {
    // Get admin from database
    const result = await dynamoClient.get({
      TableName: USERS_TABLE,
      Key: {
        PK: `ADMIN#${email}`,
      },
    });

    if (!result.Item) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      result.Item.hashed_password
    );
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userType: "ADMIN",
        email: result.Item.email,
        PK: result.Item.PK,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      message: "Login successful",
      token: token,
      user: {
        email: result.Item.email,
        name: result.Item.name,
        userType: result.Item.userType,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Login student user
 */
async function loginStudent(usn, password) {
  try {
    // Get student from database
    const result = await dynamoClient.get({
      TableName: USERS_TABLE,
      Key: {
        PK: `STUDENT#${usn}`,
      },
    });

    if (!result.Item) {
      throw new Error("Invalid USN or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      result.Item.hashed_password
    );
    if (!isPasswordValid) {
      throw new Error("Invalid USN or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userType: "STUDENT",
        usn: result.Item.usn,
        PK: result.Item.PK,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      message: "Login successful",
      token: token,
      user: {
        usn: result.Item.usn,
        name: result.Item.name,
        userType: result.Item.userType,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get user by PK (for middleware verification)
 */
async function getUserByPK(pk) {
  try {
    const result = await dynamoClient.get({
      TableName: USERS_TABLE,
      Key: {
        PK: pk,
      },
    });

    return result.Item || null;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  registerAdmin,
  registerStudent,
  loginAdmin,
  loginStudent,
  getUserByPK,
};
