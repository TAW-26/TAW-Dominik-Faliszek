import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import StateFeedback from './common/StateFeedback';
import './styles/global_history.css';

interface GlobalHistoryRecord {
  _id: string;
  userId: string;
  username: string;
  deviceId: string;
  deviceType: string;
  stationName: string;
  eventType: 'RENT' | 'RETURN';
  date: string;
}

export default function GlobalHistory() {
  const [search, setSearch] = useState('');

  const { data: history, loading, error, refetch } = useApi<GlobalHistoryRecord[]>('/api/history/global', []);

  const filteredHistory = history.filter(h =>
    h.userId.includes(search) || h.deviceId.includes(search)
  );

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Historia Globalna</h2>
        <input
          type="text"
          placeholder="Szukaj po ID użytkownika lub pojazdu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          disabled={loading || !!error}
        />
      </div>

      <StateFeedback
        loading={loading}
        error={error}
        isEmpty={history.length === 0}
        emptyMessage="Brak historii wypożyczeń w systemie."
        onRetry={refetch}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Użytkownik</th>
              <th>Akcja</th>
              <th>Pojazd</th>
              <th>Stacja</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map(record => (
              <tr key={record._id}>
                <td>{new Date(record.date).toLocaleString()}</td>
                <td>{record.username} ({record.userId})</td>
                <td>
                   <span className={`badge ${record.eventType.toLowerCase()}`}>
                      {record.eventType === 'RENT' ? 'Wypożyczenie' : 'Zwrot'}
                   </span>
                </td>
                <td>{record.deviceType} ({record.deviceId})</td>
                <td>{record.stationName}</td>
              </tr>
            ))}
            {filteredHistory.length === 0 && history.length > 0 && (
              <tr>
                <td colSpan={5} style={{textAlign: 'center'}}>Brak wyników wyszukiwania dla: "{search}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </StateFeedback>
    </div>
  );
}