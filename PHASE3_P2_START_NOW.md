# Phase 3 P2: START NOW - Immediate Action Guide

**Status:** 🚀 READY TO BEGIN  
**Date:** January 2025  
**Phase 3 P1:** ✅ Approved  
**Your Mission:** Migrate 3 verification & security modals + build VerificationAlert system

---

## 🎯 What You're Building (3-4 Weeks)

### The Goal
Migrate 3 critical modals to BaseModal infrastructure:
1. **SecondaryContactModal** - Add emergency contacts
2. **AddressChangeModal** - Update address with document upload
3. **TwoFactorSetupModal** - Enable 2FA with QR codes

### The Bonus
Build a **VerificationAlert** shared component system for all verification messages across the app.

---

## ⚡ Quick Start (Do This Now)

### Step 1: Read These First (30 minutes)
```
1. docs/PHASE3_P1_COMPLETION.md        (Learn from P1 success)
2. docs/MODAL_MIGRATION_GUIDE.md       (Migration patterns)
3. docs/PHASE3_P2_KICKOFF_PLAN.md      (Your roadmap)
```

### Step 2: Set Up Your Environment (15 minutes)
```bash
# 1. Pull latest code
git pull origin main

# 2. Create your feature branch
git checkout -b feature/phase3-p2-modals

# 3. Install any new dependencies (if needed)
npm install qrcode.react libphonenumber-js

# 4. Verify build works
npm run dev
```

### Step 3: Create Your Task List (15 minutes)
Copy this to your task tracker:

```
Week 1:
[ ] Design VerificationAlert component
[ ] Implement VerificationAlert base + 6 wrappers
[ ] Create Zod schemas for all 3 modals
[ ] Migrate SecondaryContactModal
[ ] Test SecondaryContactModal

Week 2:
[ ] Build file upload validation
[ ] Create file preview component
[ ] Migrate AddressChangeModal
[ ] Test file upload functionality
[ ] Test AddressChangeModal

Week 3:
[ ] Design multi-step state machine
[ ] Implement QR code generation
[ ] Migrate TwoFactorSetupModal
[ ] Build backup codes display
[ ] Test TwoFactorSetupModal

Week 4:
[ ] Integration testing (all 3 modals)
[ ] Accessibility testing (WCAG 2.1 AA)
[ ] Write documentation
[ ] Prepare approval package
[ ] Conduct stakeholder demo
```

---

## 📁 Files You'll Create/Modify

### New Files to Create
```
src/components/ui/verification-alert.tsx        (Week 1)
src/lib/validations/profile-schemas.ts          (add 3 schemas)
src/lib/toast-messages.ts                       (add verification toasts)
src/components/profile/modals/TwoFactorSetupModal.tsx  (rename from TwoFactorAuthModal)
```

### Files to Modify
```
src/components/profile/modals/SecondaryContactModal.tsx
src/components/profile/modals/AddressChangeModal.tsx
src/components/profile/modals/TwoFactorAuthModal.tsx → TwoFactorSetupModal.tsx
```

---

## 🏗️ Week 1 Focus: VerificationAlert + First Modal

### Day 1-2: VerificationAlert Component

**Create:** `src/components/ui/verification-alert.tsx`

**Structure:**
```typescript
// Base component
export function VerificationAlert({ ... })

// Specialized wrappers
export function EmailVerificationAlert({ ... })
export function PhoneVerificationAlert({ ... })
export function DocumentVerificationAlert({ ... })
export function SecurityAlert({ ... })
export function PendingVerificationAlert({ ... })
export function VerificationSuccessAlert({ ... })
```

**Features:**
- Consistent styling (info, warning, success, error variants)
- Icon integration (Mail, Phone, FileText, Shield, Clock, CheckCircle)
- Action button support (e.g., "Verify Now")
- Dismissible alerts
- Animations with Framer Motion

**Reference:** Look at how BaseModal handles overlays and alerts

---

### Day 3: Zod Schemas

**Update:** `src/lib/validations/profile-schemas.ts`

**Add these schemas:**
```typescript
export const secondaryContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  relationship: z.enum(['spouse', 'parent', 'sibling', 'child', 'friend', 'other']),
});

export const addressChangeSchema = z.object({
  streetAddress: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().length(2).regex(/^[A-Z]{2}$/),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default('US'),
  verificationDocument: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "File must be less than 5MB")
    .refine(
      file => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      "Only PDF, JPEG, or PNG files allowed"
    ),
});

export const twoFactorSetupSchema = z.object({
  method: z.enum(['sms', 'authenticator', 'email']),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  verificationCode: z.string().length(6).regex(/^\d{6}$/, "Must be 6 digits"),
});

export type SecondaryContactFormData = z.infer<typeof secondaryContactSchema>;
export type AddressChangeFormData = z.infer<typeof addressChangeSchema>;
export type TwoFactorSetupFormData = z.infer<typeof twoFactorSetupSchema>;
```

---

### Day 4-5: SecondaryContactModal Migration

**File:** `src/components/profile/modals/SecondaryContactModal.tsx`

**Migration Checklist:**
- [ ] Replace Dialog with BaseModal
- [ ] Add useModalState hook
- [ ] Implement Zod validation with secondaryContactSchema
- [ ] Use getZodErrorMap for field-level errors
- [ ] Add standardized toast (verificationToasts.contactAdded)
- [ ] Include EmailVerificationAlert or PhoneVerificationAlert
- [ ] Add loading skeleton for form
- [ ] Test all validation scenarios
- [ ] Test success flow with toast

**Pattern to Follow:** Look at AccountNicknameModal from Phase 3 P1

**Estimated Time:** 6-8 hours

---

## 🔥 Week 2 Focus: File Upload + AddressChangeModal

### Day 1-2: File Upload Infrastructure

**Key Features Needed:**
1. File input with validation
2. File size check (max 5MB)
3. File type check (PDF, JPG, PNG)
4. File preview component
5. Error handling for invalid files

**Implementation Tips:**
- Use HTML5 file input or react-dropzone (optional)
- Validate with Zod schema
- Show file name, size, and type after selection
- Allow file removal/replacement
- Preview image files (not PDFs)

---

### Day 3-5: AddressChangeModal Migration

**File:** `src/components/profile/modals/AddressChangeModal.tsx`

**Migration Checklist:**
- [ ] Replace Dialog with BaseModal
- [ ] Add useModalState hook
- [ ] Implement Zod validation with addressChangeSchema
- [ ] Build multi-field address form
- [ ] Add file upload input
- [ ] Implement file preview
- [ ] Use getZodErrorMap for all fields
- [ ] Add DocumentVerificationAlert
- [ ] Add standardized toasts
- [ ] Test file upload (valid/invalid files)
- [ ] Test address validation
- [ ] Test complete submission flow

**Pattern to Follow:** WireTransferModal from Phase 3 P1 (complex form)

**Estimated Time:** 10-12 hours

---

## 🔒 Week 3 Focus: Security + TwoFactorSetupModal

### Day 1-2: Multi-Step Infrastructure

**3-Step Workflow:**
1. **Select:** Choose method (SMS / Authenticator App / Email)
2. **Configure:** Set up chosen method (QR code for app, phone for SMS)
3. **Verify:** Enter 6-digit code + show backup codes

**State Management:**
```typescript
type SetupStep = 'select' | 'configure' | 'verify';
const [step, setStep] = useState<SetupStep>('select');
const [selectedMethod, setSelectedMethod] = useState<'sms' | 'authenticator' | 'email'>();
```

**QR Code Generation:**
```typescript
import QRCode from 'qrcode.react';

// Generate secret (mock for now)
const secret = 'JBSWY3DPEHPK3PXP';
const otpauthUrl = `otpauth://totp/MyFinBank:user@example.com?secret=${secret}&issuer=MyFinBank`;

<QRCode value={otpauthUrl} size={200} />
```

---

### Day 3-5: TwoFactorSetupModal Migration

**File:** Rename `TwoFactorAuthModal.tsx` → `TwoFactorSetupModal.tsx`

**Migration Checklist:**
- [ ] Replace Dialog with BaseModal
- [ ] Add useModalState hook
- [ ] Implement 3-step state machine
- [ ] Build method selection UI (3 cards)
- [ ] Add QR code generation (authenticator)
- [ ] Add phone number input (SMS)
- [ ] Build 6-digit verification code input
- [ ] Generate and display backup codes (10 codes)
- [ ] Add copy-to-clipboard for backup codes
- [ ] Use SecurityAlert for warnings
- [ ] Implement Zod validation
- [ ] Add standardized toasts
- [ ] Test all 3 methods
- [ ] Test navigation (can go back in steps)
- [ ] Test complete flow

**Pattern to Follow:** BiometricSetupModal from Phase 3 P1 (multi-step)

**Estimated Time:** 12-14 hours

---

## 📝 Week 4 Focus: Testing & Documentation

### Testing Checklist

**Per Modal:**
- [ ] Empty field validation
- [ ] Invalid input validation
- [ ] Valid input acceptance
- [ ] Success flow + toast
- [ ] Error handling + alert
- [ ] Loading states
- [ ] Keyboard navigation (Tab, Enter, ESC)
- [ ] Screen reader (ARIA labels)
- [ ] Mobile responsive

**Integration:**
- [ ] All 3 modals open/close correctly
- [ ] VerificationAlert displays in all contexts
- [ ] File upload works across browsers
- [ ] QR codes scan on mobile devices
- [ ] No console errors
- [ ] No TypeScript errors

---

### Documentation Checklist

**Files to Create:**
- [ ] `PHASE3_P2_COMPLETION.md` (detailed summary)
- [ ] `PHASE3_P2_IMPLEMENTATION_APPROVAL.md` (technical review)
- [ ] `PHASE3_P2_APPROVAL_DASHBOARD.md` (visual status)
- [ ] `PHASE3_P2_EXECUTIVE_DECISION_BRIEF.md` (business case)

**Content to Include:**
- Before/after comparisons
- Code examples
- Features added per modal
- Metrics (LOC, quality, performance)
- Lessons learned
- Next steps (Phase 3 P3)

---

## 🎯 Success Criteria (Your Targets)

### Must-Have (100% Required)
- ✅ All 3 modals migrated to BaseModal
- ✅ VerificationAlert system complete (6 wrappers)
- ✅ Zod validation for all forms
- ✅ Zero TypeScript errors
- ✅ Standardized toast messages
- ✅ Loading and success states
- ✅ Error handling with alerts
- ✅ Documentation complete

### Quality Bar
- Code Quality: 100% (like Phase 3 P1)
- User Experience: Enhanced (new features)
- Technical Debt: 0 (none added)
- Testing: 100% manual coverage
- Accessibility: WCAG 2.1 AA compliant

---

## 💡 Pro Tips from Phase 3 P1

### Do This ✅
1. **Follow the Pattern:** Copy AccountNicknameModal structure, then customize
2. **Validate Early:** Test Zod schemas before building UI
3. **Reuse Components:** Use existing Button, Input, Label components
4. **Document As You Go:** Write comments for complex logic
5. **Test Incrementally:** Don't wait until the end to test
6. **Ask for Reviews:** Get code reviewed after each modal

### Avoid This ❌
1. **Don't Skip Steps:** Every modal needs Zod + BaseModal + Toast
2. **Don't Hardcode:** Use schemas and helpers, not inline validation
3. **Don't Rush:** Quality over speed (tech debt = future pain)
4. **Don't Ignore Errors:** Fix TypeScript errors immediately
5. **Don't Forget Accessibility:** Add ARIA labels from the start
6. **Don't Skimp on Testing:** Test edge cases, not just happy path

---

## 📞 When You're Stuck

### Common Issues & Solutions

**Issue:** "How do I validate a File with Zod?"
```typescript
z.instanceof(File)
  .refine(file => file.size <= 5 * 1024 * 1024)
  .refine(file => ['application/pdf', 'image/jpeg'].includes(file.type))
```

**Issue:** "How do I show field-level errors?"
```typescript
import { getZodErrorMap } from '@/lib/validations/profile-schemas';

const errors = getZodErrorMap(zodError);
// errors = { email: "Invalid email", phone: "Invalid phone" }

<Input error={errors.email} />
```

**Issue:** "How do I generate a QR code?"
```typescript
import QRCode from 'qrcode.react';

<QRCode value="otpauth://totp/MyFinBank:user@example.com?secret=ABC123" size={200} />
```

**Issue:** "How do I manage multi-step state?"
```typescript
type Step = 'step1' | 'step2' | 'step3';
const [step, setStep] = useState<Step>('step1');

const handleNext = () => {
  if (step === 'step1') setStep('step2');
  else if (step === 'step2') setStep('step3');
};

const handleBack = () => {
  if (step === 'step3') setStep('step2');
  else if (step === 'step2') setStep('step1');
};
```

---

## 🚀 Your First Commit (Today!)

### Goal: VerificationAlert Component

**Time:** 2-4 hours

**Tasks:**
1. Create `src/components/ui/verification-alert.tsx`
2. Build base VerificationAlert component
3. Create 6 specialized wrappers
4. Test in Storybook or isolated page
5. Commit and push

**Commit Message:**
```
feat(ui): Add VerificationAlert component system

- Base VerificationAlert with variants (info, warning, success, error)
- 6 specialized wrappers (Email, Phone, Document, Security, Pending, Success)
- Icon integration with lucide-react
- Action button support
- Framer Motion animations
- Dismissible functionality

Part of Phase 3 P2 - Verification & Security Modals
```

---

## 📅 Your Daily Standup Template

### What I Did Yesterday
- [ ] Completed [task/modal name]
- [ ] Fixed [bug/issue]
- [ ] Reviewed [code/docs]

### What I'm Doing Today
- [ ] Working on [task/modal name]
- [ ] Target: [specific milestone]
- [ ] Estimate: [hours]

### Blockers
- [ ] None / [describe blocker]
- [ ] Need: [help/resource/decision]

---

## 🎉 You've Got This!

**Phase 3 P1 Success:** 4/4 modals, 100% quality, zero tech debt  
**Phase 3 P2 Target:** 3/3 modals, same quality, same standards

**Your Advantages:**
- ✅ Proven patterns from P1
- ✅ BaseModal infrastructure ready
- ✅ Zod validation established
- ✅ Toast system in place
- ✅ Migration guide available
- ✅ Clear roadmap (this document!)

**Timeline:** 3-4 weeks  
**Start Date:** Today  
**First Milestone:** VerificationAlert (2-3 days)  
**Mid-Point:** 2 modals done (2 weeks)  
**Completion:** All 3 modals + docs (3-4 weeks)

---

## 🔗 Quick Links

**Must-Read Docs:**
- `/docs/PHASE3_P1_COMPLETION.md` - Learn from P1
- `/docs/MODAL_MIGRATION_GUIDE.md` - Step-by-step guide
- `/docs/PHASE3_P2_KICKOFF_PLAN.md` - Full roadmap

**Code Reference:**
- `/src/components/ui/base-modal.tsx` - Your foundation
- `/src/lib/validations/profile-schemas.ts` - Validation patterns
- `/src/lib/toast-messages.ts` - Toast examples
- `/src/components/profile/modals/AccountNicknameModal.tsx` - Simple modal example
- `/src/components/profile/modals/BiometricSetupModal.tsx` - Multi-step example
- `/src/components/profile/modals/WireTransferModal.tsx` - Complex form example

**Approval Docs (For Reference):**
- `/PHASE3_P1_APPROVAL_PACKAGE.md` - How to get approved
- `/docs/PHASE3_P1_APPROVAL_DASHBOARD.md` - Success metrics

---

## ✅ Final Checklist Before You Start

- [ ] Phase 3 P1 approved (you're here because it is!)
- [ ] Read Phase 3 P1 completion summary
- [ ] Read migration guide
- [ ] Created feature branch
- [ ] Verified dev environment works
- [ ] Reviewed existing modal code
- [ ] Understand BaseModal pattern
- [ ] Know where to find help

**ALL SET?** 

🚀 **START WITH VERIFICATIONALERT NOW!** 🚀

---

**Good luck! You're building something great for MyFinBank users.** 💪

**Remember:** Quality over speed. Zero tech debt. Document everything. Test thoroughly.

**Questions?** Check the docs first, then ask the team.

---

**LET'S GO! 🔥**