import { jest } from "@jest/globals";

const mockPrisma: any = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  account: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  session: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  loginAttempt: {
    count: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  UserRole: { CUSTOMER: "CUSTOMER" },
  UserStatus: {
    PENDING_KYC: "PENDING_KYC",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    CLOSED: "CLOSED",
  },
  KYCStatus: { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" },
}));

jest.mock("@/utils/jwt", () => ({
  generateAccessToken: () => "access-token",
  generateRefreshToken: () => "refresh-token",
  extractBearerToken: () => "",
  verifyAccessToken: () => ({
    userId: "user-1",
    email: "demo@demo.com",
    role: "CUSTOMER",
    sessionId: "session-1",
  }),
  verifyRefreshToken: () => ({
    userId: "user-1",
    email: "demo@demo.com",
    role: "CUSTOMER",
    sessionId: "session-1",
  }),
}));

jest.mock("@/middleware/errorHandler", () => ({
  errors: {
    conflict: (msg?: string) => new Error(msg || "conflict"),
    unauthorized: (msg?: string) => new Error(msg || "unauthorized"),
    forbidden: (msg?: string) => new Error(msg || "forbidden"),
    validation: (msg?: string) => new Error(msg || "validation"),
    rateLimit: (msg?: string) => new Error(msg || "rate-limit"),
    notFound: (msg?: string) => new Error(msg || "not-found"),
    accountLocked: (msg?: string) => new Error(msg || "account-locked"),
  },
}));

jest.mock("@/utils/logger", () => ({
  log: {
    auth: jest.fn(),
    security: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("AuthService.register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defers token issuance for non-demo signups", async () => {
    const { authService } = await import("@/services/auth.service");
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user-regular",
      email: "user@example.com",
      fullName: "Test User",
      role: "CUSTOMER",
      status: "PENDING_KYC",
      kycStatus: "PENDING",
      passwordHash: "hash",
    });
    mockPrisma.account.create.mockResolvedValue({
      id: "acct-1",
      userId: "user-regular",
      accountNumber: "0001",
      routingNumber: "021000021",
      accountType: "CHECKING",
      balance: 0,
      availableBalance: 0,
      currency: "USD",
      status: "ACTIVE",
    });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const result = await authService.register({
      email: "user@example.com",
      password: "Password!2345",
      fullName: "Test User",
    });

    expect(result.accessToken).toBe("");
    expect(result.refreshToken).toBe("");
    expect(result.user.email).toBe("user@example.com");
    expect(mockPrisma.account.create).toHaveBeenCalled();
  });

  it("returns tokens immediately for demo signups", async () => {
    const { authService } = await import("@/services/auth.service");
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user-demo",
      email: "demo@demo.com",
      fullName: "Demo User",
      role: "CUSTOMER",
      status: "PENDING_KYC",
      kycStatus: "PENDING",
      passwordHash: "hash",
    });
    mockPrisma.account.create.mockResolvedValue({
      id: "acct-2",
      userId: "user-demo",
      accountNumber: "0002",
      routingNumber: "021000021",
      accountType: "CHECKING",
      balance: 0,
      availableBalance: 0,
      currency: "USD",
      status: "ACTIVE",
    });
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.session.create.mockResolvedValue({
      id: "session-1",
      userId: "user-demo",
      refreshTokenHash: "",
      expiresAt: new Date(),
      deviceInfo: {},
      ipAddress: "",
      userAgent: "",
    });
    mockPrisma.session.update.mockResolvedValue({});

    const result = await authService.register({
      email: "demo@demo.com",
      password: "Password!2345",
      fullName: "Demo User",
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.user.email).toBe("demo@demo.com");
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });
});
