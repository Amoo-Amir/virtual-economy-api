const request = require("supertest");
const { randomUUID } = require("crypto");
const app = require("../app");

const email = `auth-${randomUUID()}@example.com`;
const password = "TestPassword123";

let token;
let userId;

describe("Authentication API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ email, password });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("ok");
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.id).toBeDefined();

      userId = response.body.user.id;
    });

    it("should reject duplicate email registration", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ email, password });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe("error");
    });

    it("should reject invalid email", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        password,
      });

      expect(response.status).toBe(400);
    });

    it("should reject password shorter than 8 characters", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: `short-${randomUUID()}@example.com`,
          password: "1234567",
        });

      expect(response.status).toBe(400);
    });

    it("should reject missing fields", async () => {
      const response = await request(app).post("/api/auth/register").send({});

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.user.id).toBe(userId);

      token = response.body.token;
    });

    it("should reject incorrect password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email,
        password: "WrongPassword123",
      });

      expect(response.status).toBe(401);
    });

    it("should reject unknown email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: `unknown-${randomUUID()}@example.com`,
          password,
        });

      expect(response.status).toBe(401);
    });

    it("should reject missing login fields", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/auth/profile", () => {
    it("should return profile with a valid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it("should reject an invalid token", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("should reject a request without token", async () => {
      const response = await request(app).get("/api/auth/profile");

      expect(response.status).toBe(401);
    });
  });
});
