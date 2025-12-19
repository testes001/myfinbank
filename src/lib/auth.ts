import { UserORM, type UserModel, UserRole, UserStatus } from "@/components/data/orm/orm_user";
import { AccountORM, type AccountModel, AccountStatus } from "@/components/data/orm/orm_account";
import { FilterBuilder } from "@/components/data/orm/client";
import bcrypt from "bcryptjs";
import { getKYCData, saveKYCData } from "@/lib/kyc-storage";
import { addAuditLog } from "@/lib/admin-storage";

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
      ssn: "***-**-1234",
      phoneNumber: "+1-555-0100",
      phoneVerified: true,
      emailVerified: true,
      streetAddress: "123 Demo St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US",
      residencyYears: "5+",
      securityQuestions: [
        { question: "What is your mother's maiden name?", answer: "Demo" },
        { question: "What city were you born in?", answer: "Demo" },
        { question: "What is your favorite movie?", answer: "Demo" },
      ],
      idDocumentType: "drivers_license",
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
  const users = await userOrm.getUserByEmail(email);
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

  return { user, account: accounts[0] };
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
