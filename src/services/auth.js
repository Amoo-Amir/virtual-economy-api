const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");

const register = async (body) => {
  const { email, password } = body || {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [normalizedEmail, passwordHash],
    );

    return {
      status: "ok",
      user: result.rows[0],
    };
  } catch (error) {
    if (error.code === "23505") {
      const duplicateError = new Error("Email already exists");
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
};

const login = async (body) => {
  const { email, password } = body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id,email,password_hash,created_at
    FROM users
    WHERE email = $1`,
    [normalizedEmail],
  );

  const user = result.rows[0];

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  const accessToken = jwt.sign(
    {
      sub: user.id,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    },
  );
  return {
    status: "ok",
    accessToken,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

const getUserbyId = async (userId) => {

  const result = await pool.query(
    `SELECT id,email
    FROM users
    WHERE id = $1`,
    [userId],
  );
  return result.rows[0] || null;
};

const me = async (userId) => {
  const result = await pool.query(
    `SELECT id, email, created_at
     FROM users
     WHERE id = $1`,
    [userId],
  );

  return result.rows[0] || null;
};

module.exports = {
  register,
  login,
  getUserbyId,
  me,
};
