import { describe, expect, it } from "vitest";
import { ApiError, type ApiErrorBody } from "./client";

describe("ApiError", () => {
  it("exposes the stable code and status from the uniform error body", () => {
    const body: ApiErrorBody = {
      timestamp: "2026-06-14T00:00:00Z",
      status: 403,
      error: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
      path: "/api/v1/events/1",
      traceId: "abc123",
    };

    const err = new ApiError(body);

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe(body.message);
  });
});
