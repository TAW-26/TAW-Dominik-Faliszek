import { useState } from 'react';
import { apiFetch } from '../api/client';
import { useApi } from '../hooks/useApi';
import StateFeedback from './common/StateFeedback';
import StationForm from './station_form';
import './styles/station_management.css';

interface Station {
  _id: string;
  name: string;
  status: string;
  capacity: number;
  lon: number;
  lat: number;
  device_count?: number;
}

export default function StationManagement() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | undefined>(undefined);

  const { data: stations, loading, error, refetch } = useApi<Station[]>('/api/station', []);


  const handleSave = async (formData: any) => {
    try {
      if (formData._id) {
        await apiFetch(`/api/station/${formData._id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            capacity: formData.capacity,
            status: formData.status
          })
        });
      } else {
        await apiFetch('/api/station/create', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Błąd podczas zapisywania stacji');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć stację?')) return;
    try {
      await apiFetch(`/api/station/${id}`, { method: 'DELETE' });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Nie można usunąć stacji. Upewnij się, że nie ma na niej urządzeń.');
    }
  };

  const openForm = (station?: Station) => {
    setSelectedStation(station);
    setModalOpen(true);
  };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Zarządzanie Stacjami</h2>
        <button className="btn-primary" onClick={() => openForm()} disabled={loading || !!error}>
          + Dodaj stację
        </button>
      </div>

      <StateFeedback
        loading={loading}
        error={error}
        isEmpty={stations.length === 0}
        emptyMessage="Nie dodano jeszcze żadnych stacji do systemu."
        onRetry={refetch}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nazwa</th>
              <th>Status</th>
              <th>Pojemność</th>
              <th>Urządzenia</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {stations.map(st => (
              <tr key={st._id}>
                <td>{st._id}</td>
                <td>{st.name}</td>
                <td>{st.status}</td>
                <td>{st.capacity}</td>
                <td>{st.device_count || 0}</td>
                <td>
                  <button onClick={() => openForm(st)}>Edytuj</button>
                  <button onClick={() => handleDelete(st._id)}>Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </StateFeedback>

      {isModalOpen && (
        <StationForm
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initialData={selectedStation}
        />
      )}
    </div>
  );
}