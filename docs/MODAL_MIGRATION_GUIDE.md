# Modal Migration Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Active

---

## 📋 Overview

This guide provides step-by-step instructions for migrating existing modals from the legacy `Dialog` pattern to the new `BaseModal` infrastructure with Zod validation, standardized toasts, and automated state management.

### Benefits of Migration

- ✅ **60-70% less boilerplate code** for state management
- ✅ **Automated state transitions** (idle → submitting → success → error)
- ✅ **Type-safe validation** with Zod schemas
- ✅ **Consistent UX** with standardized animations and feedback
- ✅ **Better error handling** with field-level error display
- ✅ **Standardized notifications** with toast messages

---

## 🎯 Prerequisites

Before starting migration, ensure you have:

1. **BaseModal Component** - `src/components/ui/base-modal.tsx`
2. **Validation Schemas** - `src/lib/validations/profile-schemas.ts`
3. **Toast Messages** - `src/lib/toast-messages.ts`
4. **Skeleton Loaders** (optional) - `src/components/ui/skeleton-loaders.tsx`

---

## 🚀 Migration Process

### Step 1: Analyze Current Modal

**Identify:**
- Form fields and their validation rules
- State variables (loading, errors, data)
- API calls and error handling
- Success/error toast messages

**Example Analysis:**
```typescript
// Current modal uses:
// - useState for form data
// - useState for loading state
// - Manual error handling
// - Direct toast calls
// - Custom validation logic
```

### Step 2: Create/Update Zod Schema

**Location:** `src/lib/validations/profile-schemas.ts`

```typescript
// Add or update schema
export const myModalSchema = z.object({
  fieldName: z.string()
    .min(1, "Field cannot be empty")
    .max(100, "Field is too long"),
  // ... other fields
});

export type MyModalFormData = z.infer<typeof myModalSchema>;
```

**Common Validation Patterns:**

```typescript
// Email
email: z.string().email("Invalid email address")

// Phone
phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number")

// Amount
amount: z.number().positive("Amount must be positive").max(1000000)

// Required string
name: z.string().min(1, "Name is required").max(100)

// Optional string
note: z.string().max(500).optional()

// Enum
type: z.enum(["option1", "option2"])

// Conditional validation
}).refine((data) => /* condition */, {
  message: "Error message",
  path: ["fieldName"]
})
```

### Step 3: Import Required Dependencies

```typescript
import { useState, useEffect } from "react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  myModalSchema,
  type MyModalFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { showSuccess, showError } from "@/lib/toast-messages";
// Or use specialized toasts:
// import { profileToasts, securityToasts, servicesToasts } from "@/lib/toast-messages";
```

### Step 4: Replace State Management

**Before:**
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**After:**
```typescript
const modalState = useModalState();
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

### Step 5: Update Form Handler

**Before:**
```typescript
const handleSubmit = async () => {
  if (!formData.field) {
    toast.error("Field is required");
    return;
  }
  
  setIsLoading(true);
  try {
    await onSave(formData);
    toast.success("Success!");
    onClose();
  } catch (error) {
    toast.error("Failed");
  } finally {
    setIsLoading(false);
  }
};
```

**After:**
```typescript
const handleSubmit = async () => {
  // Clear previous errors
  setFieldErrors({});
  
  // Validate with Zod
  const result = myModalSchema.safeParse(formData);
  
  if (!result.success) {
    const errors = getZodErrorMap(result.error);
    setFieldErrors(errors);
    showError(formatZodError(result.error));
    return;
  }
  
  modalState.setSubmitting();
  
  try {
    await onSave(result.data);
    modalState.setSuccess();
    showSuccess("Operation completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Operation failed";
    modalState.setError(errorMessage);
    showError(errorMessage);
  }
};
```

### Step 6: Add Reset on Open

```typescript
useEffect(() => {
  if (isOpen) {
    setFormData(initialState);
    setFieldErrors({});
    modalState.reset();
  }
}, [isOpen]);
```

### Step 7: Replace Dialog with BaseModal

**Before:**
```typescript
return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>My Modal</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogHeader>
      
      {/* Content */}
      
      <DialogFooter>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
```

**After:**
```typescript
return (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title="My Modal"
    description="Description"
    icon={Mail}
    iconColor="bg-blue-500/20"
    state={modalState.state}
    error={modalState.error}
    successMessage="Operation completed successfully"
    size="md"
    footer={
      <>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={modalState.isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={modalState.isSubmitting}
        >
          Save
        </Button>
      </>
    }
  >
    {/* Content */}
  </BaseModal>
);
```

### Step 8: Add Field-Level Error Display

```typescript
<Input
  id="fieldName"
  value={formData.fieldName}
  onChange={(e) => {
    setFormData(prev => ({ ...prev, fieldName: e.target.value }));
    // Clear field error on change
    if (fieldErrors.fieldName) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fieldName;
        return newErrors;
      });
    }
  }}
  className={fieldErrors.fieldName 
    ? "border-red-500/50 focus-visible:ring-red-500" 
    : ""}
  disabled={modalState.isSubmitting}
/>
{fieldErrors.fieldName && (
  <p className="text-xs text-red-400">{fieldErrors.fieldName}</p>
)}
```

---

## 📝 Complete Example

### Before (Old Pattern)

```typescript
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface OldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: string) => Promise<void>;
}

export default function OldModal({ isOpen, onClose, onSave }: OldModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(name);
      toast.success("Saved!");
      onClose();
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Name</DialogTitle>
        </DialogHeader>
        <Input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### After (New Pattern)

```typescript
import { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  nameSchema,
  type NameFormData,
  formatZodError,
} from "@/lib/validations/profile-schemas";
import { showSuccess, showError } from "@/lib/toast-messages";

interface NewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: string) => Promise<void>;
}

export default function NewModal({ isOpen, onClose, onSave }: NewModalProps) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const modalState = useModalState();

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setName("");
      setFieldError(null);
      modalState.reset();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setFieldError(null);

    // Validate
    const result = nameSchema.safeParse({ name });
    if (!result.success) {
      const errorMessage = formatZodError(result.error);
      setFieldError(errorMessage);
      showError(errorMessage);
      return;
    }

    modalState.setSubmitting();

    try {
      await onSave(result.data.name);
      modalState.setSuccess();
      showSuccess("Name updated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save";
      modalState.setError(errorMessage);
      showError(errorMessage);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Name"
      description="Update your display name"
      icon={Edit}
      iconColor="bg-blue-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage="Name updated successfully"
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={modalState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={modalState.isSubmitting || !name.trim()}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldError(null);
            }}
            className={fieldError 
              ? "border-red-500/50 focus-visible:ring-red-500" 
              : ""}
            disabled={modalState.isSubmitting}
            autoFocus
          />
          {fieldError && (
            <p className="text-xs text-red-400">{fieldError}</p>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
```

---

## 🎨 Common Patterns

### Pattern 1: Conditional Fields

```typescript
{formData.type === "option1" && (
  <div className="space-y-2">
    <Label>Conditional Field</Label>
    <Input
      value={formData.conditionalField}
      onChange={(e) => handleFieldChange("conditionalField", e.target.value)}
      className={fieldErrors.conditionalField 
        ? "border-red-500/50" 
        : ""}
    />
    {fieldErrors.conditionalField && (
      <p className="text-xs text-red-400">{fieldErrors.conditionalField}</p>
    )}
  </div>
)}
```

### Pattern 2: Multi-Step Modals

```typescript
const [step, setStep] = useState<"step1" | "step2" | "step3">("step1");

const getTitle = () => {
  switch (step) {
    case "step1": return "Step 1: Select";
    case "step2": return "Step 2: Configure";
    case "step3": return "Step 3: Confirm";
  }
};

const getFooter = () => {
  if (step === "step1") {
    return (
      <>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => setStep("step2")}>Next</Button>
      </>
    );
  }
  // ... other steps
};

return (
  <BaseModal
    title={getTitle()}
    footer={getFooter()}
    // ...
  >
    {step === "step1" && <Step1Content />}
    {step === "step2" && <Step2Content />}
    {step === "step3" && <Step3Content />}
  </BaseModal>
);
```

### Pattern 3: Input Masking

```typescript
// Routing number (9 digits only)
<Input
  value={formData.routingNumber}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");
    handleFieldChange("routingNumber", value);
  }}
  maxLength={9}
  className="font-mono"
/>

// SWIFT code (uppercase)
<Input
  value={formData.swiftCode}
  onChange={(e) => {
    const value = e.target.value.toUpperCase();
    handleFieldChange("swiftCode", value);
  }}
  maxLength={11}
  className="font-mono uppercase"
/>
```

### Pattern 4: Character Counter

```typescript
<Textarea
  value={formData.description}
  onChange={(e) => handleFieldChange("description", e.target.value)}
  maxLength={500}
/>
<p className="text-xs text-white/60">
  {formData.description.length}/500 characters
  {formData.description.length >= 450 && (
    <span className="ml-2 text-amber-400">
      ({500 - formData.description.length} remaining)
    </span>
  )}
</p>
```

### Pattern 5: Real-Time Calculations

```typescript
const fee = formData.type === "domestic" ? 25 : 45;
const total = parseFloat(formData.amount || "0") + fee;

<p className="text-xs text-white/60">
  Total with fee: ${total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</p>
```

---

## 🛠️ BaseModal Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | ✅ | - | Modal open state |
| `onClose` | () => void | ✅ | - | Close handler |
| `title` | string | ✅ | - | Modal title |
| `description` | string | ❌ | undefined | Optional description |
| `icon` | LucideIcon | ❌ | undefined | Icon component |
| `iconColor` | string | ❌ | "bg-blue-500/20" | Icon background color |
| `children` | ReactNode | ✅ | - | Modal content |
| `footer` | ReactNode | ❌ | undefined | Footer content |
| `size` | "sm" \| "md" \| "lg" \| "xl" | ❌ | "md" | Modal width |
| `state` | ModalState | ❌ | "idle" | Current state |
| `error` | string \| null | ❌ | null | Error message |
| `successMessage` | string | ❌ | "Success" | Success message |
| `autoCloseOnSuccess` | boolean | ❌ | true | Auto-close on success |
| `autoCloseDelay` | number | ❌ | 1500 | Delay before close (ms) |
| `closeOnOverlayClick` | boolean | ❌ | true | Allow overlay click |

---

## 🐛 Troubleshooting

### Issue: Modal doesn't close after success

**Cause:** Not using `modalState.setSuccess()` or `autoCloseOnSuccess` is false

**Solution:**
```typescript
modalState.setSuccess(); // This triggers auto-close
// OR
<BaseModal autoCloseOnSuccess={true} />
```

### Issue: Validation errors not showing

**Cause:** Not calling `getZodErrorMap()` or not rendering error messages

**Solution:**
```typescript
const errors = getZodErrorMap(result.error);
setFieldErrors(errors);

// In JSX:
{fieldErrors.fieldName && (
  <p className="text-xs text-red-400">{fieldErrors.fieldName}</p>
)}
```

### Issue: Modal closes during submission

**Cause:** Not preventing close during submitting state

**Solution:**
```typescript
const handleClose = () => {
  if (!modalState.isSubmitting) {
    onClose();
  }
};

// BaseModal already handles this automatically
```

### Issue: Form data persists after closing

**Cause:** Not resetting state on open

**Solution:**
```typescript
useEffect(() => {
  if (isOpen) {
    setFormData(initialState);
    setFieldErrors({});
    modalState.reset();
  }
}, [isOpen]);
```

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Identify all form fields and validation rules
- [ ] Check if Zod schema exists or needs creation
- [ ] Identify appropriate toast messages to use
- [ ] Note any special UX requirements (multi-step, conditional fields, etc.)

### During Migration
- [ ] Import BaseModal and useModalState
- [ ] Create/update Zod schema
- [ ] Replace state management with useModalState
- [ ] Add field-level error display
- [ ] Replace Dialog with BaseModal
- [ ] Add reset logic in useEffect
- [ ] Update submit handler with validation
- [ ] Replace toast calls with standardized functions
- [ ] Add loading states to form fields
- [ ] Test all validation rules

### Post-Migration
- [ ] Test modal open/close
- [ ] Test form validation (valid and invalid cases)
- [ ] Test success flow with auto-close
- [ ] Test error handling and display
- [ ] Test keyboard navigation (Enter, ESC)
- [ ] Test overlay click behavior
- [ ] Verify TypeScript errors are resolved
- [ ] Update documentation if needed

---

## 📚 Resources

- [PHASE3_IMPLEMENTATION.md](./PHASE3_IMPLEMENTATION.md) - Full Phase 3 docs
- [PHASE3_P1_COMPLETION.md](./PHASE3_P1_COMPLETION.md) - P1 completion summary
- [BaseModal Component](../src/components/ui/base-modal.tsx)
- [Zod Validation Schemas](../src/lib/validations/profile-schemas.ts)
- [Toast Messages](../src/lib/toast-messages.ts)

---

## 💡 Tips & Best Practices

1. **Group Similar Modals:** Migrate modals in groups by complexity
2. **Start Simple:** Begin with basic forms before tackling complex ones
3. **Reuse Schemas:** Look for existing schemas before creating new ones
4. **Consistent Icons:** Use consistent icon colors per category (blue for profile, purple for security, etc.)
5. **Toast Context:** Include relevant context in toast messages (e.g., amounts, names)
6. **Field Clearing:** Clear field errors when user starts typing
7. **Auto-Focus:** Add `autoFocus` to primary input fields
8. **Enter Key:** Support Enter key submission for single-field forms
9. **Character Limits:** Show character counters for text inputs
10. **Helpful Tips:** Add informational cards to guide users

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Active