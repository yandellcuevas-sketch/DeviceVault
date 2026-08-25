import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Device } from './types/device';
import type { Accessory } from './types/accessory';
import { Sidebar, type CurrentView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './views/DashboardView';
import { DevicesGalleryView } from './views/DevicesGalleryView';
import { RegisterDeviceView } from './views/RegisterDeviceView';
import { DeviceProfileView } from './views/DeviceProfileView';
import { AccessoriesView } from './views/AccessoriesView';
import { RegisterAccessoryView } from './views/RegisterAccessoryView';
import { AccessoryProfileView } from './views/AccessoryProfileView';
import { ImeiLookupView } from './views/ImeiLookupView';
import { BackupView } from './views/BackupView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>(undefined);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | undefined>(undefined);
  const [preselectedDeviceIdForAccessory, setPreselectedDeviceIdForAccessory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Consulta reactiva en tiempo real de todos los dispositivos y accesorios
  const devices = useLiveQuery(() => db.devices.toArray(), []) || [];
  const accessories = useLiveQuery(() => db.accessories.toArray(), []) || [];

  // Sincronizar seleccionado si cambia en DB
  useEffect(() => {
    if (selectedDevice) {
      const updated = devices.find((d) => d.id === selectedDevice.id);
      if (updated) setSelectedDevice(updated);
    }
  }, [devices, selectedDevice]);

  useEffect(() => {
    if (selectedAccessory) {
      const updated = accessories.find((a) => a.id === selectedAccessory.id);
      if (updated) setSelectedAccessory(updated);
    }
  }, [accessories, selectedAccessory]);

  // Manejo de atajo de teclado Ctrl+K para buscar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSelectedDevice(null);
        setSelectedAccessory(null);
        setCurrentView('imei_lookup');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers para Dispositivos
  const handleDeviceSaved = (savedDevice: Device) => {
    setSelectedDevice(savedDevice);
    setEditingDevice(undefined);
    setCurrentView('gallery');
  };

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(null);
    setSelectedAccessory(null);
    setEditingDevice(device);
    setCurrentView('register');
  };

  const handleDeleteDevice = async (deviceId: string) => {
    await db.devices.delete(deviceId);
    setSelectedDevice(null);
    setCurrentView('gallery');
  };

  const handleSelectDevice = (device: Device) => {
    setSelectedAccessory(null);
    setSelectedDevice(device);
  };

  // Handlers para Accesorios
  const handleAccessorySaved = (savedAccessory: Accessory) => {
    setSelectedAccessory(savedAccessory);
    setEditingAccessory(undefined);
    setPreselectedDeviceIdForAccessory(undefined);
    setCurrentView('accessories');
  };

  const handleEditAccessory = (accessory: Accessory) => {
    setSelectedAccessory(null);
    setSelectedDevice(null);
    setEditingAccessory(accessory);
    setCurrentView('register_accessory');
  };

  const handleDeleteAccessory = async (accessoryId: string) => {
    await db.accessories.delete(accessoryId);
    setSelectedAccessory(null);
    setCurrentView('accessories');
  };

  const handleSelectAccessory = (accessory: Accessory) => {
    setSelectedDevice(null);
    setSelectedAccessory(accessory);
  };

  const handleAddAccessoryForDevice = (deviceId: string) => {
    setSelectedDevice(null);
    setSelectedAccessory(null);
    setEditingAccessory(undefined);
    setPreselectedDeviceIdForAccessory(deviceId);
    setCurrentView('register_accessory');
  };

  const handleNavigate = (view: CurrentView) => {
    setSelectedDevice(null);
    setSelectedAccessory(null);
    setEditingDevice(undefined);
    setEditingAccessory(undefined);
    setPreselectedDeviceIdForAccessory(undefined);
    setCurrentView(view);
  };

  const handleHeaderRegisterClick = () => {
    setSelectedDevice(null);
    setSelectedAccessory(null);
    if (currentView === 'accessories' || currentView === 'register_accessory') {
      setEditingAccessory(undefined);
      setPreselectedDeviceIdForAccessory(undefined);
      setCurrentView('register_accessory');
    } else {
      setEditingDevice(undefined);
      setCurrentView('register');
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-slate-100 antialiased overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Sidebar de Navegacion */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleNavigate}
        deviceCount={devices.length}
        accessoryCount={accessories.length}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <Header
          currentView={currentView}
          onSearchClick={() => {
            setSelectedDevice(null);
            setSelectedAccessory(null);
            setCurrentView('imei_lookup');
          }}
          onRegisterClick={handleHeaderRegisterClick}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {/* Vista de Detalle de Dispositivo */}
          {selectedDevice ? (
            <DeviceProfileView
              device={selectedDevice}
              onBack={() => setSelectedDevice(null)}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDevice}
              onSelectAccessory={handleSelectAccessory}
              onAddAccessoryForDevice={handleAddAccessoryForDevice}
            />
          ) : selectedAccessory ? (
            /* Vista de Detalle de Accesorio */
            <AccessoryProfileView
              accessory={selectedAccessory}
              linkedDevice={
                selectedAccessory.linkedDeviceId
                  ? devices.find((d) => d.id === selectedAccessory.linkedDeviceId)
                  : undefined
              }
              onBack={() => setSelectedAccessory(null)}
              onEdit={handleEditAccessory}
              onDelete={handleDeleteAccessory}
              onViewDevice={handleSelectDevice}
            />
          ) : currentView === 'dashboard' ? (
            <DashboardView
              devices={devices}
              onNavigate={handleNavigate}
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
          ) : currentView === 'accessories' ? (
            <AccessoriesView
              accessories={accessories}
              devices={devices}
              onSelectAccessory={handleSelectAccessory}
              onNavigateToRegister={() => {
                setEditingAccessory(undefined);
                setPreselectedDeviceIdForAccessory(undefined);
                setCurrentView('register_accessory');
              }}
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
          ) : currentView === 'register_accessory' ? (
            <RegisterAccessoryView
              devices={devices}
              editingAccessory={editingAccessory}
              preselectedDeviceId={preselectedDeviceIdForAccessory}
              onSaved={handleAccessorySaved}
              onCancel={() => {
                setEditingAccessory(undefined);
                setPreselectedDeviceIdForAccessory(undefined);
                setCurrentView('accessories');
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

      {/* Navegacion Movil */}
      <MobileNav
        currentView={currentView}
        onViewChange={handleNavigate}
      />
    </div>
  );
}