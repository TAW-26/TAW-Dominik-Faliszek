import Modal from './common/modal';
import './styles/device_details.css';

interface DeviceDetailsProps {
  device: { _id: string; type: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onRent: (id: string) => void;
}

export default function DeviceDetails({ device, isOpen, onClose, onRent }: DeviceDetailsProps) {
  if (!device) return null;

  return (
    <Modal title="Szczegóły pojazdu" isOpen={isOpen} onClose={onClose}>
      <div className="device-details-content">
        <div className="device-graphic">
          {device.type === 'bike' ? '🚲' : '🛴'}
        </div>
        <div className="device-info">
          <p><strong>Typ:</strong> {device.type === 'bike' ? 'Rower' : 'Hulajnoga'}</p>
          <p><strong>ID Urządzenia:</strong> <code>{device._id}</code></p>
        </div>
        <div className="device-actions">
          <button className="btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn-primary rent-btn" onClick={() => onRent(device._id)}>Wypożycz</button>
        </div>
      </div>
    </Modal>
  );
}