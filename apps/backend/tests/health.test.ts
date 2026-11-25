import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("HimaCraft API", () => {
  it("should return API health status", async () => {
    const response = await request(app)
      .get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should return liveness status", async () => {
    const response = await request(app)
      .get("/api/v1/health/live");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("alive");
  });

  it("should return 404 for unknown routes", async () => {
    const response = await request(app)
      .get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});