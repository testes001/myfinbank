# Fin-Bank Production Setup & Integration Guide

## Quick Start

### 1. Update App Entry Point

To use the new landing page with authentication gateway, update your main routing:

```typescript
// src/routes/index.tsx
import { AuthenticationGateway } from "@/components/AuthenticationGateway";
import { BankingApp } from "@/components/BankingApp";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show landing page + login for unauthenticated users
  if (!currentUser) {
    return <AuthenticationGateway />;
  }

  // Show dashboard for authenticated users
  return <BankingApp />;
}
```

### 2. Update BankingApp Component

Update to use the new MobileDepositModalNew:

```typescript
import { MobileDepositModalNew } from "@/components/MobileDepositModalNew";

// Replace this line:
// <MobileDepositModal open={isMobileDepositOpen} ...>

// With this:
<MobileDepositModalNew open={isMobileDepositOpen} ...>
```

---

## Integration Checklist

### 1. Email Service Setup (SendGrid)

#### Option A: SendGrid

```bash
npm install @sendgrid/mail
```

Create `src/lib/email-service.ts`:

```typescript
import sgMail from "@sendgrid/mail";
import { getEmailTemplate } from "./email-templates";

sgMail.setApiKey(process.env.VITE_SENDGRID_API_KEY!);

export async function sendTransactionalEmail(
  emailType: string,
  to: string,
  data: any,
): Promise<boolean> {
  try {
    const template = getEmailTemplate(emailType, data);
    if (!template) {
      console.error(`Email template not found: ${emailType}`);
      return false;
    }

    await sgMail.send({
      to,
      from: process.env.VITE_SENDGRID_FROM_EMAIL!,
      subject: template.subject,
      html: template.html,
      text: template.plainText,
      replyTo: "support@finbank.eu",
    });

    console.log(`Email sent: ${emailType} to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email: ${emailType}`, error);
    return false;
  }
}

// Usage
export async function sendWelcomeEmail(fullName: string, email: string) {
  return sendTransactionalEmail("welcome", email, {
    fullName,
    email,
    appUrl: "https://app.finbank.eu",
  });
}
```

#### Option B: Mailgun

```bash
npm install mailgun.js
```

```typescript
import FormData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);
const client = mailgun.client({
  username: "api",
  key: process.env.VITE_MAILGUN_API_KEY!,
});

const messageData = {
  from: "Fin-Bank <noreply@finbank.eu>",
  to: recipient,
  subject: template.subject,
  html: template.html,
  text: template.plainText,
};

const result = await client.messages.create("mg.finbank.eu", messageData);
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Email Service (choose one)
VITE_SENDGRID_API_KEY=SG.xxxxxx
VITE_SENDGRID_FROM_EMAIL=noreply@finbank.eu

# OR
VITE_MAILGUN_API_KEY=key-xxxxx
VITE_MAILGUN_DOMAIN=mg.finbank.eu

# IP Geolocation (ipapi.co is free, no key needed)
# VITE_IPAPI_KEY=optional_key_for_higher_limits

# Encryption for check deposits
VITE_ENCRYPTION_KEY=your_32_char_encryption_key

# Feature Flags
VITE_ENABLE_JOINT_ACCOUNTS=true
VITE_ENABLE_SPENDING_ANALYTICS=true
VITE_ENABLE_MOBILE_DEPOSIT=true

# Monitoring
VITE_SENTRY_DSN=https://xxxxxx@sentry.io/123456
```

### 3. Integrate IP Detection into Login

Update `src/lib/auth.ts`:

```typescript
import { performLoginSecurityCheck, getFundRestrictionStatus } from "./auth-security";
import { sendNewLoginAlert } from "./email-service";

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  // ... existing validation code ...

  // NEW: Perform security check
  const securityContext = await performLoginSecurityCheck(authUser);

  // NEW: Store security context in session
  sessionStorage.setItem(
    `security_context_${authUser.user.id}`,
    JSON.stringify(securityContext),
  );

  // NEW: Send login alert email if new device
  if (securityContext.isNewDevice) {
    const deviceInfo = formatDeviceInfoForEmail(
      securityContext.ipData,
      securityContext.deviceFingerprint,
    );

    await sendNewLoginAlert(email, {
      deviceInfo,
      location: securityContext.ipData?.city + ", " + securityContext.ipData?.country,
      timestamp: new Date().toLocaleString(),
      isUnknownDevice: securityContext.isNewDevice,
    });
  }

  return authUser;
}
```

### 4. Enforce Fund Access Restrictions

Create middleware to check restrictions before transfers:

```typescript
// src/lib/transfer-authorization.ts
import { getFundRestrictionStatus } from "./ip-geolocation";

export function canUserTransferFunds(userId: string): {
  allowed: boolean;
  reason?: string;
} {
  const restriction = getFundRestrictionStatus(userId);

  if (restriction.restricted) {
    return {
      allowed: false,
      reason: restriction.message,
    };
  }

  return { allowed: true };
}
```

Usage in transfer component:

```typescript
const { allowed, reason } = canUserTransferFunds(currentUser.user.id);

if (!allowed) {
  toast.error(reason);
  return;
}

// Continue with transfer
```

### 5. Mobile Deposit Integration

The `MobileDepositModalNew` component is already fully integrated. Just ensure it's imported:

```typescript
import { MobileDepositModalNew } from "@/components/MobileDepositModalNew";
import { getUserMobileDeposits, getAdminDepositQueue } from "@/lib/mobile-deposit";

// In your dashboard
<MobileDepositModalNew
  open={isMobileDepositOpen}
  onOpenChange={setIsMobileDepositOpen}
  onSuccess={() => {
    // Refresh deposit history
    const deposits = getUserMobileDeposits(currentUser.user.id);
  }}
/>
```

### 6. Create Admin Deposit Dashboard

Create `src/components/AdminDepositDashboard.tsx`:

```typescript
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAdminDepositQueue,
  getMobileDeposit,
  approveDeposit,
  rejectDeposit,
  getDepositStatistics,
} from "@/lib/mobile-deposit";

export function AdminDepositDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setQueue(getAdminDepositQueue());
    setStats(getDepositStatistics());
  }, []);

  const handleApprove = (depositId: string) => {
    const result = approveDeposit(depositId, "admin@finbank.eu");
    if (result.success) {
      setQueue(getAdminDepositQueue());
      setStats(getDepositStatistics());
    }
  };

  const handleReject = (
    depositId: string,
    reason: "unsupported_currency" | "illegible_image" | "other",
  ) => {
    const result = rejectDeposit(depositId, "admin@finbank.eu", reason);
    if (result.success) {
      setQueue(getAdminDepositQueue());
      setStats(getDepositStatistics());
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mobile Deposit Admin</h1>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-2xl font-bold">{stats?.totalPending || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {stats?.totalApproved || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {stats?.totalRejected || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Avg Processing</p>
          <p className="text-lg font-bold">
            {stats?.averageProcessingTime
              ? `${Math.round(stats.averageProcessingTime / (1000 * 60 * 60))}h`
              : "—"}
          </p>
        </Card>
      </div>

      {/* Deposit Queue */}
      <div>
        <h2 className="text-xl font-bold mb-4">Pending Deposits ({queue.length})</h2>

        {queue.length === 0 ? (
          <Card className="p-8 text-center text-slate-600">
            No pending deposits
          </Card>
        ) : (
          <div className="space-y-4">
            {queue.map((deposit) => (
              <Card key={deposit.id} className="p-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div>
                    <p className="text-sm text-slate-600">Amount</p>
                    <p className="font-bold">
                      {deposit.currency}
                      {deposit.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Currency</p>
                    <p className="font-semibold">{deposit.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Account</p>
                    <p className="font-semibold capitalize">{deposit.accountType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Submitted</p>
                    <p className="text-sm">
                      {new Date(deposit.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <img
                      src={deposit.checkFrontImageUrl}
                      alt="Check"
                      className="h-12 rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(deposit.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        handleReject(deposit.id, "illegible_image")
                      }
                      variant="outline"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 7. Add Security Headers (Recommended)

In `vite.config.js`:

```javascript
export default {
  server: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    },
  },
};
```

### 8. Testing the Implementation

#### Test Login with IP Detection

```bash
# Login with a test user
# Should see:
# 1. IP geolocation detected
# 2. Device fingerprint generated
# 3. Security event logged
# 4. If new device: 24-hour restriction applied
# 5. Login alert email sent
```

#### Test Mobile Deposit

```bash
# Open mobile deposit modal
# 1. Review currency restrictions message
# 2. Capture check images
# 3. Enter amount and select currency (USD or EUR)
# 4. Try entering unsupported currency (€ instead of EUR)
# 5. Should get validation error
# 6. Submit deposit
# 7. Check admin queue shows deposit
# 8. Approve/reject deposit
# 9. Verify emails sent
```

#### Test Fund Restrictions

```bash
# 1. Login from unknown IP
# 2. Check session storage for restriction
# 3. Try to transfer funds
# 4. Should be blocked with message
# 5. View dashboard should show restriction notice
# 6. Wait 24 hours (or manually clear in localStorage)
# 7. Transfer should be allowed
```

---

## Production Deployment Checklist

### Pre-Deployment Security

- [ ] All secrets moved to environment variables
- [ ] No hardcoded API keys or passwords
- [ ] HTTPS enabled (TLS 1.2+)
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### Pre-Deployment Functionality

- [ ] Landing page geo-blocking working
- [ ] Email service connected (test send)
- [ ] Mobile deposit full workflow tested
- [ ] Admin dashboard working
- [ ] Fund restrictions enforced
- [ ] Security events logged
- [ ] 24-hour delays working correctly

### Pre-Deployment Compliance

- [ ] GDPR privacy notice displayed
- [ ] Terms of service available
- [ ] Deposit insurance clearly shown
- [ ] EU banking license displayed
- [ ] Regulatory contact info provided
- [ ] Data retention policy documented (7 years)

### Monitoring & Alerting

- [ ] Sentry/error tracking enabled
- [ ] Analytics installed
- [ ] Email delivery monitoring
- [ ] Failed login alerts configured
- [ ] Suspicious activity detection enabled
- [ ] Uptime monitoring configured

---

## Troubleshooting

### IP Geolocation Not Working

**Issue**: Location check fails, blocks valid users

**Solution**:
```typescript
// In LandingPage.tsx, geolocation check can fail gracefully
if (geoData === null) {
  // Continue without blocking - server can verify later
  setLocationCheck({ eligible: true, country: "Unknown", countryCode: "" });
}
```

### Email Not Sending

**Issue**: Users don't receive emails

**Debug**:
```typescript
// Test email service
import { sendWelcomeEmail } from "@/lib/email-service";

const result = await sendWelcomeEmail("Test User", "test@example.com");
console.log("Email sent:", result);
```

### Fund Restriction Not Working

**Issue**: User can still transfer when restricted

**Debug**:
```typescript
// Check localStorage
const restrictions = localStorage.getItem(
  `fin_bank_fund_restrictions_${userId}`
);
console.log("Restrictions:", restrictions);

// Clear manually if needed
localStorage.removeItem(`fin_bank_fund_restrictions_${userId}`);
```

### Mobile Deposit Images Not Saved

**Issue**: Deposit images lost after refresh

**Solution**: Implement image encryption and server-side storage:
```typescript
// Use Firebase Storage, AWS S3, or similar
// Encrypt images before upload
// Reference URL in deposit record
```

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load landing page for faster initial load
const LandingPage = React.lazy(() =>
  import("@/components/LandingPage")
);
```

### Image Optimization

```typescript
// For check deposit images
const imageFile = await compressImage(file);
const webpFile = await convertToWebP(imageFile);
const base64 = await fileToBase64(webpFile);
```

### Caching Strategy

```typescript
// Cache geolocation data (valid for 24 hours)
const cacheKey = `geo_${userIp}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
  const age = Date.now() - JSON.parse(cached).timestamp;
  if (age < 24 * 60 * 60 * 1000) {
    return JSON.parse(cached).data;
  }
}
```

---

## Next Steps

1. **Integrate email service** (SendGrid or Mailgun)
2. **Test IP detection** with actual locations
3. **Deploy landing page** to production
4. **Enable mobile deposit** admin features
5. **Setup monitoring** for all critical flows
6. **Perform security audit** before launch
7. **Load test** with expected user volume
8. **Train support team** on new features

---

## Support

For issues or questions:
- Review `FINBANK_UPGRADE_SUMMARY.md` for detailed documentation
- Check component comments for usage examples
- Test with demo users: alice@demo.com (password: demo123)

---

**Last Updated**: December 2024
**Status**: ✅ Ready for Production Integration
