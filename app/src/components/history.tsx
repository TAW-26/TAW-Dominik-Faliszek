import { useApi } from '../hooks/useApi';
import Modal from './common/modal';
import StateFeedback from './common/StateFeedback';
import './styles/history.css';

interface HistoryRecord {
  _id: string;
  date: string;
  deviceType: string;
  deviceId: string;
  stationName: string;
  eventType: 'RENT' | 'RETURN';
}

interface HistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryProps) {
  const { data: history, loading, error, refetch } = useApi<HistoryRecord[]>('/api/history/user', []);

  return (
    <Modal title="Moja Historia" isOpen={isOpen} onClose={onClose}>
      <div className="history-table-container">
        <StateFeedback
          loading={loading}
          error={error}
          isEmpty={history.length === 0}
          emptyMessage="Brak historii wypożyczeń."
          onRetry={refetch}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Wydarzenie</th>
                <th>Typ pojazdu</th>
                <th>ID Pojazdu</th>
                <th>Stacja</th>
              </tr>
            </thead>
            <tbody>
              {history.map(record => (
                <tr key={record._id}>
                  <td>{new Date(record.date).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${record.eventType.toLowerCase()}`}>
                      {record.eventType === 'RENT' ? 'Wypożyczenie' : 'Zwrot'}
                    </span>
                  </td>
                  <td>{record.deviceType === 'bike' ? 'Rower' : 'Hulajnoga'}</td>
                  <td>{record.deviceId}</td>
                  <td>{record.stationName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StateFeedback>
      </div>
    </Modal>
  );
}