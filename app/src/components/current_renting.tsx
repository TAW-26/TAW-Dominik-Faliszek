import './styles/current_renting.css';
import Card from './common/card';


interface CurrentRentingProps {
  rental: { _id: string; type: string } | null;
}

export default function CurrentRenting({ rental }: CurrentRentingProps) {
  if (!rental) return null;

  return (
    <div className="current-renting-overlay">
      <Card className="active-rental-card">
        <h3>Aktywne wypożyczenie</h3>
        <div className="rental-details">
          <span className="device-icon">{rental.type === 'bike' ? '🚲' : '🛴'}</span>
          <div>
            <p><strong>Typ:</strong> {rental.type === 'bike' ? 'Rower' : 'Hulajnoga'}</p>
            <p><strong>ID:</strong> {rental._id}</p>
          </div>
        </div>
        <p className="hint">Kliknij na stację z wolnym miejscem, aby zwrócić.</p>
      </Card>
    </div>
  );
}