/**
 * Fin-Bank Email Templates
 * Professional, branded HTML templates for all transactional emails
 */

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  plainText: string;
}

/**
 * Email template configuration
 */
export const EmailTemplates = {
  /**
   * Welcome/Onboarding Email
   */
  welcome: (data: { fullName: string; email: string; appUrl: string }): EmailTemplate => ({
    name: "welcome",
    subject: "Welcome to Fin-Bank - Your Account is Ready",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Fin-Bank</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #1A1A1A; }
    .email-container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: linear-gradient(135deg, #003366 0%, #004D99 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: #FFFFFF; margin-bottom: 10px; }
    .tagline { color: #E6F0FF; font-size: 14px; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 20px; font-weight: 600; color: #003366; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 600; color: #003366; margin-bottom: 15px; }
    .feature-list { list-style: none; }
    .feature-list li { padding: 10px 0; border-bottom: 1px solid #E0E0E0; }
    .feature-list li:before { content: "✓ "; color: #00A86B; font-weight: bold; margin-right: 10px; }
    .cta-button { display: inline-block; background: #003366; color: #FFFFFF; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .cta-button:hover { background: #004D99; }
    .security-notice { background: #E6F9F0; padding: 15px; border-left: 4px solid #00A86B; margin: 20px 0; font-size: 14px; }
    .footer { background: #F5F5F5; padding: 30px 20px; text-align: center; border-top: 1px solid #E0E0E0; }
    .footer-text { font-size: 12px; color: #4A4A4A; margin: 5px 0; }
    .footer-links { margin: 15px 0; }
    .footer-links a { color: #003366; text-decoration: none; font-size: 12px; margin: 0 10px; }
    .eu-badge { background: #E6F0FF; color: #003366; padding: 8px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">Fin-Bank</div>
      <div class="tagline">Secure banking for modern Europe</div>
    </div>
    
    <div class="content">
      <div class="greeting">Welcome, ${data.fullName}!</div>
      <p>Your Fin-Bank account has been successfully created. We're excited to welcome you to secure, modern banking across Europe.</p>
      
      <div class="section">
        <div class="section-title">Your Account is Ready</div>
        <p>Here's what you can do right now:</p>
        <ul class="feature-list">
          <li>Access your checking and savings accounts</li>
          <li>Set up virtual and physical cards instantly</li>
          <li>Send SEPA transfers to other EU banks</li>
          <li>Deposit checks via mobile deposit</li>
          <li>Create savings goals and track progress</li>
        </ul>
      </div>
      
      <div class="security-notice">
        <strong>🔒 Your Security is Our Priority</strong><br>
        Your account is protected by EU banking regulations, GDPR compliance, and €100,000 deposit insurance. We use military-grade encryption to keep your data safe.
      </div>
      
      <div class="section">
        <div class="section-title">Next Steps</div>
        <p>Complete your profile to unlock all features:</p>
        <a href="${data.appUrl}" class="cta-button">Complete Your Profile</a>
      </div>
      
      <div class="eu-badge">✓ EU Banking License | GDPR Compliant | Deposit Insured</div>
    </div>
    
    <div class="footer">
      <div class="footer-text"><strong>Fin-Bank</strong> - Secure Digital Banking</div>
      <div class="footer-text">Available in Spain, Germany, France, Italy, and Portugal</div>
      <div class="footer-text">EU Banking License: ES-2024-001-FINBANK</div>
      <div class="footer-links">
        <a href="${data.appUrl}/privacy">Privacy Policy</a>
        <a href="${data.appUrl}/terms">Terms of Service</a>
        <a href="${data.appUrl}/contact">Contact Support</a>
      </div>
      <div class="footer-text">© 2024 Fin-Bank. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`,
    plainText: `Welcome to Fin-Bank, ${data.fullName}!

Your Fin-Bank account has been successfully created. We're excited to welcome you to secure, modern banking across Europe.

YOUR ACCOUNT IS READY
You can now:
- Access your checking and savings accounts
- Set up virtual and physical cards instantly
- Send SEPA transfers to other EU banks
- Deposit checks via mobile deposit
- Create savings goals and track progress

YOUR SECURITY IS OUR PRIORITY
Your account is protected by EU banking regulations, GDPR compliance, and €100,000 deposit insurance.

NEXT STEPS
Complete your profile to unlock all features: ${data.appUrl}

Fin-Bank - Secure Digital Banking
Available in Spain, Germany, France, Italy, and Portugal
      EU Banking License: ES-2024-001-FINBANK`,
  }),

  /**
   * Email Verification Code
   */
  verificationCode: (data: { code: string; email: string }): EmailTemplate => ({
    name: "email_verification",
    subject: "Verify your email to finish setting up Fin-Bank",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; background: #F5F7FB; }
    .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #003366 0%, #004D99 100%); padding: 28px 24px; color: #FFFFFF; }
    .title { font-size: 22px; font-weight: 700; }
    .content { padding: 28px 24px; }
    .code { font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #003366; text-align: center; padding: 18px; background: #F2F6FF; border-radius: 10px; margin: 16px 0; }
    .muted { color: #4A4A4A; font-size: 14px; line-height: 1.6; }
    .footer { padding: 20px 24px; background: #F7F9FC; color: #6B7280; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">Verify your email</div>
      <div style="margin-top:6px; opacity: 0.85;">Complete verification to secure your Fin-Bank account</div>
    </div>
    <div class="content">
      <p class="muted">Enter the code below in the app to finish setting up your account. This code expires in 10 minutes.</p>
      <div class="code">${data.code}</div>
      <p class="muted">If you didn’t request this, you can ignore this email.</p>
    </div>
    <div class="footer">
      <div>Sent to ${data.email}</div>
      <div>Fin-Bank • PSD2 + GDPR compliant • €100k deposit guarantee</div>
    </div>
  </div>
</body>
</html>`,
    plainText: `Verify your email to finish setting up Fin-Bank.

Your verification code: ${data.code}
This code expires in 10 minutes.

If you didn't request this, you can ignore this email.`,
  }),

  /**
   * Transaction Confirmation Email
   */
  transactionConfirmation: (data: {
    recipientName: string;
    amount: string;
    currency: string;
    date: string;
    referenceNumber: string;
  }): EmailTemplate => ({
    name: "transaction_confirmation",
    subject: `Transaction Completed: ${data.currency}${data.amount} to ${data.recipientName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Confirmation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: linear-gradient(135deg, #003366 0%, #004D99 100%); padding: 30px 20px; text-align: center; color: #FFFFFF; }
    .logo { font-size: 24px; font-weight: bold; }
    .content { padding: 30px 20px; }
    .success-badge { background: #E6F9F0; border-left: 4px solid #00A86B; padding: 15px; margin: 20px 0; }
    .transaction-details { background: #F5F5F5; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E0E0E0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #4A4A4A; font-weight: 500; }
    .detail-value { color: #003366; font-weight: 600; }
    .security-note { background: #E6F0FF; padding: 12px; border-radius: 4px; margin: 15px 0; font-size: 13px; }
    .footer { background: #F5F5F5; padding: 20px; text-align: center; border-top: 1px solid #E0E0E0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Fin-Bank</div>
    </div>
    
    <div class="content">
      <h2 style="color: #003366; margin-bottom: 15px;">✓ Transaction Completed</h2>
      
      <div class="success-badge">
        Your transfer has been successfully processed and is on its way!
      </div>
      
      <div class="transaction-details">
        <div class="detail-row">
          <span class="detail-label">Recipient:</span>
          <span class="detail-value">${data.recipientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount:</span>
          <span class="detail-value">${data.currency}${data.amount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${data.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reference Number:</span>
          <span class="detail-value">${data.referenceNumber}</span>
        </div>
      </div>
      
      <div class="security-note">
        <strong>🔒 Security Notice:</strong> Didn't make this transaction? Report it immediately by contacting our support team.
      </div>
      
      <p style="margin-top: 20px;">For more details, log in to your Fin-Bank account to view this transaction.</p>
    </div>
    
    <div class="footer">
      <p>Fin-Bank - Secure Digital Banking</p>
      <p>© 2024 Fin-Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    plainText: `Transaction Completed: ${data.currency}${data.amount} to ${data.recipientName}

Your transfer has been successfully processed!

TRANSACTION DETAILS
Recipient: ${data.recipientName}
Amount: ${data.currency}${data.amount}
Date: ${data.date}
Reference: ${data.referenceNumber}

SECURITY NOTICE
Didn't make this transaction? Report it immediately to our support team.`,
  }),

  /**
   * Password Reset Email
   */
  passwordReset: (data: {
    resetLink: string;
    expiresIn: string;
    deviceInfo: string;
  }): EmailTemplate => ({
    name: "password_reset",
    subject: "Password Reset Requested for Your Fin-Bank Account",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: #003366; color: #FFFFFF; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .warning { background: #FFF3E0; border-left: 4px solid #F57C00; padding: 15px; margin: 20px 0; }
    .reset-button { display: inline-block; background: #003366; color: #FFFFFF; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .expiry-note { background: #F5F5F5; padding: 12px; margin: 15px 0; font-size: 13px; color: #4A4A4A; }
    .footer { background: #F5F5F5; padding: 20px; text-align: center; border-top: 1px solid #E0E0E0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 24px; font-weight: bold;">Fin-Bank</div>
    </div>
    
    <div class="content">
      <h2 style="color: #003366; margin-bottom: 15px;">Password Reset Request</h2>
      
      <p>We received a request to reset your Fin-Bank password. If you made this request, click the button below to set a new password.</p>
      
      <a href="${data.resetLink}" class="reset-button">Reset Password</a>
      
      <div class="expiry-note">
        <strong>⏰ Link Expires:</strong> ${data.expiresIn}
      </div>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> If you didn't request this password reset, your account may be at risk. Don't share this link with anyone, and your password will remain unchanged if you ignore this email.
      </div>
      
      <p><strong>Device Information:</strong><br>${data.deviceInfo}</p>
      
      <p style="margin-top: 20px; font-size: 13px; color: #4A4A4A;">This is a security-sensitive email. Do not forward it to anyone.</p>
    </div>
    
    <div class="footer">
      <p>Fin-Bank - Secure Digital Banking</p>
      <p>© 2024 Fin-Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    plainText: `Password Reset Request for Your Fin-Bank Account

We received a request to reset your password. If you made this request, click the link below:

${data.resetLink}

LINK EXPIRES: ${data.expiresIn}

IMPORTANT SECURITY NOTICE
If you didn't request this, don't worry. Just ignore this email and your password will remain unchanged.

Device: ${data.deviceInfo}

This is a security-sensitive email. Do not forward it.`,
  }),

  /**
   * Password Reset Completed Email
   */
  passwordResetCompleted: (data: {
    deviceInfo: string;
    fundAccessDelay?: boolean;
  }): EmailTemplate => ({
    name: "password_reset_completed",
    subject: "Your Fin-Bank Password Has Been Changed",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: linear-gradient(135deg, #003366 0%, #004D99 100%); color: #FFFFFF; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .success { background: #E6F9F0; border-left: 4px solid #00A86B; padding: 15px; margin: 20px 0; }
    .delay-notice { background: #FFF3E0; border-left: 4px solid #F57C00; padding: 15px; margin: 20px 0; }
    .footer { background: #F5F5F5; padding: 20px; text-align: center; border-top: 1px solid #E0E0E0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 24px; font-weight: bold;">Fin-Bank</div>
    </div>
    
    <div class="content">
      <h2 style="color: #003366; margin-bottom: 15px;">✓ Password Changed Successfully</h2>
      
      <div class="success">
        Your password has been updated. You can now log in with your new password.
      </div>
      
      <p><strong>Reset from Device:</strong><br>${data.deviceInfo}</p>
      
      ${
        data.fundAccessDelay
          ? `
      <div class="delay-notice">
        <strong>⏱️ Security Notice:</strong> For your security, fund access (transfers, withdrawals, card transactions) is temporarily delayed for 24 hours when logging in from a new device. This is a standard security measure. After 24 hours with no suspicious activity, you'll have full access again.
      </div>
      `
          : ""
      }
      
      <p style="margin-top: 20px; font-size: 13px;">If you didn't make this change, please contact our support team immediately.</p>
    </div>
    
    <div class="footer">
      <p>Fin-Bank - Secure Digital Banking</p>
      <p>© 2024 Fin-Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    plainText: `Your Fin-Bank Password Has Been Changed

Your password has been updated successfully. You can now log in with your new password.

Device: ${data.deviceInfo}

${
  data.fundAccessDelay
    ? `
SECURITY NOTICE
For your security, fund access is temporarily delayed for 24 hours when logging in from a new device. After 24 hours with no suspicious activity, you'll have full access.
`
    : ""
}`,
  }),

  /**
   * New Login Alert Email
   */
  newLoginAlert: (data: {
    deviceInfo: string;
    location: string;
    timestamp: string;
    isUnknownDevice: boolean;
  }): EmailTemplate => ({
    name: "new_login_alert",
    subject: "New Login to Your Fin-Bank Account",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Alert</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: #004D99; color: #FFFFFF; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .alert-box { background: ${data.isUnknownDevice ? "#FFF3E0" : "#E6F9F0"}; border-left: 4px solid ${data.isUnknownDevice ? "#F57C00" : "#00A86B"}; padding: 15px; margin: 20px 0; }
    .details { background: #F5F5F5; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-item { padding: 8px 0; }
    .footer { background: #F5F5F5; padding: 20px; text-align: center; border-top: 1px solid #E0E0E0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 24px; font-weight: bold;">Fin-Bank</div>
    </div>
    
    <div class="content">
      <h2 style="color: #003366; margin-bottom: 15px;">🔐 Login Activity Notice</h2>
      
      <p>We detected a new login to your Fin-Bank account. Here are the details:</p>
      
      <div class="details">
        <div class="detail-item"><strong>Device:</strong> ${data.deviceInfo}</div>
        <div class="detail-item"><strong>Location:</strong> ${data.location}</div>
        <div class="detail-item"><strong>Time:</strong> ${data.timestamp}</div>
      </div>
      
      <div class="alert-box">
        ${
          data.isUnknownDevice
            ? "<strong>⚠️ Unknown Device Detected:</strong> This login came from a new device or location. For your security, some features may be temporarily restricted."
            : "<strong>✓ Recognized Device:</strong> We recognize this device."
        }
      </div>
      
      <p><strong>Is this you?</strong></p>
      <p>If you recognize this login, no action is needed. If this wasn't you, secure your account immediately by resetting your password.</p>
    </div>
    
    <div class="footer">
      <p>Fin-Bank - Secure Digital Banking</p>
      <p>© 2024 Fin-Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    plainText: `Login Activity Notice for Your Fin-Bank Account

We detected a new login to your account:

Device: ${data.deviceInfo}
Location: ${data.location}
Time: ${data.timestamp}

${data.isUnknownDevice ? "UNKNOWN DEVICE DETECTED\nThis login came from a new device or location. Some features may be temporarily restricted." : "RECOGNIZED DEVICE\nWe recognize this device."}

Is this you? If not, reset your password immediately.`,
  }),

  /**
   * Mobile Deposit - Submission Confirmation
   */
  mobileDepositSubmitted: (data: {
    amount: string;
    currency: string;
    accountType: string;
    depositDate: string;
  }): EmailTemplate => ({
    name: "mobile_deposit_submitted",
    subject: "Check Deposit Received - Under Review",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deposit Submitted</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: linear-gradient(135deg, #003366 0%, #004D99 100%); color: #FFFFFF; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .pending { background: #E6F0FF; border-left: 4px solid #1976D2; padding: 15px; margin: 20px 0; }
    .details { background: #F5F5F5; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-row { padding: 8px 0; }
    .timeline { margin: 20px 0; }
    .timeline-item { padding: 10px 0; padding-left: 30px; position: relative; }
    .timeline-item:before { content: "✓"; position: absolute; left: 0; color: #00A86B; font-weight: bold; }
    .footer { background: #F5F5F5; padding: 20px; text-align: center; border-top: 1px solid #E0E0E0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 24px; font-weight: bold;">Fin-Bank</div>
    </div>
    
    <div class="content">
      <h2 style="color: #003366; margin-bottom: 15px;">📱 Check Deposit Received</h2>
      
      <p>Thank you! We've received your check deposit and it's now under review.</p>
      
      <div class="pending">
        <strong>⏱️ Under Review:</strong> Your deposit will be reviewed by our team and funds will be available once approved (typically 1-3 business days).
      </div>
      
      <div class="details">
        <div class="detail-row"><strong>Amount:</strong> ${data.currency}${data.amount}</div>
        <div class="detail-row"><strong>Currency:</strong> ${data.currency} (USD/EUR only)</div>
        <div class="detail-row"><strong>Deposit To:</strong> ${data.accountType}</div>
        <div class="detail-row"><strong>Submitted:</strong> ${data.depositDate}</div>
      </div>
      
      <div class="timeline">
        <div style="margin-bottom: 15px;"><strong>Processing Timeline:</strong></div>
        <div class="timeline-item">Deposit received and confirmed</div>
        <div class="timeline-item">Manual review by compliance team (24-48 hours)</div>
        <div class="timeline-item">Funds credited to your account</div>
        <div class="timeline-item">Confirmation email sent</div>
      </div>
      
      <p style="font-size: 13px; color: #4A4A4A; margin-top: 20px;"><strong>Note:</strong> We accept checks denominated in USD or EUR only. Checks in other currencies will be rejected.</p>
    </div>
    
    <div class="footer">
      <p>Fin-Bank - Secure Digital Banking</p>
      <p>© 2024 Fin-Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    plainText: `Check Deposit Received - Under Review

Your check deposit has been received and is now under review.

Amount: ${data.currency}${data.amount}
Currency: ${data.currency} (USD/EUR only)
Deposit To: ${data.accountType}
Submitted: ${data.depositDate}

Processing Timeline:
✓ Deposit received and confirmed
✓ Manual review by compliance team (24-48 hours)
✓ Funds credited to your account
✓ Confirmation email sent

Note: We accept checks in USD or EUR only.`,
  }),

  /**
   * Mobile Deposit - Approved
   */
  mobileDepositApproved: (data: {
    amount: string;
    currency: string;
    newBalance: string;
    approvedDate: string;
  }): EmailTemplate => ({
    name: "mobile_deposit_approved",
    subject: "Check Deposit Approved - Funds Available",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deposit Approved</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: linear-gradient(135deg, #003366 0%, #004D99 100%); color: #FFFFFF; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .success { background: #E6F9F0; border-left: 4px solid #00A86B; padding: 15px; margin: 20px 0; }
    .amount-box { background: #F5F5F5; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
    .large-amount { font-size: 32px; font-weight: bold; color: #00A86B; }
    .balance-info { font-size: 13px; color: #4A4A4A; margin-top: 10px; }
    .cta-button { display: inline-block; background: #003366; color: #FFFFFF; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { background: #F5F5F5; padding: 20px; text-align: center; border-top: 1px solid #E0E0E0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 24px; font-weight: bold;">Fin-Bank</div>
    </div>
    
    <div class="content">
      <h2 style="color: #003366; margin-bottom: 15px;">✓ Check Deposit Approved</h2>
      
      <div class="success">
        Your check deposit has been approved and funds are now available in your account!
      </div>
      
      <div class="amount-box">
        <div style="color: #4A4A4A; font-size: 13px;">Deposited Amount</div>
        <div class="large-amount">+${data.currency}${data.amount}</div>
        <div class="balance-info">Approved on ${data.approvedDate}</div>
        <div class="balance-info" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #E0E0E0;">New Available Balance: ${data.currency}${data.newBalance}</div>
      </div>
      
      <p>You can now use these funds for transfers, payments, and withdrawals.</p>
      
      <a href="https://app.finbank.eu/dashboard" class="cta-button">View Account Balance</a>
    </div>
    
    <div class="footer">
      <p>Fin-Bank - Secure Digital Banking</p>
      <p>© 2024 Fin-Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    plainText: `Check Deposit Approved - Funds Available

Your check deposit has been approved!

Deposited Amount: ${data.currency}${data.amount}
Approved: ${data.approvedDate}
New Balance: ${data.currency}${data.newBalance}

Your funds are now available for transfers, payments, and withdrawals.`,
  }),

  /**
   * Mobile Deposit - Rejected
   */
  mobileDepositRejected: (data: {
    amount: string;
    currency: string;
    rejectionReason: string;
    submittedDate: string;
  }): EmailTemplate => ({
    name: "mobile_deposit_rejected",
    subject: "Check Deposit Could Not Be Processed",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deposit Rejected</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .header { background: linear-gradient(135deg, #003366 0%, #004D99 100%); color: #FFFFFF; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .error { background: #FFEBEE; border-left: 4px solid #D32F2F; padding: 15px; margin: 20px 0; }
    .reason-box { background: #F5F5F5; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .cta-button { display: inline-block; background: #003366; color: #FFFFFF; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .footer { background: #F5F5F5; padding: 20px; text-align: center; border-top: 1px solid #E0E0E0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 24px; font-weight: bold;">Fin-Bank</div>
    </div>
    
    <div class="content">
      <h2 style="color: #003366; margin-bottom: 15px;">⚠️ Deposit Could Not Be Processed</h2>
      
      <p>Unfortunately, we were unable to process your check deposit. Here's why:</p>
      
      <div class="reason-box">
        <strong>Reason:</strong><br>${data.rejectionReason}
      </div>
      
      <p style="font-size: 13px; color: #4A4A4A;"><strong>Deposit Details:</strong><br>Amount: ${data.currency}${data.amount}<br>Submitted: ${data.submittedDate}</p>
      
      <div class="error">
        <strong>Important Note:</strong> We only accept checks denominated in USD or EUR. Checks in other currencies will be automatically rejected.
      </div>
      
      <p style="margin-top: 20px;"><strong>What to do next:</strong></p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>Review the rejection reason above</li>
        <li>Ensure your check is in USD or EUR</li>
        <li>Verify all check information is correct and legible</li>
        <li>Try uploading again with clearer images</li>
      </ul>
      
      <a href="https://app.finbank.eu/deposits" class="cta-button">Try Again</a>
      <a href="https://app.finbank.eu/support" class="cta-button" style="background: #F5F5F5; color: #003366; border: 1px solid #E0E0E0;">Contact Support</a>
    </div>
    
    <div class="footer">
      <p>Fin-Bank - Secure Digital Banking</p>
      <p>© 2024 Fin-Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    plainText: `Check Deposit Could Not Be Processed

Unfortunately, we were unable to process your deposit.

Reason: ${data.rejectionReason}

Amount: ${data.currency}${data.amount}
Submitted: ${data.submittedDate}

IMPORTANT NOTE
We only accept checks in USD or EUR. Checks in other currencies will be rejected.

NEXT STEPS
1. Review the rejection reason
2. Ensure your check is in USD or EUR
3. Verify the check is clear and legible
4. Try uploading again

If you need help, contact our support team.`,
  }),
};

/**
 * Get email template by name
 */
export function getEmailTemplate(
  templateName: string,
  data: any,
): EmailTemplate | null {
  const template = (EmailTemplates as any)[templateName];
  if (!template) return null;
  return template(data);
}
