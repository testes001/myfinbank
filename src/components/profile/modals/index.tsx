import { lazy, Suspense } from "react";
import {
  FormModalSkeleton,
  DetailModalSkeleton,
  ListModalSkeleton,
  ChartModalSkeleton,
} from "@/components/ui/skeleton-loaders";

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

// Wrapper components with Suspense and appropriate skeleton loaders

export function ProfilePictureModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <ProfilePictureModalComponent {...props} />
    </Suspense>
  );
}

export function SecondaryContactModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <SecondaryContactModalComponent {...props} />
    </Suspense>
  );
}

export function AddressChangeModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <AddressChangeModalComponent {...props} />
    </Suspense>
  );
}

export function TwoFactorSetupModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <TwoFactorSetupModalComponent {...props} />
    </Suspense>
  );
}

export function BiometricSetupModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <BiometricSetupModalComponent {...props} />
    </Suspense>
  );
}

export function SessionsModal(props: any) {
  return (
    <Suspense fallback={<ListModalSkeleton />}>
      <SessionsModalComponent {...props} />
    </Suspense>
  );
}

export function LoginHistoryModal(props: any) {
  return (
    <Suspense fallback={<ListModalSkeleton />}>
      <LoginHistoryModalComponent {...props} />
    </Suspense>
  );
}

export function CreditScoreModal(props: any) {
  return (
    <Suspense fallback={<DetailModalSkeleton />}>
      <CreditScoreModalComponent {...props} />
    </Suspense>
  );
}

export function LinkAccountModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <LinkAccountModalComponent {...props} />
    </Suspense>
  );
}

export function LimitUpgradeModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <LimitUpgradeModalComponent {...props} />
    </Suspense>
  );
}

export function AccountNicknameModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <AccountNicknameModalComponent {...props} />
    </Suspense>
  );
}

export function TravelNotificationModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <TravelNotificationModalComponent {...props} />
    </Suspense>
  );
}

export function WireTransferModal(props: any) {
  return (
    <Suspense fallback={<FormModalSkeleton />}>
      <WireTransferModalComponent {...props} />
    </Suspense>
  );
}

export function SpendingAnalyticsModal(props: any) {
  return (
    <Suspense fallback={<ChartModalSkeleton />}>
      <SpendingAnalyticsModalComponent {...props} />
    </Suspense>
  );
}

export function BudgetingModal(props: any) {
  return (
    <Suspense fallback={<ChartModalSkeleton />}>
      <BudgetingModalComponent {...props} />
    </Suspense>
  );
}
