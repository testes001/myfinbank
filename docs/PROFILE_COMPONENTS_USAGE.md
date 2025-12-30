# Profile Components Usage Guide

This guide demonstrates how to use the refactored Profile components (tabs and modals) with the `useProfileData` hook.

---

## 📦 Quick Start

### 1. Import Required Components

```tsx
import { useState } from 'react';
import { useProfileData } from '@/hooks/useProfileData';

// Tab Components
import { AccountTab } from '@/components/profile/tabs/AccountTab';
import { SecurityTab } from '@/components/profile/tabs/SecurityTab';
import { ServicesTab } from '@/components/profile/tabs/ServicesTab';
import { NotificationsTab } from '@/components/profile/tabs/NotificationsTab';
import { ToolsTab } from '@/components/profile/tabs/ToolsTab';

// Modal Components (lazy-loaded with Suspense)
import {
  ProfilePictureModal,
  SecondaryContactModal,
  AddressChangeModal,
  TwoFactorSetupModal,
  BiometricSetupModal,
  SessionsModal,
  LoginHistoryModal,
  CreditScoreModal,
  LinkAccountModal,
  LimitUpgradeModal,
  AccountNicknameModal,
  TravelNotificationModal,
  WireTransferModal,
  SpendingAnalyticsModal,
  BudgetingModal,
} from '@/components/profile/modals';
```

### 2. Basic Implementation

```tsx
export function ProfilePage() {
  // Get all profile data and handlers from the custom hook
  const profileData = useProfileData();
  
  // Modal state management
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Helper to open modals
  const openModal = (modalName: string) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="container mx-auto p-6">
      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-white/10">
        <TabButton
          active={profileData.activeTab === 'account'}
          onClick={() => profileData.setActiveTab('account')}
        >
          Account
        </TabButton>
        <TabButton
          active={profileData.activeTab === 'security'}
          onClick={() => profileData.setActiveTab('security')}
        >
          Security
        </TabButton>
        <TabButton
          active={profileData.activeTab === 'services'}
          onClick={() => profileData.setActiveTab('services')}
        >
          Services
        </TabButton>
        <TabButton
          active={profileData.activeTab === 'notifications'}
          onClick={() => profileData.setActiveTab('notifications')}
        >
          Notifications
        </TabButton>
        <TabButton
          active={profileData.activeTab === 'tools'}
          onClick={() => profileData.setActiveTab('tools')}
        >
          Tools
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {profileData.activeTab === 'account' && (
          <AccountTab
            currentUser={profileData.currentUser}
            profilePhotoUploaded={profileData.profilePhotoUploaded}
            profilePhotoUrl={profileData.profilePhotoUrl}
            isUploadingPhoto={profileData.isUploadingPhoto}
            kycData={profileData.kycData}
            profileData={profileData.profileData}
            secondaryEmail={profileData.secondaryEmail}
            secondaryPhone={profileData.secondaryPhone}
            pendingAddressChange={profileData.pendingAddressChange}
            showAccountNumber={profileData.showAccountNumber}
            setShowAccountNumber={profileData.setShowAccountNumber}
            onOpenProfilePictureModal={() => openModal('profilePicture')}
            onOpenSecondaryContactModal={() => openModal('secondaryContact')}
            onOpenAddressChangeModal={() => openModal('addressChange')}
            onOpenDirectDepositModal={() => openModal('directDeposit')}
          />
        )}

        {profileData.activeTab === 'security' && (
          <SecurityTab
            twoFactorEnabled={profileData.twoFactorEnabled}
            twoFactorMethod={profileData.twoFactorMethod}
            biometricEnabled={profileData.biometricEnabled}
            biometricType={profileData.biometricType}
            activeSessions={profileData.activeSessions}
            loginHistory={profileData.loginHistory}
            onEnable2FA={profileData.handleEnable2FA}
            onEnableBiometric={profileData.handleEnableBiometric}
            onOpenTwoFactorSetupModal={() => openModal('twoFactorSetup')}
            onOpenBiometricSetupModal={() => openModal('biometricSetup')}
            onOpenSessionsModal={() => openModal('sessions')}
            onOpenLoginHistoryModal={() => openModal('loginHistory')}
            onChangePassword={() => openModal('changePassword')}
          />
        )}

        {profileData.activeTab === 'services' && (
          <ServicesTab
            overdraftEnabled={profileData.overdraftEnabled}
            linkedSavingsForOverdraft={profileData.linkedSavingsForOverdraft}
            externalAccounts={profileData.externalAccounts}
            accountNickname={profileData.accountNickname}
            travelNotifications={profileData.travelNotifications}
            onToggleOverdraft={() => profileData.setOverdraftEnabled(!profileData.overdraftEnabled)}
            onOpenLinkAccountModal={() => openModal('linkAccount')}
            onOpenAccountNicknameModal={() => openModal('accountNickname')}
            onOpenTravelNotificationModal={() => openModal('travelNotification')}
            onOpenWireTransferModal={() => openModal('wireTransfer')}
            onOpenLimitUpgradeModal={() => openModal('limitUpgrade')}
          />
        )}

        {profileData.activeTab === 'notifications' && (
          <NotificationsTab
            notificationPreferences={profileData.notificationPreferences}
            onPreferenceChange={(category, channel, value) => {
              profileData.setNotificationPreferences((prev) => ({
                ...prev,
                [category]: { ...prev[category], [channel]: value },
              }));
            }}
            onSavePreferences={() => {
              // API call to save preferences
              console.log('Saving notification preferences');
            }}
          />
        )}

        {profileData.activeTab === 'tools' && (
          <ToolsTab
            creditScore={profileData.creditScore}
            showCreditScore={profileData.showCreditScore}
            spendingData={profileData.spendingData}
            budgets={profileData.budgets}
            onToggleCreditScore={() => profileData.setShowCreditScore(!profileData.showCreditScore)}
            onOpenCreditScoreModal={() => openModal('creditScore')}
            onOpenSpendingAnalyticsModal={() => openModal('spendingAnalytics')}
            onOpenBudgetingModal={() => openModal('budgeting')}
          />
        )}
      </div>

      {/* Modals */}
      <ProfilePictureModal
        isOpen={activeModal === 'profilePicture'}
        onClose={closeModal}
        onUpload={profileData.handleProfilePhotoUpload}
        isUploading={profileData.isUploadingPhoto}
        alreadyUploaded={profileData.profilePhotoUploaded}
      />

      <SecondaryContactModal
        isOpen={activeModal === 'secondaryContact'}
        onClose={closeModal}
        currentSecondaryEmail={profileData.secondaryEmail}
        currentSecondaryPhone={profileData.secondaryPhone}
        onSave={async (email, phone) => {
          profileData.setSecondaryEmail(email);
          profileData.setSecondaryPhone(phone);
          await profileData.handleSaveSecondaryContact();
        }}
      />

      <AddressChangeModal
        isOpen={activeModal === 'addressChange'}
        onClose={closeModal}
        currentAddress={profileData.profileData.address}
        onSubmit={async (addressData, verificationDoc) => {
          profileData.setNewAddressData(addressData);
          profileData.setAddressVerificationDoc(verificationDoc);
          await profileData.handleSubmitAddressChange();
        }}
        pendingChange={profileData.pendingAddressChange}
      />

      <TwoFactorSetupModal
        isOpen={activeModal === 'twoFactorSetup'}
        onClose={closeModal}
        currentMethod={profileData.twoFactorMethod}
        onMethodChange={profileData.setTwoFactorMethod}
        onSetup={profileData.handleSetup2FA}
      />

      <BiometricSetupModal
        isOpen={activeModal === 'biometricSetup'}
        onClose={closeModal}
        currentType={profileData.biometricType}
        onTypeChange={profileData.setBiometricType}
        onSetup={profileData.handleSetupBiometric}
      />

      <SessionsModal
        isOpen={activeModal === 'sessions'}
        onClose={closeModal}
        sessions={profileData.activeSessions}
        onTerminateSession={(sessionId) => console.log('Terminate:', sessionId)}
        onTerminateAllOther={() => console.log('Terminate all other sessions')}
      />

      <LoginHistoryModal
        isOpen={activeModal === 'loginHistory'}
        onClose={closeModal}
        loginHistory={profileData.loginHistory}
        onDownloadHistory={() => console.log('Download login history')}
      />

      <CreditScoreModal
        isOpen={activeModal === 'creditScore'}
        onClose={closeModal}
        creditScore={profileData.creditScore}
      />

      <LinkAccountModal
        isOpen={activeModal === 'linkAccount'}
        onClose={closeModal}
        onLink={async (accountData) => {
          console.log('Link account:', accountData);
          // Add to external accounts
        }}
      />

      <LimitUpgradeModal
        isOpen={activeModal === 'limitUpgrade'}
        onClose={closeModal}
        onRequest={async (limitType, amount) => {
          console.log('Request limit upgrade:', limitType, amount);
        }}
      />

      <AccountNicknameModal
        isOpen={activeModal === 'accountNickname'}
        onClose={closeModal}
        currentNickname={profileData.accountNickname}
        onSave={async (nickname) => {
          profileData.setAccountNickname(nickname);
        }}
      />

      <TravelNotificationModal
        isOpen={activeModal === 'travelNotification'}
        onClose={closeModal}
        onAdd={async (data) => {
          console.log('Add travel notification:', data);
        }}
      />

      <WireTransferModal
        isOpen={activeModal === 'wireTransfer'}
        onClose={closeModal}
        onInitiate={async (data) => {
          console.log('Initiate wire transfer:', data);
        }}
      />

      <SpendingAnalyticsModal
        isOpen={activeModal === 'spendingAnalytics'}
        onClose={closeModal}
        spendingData={profileData.spendingData}
      />

      <BudgetingModal
        isOpen={activeModal === 'budgeting'}
        onClose={closeModal}
        budgets={profileData.budgets}
        onAddBudget={async (category, limit) => {
          console.log('Add budget:', category, limit);
        }}
        onRemoveBudget={async (category) => {
          console.log('Remove budget:', category);
        }}
      />
    </div>
  );
}
```

---

## 🎯 Pattern Examples

### Opening Modals from Tab Components

Tabs should never manage modal state directly. Instead, they receive callbacks as props:

```tsx
// ✅ GOOD: Tab receives callback
<AccountTab
  onOpenProfilePictureModal={() => openModal('profilePicture')}
  // ... other props
/>

// ❌ BAD: Tab manages modal state
<AccountTab
  setShowModal={setShowModal}  // Don't do this
/>
```

### Handling Form Submissions

Modals should call async handlers and let the hook manage state:

```tsx
<SecondaryContactModal
  onSave={async (email, phone) => {
    // Update local state
    profileData.setSecondaryEmail(email);
    profileData.setSecondaryPhone(phone);
    
    // Call API
    await profileData.handleSaveSecondaryContact();
    
    // Modal will close automatically on success
  }}
/>
```

### Conditional Rendering Based on State

```tsx
{profileData.profilePhotoUploaded ? (
  <div>Photo uploaded</div>
) : (
  <Button onClick={() => openModal('profilePicture')}>
    Upload Photo
  </Button>
)}
```

---

## 🔧 Advanced Usage

### Custom Modal Management

For more control, create a custom hook:

```tsx
function useModalManager() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  const openModal = (name: string, data?: any) => {
    setActiveModal(name);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  return { activeModal, modalData, openModal, closeModal };
}
```

### Passing Additional Context

```tsx
const { openModal } = useModalManager();

// Pass context when opening modal
<Button onClick={() => openModal('addressChange', { 
  reason: 'moving',
  urgency: 'high' 
})}>
  Change Address
</Button>

// Use context in modal
<AddressChangeModal
  isOpen={activeModal === 'addressChange'}
  metadata={modalData}
  // ...
/>
```

---

## 🎨 Styling Customization

All components use Tailwind classes and can be customized:

```tsx
// Wrap in custom container
<div className="max-w-6xl mx-auto">
  <SecurityTab {...props} />
</div>

// Custom card styling
<div className="rounded-2xl shadow-2xl">
  <AccountTab {...props} />
</div>
```

---

## ⚡ Performance Tips

### 1. Memoize Callbacks

```tsx
const handleOpenModal = useCallback((modalName: string) => {
  setActiveModal(modalName);
}, []);
```

### 2. Lazy Load Tabs (Optional)

```tsx
const AccountTab = lazy(() => import('./tabs/AccountTab'));
const SecurityTab = lazy(() => import('./tabs/SecurityTab'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  {activeTab === 'account' && <AccountTab {...props} />}
</Suspense>
```

### 3. Avoid Re-renders

```tsx
// Use React.memo for tabs if props don't change often
export const AccountTab = React.memo(({ ... }) => {
  // Component code
});
```

---

## 🧪 Testing Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';

test('opens profile picture modal when button clicked', async () => {
  render(<ProfilePage />);
  
  const uploadButton = screen.getByText(/Upload Photo/i);
  fireEvent.click(uploadButton);
  
  expect(screen.getByText(/Upload Profile Picture/i)).toBeInTheDocument();
});
```

---

## 📝 TypeScript Types

All components are fully typed. Here are the key interfaces:

```typescript
interface ProfileData {
  phone: string;
  address: string;
  email: string;
}

interface NotificationPreferences {
  transactions: { email: boolean; push: boolean; sms: boolean };
  security: { email: boolean; push: boolean; sms: boolean };
  // ... other categories
}

interface CreditScore {
  score: number;
  rating: string;
  factors: string[];
  lastUpdated: string;
}
```

---

## 🚨 Common Pitfalls

### 1. Forgetting to Pass Required Props

```tsx
// ❌ Missing required props
<AccountTab currentUser={profileData.currentUser} />

// ✅ All required props
<AccountTab
  currentUser={profileData.currentUser}
  profilePhotoUploaded={profileData.profilePhotoUploaded}
  // ... all other required props
/>
```

### 2. Not Handling Async Operations

```tsx
// ❌ Not awaiting async operations
const handleSave = () => {
  profileData.handleSaveSecondaryContact(); // Missing await
  closeModal();
};

// ✅ Properly awaiting
const handleSave = async () => {
  try {
    await profileData.handleSaveSecondaryContact();
    closeModal();
  } catch (error) {
    // Handle error
  }
};
```

### 3. Modal State Conflicts

```tsx
// ❌ Multiple modals can be open
<ProfilePictureModal isOpen={showProfilePicture} />
<AddressChangeModal isOpen={showAddressModal} />

// ✅ Only one modal open at a time
<ProfilePictureModal isOpen={activeModal === 'profilePicture'} />
<AddressChangeModal isOpen={activeModal === 'addressChange'} />
```

---

## 📚 Additional Resources

- **Hook Documentation:** See `useProfileData.ts` for all available state and handlers
- **Component Props:** Check each component file for detailed prop types
- **Styling Guide:** Refer to Tailwind 4 documentation for utility classes
- **Animation Guide:** See Framer Motion docs for advanced animations

---

## 💡 Best Practices

1. **Always use the `useProfileData` hook** - Don't bypass it
2. **Keep modals stateless** - They should only receive props
3. **Use proper loading states** - Show spinners during async operations
4. **Handle errors gracefully** - Use toast notifications for user feedback
5. **Close modals on success** - Improve UX by auto-closing after actions
6. **Validate before submission** - Validate in modals before calling handlers
7. **Test edge cases** - Empty states, error states, loading states

---

## ✅ Checklist for Implementation

- [ ] Import `useProfileData` hook
- [ ] Import required tab components
- [ ] Import required modal components
- [ ] Set up modal state management
- [ ] Create tab navigation UI
- [ ] Render active tab with props
- [ ] Add all modals with proper props
- [ ] Test modal open/close functionality
- [ ] Test form submissions
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test on different screen sizes

---

**Last Updated:** January 2025  
**Version:** 2.0.0  
**Status:** Production Ready