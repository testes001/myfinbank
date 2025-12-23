import { createFileRoute } from '@tanstack/react-router';
import { EnhancedLoginForm } from '@/components/EnhancedLoginForm';

export const Route = createFileRoute('/login')({
  component: EnhancedLoginForm,
});