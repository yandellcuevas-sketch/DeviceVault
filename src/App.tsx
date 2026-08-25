import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Device } from './types/device';
import { Sidebar, type CurrentView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './views/DashboardView';
import { DevicesGalleryView } from './views/DevicesGalleryView';
import { RegisterDeviceView } from './views/RegisterDeviceView';
import { DeviceProfileView } from './views/DeviceProfileView';
import { ImeiLookupView } from './views/ImeiLookupView';
import { BackupView } from './views/BackupView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Consulta reactiva en tiempo real de todos los dispositivos en IndexedDB
  const devices = useLiveQuery(() => db.devices.toArray(), []) || [];

  // Mantener actualizado el dispositivo seleccionado si cambia en la base de datos
  useEffect(() => {
    if (selectedDevice) {
      const updated = devices.find((d) => d.id === selectedDevice.id);
      if (updated) {
        setSelectedDevice(updated);
      }
    }
  }, [devices, selectedDevice]);

  // Manejo de atajo de teclado Ctrl+K para buscar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCurrentView('imei_lookup');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDeviceSaved = (savedDevice: Device) => {
    setSelectedDevice(savedDevice);
    setEditingDevice(undefined);
    setCurrentView('gallery');
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setCurrentView('register');
  };

  const handleDeleteDevice = async (deviceId: string) => {
    await db.devices.delete(deviceId);
    setSelectedDevice(null);
    setCurrentView('gallery');
  };

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-slate-100 antialiased overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Sidebar de Navegación de Escritorio */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setSelectedDevice(null);
          setEditingDevice(undefined);
          setCurrentView(view);
        }}
        deviceCount={devices.length}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <Header
          currentView={currentView}
          onSearchClick={() => {
            setSelectedDevice(null);
            setCurrentView('imei_lookup');
          }}
          onRegisterClick={() => {
            setSelectedDevice(null);
            setEditingDevice(undefined);
            setCurrentView('register');
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {selectedDevice ? (
            <DeviceProfileView
              device={selectedDevice}
              onBack={() => setSelectedDevice(null)}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDevice}
            />
          ) : currentView === 'dashboard' ? (
            <DashboardView
              devices={devices}
              onNavigate={(view) => setCurrentView(view)}
              onSelectDevice={handleSelectDevice}
            />
          ) : currentView === 'gallery' ? (
            <DevicesGalleryView
              devices={devices}
              onSelectDevice={handleSelectDevice}
              onNavigateToRegister={() => {
                setEditingDevice(undefined);
                setCurrentView('register');
              }}
              initialSearchQuery={searchQuery}
            />
          ) : currentView === 'register' ? (
            <RegisterDeviceView
              editingDevice={editingDevice}
              onSaved={handleDeviceSaved}
              onCancel={() => {
                setEditingDevice(undefined);
                setCurrentView('gallery');
              }}
            />
          ) : currentView === 'imei_lookup' ? (
            <ImeiLookupView
              devices={devices}
              onSelectDevice={handleSelectDevice}
            />
          ) : currentView === 'backup' ? (
            <BackupView
              deviceCount={devices.length}
              onRefresh={() => {}}
            />
          ) : currentView === 'settings' ? (
            <SettingsView
              deviceCount={devices.length}
              onRefresh={() => {}}
            />
          ) : null}
        </main>
      </div>

      {/* Navegación Móvil */}
      <MobileNav
        currentView={currentView}
        onViewChange={(view) => {
          setSelectedDevice(null);
          setEditingDevice(undefined);
          setCurrentView(view);
        }}
      />
    </div>
  );
}
