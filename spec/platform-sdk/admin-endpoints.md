# Admin API Endpoints

This document describes the admin-related endpoints used by the `AdminPanel` UI.

Note: this repository includes a demo in-memory `admin-storage` which is not intended for production. Protect admin routes server-side in real deployments.

## GET /admin/session
- Purpose: return current admin session if authenticated
- Response: 200 with JSON { id, username, role, fullName, createdAt }

## POST /admin/login
- Purpose: authenticate an admin user
- Body: { username, password }
- Response: 200 with session object and token

## POST /admin/logout
- Purpose: revoke admin session

## GET /admin/audit-logs
- Purpose: list audit logs
- Query: `?limit=50&before=` optional

## POST /admin/review/kyc
- Purpose: approve/reject a user's KYC application
- Body: { userId, action: "approve" | "reject", notes?: string }

## POST /admin/review/transaction
- Purpose: approve/reject pending transaction
- Body: { transactionId, action: "approve" | "reject", notes?: string }

## POST /admin/suspicious/review
- Purpose: mark suspicious activity as reviewed
- Body: { flagId, reviewerId, notes?: string }

Implementation notes
- Client should include an authorization token for admin endpoints.
- Server must enforce rate limits and strong authentication (MFA recommended).
- All admin actions must be logged to an immutable audit log.
