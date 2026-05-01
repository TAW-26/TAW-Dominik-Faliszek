import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiFetch } from '../api/client';
import { useApi } from '../hooks/useApi';
import StationDetails from './station_details';
import DeviceDetails from './device_details';
import CurrentRenting from './current_renting';
import StateFeedback from './common/StateFeedback';
import 'leaflet/dist/leaflet.css';
import './styles/map.css';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type Station = { _id: string; name: string; lat: number; lon: number; capacity: number; status: string };
type Device = { _id: string; type: string; status: string };

export default function MapComponent() {
  const {
    data: stations,
    loading: stationsLoading,
    error: stationsError,
    refetch: refetchStations
  } = useApi<Station[]>('/api/station', []);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeRental, setActiveRental] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isDeviceModalOpen, setDeviceModalOpen] = useState(false);

  useEffect(() => {

    apiFetch('/api/device/active')
      .then((device) => {
        if (device && device._id) {
          setActiveRental(device);
        }
      })
      .catch((err) => {
        console.error("Brak aktywnego wypożyczenia lub błąd pobierania:", err);
      });
  }, []);

  const handleStationSelect = async (station: Station) => {
    setSelectedStation(station);
      try {
        const data = await apiFetch(`/api/device/${station._id}`);
        setDevices(data);
      } catch (e) {
        setDevices([]);
      }
  };

  const rentDevice = async (deviceId: string) => {
    try {
      await apiFetch(`/api/device/${deviceId}/rent`, { method: 'POST' });
      setActiveRental(devices.find(d => d._id === deviceId) || null);
      setDeviceModalOpen(false);
      setDevices(prev => prev.filter(d => d._id !== deviceId));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const returnDevice = async () => {
    if (!selectedStation || !activeRental) return;
    try {
      await apiFetch(`/api/device/${activeRental._id}/return`, {
        method: 'POST',
        body: JSON.stringify({ stationId: selectedStation._id })
      });
      setActiveRental(null);
      const updated = await apiFetch(`/api/device/${selectedStation._id}`);
      setDevices(updated);
      refetchStations();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (stationsLoading || stationsError) {
    return (
      <div className="map-view" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }}>
        <StateFeedback
          loading={stationsLoading}
          error={stationsError}
          isEmpty={false}
          onRetry={refetchStations}
        >
          <div />
        </StateFeedback>
      </div>
    );
  }

  return (
    <div className="map-view">
      <CurrentRenting rental={activeRental} />

      <MapContainer center={[52.2297, 21.0122]} zoom={13} className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map(st => (
          <Marker
            key={st._id}
            position={[st.lat, st.lon]}
            eventHandlers={{ click: () => handleStationSelect(st) }}
          >
            <Popup>{st.name}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedStation && (
        <StationDetails
          station={selectedStation}
          devices={devices}
          onDeviceClick={(d) => { setSelectedDevice(d); setDeviceModalOpen(true); }}
          onReturnClick={returnDevice}
          hasActiveRental={!!activeRental}
        />
      )}

      <DeviceDetails
        isOpen={isDeviceModalOpen}
        device={selectedDevice}
        onClose={() => setDeviceModalOpen(false)}
        onRent={rentDevice}
      />
    </div>
  );
}