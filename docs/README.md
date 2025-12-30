# MyFinBank Profile Components - Developer Guide

## 🎯 Quick Start

This is the Phase 2 implementation of the ProfilePage refactoring. All components follow a **stateless presentation pattern** with business logic centralized in the `useProfileData` hook.

## 📁 Project Structure

```
src/
├── hooks/
│   └── useProfileData.ts          # ⭐ Central business logic
├── components/
│   └── profile/
│       ├── tabs/                  # 5 tab components
│       │   ├── AccountTab.tsx
│       │   ├── SecurityTab.tsx
│       │   ├── ServicesTab.tsx
│       │   ├── NotificationsTab.tsx
│       │   └── ToolsTab.tsx
│       └── modals/                # 15+ modal components
│           ├── index.tsx          # Lazy loading wrappers
│           └── *.tsx              # Individual modals
```

## 🚀 Usage

```tsx
import { useProfileData } from '@/hooks/useProfileData';
import { SecurityTab } from '@/components/profile/tabs/SecurityTab';
import { TwoFactorSetupModal } from '@/components/profile/modals';

function ProfilePage() {
  const profileData = useProfileData();
  const [showModal, setShowModal] = useState(null);

  return (
    <>
      <SecurityTab
        twoFactorEnabled={profileData.twoFactorEnabled}
        onOpenTwoFactorSetupModal={() => setShowModal('2fa')}
        {...otherProps}
      />
      
      <TwoFactorSetupModal
        isOpen={showModal === '2fa'}
        onClose={() => setShowModal(null)}
        currentMethod={profileData.twoFactorMethod}
        onSetup={profileData.handleSetup2FA}
      />
    </>
  );
}
```

## 📚 Documentation

- **[PHASE2_PROFILE_REFACTORING.md](./PHASE2_PROFILE_REFACTORING.md)** - Comprehensive implementation guide
- **[PROFILE_COMPONENTS_USAGE.md](./PROFILE_COMPONENTS_USAGE.md)** - Usage examples and patterns
- **[PHASE2_CHECKLIST.md](./PHASE2_CHECKLIST.md)** - Implementation checklist & next steps

## ✨ Key Features

✅ **Stateless Components** - Easy to test and maintain  
✅ **Lazy Loading** - Modals load on-demand  
✅ **Manual Chunking** - Single `profile-modals` chunk  
✅ **TypeScript** - Full type safety  
✅ **Animations** - Framer Motion throughout  
✅ **Tailwind 4** - Consistent styling

## 🧪 Testing (Phase 3)

```bash
# Run unit tests (when implemented)
npm test

# Run E2E tests (when implemented)
npm run test:e2e

# Check TypeScript
npm run type-check
```

## 📦 Build

The build is optimized with manual chunking:

```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'profile-modals': [/* all modal paths */],
      },
    },
  },
}
```

## 🎨 Component Patterns

### Tabs
- Receive all data as props
- Trigger callbacks to open modals
- No internal state management
- Consistent styling with Tailwind

### Modals
- Lazy-loaded with Suspense
- Form validation before submission
- Loading states during async ops
- Auto-close on success

### Hook (useProfileData)
- Centralized state management
- All API calls
- Event handlers
- Data transformations

## 🔧 Development Workflow

1. **Add new feature**
   - Add state to `useProfileData` if needed
   - Create/update tab component
   - Create/update modal component
   - Wire props through

2. **Test locally**
   - Verify tab switching works
   - Test modal open/close
   - Test form submission
   - Check error handling

3. **Review checklist**
   - TypeScript compiles
   - No console errors
   - Animations work
   - Mobile responsive

## 🚨 Common Issues

**Modal won't open?**  
Check that `isOpen` prop is correctly set and modal is imported.

**Props not updating?**  
Verify the hook is returning the correct values and components aren't memoized incorrectly.

**TypeScript errors?**  
Ensure all required props are passed and types match the interfaces.

## 👥 Team

- **Frontend Engineers**: Component implementation
- **Backend Engineers**: API endpoints
- **QA Team**: Testing and validation
- **DevOps**: Deployment and monitoring

## 📞 Support

Questions? Check the documentation first, then reach out to the engineering lead.

---

**Status**: ✅ Phase 2 Complete  
**Next**: Phase 3 - Testing & Integration  
**Version**: 2.0.0
