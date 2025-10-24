'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Appointment, Doctor } from '@/types/firestore';

interface AppointmentFormProps {
  onClose: () => void;
  doctors: Doctor[];
}

export default function AppointmentForm({ onClose, doctors }: AppointmentFormProps) {
  const [patientPhone, setPatientPhone] = useState('');
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [patientTcNumber, setPatientTcNumber] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newAppointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'> = {
        patient_phone: patientPhone,
        patient_first_name: patientFirstName,
        patient_last_name: patientLastName,
        patient_tc_number: patientTcNumber,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        duration_minutes: 30, // Default duration
        status: 'scheduled',
        source: 'manual',
        requested_at: new Date() as any, // Will be replaced by serverTimestamp
        raw_payload: {},
      };
      
      await addDoc(collection(db, 'appointments'), {
        ...newAppointment,
        requested_at: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      onClose();
    } catch (err) {
      console.error('Randevu oluşturulurken hata oluştu:', err);
      setError('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Yeni Randevu Oluştur</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="patientFirstName" className="block text-sm font-medium text-gray-700">
                Hasta Adı
              </label>
              <input
                type="text"
                id="patientFirstName"
                value={patientFirstName}
                onChange={(e) => setPatientFirstName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="Ad"
              />
            </div>
            
            <div>
              <label htmlFor="patientLastName" className="block text-sm font-medium text-gray-700">
                Hasta Soyadı
              </label>
              <input
                type="text"
                id="patientLastName"
                value={patientLastName}
                onChange={(e) => setPatientLastName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="Soyad"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700">
                Hasta Telefonu
              </label>
              <input
                type="tel"
                id="patientPhone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="+90 5XX XXX XX XX"
              />
            </div>
            
            <div>
              <label htmlFor="patientTcNumber" className="block text-sm font-medium text-gray-700">
                TC Kimlik No
              </label>
              <input
                type="text"
                id="patientTcNumber"
                value={patientTcNumber}
                onChange={(e) => setPatientTcNumber(e.target.value)}
                required
                maxLength={11}
                pattern="[0-9]{11}"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="12345678901"
              />
            </div>
          </div>

          <div>
            <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700">
              Doktor
            </label>
            <select
              id="doctorId"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            >
              <option value="">Doktor seçin</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty || 'Genel Pratisyen'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
              Randevu Tarihi
            </label>
            <input
              type="date"
              id="appointmentDate"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            />
          </div>

          <div>
            <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700">
              Randevu Saati
            </label>
            <input
              type="time"
              id="appointmentTime"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center justify-center space-x-2 transition duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <span>Randevu Oluştur</span>
              )}
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
