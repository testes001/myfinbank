import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/AdminPanel";
import { useEffect } from "react";
import { getAdminSession } from "@/lib/admin-storage";

export const Route = createFileRoute("/admin-console")({
  component: AdminConsole,
});

function AdminConsole() {
  useEffect(() => {
    // Client-side guard: if admin console is disabled via env, redirect non-admins
    const enabled = import.meta.env.VITE_ENABLE_ADMIN === "true";
    const session = getAdminSession();
    if (!enabled && !session) {
      // Redirect to home
      window.location.href = "/";
    }
  }, []);

  return <AdminPanel />;
}
