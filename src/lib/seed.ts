import { UserORM } from "@/components/data/orm/orm_user";
import { AccountORM } from "@/components/data/orm/orm_account";
import { hashPassword } from "@/lib/auth";
import { saveKYCData, getKYCData } from "@/lib/kyc-storage";

const userOrm = UserORM.getInstance();
const accountOrm = AccountORM.getInstance();

// FinBank routing number (constant for all users) - 051000017 as per banking standards
export const FINBANK_ROUTING_NUMBER = "051000017";

// Generate unique account number (10-12 digits)
function generateAccountNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
}

// Create approved KYC data for demo users
function createDemoKYCData(userId: string, phone: string, address: string) {
  const now = new Date().toISOString();
  const addressParts = address.split(",");
  const stateZip = addressParts[2]?.trim().split(" ") || ["NY", "10001"];

  saveKYCData(userId, {
    userId,
    dateOfBirth: "1990-01-15",
    ssn: "***-**-1234",
    phoneNumber: phone,
    phoneVerified: true,
    emailVerified: true,
    streetAddress: addressParts[0] || "123 Demo St",
    city: addressParts[1]?.trim() || "New York",
    state: stateZip[0] || "NY",
    zipCode: stateZip[1] || "10001",
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
}

export async function seedDemoUsers() {
  const demoUsers = [
    { email: "alice@demo.com", fullName: "Alice Johnson", password: "demo123", phone: "+1-555-0101", address: "123 Main St, New York, NY 10001" },
    { email: "bob@demo.com", fullName: "Bob Smith", password: "demo123", phone: "+1-555-0102", address: "456 Oak Ave, Los Angeles, CA 90001" },
    { email: "charlie@demo.com", fullName: "Charlie Brown", password: "demo123", phone: "+1-555-0103", address: "789 Elm St, Chicago, IL 60601" },
    { email: "diana@demo.com", fullName: "Diana Prince", password: "demo123", phone: "+1-555-0104", address: "321 Pine Rd, Houston, TX 77001" },
    { email: "evan@demo.com", fullName: "Evan Williams", password: "demo123", phone: "+1-555-0105", address: "654 Maple Dr, Phoenix, AZ 85001" },
  ];

  try {
    const existingUsers = await userOrm.getAllUser();
    const existingUsersByEmail = new Map(existingUsers.map((u) => [u.email, u]));

    for (const demoUser of demoUsers) {
      const existingUser = existingUsersByEmail.get(demoUser.email);

      if (!existingUser) {
        // Create new demo user
        const passwordHash = await hashPassword(demoUser.password);

        const [newUser] = await userOrm.insertUser([
          {
            email: demoUser.email,
            password_hash: passwordHash,
            full_name: demoUser.fullName,
            theme_preference: "dark",
            role: 0,
            status: 0,
            id: "",
            data_creator: "",
            data_updater: "",
            create_time: "",
            update_time: "",
          },
        ]);

        await accountOrm.insertAccount([
          {
            user_id: newUser.id,
            account_type: "checking",
            balance: "1000.00",
            currency: "USD",
            status: 0,
            id: "",
            data_creator: "",
            data_updater: "",
            create_time: "",
            update_time: "",
          },
        ]);

        // Create approved KYC data for new demo user
        createDemoKYCData(newUser.id, demoUser.phone, demoUser.address);
        console.log(`Created demo user: ${demoUser.email}`);
      } else {
        // Check if existing demo user needs KYC data
        const existingKYC = getKYCData(existingUser.id);
        if (!existingKYC || existingKYC.kycStatus !== "approved") {
          createDemoKYCData(existingUser.id, demoUser.phone, demoUser.address);
          console.log(`Added approved KYC data for existing demo user: ${demoUser.email}`);
        }
      }
    }

    console.log("Demo users seeding completed");
  } catch (error) {
    console.error("Failed to seed demo users:", error);
  }
}

// Mock routing number database for external bank lookups
export const ROUTING_NUMBER_DATABASE: Record<string, string> = {
  "011000015": "Federal Reserve Bank",
  "021000021": "JPMorgan Chase Bank",
  "026009593": "Bank of America",
  "121000248": "Wells Fargo Bank",
  "111000025": "Bank of New York Mellon",
  "036001808": "PNC Bank",
  "021200025": "Citibank",
  "044000037": "U.S. Bank",
  "322271627": "TD Bank",
  "256074974": "Navy Federal Credit Union",
  "051000017": "FinBank", // Our bank
};
