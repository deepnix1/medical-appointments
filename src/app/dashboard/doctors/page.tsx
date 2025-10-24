'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Doctor } from '@/types/firestore';
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaSpinner, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import DoctorForm from '@/components/doctors/DoctorForm';
import { deleteDoctor } from '@/lib/firestore';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'doctors'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const doctorsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Doctor[];
      setDoctors(doctorsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleActive = async (doctor: Doctor) => {
    if (!doctor.id) return;
    const doctorRef = doc(db, 'doctors', doctor.id);
    await updateDoc(doctorRef, { active: !doctor.active });
  };

  const confirmDelete = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (doctorToDelete && doctorToDelete.id) {
      try {
        await deleteDoctor(doctorToDelete.id);
        setShowDeleteModal(false);
        setDoctorToDelete(null);
      } catch (error) {
        console.error('Doktor silinirken hata:', error);
        alert('Doktor silinirken hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
      </div>
    );
  }

  const filteredDoctors = doctors.filter((d) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (d.specialty || '').toLowerCase().includes(term) ||
      (d.timezone || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Doktorlar</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="İsim, uzmanlık veya saat dilimi ile ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2"
          >
            <FaPlus />
            <span>Doktor Ekle</span>
          </button>
        </div>
      </div>

      {showAddModal && <DoctorForm onClose={() => setShowAddModal(false)} />}

      {filteredDoctors.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-600">Doktor bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uzmanlık</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Randevu Süresi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saat Dilimi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {doctor.first_name} {doctor.last_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {doctor.specialty || 'Pratisyen Hekim'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doctor.slot_length} dk</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doctor.timezone}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doctor.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {doctor.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDoctor(doctor)}
                          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                        >
                          Detaylar
                        </button>
                        <button
                          onClick={() => handleToggleActive(doctor)}
                          className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 ${
                            doctor.active ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {doctor.active ? <FaToggleOff /> : <FaToggleOn />}
                          {doctor.active ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>
                        <button
                          onClick={() => confirmDelete(doctor)}
                          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-1"
                        >
                          <FaTrash />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDeleteModal && doctorToDelete && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all scale-100 opacity-100">
            <div className="text-center mb-6">
              <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Silme Onayı</h3>
              <p className="text-gray-600 text-lg">
                Dr. <span className="font-semibold">{doctorToDelete.first_name} {doctorToDelete.last_name}</span> silinsin mi?
              </p>
              <p className="text-red-500 text-sm mt-3 font-medium">Bu işlem geri alınamaz ve ayrıca:</p>
              <ul className="text-red-400 text-sm list-disc list-inside mt-2 text-left mx-auto max-w-xs">
                <li>İlgili tüm uygunluk kuralları silinir</li>
                <li>İlgili tüm istisnalar silinir</li>
                <li>Planlı randevular iptal edilir</li>
              </ul>
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

      {selectedDoctor && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Doktor Detayı</h2>
            <div className="space-y-3 text-gray-700">
              <div><span className="font-medium">Ad Soyad:</span> {selectedDoctor.first_name} {selectedDoctor.last_name}</div>
              <div><span className="font-medium">Uzmanlık:</span> {selectedDoctor.specialty || 'Pratisyen Hekim'}</div>
              <div><span className="font-medium">Randevu süresi:</span> {selectedDoctor.slot_length} dk</div>
              <div><span className="font-medium">Saat dilimi:</span> {selectedDoctor.timezone}</div>
              <div>
                <span className="font-medium">Durum:</span>{' '}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedDoctor.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {selectedDoctor.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}