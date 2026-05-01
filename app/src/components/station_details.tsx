import './styles/station_details.css';

interface Device {
  _id: string;
  type: string;
}

interface Station {
  _id: string;
  name: string;
  capacity: number;
}

interface StationDetailsProps {
  station: Station;
  devices: Device[];
  onDeviceClick: (device: Device) => void;
  onReturnClick?: () => void;
  hasActiveRental: boolean;
}

export default function StationDetails({ station, devices, onDeviceClick, onReturnClick, hasActiveRental }: StationDetailsProps) {
  const freeSpaces = station.capacity - devices.length;

  return (
    <div className="station-sidebar">
      <div className="sidebar-header">
        <h3>{station.name}</h3>
        <div className="capacity-badge">
          Wolne miejsca: {freeSpaces} / {station.capacity}
        </div>
      </div>

      {hasActiveRental ? (
        <div className="return-section">
          {freeSpaces > 0 ? (
            <button className="btn-primary btn-large" onClick={onReturnClick}>
              Zwróć pojazd na tej stacji
            </button>
          ) : (
            <div className="error-message">Brak wolnych miejsc na tej stacji.</div>
          )}
        </div>
      ) : (
        <div className="device-list">
          <h4>Dostępne pojazdy ({devices.length}):</h4>
          {devices.length === 0 ? (
            <p className="empty-state">Brak dostępnych pojazdów na tej stacji.</p>
          ) : (
            devices.map(device => (
              <div key={device._id} className="device-list-item" onClick={() => onDeviceClick(device)}>
                <span className="icon">{device.type === 'bike' ? '🚲' : '🛴'}</span>
                <span className="id">ID: {device._id.substring(0, 8)}...</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}