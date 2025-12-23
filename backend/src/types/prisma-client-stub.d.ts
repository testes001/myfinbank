declare module '@prisma/client' {
  // Minimal stubs so TypeScript can compile without generated Prisma types.
  export class PrismaClient {
    [key: string]: any;
  }

  export type Prisma = any;

  // Common models
  export type Account = any;
  export type AccountStatus = any;
  export type AccountType = any;

  export type AdminUser = any;
  export type AdminSession = any;
  export type AdminRole = any;
  export type AdminStatus = any;

  export type User = any;
  export type UserRole = any;
  export type UserStatus = any;

  export type KYCVerification = any;
  export type KYCStatus = any;

  export type Transaction = any;
  export type TransactionStatus = any;
  export type TransactionType = any;

  export type P2PTransfer = any;
  export type P2PTransferStatus = any;

  export type SavingsGoal = any;
  export type SavingsGoalStatus = any;

  export type VirtualCard = any;
  export type CardStatus = any;
  export type CardType = any;

  // Exported enum objects (loosely typed)
  export const AccountStatus: any;
  export const AccountType: any;
  export const AdminRole: any;
  export const AdminStatus: any;
  export const UserRole: any;
  export const UserStatus: any;
  export const KYCStatus: any;
  export const TransactionStatus: any;
  export const TransactionType: any;
  export const P2PTransferStatus: any;
  export const SavingsGoalStatus: any;
  export const CardStatus: any;
  export const CardType: any;
}
