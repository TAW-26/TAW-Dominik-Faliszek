import React, { useState } from 'react';
import Modal from './common/modal';
import "./styles/station_form.css"

interface StationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (station: any) => void;
  initialData?: any;
}

export default function StationForm({ isOpen, onClose, onSave, initialData }: StationFormProps) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    status: 'active',
    capacity: 10,
    lat: '',
    lon: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal title={initialData ? "Edytuj Stację" : "Dodaj Stację"} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-group">
        <label>
          Nazwa stacji:
          <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </label>
        <label>
          Status:
          <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} required>
            <option value="active">Aktywna</option>
            <option value="inactive">Nieaktywna</option>
          </select>
        </label>
        <label>
          Pojemność:
          <input type="number" min="1" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} required />
        </label>
        <label>
          Szerokość geograficzna (Lat):
          <input type="number" step="any" value={formData.lat} onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })} required />
        </label>
        <label>
          Długość geograficzna (Lon):
          <input type="number" step="any" value={formData.lon} onChange={e => setFormData({ ...formData, lon: parseFloat(e.target.value) })} required />
        </label>
        <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>Zapisz</button>
      </form>
    </Modal>
  );
}