const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const { createUser } = require("../repositories/user.repository");
const {
  createWalletWithInitialCredit,
} = require("../repositories/wallet.repository");

const userRepository = require("../repositories/user.repository");

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

  let user;

  try {
    user = await prisma.$transaction(async (tx) => {
      const newUser = await createUser(tx, {
        email: normalizedEmail,
        password_hash: passwordHash,
      });

      try {
        await createWalletWithInitialCredit(tx, newUser.id);
      } catch (error) {
        console.error("Wallet creation failed:", error);

        throw new Error("WALLET_CREATION_FAILED", {
          cause: error,
        });
      }

      return newUser;
    });

    return {
      status: "ok",
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (error) {
    if (error.code === "P2002") {
      throw (409, "Email is already registered");
    }
    if (error.message === "WALLET_CREATION_FAILED") {
      throw (500, "Registration failed: wallet creation failed");
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

  const user = await userRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: user.id,
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  return {
    status: "ok",
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

const getUserbyId = async (userId) => {
  const user = await userRepository.getUserById(userId);

  return user;
};

const me = async (userId) => {
  const userProfile = await userRepository.myProfile(userId);

  return userProfile;
};

module.exports = {
  register,
  login,
  getUserbyId,
  me,
};
