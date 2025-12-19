import { useEffect, useState } from "react";
import { seedDemoUsers } from "@/lib/seed";
import { initializeAdminAccounts } from "@/lib/admin-storage";

export function SeedInitializer({ children }: { children: React.ReactNode }) {
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    const initSeed = async () => {
      console.log("Current NODE_ENV:", process.env.NODE_ENV);
      // Do not run seeder in test environment
      if (process.env.NODE_ENV === 'test') {
        setIsSeeded(true);
        return;
      }

      const seededKey = "finbank_demo_seeded";
      const hasSeeded = localStorage.getItem(seededKey);

      if (!hasSeeded) {
        try {
          await seedDemoUsers();
          initializeAdminAccounts();
          localStorage.setItem(seededKey, "true");
        } catch (error) {
          console.error("Seeding error:", error);
        }
      } else {
        // Always ensure admin accounts exist
        initializeAdminAccounts();
      }
      setIsSeeded(true);
    };

    initSeed();
  }, []);

  if (!isSeeded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950">
        <div className="text-center">
          <div className="mb-4 size-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-500 mx-auto" />
          <p className="text-white/80">Initializing FinBank...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
