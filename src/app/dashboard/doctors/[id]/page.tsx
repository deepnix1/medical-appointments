'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Doctor, AvailabilityRule, Appointment } from '@/types/firestore';
import { WeeklySchedule } from '@/components/availability/WeeklySchedule';

export default function DoctorDetailPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!id) return;

    // Fetch doctor details
    const doctorRef = doc(db, 'doctors', id as string);
    const unsubscribeDoctor = onSnapshot(doctorRef, (doc) => {
      if (doc.exists()) {
        setDoctor({ id: doc.id, ...doc.data() } as Doctor);
      } else {
        setDoctor(null);
      }
      setLoading(false);
    });

    // Fetch upcoming appointments
    const today = new Date().toISOString().split('T')[0];
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('doctor_id', '==', id),
      where('appointment_date', '>=', today)
    );

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      setAppointments(appointmentsList);
    });

    return () => {
      unsubscribeDoctor();
      unsubscribeAppointments();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-gray-500">Doctor not found</h3>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Dr. {doctor.first_name} {doctor.last_name}
            </h2>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Doctor Information</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Specialty</dt>
                  <dd className="mt-1 text-sm text-gray-900">{doctor.specialty || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        doctor.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {doctor.active ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{doctor.timezone}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Appointment Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">{doctor.slot_length} minutes</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Availability Schedule</h3>
            </div>
            <div className="border-t border-gray-200">
              <WeeklySchedule doctorId={doctor.id} />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Appointments</h3>
            </div>
            <div className="border-t border-gray-200">
              {appointments.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No upcoming appointments</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <li key={appointment.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600">
                            {appointment.patient_phone}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {appointment.appointment_date} at {appointment.appointment_time}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === 'scheduled'
                                ? 'bg-yellow-100 text-yellow-800'
                                : appointment.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
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
      </div>
    </div>
  );
}