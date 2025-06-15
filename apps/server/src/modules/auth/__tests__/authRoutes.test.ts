import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { authRoutes } from "../routes";

describe("Auth Routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);

  it("should return 400 if credentials are missing", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("MISSING_CREDENTIALS");
  });

  it("should return 401 for admin email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@sentry.io", password: "test" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHORIZED");
  });

  it("should return 200 and a user for valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "test" });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
  });
});
