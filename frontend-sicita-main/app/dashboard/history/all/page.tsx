// app/dashboard/all/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Device } from "@/types/device";
import {
  SensorData,
  FloodAlertData,
  RapidRiseAlertData,
  WaterQualityUpdateData,
  CriticalWaterQualityAlertData,
  DeviceStatusUpdateData,
  RainfallUpdateData,
} from "@/types/sensor";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import { useSelectedDevice } from "../../../../contexts/SelectedDeviceContext";

// Komponen Anak
import PushSubscriptionControls from "../../components/PushSubscriptionControls";
import DeviceDisplayGrid from "../../components/DeviceDisplayGrid";
import DashboardStatsCards from "../../components/DashboardStatsCards";
import GlobalAlertDisplay from "../../components/GlobalAlertDisplay";

// --- (Tipe-tipe data tidak diubah, biarkan seperti aslinya) ---
interface ServerToClientEvents {
  new_sensor_data: (data: SensorData) => void;
  flood_alert: (data: FloodAlertData) => void;
  rapid_rise_alert: (data: RapidRiseAlertData) => void;
  rainfall_update: (data: RainfallUpdateData) => void;
  device_updated: (data: Device) => void;
  device_status_update: (data: DeviceStatusUpdateData) => void;
  water_quality_update: (data: WaterQualityUpdateData) => void;
  critical_water_quality_alert: (data: CriticalWaterQualityAlertData) => void;
}

type RealtimeDataMap = Record<string, Partial<SensorData>>;
type ActiveAlertsMap = Record<string, FloodAlertData | null>;
type ActiveRapidRiseAlertsMap = Record<string, RapidRiseAlertData | null>;
type RainfallStatusMap = Record<string, RainfallUpdateData | null>;
type WaterQualityStatusMap = Record<string, WaterQualityUpdateData | null>;
type ActiveCriticalWaterQualityAlertsMap = Record<
  string,
  CriticalWaterQualityAlertData | null
>;

export default function AllDevicesDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const {
    setAvailableDevices,
    setIsLoadingAvailableDevices,
    setSelectedDeviceId,
  } = useSelectedDevice();

  // --- (Semua state tidak diubah, biarkan seperti aslinya) ---
  const [devices, setDevices] = useState<Device[]>([]);
  const [realtimeData, setRealtimeData] = useState<RealtimeDataMap>({});
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlertsMap>({});
  const [activeRapidRiseAlerts, setActiveRapidRiseAlerts] =
    useState<ActiveRapidRiseAlertsMap>({});
  const [rainfallStatuses, setRainfallStatuses] = useState<RainfallStatusMap>(
    {}
  );
  const [waterQualityStatuses, setWaterQualityStatuses] =
    useState<WaterQualityStatusMap>({});
  const [
    activeCriticalWaterQualityAlerts,
    setActiveCriticalWaterQualityAlerts,
  ] = useState<ActiveCriticalWaterQualityAlertsMap>({});
  const [isLoadingPageData, setIsLoadingPageData] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

  // --- (Semua useEffect untuk logika data fetching dan socket tidak diubah) ---
  useEffect(() => {
    setSelectedDeviceId("all");
  }, [setSelectedDeviceId]);

  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      backendUrl &&
      session?.user?.backendToken
    ) {
      const fetchDevicesList = async () => {
        setIsLoadingPageData(true);
        setIsLoadingAvailableDevices(true);
        setFetchError(null);
        try {
          const response = await fetch(`${backendUrl}/api/devices`, {
            headers: {
              Authorization: `Bearer ${session.user!.backendToken}`,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: `Gagal mengambil daftar perangkat. Status: ${response.status}`,
            }));
            throw new Error(
              errorData.message || "Terjadi kesalahan pada server."
            );
          }
          const fetchedDevices: Device[] = await response.json();
          setDevices(fetchedDevices);
          setAvailableDevices(fetchedDevices);
        } catch (err) {
          console.error("Error fetching devices list:", err);
          setFetchError(
            err instanceof Error ? err.message : "Gagal memuat data perangkat."
          );
          setAvailableDevices([]);
        } finally {
          setIsLoadingPageData(false);
          setIsLoadingAvailableDevices(false);
        }
      };
      fetchDevicesList();
    } else if (sessionStatus === "unauthenticated") {
      setIsLoadingPageData(false);
      setIsLoadingAvailableDevices(false);
      setDevices([]);
      setAvailableDevices([]);
    }
  }, [
    session?.user,
    sessionStatus,
    backendUrl,
    session?.user?.backendToken,
    setAvailableDevices,
    setIsLoadingAvailableDevices,
  ]);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !backendUrl) return;
    const socket: Socket<ServerToClientEvents> = getSocket(
      backendUrl,
      session?.user?.backendToken
    );

    const handleNewSensorData = (data: SensorData) =>
      setRealtimeData((prev) => ({ ...prev, [data.device_id]: data }));
    const handleFloodAlert = (data: FloodAlertData) =>
      setActiveAlerts((prev) => ({ ...prev, [data.deviceId]: data }));
    const handleRapidRiseAlert = (data: RapidRiseAlertData) =>
      setActiveRapidRiseAlerts((prev) => ({ ...prev, [data.deviceId]: data }));
    const handleRainfallUpdate = (data: RainfallUpdateData) =>
      setRainfallStatuses((prev) => ({ ...prev, [data.deviceId]: data }));
    const handleWaterQualityUpdate = (data: WaterQualityUpdateData) => {
      setWaterQualityStatuses((prev) => ({ ...prev, [data.deviceId]: data }));
      if (
        data.qualityCategory !== "Kritis" &&
        data.qualityCategory !== "Buruk"
      ) {
        setActiveCriticalWaterQualityAlerts((prev) => ({
          ...prev,
          [data.deviceId]: null,
        }));
      }
    };
    const handleCriticalWaterQualityAlert = (
      data: CriticalWaterQualityAlertData
    ) => {
      setActiveCriticalWaterQualityAlerts((prev) => ({
        ...prev,
        [data.deviceId]: data,
      }));
    };
    const handleDeviceUpdated = (updatedDevice: Device) => {
      const updateLogic = (prevDevices: Device[]) =>
        prevDevices.map((d) =>
          d.device_id === updatedDevice.device_id ? updatedDevice : d
        );
      setDevices(updateLogic);
      setAvailableDevices(updateLogic);
    };
    const handleDeviceStatusUpdate = (statusUpdate: DeviceStatusUpdateData) => {
      const updateLogic = (prevDevices: Device[]) =>
        prevDevices.map((device) =>
          device.device_id === statusUpdate.deviceId
            ? {
                ...device,
                is_offline: statusUpdate.isOffline,
                location:
                  statusUpdate.location !== undefined
                    ? statusUpdate.location
                    : device.location,
                name:
                  statusUpdate.name !== undefined
                    ? statusUpdate.name
                    : device.name,
              }
            : device
        );
      setDevices(updateLogic);
      setAvailableDevices(updateLogic);
    };

    socket.on("new_sensor_data", handleNewSensorData);
    socket.on("flood_alert", handleFloodAlert);
    socket.on("rapid_rise_alert", handleRapidRiseAlert);
    socket.on("rainfall_update", handleRainfallUpdate);
    socket.on("device_updated", handleDeviceUpdated);
    socket.on("device_status_update", handleDeviceStatusUpdate);
    socket.on("water_quality_update", handleWaterQualityUpdate);
    socket.on("critical_water_quality_alert", handleCriticalWaterQualityAlert);

    return () => {
      socket.off("new_sensor_data", handleNewSensorData);
      socket.off("flood_alert", handleFloodAlert);
      socket.off("rapid_rise_alert", handleRapidRiseAlert);
      socket.off("rainfall_update", handleRainfallUpdate);
      socket.off("device_updated", handleDeviceUpdated);
      socket.off("device_status_update", handleDeviceStatusUpdate);
      socket.off("water_quality_update", handleWaterQualityUpdate);
      socket.off(
        "critical_water_quality_alert",
        handleCriticalWaterQualityAlert
      );
    };
  }, [
    sessionStatus,
    backendUrl,
    session?.user?.backendToken,
    setAvailableDevices,
  ]);

  // ▼▼▼ BAGIAN RENDER (TAMPILAN) YANG DIRAPIKAN ▼▼▼

  // Fungsi untuk merender konten utama agar lebih bersih
  const renderMainContent = () => {
    // 1. Handle state Error
    if (fetchError) {
      return (
        <div className="text-center py-10">
          <p className="text-destructive font-medium mb-1">Terjadi Kesalahan</p>
          <p className="text-muted-foreground">{fetchError}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Silakan coba muat ulang halaman atau hubungi administrator.
          </p>
        </div>
      );
    }

    // 2. Handle state Tidak Ada Perangkat
    if (devices.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10">
          Tidak ada perangkat yang terdaftar atau dapat diakses.
        </p>
      );
    }

    // 3. Tampilkan konten utama jika semua baik-baik saja
    return (
      <div className="flex flex-col gap-8">
        {" "}
        {/* Memberi jarak antar bagian konten */}
        <DashboardStatsCards
          devices={devices}
          activeAlerts={activeAlerts}
          activeCriticalWaterQualityAlerts={activeCriticalWaterQualityAlerts}
        />
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Status Perangkat Individual
          </h2>
          <DeviceDisplayGrid
            devices={devices}
            realtimeData={realtimeData}
            activeAlerts={activeAlerts}
            activeRapidRiseAlerts={activeRapidRiseAlerts}
            rainfallStatuses={rainfallStatuses}
            waterQualityStatuses={waterQualityStatuses}
            activeCriticalWaterQualityAlerts={activeCriticalWaterQualityAlerts}
          />
        </div>
      </div>
    );
  };

  return (
    // Menggunakan `space-y-8` untuk memberi jarak vertikal yang konsisten antar elemen utama
    <main className="container mx-auto p-4 lg:p-6 space-y-8">
      {/* --- Header Halaman --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ringkasan Semua Perangkat
          </h1>
          <p className="text-muted-foreground mt-1">
            Pantau status semua perangkat Anda secara real-time.
          </p>
        </div>
        <div className="flex-shrink-0">
          <PushSubscriptionControls />
        </div>
      </div>

      {/* --- Peringatan Global (Jika Ada) --- */}
      <GlobalAlertDisplay
        activeCriticalWaterQualityAlerts={activeCriticalWaterQualityAlerts}
        devices={devices}
      />

      {/* --- Konten Utama: Loading, Error, atau Data --- */}
      <div>
        {isLoadingPageData ? (
          <p className="text-center text-muted-foreground py-10">
            Memuat data perangkat...
          </p>
        ) : (
          renderMainContent()
        )}
      </div>
    </main>
  );
}
