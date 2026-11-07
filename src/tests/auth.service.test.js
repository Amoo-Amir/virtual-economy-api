jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("../config/prisma", () => ({
  $transaction: jest.fn(),
}));

jest.mock("../repositories/user.repository", () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  myProfile: jest.fn(),
}));

jest.mock("../repositories/wallet.repository", () => ({
  createWalletWithInitialCredit: jest.fn(),
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const userRepository = require("../repositories/user.repository");
const {
  createWalletWithInitialCredit,
} = require("../repositories/wallet.repository");

const ApiError = require("../utils/ApiError");
const authService = require("../services/auth.service");

describe("Auth Service Unit Tests", () => {
  const user = {
    id: "user-test-id",
    email: "amir@example.com",
    password_hash: "hashed-password",
  };

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should reject missing email or password", async () => {
      await expect(authService.register({})).rejects.toMatchObject({
        statusCode: 400,
        message: "Email and password are required",
      });
    });

    it("should register user and create initial wallet", async () => {
      const tx = { users: {} };

      bcrypt.hash.mockResolvedValue("hashed-password");

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(tx);
      });

      userRepository.createUser.mockResolvedValue({
        id: user.id,
        email: user.email,
      });

      createWalletWithInitialCredit.mockResolvedValue(undefined);

      const result = await authService.register({
        email: "  AMIR@example.com ",
        password: "Password123",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("Password123", 10);

      expect(userRepository.createUser).toHaveBeenCalledWith(tx, {
        email: "amir@example.com",
        password_hash: "hashed-password",
      });

      expect(createWalletWithInitialCredit).toHaveBeenCalledWith(tx, user.id);

      expect(result).toEqual({
        status: "ok",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });

    it("should convert duplicate email error to 409", async () => {
      const duplicateError = new Error("Unique constraint failed");

      duplicateError.code = "P2002";
      duplicateError.meta = {
        target: ["email"],
      };

      bcrypt.hash.mockResolvedValue("hashed-password");
      prisma.$transaction.mockRejectedValue(duplicateError);

      await expect(
        authService.register({
          email: user.email,
          password: "Password123",
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Email is already registered",
      });
    });

    it("should return 500 when initial wallet creation fails", async () => {
      const walletError = new Error("Database wallet error");
      const tx = {};

      bcrypt.hash.mockResolvedValue("hashed-password");

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(tx);
      });

      userRepository.createUser.mockResolvedValue({
        id: user.id,
        email: user.email,
      });

      createWalletWithInitialCredit.mockRejectedValue(walletError);

      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        authService.register({
          email: user.email,
          password: "Password123",
        }),
      ).rejects.toMatchObject({
        statusCode: 500,
        message: "Registration failed: wallet creation failed",
      });

      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it("should rethrow unexpected registration errors", async () => {
      const error = new Error("Unexpected database error");

      bcrypt.hash.mockResolvedValue("hashed-password");
      prisma.$transaction.mockRejectedValue(error);

      await expect(
        authService.register({
          email: user.email,
          password: "Password123",
        }),
      ).rejects.toBe(error);
    });
  });

  describe("login", () => {
    it("should reject missing login fields with ApiError 400", async () => {
      await expect(
        authService.login({ email: user.email }),
      ).rejects.toBeInstanceOf(ApiError);

      await expect(authService.login({})).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should reject unknown email", async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: user.email,
          password: "Password123",
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("should reject incorrect password", async () => {
      userRepository.findUserByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({
          email: user.email,
          password: "WrongPassword",
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("should login successfully and return a valid JWT", async () => {
      userRepository.findUserByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.login({
        email: " AMIR@example.com ",
        password: "Password123",
      });

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        "amir@example.com",
      );

      expect(result.status).toBe("ok");
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);

      expect(decoded.sub).toBe(user.id);
    });
  });

  describe("getUserbyId and me", () => {
    it("should return user by ID", async () => {
      userRepository.getUserById.mockResolvedValue(user);

      await expect(authService.getUserbyId(user.id)).resolves.toBe(user);

      expect(userRepository.getUserById).toHaveBeenCalledWith(user.id);
    });

    it("should return user profile", async () => {
      userRepository.myProfile.mockResolvedValue(user);

      await expect(authService.me(user.id)).resolves.toBe(user);

      expect(userRepository.myProfile).toHaveBeenCalledWith(user.id);
    });
  });
});
