import { jest } from "@jest/globals";

jest.mock("@/config/redis", () => ({
  __esModule: true,
  default: null,
}));

describe("verification service throttling", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("issues and verifies codes with in-memory store", async () => {
    const { issueVerificationCode, verifyCode } = await import("@/services/verification.service");
    const { code } = await issueVerificationCode("otp-user@example.com");
    const result = await verifyCode("otp-user@example.com", code);
    expect(result).toBe(true);
  });

  it("throttles repeated verification requests per email and IP", async () => {
    const { checkVerificationRateLimit } = await import("@/services/verification.service");
    for (let i = 0; i < 5; i++) {
      await expect(
        checkVerificationRateLimit("throttle@example.com", "127.0.0.1")
      ).resolves.toBeUndefined();
    }

    await expect(
      checkVerificationRateLimit("throttle@example.com", "127.0.0.1")
    ).rejects.toThrow(/Too many verification requests/i);
  });
});
