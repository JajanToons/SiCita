// app/dashboard/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { CriticalWaterQualityAlertData } from "@/types/sensor";

import { AppSidebar } from "@/components/layout/dashboard/AppSidebar"; // Path ke AppSidebar Anda
import { SiteHeader } from "@/components/layout/dashboard/SiteHeader"; // Path ke SiteHeader Anda
import { SelectedDeviceProvider } from "../../contexts/SelectedDeviceContext";
import { SidebarProvider } from "@/components/ui/sidebar"; // Pastikan useSidebar diekspor dan digunakan dengan benar

interface DashboardLayoutSocketEvents {
  critical_water_quality_alert: (data: CriticalWaterQualityAlertData) => void;
}

// Komponen Internal untuk mengakses hook useSidebar
function MainContentArea({ children }: { children: React.ReactNode }) {
  // Ganti 'isOpen' dengan state yang sesuai dari hook Anda jika berbeda
  // (misalnya isCollapsed, dan logikanya dibalik)

  // Kelas untuk main content area, bisa disesuaikan jika perlu margin kiri dinamis
  // Namun, dengan flex-grow, ini seharusnya tidak perlu jika sidebar mengatur width/display-nya sendiri.
  // const mainContentMarginClass = isOpen ? "lg:ml-[280px] md:ml-[220px]" : "lg:ml-[72px] md:ml-[72px]"; // Contoh jika sidebar tidak display:none

  return (
    <div className="flex flex-col flex-grow h-full overflow-hidden">
      {" "}
      {/* flex-grow agar mengambil sisa ruang */}
      {/* SiteHeader sekarang akan berada di sini dan mungkin berisi SidebarTrigger */}
      <SiteHeader />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {" "}
        {/* flex-1 dan overflow-y-auto */}
        {children}
      </main>
    </div>
  );
}

export default function DashboardAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const apiUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

  // useEffect untuk proteksi sesi (tetap sama)
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      const callbackUrl =
        pathname +
        (typeof window !== "undefined" ? window.location.search : "");
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router, pathname]);

  // useEffect untuk listener socket global (tetap sama)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.backendToken && apiUrl) {
      const socket: Socket<DashboardLayoutSocketEvents> = getSocket(
        apiUrl,
        session.user.backendToken
      );
      const handleGlobalCriticalWaterQualityAlert = () => {
        // ... (logika toast Anda) ...
      };
      socket.on(
        "critical_water_quality_alert",
        handleGlobalCriticalWaterQualityAlert
      );
      return () => {
        socket.off(
          "critical_water_quality_alert",
          handleGlobalCriticalWaterQualityAlert
        );
      };
    }
  }, [status, session?.user?.backendToken, apiUrl, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <p>Memuat sesi pengguna...</p>
      </div>
    );
  }

  return (
    <SelectedDeviceProvider>
      <SidebarProvider>
        {" "}
        {/* SidebarProvider membungkus semua yang butuh state sidebar */}
        <div className="flex h-screen w-full bg-muted/40 dark:bg-muted/20">
          {" "}
          {/* Container Flexbox Utama */}
          {/* AppSidebar akan mengatur lebarnya sendiri berdasarkan state dari useSidebar */}
          <AppSidebar />
          {/* Komponen MainContentArea akan menggunakan flex-grow */}
          <MainContentArea>
            <div className="overflow-hidden ">{children}</div>
          </MainContentArea>
        </div>
      </SidebarProvider>
    </SelectedDeviceProvider>
  );
}
