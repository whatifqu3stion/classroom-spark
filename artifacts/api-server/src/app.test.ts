import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import supertest from "supertest";
import app from "./app";
import {
  ACTIVITY_PAYLOAD_TOO_LARGE_ERROR,
  ACTIVITY_REQUEST_BODY_LIMIT_BYTES,
  PRESENTATION_IMAGE_FILE_LIMIT_BYTES,
  PRESENTATION_IMAGE_SIZE_ERROR,
} from "@workspace/api-zod";

describe("API request body limits", () => {
  beforeEach(() => {
    vi.stubEnv("APP_PASSWORD", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a safe JSON 413 response for oversized activity payloads", async () => {
    const response = await supertest(app)
      .post("/api/healthz")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          payload: "x".repeat(ACTIVITY_REQUEST_BODY_LIMIT_BYTES),
        }),
      );

    expect(response.status).toBe(413);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ error: ACTIVITY_PAYLOAD_TOO_LARGE_ERROR });
  });

  it("rejects an over-5 MB image data URL before activity persistence", async () => {
    const encodedLength =
      4 * Math.ceil((PRESENTATION_IMAGE_FILE_LIMIT_BYTES + 1) / 3);
    const oversizedVisualUrl = `data:image/png;base64,${"A".repeat(encodedLength)}`;

    const response = await supertest(app).post("/api/activities").send({
      classId: "not-needed-for-image-validation",
      task: "Keep the rest of the activity intact.",
      durationMinutes: 5,
      deviceMode: "off",
      visualUrl: oversizedVisualUrl,
    });

    expect(response.status).toBe(413);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ error: PRESENTATION_IMAGE_SIZE_ERROR });
  });
});