'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment } from '@/types/firestore';

export default function DashboardPage() {
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'appointments'),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      
      setRecentAppointments(appointments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Panel
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          {/* Son Randevular */}
          <div className="md:col-span-2">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Son Randevular
                </h3>
              </div>
              <div className="border-t border-gray-200">
                {loading ? (
                  <div className="p-4 text-center">Yükleniyor...</div>
                ) : recentAppointments.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Henüz randevu yok
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {recentAppointments.map((appointment) => (
                      <li key={appointment.id} className="px-4 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-600">
                              {appointment.patient_phone}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {appointment.appointment_date} •{' '}
                              {appointment.appointment_time}
                            </p>
                          </div>
                          <div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'scheduled'
                                ? 'bg-yellow-100 text-yellow-800'
                                : appointment.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Hızlı İstatistikler */}
          <div className="mt-8 md:mt-0">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Hızlı İstatistikler
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5">
                <dl className="grid grid-cols-1 gap-5">
                  <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bugünkü Randevular
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {recentAppointments.filter(
                        (a) => a.appointment_date === new Date().toISOString().split('T')[0]
                      ).length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
