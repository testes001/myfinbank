import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load all modal components for code splitting
const ProfilePictureModalComponent = lazy(
  () => import("./ProfilePictureModal.tsx"),
);
const SecondaryContactModalComponent = lazy(
  () => import("./SecondaryContactModal.tsx"),
);
const AddressChangeModalComponent = lazy(
  () => import("./AddressChangeModal.tsx"),
);
const TwoFactorSetupModalComponent = lazy(
  () => import("./TwoFactorSetupModal.tsx"),
);
const BiometricSetupModalComponent = lazy(
  () => import("./BiometricSetupModal.tsx"),
);
const SessionsModalComponent = lazy(() => import("./SessionsModal.tsx"));
const LoginHistoryModalComponent = lazy(
  () => import("./LoginHistoryModal.tsx"),
);
const CreditScoreModalComponent = lazy(() => import("./CreditScoreModal.tsx"));
const LinkAccountModalComponent = lazy(() => import("./LinkAccountModal.tsx"));
const LimitUpgradeModalComponent = lazy(
  () => import("./LimitUpgradeModal.tsx"),
);
const AccountNicknameModalComponent = lazy(
  () => import("./AccountNicknameModal.tsx"),
);
const TravelNotificationModalComponent = lazy(
  () => import("./TravelNotificationModal.tsx"),
);
const WireTransferModalComponent = lazy(
  () => import("./WireTransferModal.tsx"),
);
const SpendingAnalyticsModalComponent = lazy(
  () => import("./SpendingAnalyticsModal.tsx"),
);
const BudgetingModalComponent = lazy(() => import("./BudgetingModal.tsx"));

// Loading fallback component
function ModalLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

// Wrapper components with Suspense
export function ProfilePictureModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <ProfilePictureModalComponent {...props} />
    </Suspense>
  );
}

export function SecondaryContactModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <SecondaryContactModalComponent {...props} />
    </Suspense>
  );
}

export function AddressChangeModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <AddressChangeModalComponent {...props} />
    </Suspense>
  );
}

export function TwoFactorSetupModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <TwoFactorSetupModalComponent {...props} />
    </Suspense>
  );
}

export function BiometricSetupModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <BiometricSetupModalComponent {...props} />
    </Suspense>
  );
}

export function SessionsModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <SessionsModalComponent {...props} />
    </Suspense>
  );
}

export function LoginHistoryModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <LoginHistoryModalComponent {...props} />
    </Suspense>
  );
}

export function CreditScoreModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <CreditScoreModalComponent {...props} />
    </Suspense>
  );
}

export function LinkAccountModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <LinkAccountModalComponent {...props} />
    </Suspense>
  );
}

export function LimitUpgradeModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <LimitUpgradeModalComponent {...props} />
    </Suspense>
  );
}

export function AccountNicknameModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <AccountNicknameModalComponent {...props} />
    </Suspense>
  );
}

export function TravelNotificationModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <TravelNotificationModalComponent {...props} />
    </Suspense>
  );
}

export function WireTransferModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <WireTransferModalComponent {...props} />
    </Suspense>
  );
}

export function SpendingAnalyticsModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <SpendingAnalyticsModalComponent {...props} />
    </Suspense>
  );
}

export function BudgetingModal(props: any) {
  return (
    <Suspense fallback={<ModalLoader />}>
      <BudgetingModalComponent {...props} />
    </Suspense>
  );
}
