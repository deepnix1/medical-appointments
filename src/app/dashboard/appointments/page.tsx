'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteAppointment } from '@/lib/firestore';
import type { Appointment, Doctor } from '@/types/firestore';
import AppointmentForm from '@/components/appointments/AppointmentForm';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ [key: string]: Doctor }>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    date: '',
    doctorId: '',
  });

  useEffect(() => {
    // Fetch doctors for reference
    const unsubscribeDoctors = onSnapshot(
      collection(db, 'doctors'),
      (snapshot) => {
        const doctorsMap: { [key: string]: Doctor } = {};
        snapshot.docs.forEach((doc) => {
          doctorsMap[doc.id] = { id: doc.id, ...doc.data() } as Doctor;
        });
        setDoctors(doctorsMap);
      }
    );

    // Fetch appointments with filters
    let appointmentsQuery = query(
      collection(db, 'appointments'),
      orderBy('appointment_date', 'desc'),
      orderBy('appointment_time', 'desc')
    );

    if (filter.status) {
      appointmentsQuery = query(appointmentsQuery, where('status', '==', filter.status));
    }
    if (filter.date) {
      appointmentsQuery = query(appointmentsQuery, where('appointment_date', '==', filter.date));
    }
    if (filter.doctorId) {
      appointmentsQuery = query(appointmentsQuery, where('doctor_id', '==', filter.doctorId));
    }

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      setAppointments(appointmentsList);
      setLoading(false);
    });

    return () => {
      unsubscribeDoctors();
      unsubscribeAppointments();
    };
  }, [filter]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Randevu durumu güncellenirken hata oluştu:', error);
    }
  };

  const confirmDelete = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (appointmentToDelete && appointmentToDelete.id) {
      try {
        await deleteAppointment(appointmentToDelete.id);
        setShowDeleteModal(false);
        setAppointmentToDelete(null);
      } catch (error) {
        console.error('Randevu silinirken hata oluştu:', error);
        alert('Randevu silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Randevular</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition duration-200"
          >
            <span>+</span>
            <span>Yeni Randevu</span>
          </button>
        </div>

        <div className="mt-4 bg-white shadow sm:rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Durum
              </label>
              <select
                id="status"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Tümü</option>
                <option value="scheduled">Planlandı</option>
                <option value="confirmed">Onaylandı</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Tarih
              </label>
              <input
                type="date"
                id="date"
                value={filter.date}
                onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>

            <div>
              <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                Doktor
              </label>
              <select
                id="doctor"
                value={filter.doctorId}
                onChange={(e) => setFilter({ ...filter, doctorId: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Tümü</option>
                {Object.values(doctors).map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Hasta
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Doktor
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Tarih & Saat
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Durum
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Kaynak
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">İşlemler</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {appointments.map((appointment) => {
                      const doctor = doctors[appointment.doctor_id];
                      return (
                        <tr key={appointment.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div>
                              <div className="font-medium">
                                {appointment.patient_first_name && appointment.patient_last_name 
                                  ? `${appointment.patient_first_name} ${appointment.patient_last_name}`
                                  : appointment.patient_phone
                                }
                              </div>
                              {appointment.patient_first_name && appointment.patient_last_name && (
                                <div className="text-gray-500 text-xs">
                                  {appointment.patient_phone}
                                </div>
                              )}
                              {appointment.patient_tc_number && (
                                <div className="text-gray-500 text-xs">
                                  TC: {appointment.patient_tc_number}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {appointment.appointment_date} • {appointment.appointment_time}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                appointment.status === 'scheduled'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : appointment.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : appointment.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {appointment.status === 'scheduled' && 'Planlandı'}
                              {appointment.status === 'confirmed' && 'Onaylandı'}
                              {appointment.status === 'completed' && 'Tamamlandı'}
                              {appointment.status === 'cancelled' && 'İptal Edildi'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {appointment.source}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              {appointment.status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                    className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded text-xs"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                    className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-xs"
                                  >
                                    İptal Et
                                  </button>
                                </>
                              )}
                              {appointment.status === 'confirmed' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                  className="text-green-600 hover:text-green-900 px-2 py-1 rounded text-xs"
                                >
                                  Tamamla
                                </button>
                              )}
                              <button
                                onClick={() => confirmDelete(appointment)}
                                className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-xs"
                                title="Randevuyu Sil"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Add Appointment Modal */}
        {showAddModal && (
          <AppointmentForm
            onClose={() => setShowAddModal(false)}
            doctors={Object.values(doctors)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && appointmentToDelete && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all scale-100 opacity-100">
              <div className="text-center mb-6">
                <div className="text-red-500 text-6xl mx-auto mb-4">⚠️</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Silme Onayı</h3>
                <p className="text-gray-600 text-lg">
                  Bu randevuyu silmek istediğinizden emin misiniz?
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Hasta:</strong> {
                      appointmentToDelete.patient_first_name && appointmentToDelete.patient_last_name 
                        ? `${appointmentToDelete.patient_first_name} ${appointmentToDelete.patient_last_name}`
                        : appointmentToDelete.patient_phone
                    }
                  </p>
                  {appointmentToDelete.patient_first_name && appointmentToDelete.patient_last_name && (
                    <p className="text-sm text-gray-700">
                      <strong>Telefon:</strong> {appointmentToDelete.patient_phone}
                    </p>
                  )}
                  {appointmentToDelete.patient_tc_number && (
                    <p className="text-sm text-gray-700">
                      <strong>TC Kimlik:</strong> {appointmentToDelete.patient_tc_number}
                    </p>
                  )}
                  <p className="text-sm text-gray-700">
                    <strong>Tarih:</strong> {appointmentToDelete.appointment_date}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Saat:</strong> {appointmentToDelete.appointment_time}
                  </p>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
