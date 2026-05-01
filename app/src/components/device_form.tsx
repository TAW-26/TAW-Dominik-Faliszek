import React, { useState, useEffect } from 'react';
import Modal from './common/modal';
import { apiFetch } from '../api/client';
import "./styles/device_form.css"

interface Station {
  _id: string;
  name: string;
  capacity: number;
  device_count: number;
}

interface DeviceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: any) => void;
  initialData?: any;
}

export default function DeviceForm({ isOpen, onClose, onSave, initialData }: DeviceFormProps) {
  const [availableStations, setAvailableStations] = useState<Station[]>([]);
  const [formData, setFormData] = useState(initialData || {
    type: 'bike',
    status: 'available',
    stationId: ''
  });

  useEffect(() => {
    apiFetch('/api/station/available')
      .then((data: Station[]) => {
        setAvailableStations(data);
      })
      .catch((err) => {
        console.error("Failed to fetch available stations:", err);
        setAvailableStations([]);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal title={initialData ? "Edytuj Pojazd" : "Dodaj Pojazd"} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-group">
        <label>
          Typ pojazdu:
          <select
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="bike">Rower</option>
            <option value="scooter">Hulajnoga</option>
          </select>
        </label>

        <label>
          Status:
          <select
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="available">Dostępny</option>
            <option value="maintenance">W serwisie</option>
            <option value="out_of_order">Wyłączony z użytku</option>
          </select>
        </label>

        <label>
          Lokalizacja (Stacja z wolnym miejscem):
          <select
            value={formData.stationId}
            onChange={e => setFormData({ ...formData, stationId: e.target.value })}
          >
            <option value="">-- Brak przypisania (Magazyn / Serwis) --</option>
            {availableStations.map(s => (
              <option key={s._id} value={s._id}>
                {s.name} (Dostępne sloty: {s.capacity - (s.device_count || 0)})
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Anuluj</button>
          <button type="submit" className="btn-primary">Zapisz Pojazd</button>
        </div>
      </form>
    </Modal>
  );
}