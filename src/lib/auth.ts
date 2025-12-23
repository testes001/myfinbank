import { UserORM, type UserModel, UserRole, UserStatus } from "@/components/data/orm/orm_user";
import { AccountORM, type AccountModel, AccountStatus } from "@/components/data/orm/orm_account";
import { FilterBuilder } from "@/components/data/orm/client";
import bcrypt from "bcryptjs";
import { getKYCData, saveKYCData } from "@/lib/kyc-storage";
import { addAuditLog } from "@/lib/admin-storage";
import {
  performLoginSecurityCheck,
  performPasswordResetSecurityCheck,
  formatDeviceInfoForEmail,
} from "@/lib/auth-security";
import {
  sendNewLoginAlertEmail,
  sendPasswordResetEmail,
  sendPasswordResetCompletedEmail,
} from "@/lib/email-service";

const userOrm = UserORM.getInstance();
const accountOrm = AccountORM.getInstance();

// Demo user emails that should bypass KYC
const DEMO_USER_EMAILS = [
  "alice@demo.com",
  "bob@demo.com",
  "charlie@demo.com",
  "diana@demo.com",
  "evan@demo.com",
];

// Ensure demo user has approved KYC data
function ensureDemoUserKYC(userId: string, email: string) {
  if (!DEMO_USER_EMAILS.includes(email)) return;

  const existingKYC = getKYCData(userId);
  if (!existingKYC || existingKYC.kycStatus !== "approved") {
    const now = new Date().toISOString();
    saveKYCData(userId, {
      userId,
      dateOfBirth: "1990-01-15",
      ssn: "X1234567", // EU ID placeholder
      phoneNumber: "+34 900 123 456",
      phoneVerified: true,
      emailVerified: true,
      streetAddress: "Calle de Alcalá 45",
      city: "Madrid",
      state: "Madrid",
      zipCode: "28014",
      country: "ES",
      residencyYears: "5+",
      securityQuestions: [
        { question: "What is your mother's maiden name?", answer: "Demo" },
        { question: "What city were you born in?", answer: "Demo" },
        { question: "What is your favorite movie?", answer: "Demo" },
      ],
      idDocumentType: "dni",
      idDocumentFrontUrl: "https://secure-storage.example.com/demo-id-front.jpg",
      idDocumentBackUrl: "https://secure-storage.example.com/demo-id-back.jpg",
      livenessCheckComplete: true,
      livenessCheckTimestamp: now,
      accountTypes: ["checking"],
      initialDepositMethod: "external_ach",
      initialDepositAmount: "1000.00",
      kycStatus: "approved",
      kycSubmittedAt: now,
      kycReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Auto-approved KYC for demo user: ${email}`);
  }
}

export interface AuthUser {
  user: UserModel;
  account: AccountModel;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string
): Promise<AuthUser> {
  // Basic geo-eligibility guard (frontend safety; must be enforced server-side in production)
  const geoCountry = (window as any).__finbankCountryCode as string | undefined;
  if (geoCountry) {
    const upper = geoCountry.toUpperCase();
    const eligible = ["ES", "DE", "FR", "IT", "PT"];
    if (!eligible.includes(upper)) {
      if (upper === "US") {
        (window as any).__finbankRequireSponsor = true;
      } else {
        throw new Error("Fin-Bank currently serves Spain, Germany, France, Italy, and Portugal only");
      }
    }
  }
  const existingUsers = await userOrm.getUserByEmail(email);
  if (existingUsers.length > 0) {
    addAuditLog({
      actor: email,
      actorType: "user",
      action: "registration_failed",
      resource: "user",
      details: { email, reason: "Email already exists" },
      status: "failed",
    });
    throw new Error("User with this email already exists");
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await userOrm.insertUser([
    {
      email,
      password_hash: passwordHash,
      full_name: fullName,
      theme_preference: "dark",
      role: UserRole.Unspecified,
      status: UserStatus.Unspecified,
      id: "",
      data_creator: "",
      data_updater: "",
      create_time: "",
      update_time: "",
    },
  ]);

  const [account] = await accountOrm.insertAccount([
    {
      user_id: newUser.id,
      account_type: "checking",
      balance: "0",
      currency: "USD",
      status: AccountStatus.Unspecified,
      id: "",
      data_creator: "",
      data_updater: "",
      create_time: "",
      update_time: "",
    },
  ]);

  addAuditLog({
    actor: newUser.id,
    actorType: "user",
    action: "user_registered",
    resource: "user",
    resourceId: newUser.id,
    details: { email, fullName },
    status: "success",
  });

  return { user: newUser, account };
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  console.log("Attempting to log in user:", email);
  const users = await userOrm.getUserByEmail(email);
  console.log("Users found:", users);
  if (users.length === 0) {
    addAuditLog({
      actor: email,
      actorType: "user",
      action: "login_failed",
      resource: "user",
      details: { email, reason: "User not found" },
      status: "failed",
    });
    throw new Error("Invalid email or password");
  }

  const user = users[0];
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    addAuditLog({
      actor: user.id,
      actorType: "user",
      action: "login_failed",
      resource: "user",
      resourceId: user.id,
      details: { email, reason: "Invalid password" },
      status: "failed",
    });
    throw new Error("Invalid email or password");
  }

  const accounts = await accountOrm.getAccountByUserId(user.id);
  if (accounts.length === 0) {
    throw new Error("No account found for user");
  }

  // Auto-approve KYC for demo users so they can access dashboard
  ensureDemoUserKYC(user.id, email);

  addAuditLog({
    actor: user.id,
    actorType: "user",
    action: "user_login",
    resource: "user",
    resourceId: user.id,
    details: { email },
    status: "success",
  });

  // Perform security checks asynchronously (do not block login response)
  void (async () => {
    try {
      const sec = await performLoginSecurityCheck({ user, account: accounts[0] });
      const deviceInfo = formatDeviceInfoForEmail(sec.ipData, sec.deviceFingerprint);
      const location = sec.ipData ? `${sec.ipData.city}, ${sec.ipData.country}` : "Unknown";
      const timestamp = new Date().toLocaleString();

      await sendNewLoginAlertEmail(user.email, deviceInfo, location, timestamp, sec.isNewDevice);
    } catch (e) {
      console.error("Failed to run login security check or send email:", e);
    }
  })();

  return { user, account: accounts[0] };
}

/**
 * Request a password reset for a user email. Generates a simple token stored in localStorage
 * and sends a password reset email with device/location info. Returns a token for testing.
 */
export async function requestPasswordReset(email: string): Promise<string> {
  const users = await userOrm.getUserByEmail(email);
  if (users.length === 0) {
    throw new Error("User not found");
  }

  const user = users[0];

  // Perform security check to gather device/ip info
  const sec = await performPasswordResetSecurityCheck(user.id);
  const deviceInfo = formatDeviceInfoForEmail(sec.ipData, sec.deviceFingerprint);

  // Create token (for demo purposes, store in localStorage)
  const token = `pwreset_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
  const payload = { token, userId: user.id, expiresAt };
  localStorage.setItem(`fin_bank_pwreset_${token}`, JSON.stringify(payload));

  const resetLink = `${window.location.origin}/reset-password?token=${token}`;

  // Send password reset email (non-blocking)
  void sendPasswordResetEmail(user.email, resetLink, deviceInfo).catch((e) =>
    console.error("Failed to send password reset email:", e),
  );

  return token;
}

/**
 * Complete password reset given token and new password. Applies fund restriction if reset from unknown device.
 */
export async function completePasswordReset(token: string, newPassword: string): Promise<void> {
  const stored = localStorage.getItem(`fin_bank_pwreset_${token}`);
  if (!stored) throw new Error("Invalid or expired token");

  const payload = JSON.parse(stored);
  if (new Date(payload.expiresAt).getTime() < Date.now()) {
    throw new Error("Token expired");
  }

  const userId = payload.userId as string;
  const users = await userOrm.getUserById(userId);
  if (users.length === 0) throw new Error("User not found");

  const newHash = await hashPassword(newPassword);
  const user = users[0];
  await userOrm.setUserById(userId, { ...user, password_hash: newHash });

  // Perform security checks and apply restrictions if needed
  const sec = await performPasswordResetSecurityCheck(userId);
  const deviceInfo = formatDeviceInfoForEmail(sec.ipData, sec.deviceFingerprint);

  // If reset was from unknown device, email will note fundAccessDelay via sendPasswordResetCompletedEmail
  const fundAccessDelay = sec.isNewDevice;

  void sendPasswordResetCompletedEmail(user.email, deviceInfo, fundAccessDelay).catch((e) =>
    console.error("Failed to send password reset completion email:", e),
  );

  // Remove token
  localStorage.removeItem(`fin_bank_pwreset_${token}`);
}

export async function getUserWithAccount(userId: string): Promise<AuthUser> {
  const users = await userOrm.getUserById(userId);
  if (users.length === 0) {
    throw new Error("User not found");
  }

  const accounts = await accountOrm.getAccountByUserId(userId);
  if (accounts.length === 0) {
    throw new Error("No account found for user");
  }

  return { user: users[0], account: accounts[0] };
}

export async function updateUserTheme(userId: string, theme: string): Promise<void> {
  const users = await userOrm.getUserById(userId);
  if (users.length === 0) {
    throw new Error("User not found");
  }

  const user = users[0];
  await userOrm.setUserById(userId, {
    ...user,
    theme_preference: theme,
  });
}
