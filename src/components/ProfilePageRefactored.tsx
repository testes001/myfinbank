import { lazy, Suspense, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LogOut, User, Shield, Settings, Bell, FileText, Loader2 } from "lucide-react";
import { useProfileData } from "@/hooks/useProfileData";
import { DirectDepositModal } from "@/components/DirectDepositModal";
import { CardManagementModal } from "@/components/CardManagementModal";

// Lazy load tab components for code splitting
const AccountTab = lazy(() => import("./profile/tabs/AccountTab").then(m => ({ default: m.AccountTab })));
const SecurityTab = lazy(() => import("./profile/tabs/SecurityTab"));
const ServicesTab = lazy(() => import("./profile/tabs/ServicesTab"));
const NotificationsTab = lazy(() => import("./profile/tabs/NotificationsTab"));
const ToolsTab = lazy(() => import("./profile/tabs/ToolsTab"));

// Lazy load modals (only when opened)
const ProfilePictureModal = lazy(() => import("./profile/modals/ProfilePictureModal"));
const SecondaryContactModal = lazy(() => import("./profile/modals/SecondaryContactModal"));
const AddressChangeModal = lazy(() => import("./profile/modals/AddressChangeModal"));
const TwoFactorSetupModal = lazy(() => import("./profile/modals/TwoFactorSetupModal"));
const BiometricSetupModal = lazy(() => import("./profile/modals/BiometricSetupModal"));
const SessionsModal = lazy(() => import("./profile/modals/SessionsModal"));
const LoginHistoryModal = lazy(() => import("./profile/modals/LoginHistoryModal"));
const CreditScoreModal = lazy(() => import("./profile/modals/CreditScoreModal"));
const LinkAccountModal = lazy(() => import("./profile/modals/LinkAccountModal"));
const LimitUpgradeModal = lazy(() => import("./profile/modals/LimitUpgradeModal"));
const AccountNicknameModal = lazy(() => import("./profile/modals/AccountNicknameModal"));
const TravelNotificationModal = lazy(() => import("./profile/modals/TravelNotificationModal"));
const WireTransferModal = lazy(() => import("./profile/modals/WireTransferModal"));
const SpendingAnalyticsModal = lazy(() => import("./profile/modals/SpendingAnalyticsModal"));
const BudgetingModal = lazy(() => import("./profile/modals/BudgetingModal"));

// Loading component for tabs and modals
function TabLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

function ModalLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    </div>
  );
}

export function ProfilePageRefactored() {
  const { currentUser, logout } = useAuth();

  // Use custom hook for all profile data and business logic
  const profileData = useProfileData();

  // Modal visibility states
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [showSecondaryContactModal, setShowSecondaryContactModal] = useState(false);
  const [showAddressChangeModal, setShowAddressChangeModal] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [showBiometricSetupModal, setShowBiometricSetupModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [showCreditScoreModal, setShowCreditScoreModal] = useState(false);
  const [showLinkAccountModal, setShowLinkAccountModal] = useState(false);
  const [showLimitUpgradeModal, setShowLimitUpgradeModal] = useState(false);
  const [showDirectDepositModal, setShowDirectDepositModal] = useState(false);
  const [showCardManagementModal, setShowCardManagementModal] = useState(false);
  const [showAccountNicknameModal, setShowAccountNicknameModal] = useState(false);
  const [showTravelNotificationModal, setShowTravelNotificationModal] = useState(false);
  const [showWireTransferModal, setShowWireTransferModal] = useState(false);
  const [showSpendingAnalyticsModal, setShowSpendingAnalyticsModal] = useState(false);
  const [showBudgetingModal, setShowBudgetingModal] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen p-4 pt-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
            <p className="text-white/60">Manage your account and preferences</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={profileData.activeTab}
          onValueChange={profileData.setActiveTab}
          className="space-y-4"
        >
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max bg-white/5">
              <TabsTrigger value="account" className="data-[state=active]:bg-white/20">
                <User className="mr-2 size-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white/20">
                <Shield className="mr-2 size-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="services" className="data-[state=active]:bg-white/20">
                <Settings className="mr-2 size-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white/20">
                <Bell className="mr-2 size-4" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-white/20">
                <FileText className="mr-2 size-4" />
                Tools
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Tab - Lazy loaded */}
          <TabsContent value="account">
            <Suspense fallback={<TabLoader />}>
              <AccountTab
                currentUser={currentUser}
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
                onOpenProfilePictureModal={() => setShowProfilePictureModal(true)}
                onOpenSecondaryContactModal={() => setShowSecondaryContactModal(true)}
                onOpenAddressChangeModal={() => setShowAddressChangeModal(true)}
                onOpenDirectDepositModal={() => setShowDirectDepositModal(true)}
              />
            </Suspense>
          </TabsContent>

          {/* Security Tab - Lazy loaded */}
          <TabsContent value="security">
            <Suspense fallback={<TabLoader />}>
              <SecurityTab
                twoFactorEnabled={profileData.twoFactorEnabled}
                twoFactorMethod={profileData.twoFactorMethod}
                biometricEnabled={profileData.biometricEnabled}
                biometricType={profileData.biometricType}
                activeSessions={profileData.activeSessions}
                loginHistory={profileData.loginHistory}
                onEnable2FA={profileData.handleEnable2FA}
                onEnableBiometric={profileData.handleEnableBiometric}
                onOpen2FASetup={() => setShow2FASetupModal(true)}
                onOpenBiometricSetup={() => setShowBiometricSetupModal(true)}
                onOpenSessions={() => setShowSessionsModal(true)}
                onOpenLoginHistory={() => setShowLoginHistoryModal(true)}
              />
            </Suspense>
          </TabsContent>

          {/* Services Tab - Lazy loaded */}
          <TabsContent value="services">
            <Suspense fallback={<TabLoader />}>
              <ServicesTab
                overdraftEnabled={profileData.overdraftEnabled}
                setOverdraftEnabled={profileData.setOverdraftEnabled}
                linkedSavingsForOverdraft={profileData.linkedSavingsForOverdraft}
                setLinkedSavingsForOverdraft={profileData.setLinkedSavingsForOverdraft}
                externalAccounts={profileData.externalAccounts}
                accountNickname={profileData.accountNickname}
                travelNotifications={profileData.travelNotifications}
                onOpenLinkAccount={() => setShowLinkAccountModal(true)}
                onOpenLimitUpgrade={() => setShowLimitUpgradeModal(true)}
                onOpenCardManagement={() => setShowCardManagementModal(true)}
                onOpenAccountNickname={() => setShowAccountNicknameModal(true)}
                onOpenTravelNotification={() => setShowTravelNotificationModal(true)}
                onOpenWireTransfer={() => setShowWireTransferModal(true)}
              />
            </Suspense>
          </TabsContent>

          {/* Notifications Tab - Lazy loaded */}
          <TabsContent value="notifications">
            <Suspense fallback={<TabLoader />}>
              <NotificationsTab
                notificationPreferences={profileData.notificationPreferences}
                setNotificationPreferences={profileData.setNotificationPreferences}
              />
            </Suspense>
          </TabsContent>

          {/* Tools Tab - Lazy loaded */}
          <TabsContent value="tools">
            <Suspense fallback={<TabLoader />}>
              <ToolsTab
                creditScore={profileData.creditScore}
                spendingData={profileData.spendingData}
                budgets={profileData.budgets}
                onOpenCreditScore={() => setShowCreditScoreModal(true)}
                onOpenSpendingAnalytics={() => setShowSpendingAnalyticsModal(true)}
                onOpenBudgeting={() => setShowBudgetingModal(true)}
              />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Modals - All lazy loaded */}
        {showProfilePictureModal && (
          <Suspense fallback={<ModalLoader />}>
            <ProfilePictureModal
              open={showProfilePictureModal}
              onOpenChange={setShowProfilePictureModal}
              currentUser={currentUser}
              isUploading={profileData.isUploadingPhoto}
              onUpload={profileData.handleProfilePhotoUpload}
            />
          </Suspense>
        )}

        {showSecondaryContactModal && (
          <Suspense fallback={<ModalLoader />}>
            <SecondaryContactModal
              open={showSecondaryContactModal}
              onOpenChange={setShowSecondaryContactModal}
              secondaryEmail={profileData.secondaryEmail}
              setSecondaryEmail={profileData.setSecondaryEmail}
              secondaryPhone={profileData.secondaryPhone}
              setSecondaryPhone={profileData.setSecondaryPhone}
              onSave={profileData.handleSaveSecondaryContact}
            />
          </Suspense>
        )}

        {showAddressChangeModal && (
          <Suspense fallback={<ModalLoader />}>
            <AddressChangeModal
              open={showAddressChangeModal}
              onOpenChange={setShowAddressChangeModal}
              addressData={profileData.newAddressData}
              setAddressData={profileData.setNewAddressData}
              verificationDoc={profileData.addressVerificationDoc}
              setVerificationDoc={profileData.setAddressVerificationDoc}
              onSubmit={profileData.handleSubmitAddressChange}
            />
          </Suspense>
        )}

        {show2FASetupModal && (
          <Suspense fallback={<ModalLoader />}>
            <TwoFactorSetupModal
              open={show2FASetupModal}
              onOpenChange={setShow2FASetupModal}
              method={profileData.twoFactorMethod}
              setMethod={profileData.setTwoFactorMethod}
              onSetup={profileData.handleSetup2FA}
            />
          </Suspense>
        )}

        {showBiometricSetupModal && (
          <Suspense fallback={<ModalLoader />}>
            <BiometricSetupModal
              open={showBiometricSetupModal}
              onOpenChange={setShowBiometricSetupModal}
              biometricType={profileData.biometricType}
              setBiometricType={profileData.setBiometricType}
              onSetup={profileData.handleSetupBiometric}
            />
          </Suspense>
        )}

        {showSessionsModal && (
          <Suspense fallback={<ModalLoader />}>
            <SessionsModal
              open={showSessionsModal}
              onOpenChange={setShowSessionsModal}
              sessions={profileData.activeSessions}
            />
          </Suspense>
        )}

        {showLoginHistoryModal && (
          <Suspense fallback={<ModalLoader />}>
            <LoginHistoryModal
              open={showLoginHistoryModal}
              onOpenChange={setShowLoginHistoryModal}
              history={profileData.loginHistory}
            />
          </Suspense>
        )}

        {showCreditScoreModal && (
          <Suspense fallback={<ModalLoader />}>
            <CreditScoreModal
              open={showCreditScoreModal}
              onOpenChange={setShowCreditScoreModal}
              creditScore={profileData.creditScore}
            />
          </Suspense>
        )}

        {showLinkAccountModal && (
          <Suspense fallback={<ModalLoader />}>
            <LinkAccountModal
              open={showLinkAccountModal}
              onOpenChange={setShowLinkAccountModal}
              externalAccounts={profileData.externalAccounts}
              setExternalAccounts={profileData.setExternalAccounts}
            />
          </Suspense>
        )}

        {showLimitUpgradeModal && (
          <Suspense fallback={<ModalLoader />}>
            <LimitUpgradeModal
              open={showLimitUpgradeModal}
              onOpenChange={setShowLimitUpgradeModal}
            />
          </Suspense>
        )}

        {showAccountNicknameModal && (
          <Suspense fallback={<ModalLoader />}>
            <AccountNicknameModal
              open={showAccountNicknameModal}
              onOpenChange={setShowAccountNicknameModal}
              nickname={profileData.accountNickname}
              setNickname={profileData.setAccountNickname}
            />
          </Suspense>
        )}

        {showTravelNotificationModal && (
          <Suspense fallback={<ModalLoader />}>
            <TravelNotificationModal
              open={showTravelNotificationModal}
              onOpenChange={setShowTravelNotificationModal}
            />
          </Suspense>
        )}

        {showWireTransferModal && (
          <Suspense fallback={<ModalLoader />}>
            <WireTransferModal
              open={showWireTransferModal}
              onOpenChange={setShowWireTransferModal}
            />
          </Suspense>
        )}

        {showSpendingAnalyticsModal && (
          <Suspense fallback={<ModalLoader />}>
            <SpendingAnalyticsModal
              open={showSpendingAnalyticsModal}
              onOpenChange={setShowSpendingAnalyticsModal}
              spendingData={profileData.spendingData}
            />
          </Suspense>
        )}

        {showBudgetingModal && (
          <Suspense fallback={<ModalLoader />}>
            <BudgetingModal
              open={showBudgetingModal}
              onOpenChange={setShowBudgetingModal}
              budgets={profileData.budgets}
            />
          </Suspense>
        )}

        {/* Existing modals that are already separate components */}
        <DirectDepositModal
          open={showDirectDepositModal}
          onOpenChange={setShowDirectDepositModal}
        />

        <CardManagementModal
          open={showCardManagementModal}
          onOpenChange={setShowCardManagementModal}
        />
      </div>
    </div>
  );
}
