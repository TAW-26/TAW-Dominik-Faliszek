import { useState } from 'react';
import { apiFetch } from '../api/client';
import { useApi } from '../hooks/useApi';
import StateFeedback from './common/StateFeedback';
import DeviceForm from './device_form';
import './styles/device_management.css';

interface Device {
  _id: string;
  type: string;
  status: string;
  current_binding?: string;
  binding_type?: string;
}

interface Station {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  username: string;
}

export default function DeviceManagement() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>(undefined);

  const { data: devices, loading, error, refetch } = useApi<Device[]>('/api/device', []);
  const { data: stations } = useApi<Station[]>('/api/station', []);
  const { data: users } = useApi<User[]>('/api/user/name/all', []);

  const handleSave = async (formData: any) => {
    try {
      const basePayload = {
        type: formData.type,
        status: formData.status,
      };

      if (formData._id) {
        await apiFetch(`/api/device/${formData._id}`, {
          method: 'PATCH',
          body: JSON.stringify(basePayload)
        });

        if (formData.stationId !== selectedDevice?.current_binding) {
          await apiFetch(`/api/device/${formData._id}/bind`, {
            method: 'POST',
            body: JSON.stringify({ stationId: formData.stationId || null })
          });
        }
      } else {
        const newDevice = await apiFetch('/api/device/create', {
          method: 'POST',
          body: JSON.stringify(basePayload)
        });
        if (formData.stationId) {
          await apiFetch(`/api/device/${newDevice._id}/bind`, {
            method: 'POST',
            body: JSON.stringify({ stationId: formData.stationId })
          });
        }
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Błąd podczas zapisywania pojazdu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Czy na pewno usunąć urządzenie?')) return;
    try {
      await apiFetch(`/api/device/${id}`, { method: 'DELETE' });
      refetch(); // Zastępuje fetchDevices()
    } catch (err: any) {
      alert(err.message || 'Błąd usuwania');
    }
  };

  const openForm = (device?: Device) => {
    setSelectedDevice(device);
    setModalOpen(true);
  };

  const getStationLabel = (bindingId?: string) => {
    if (!bindingId) return 'Nieznana stacja';
    const station = stations.find(s => s._id === bindingId);
    return station ? `${station.name} (${bindingId})` : `Nieznana stacja (${bindingId})`;
  };

  const getUserLabel = (bindingId?: string) => {
    if (!bindingId) return 'Wypożyczony (Nieznany użytkownik)';
    const user = users.find(u => u._id === bindingId);
    return user ? `Wypożyczony (${user.username} | ${bindingId})` : `Wypożyczony (${bindingId})`;
  };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Zarządzanie Flotą</h2>
        <button className="btn-primary" onClick={() => openForm()} disabled={loading || !!error}>
          + Dodaj pojazd
        </button>
      </div>

      <StateFeedback
        loading={loading}
        error={error}
        isEmpty={devices.length === 0}
        emptyMessage="Brak urządzeń we flocie."
        onRetry={refetch}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Pojazdu</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Aktualna Lokalizacja</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(dev => (
              <tr key={dev._id}>
                <td>{dev._id}</td>
                <td>{dev.type === 'bike' ? 'Rower' : 'Hulajnoga'}</td>
                <td>{dev.status}</td>
                <td>
                  {dev.binding_type === 'station'
                    ? getStationLabel(dev.current_binding)
                    : dev.binding_type === 'user'
                      ? getUserLabel(dev.current_binding)
                      : dev.status === 'maintenance'
                        ? 'W serwisie'
                        : dev.status === 'out_of_order'
                          ? 'Wyłączony z użytku'
                          : 'Magazyn (Brak przypisania)'
                  }
                </td>
                <td>
                  <button onClick={() => openForm({...dev, stationId: dev.current_binding} as any)}>Edytuj</button>
                  <button onClick={() => handleDelete(dev._id)}>Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </StateFeedback>

      {isModalOpen && (
        <DeviceForm
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initialData={selectedDevice}
        />
      )}
    </div>
  );
}