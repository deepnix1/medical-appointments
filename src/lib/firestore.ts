import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Doctor, AvailabilityRule, AvailabilityException, Appointment } from '../types/firestore';

// Collection references
const COLLECTIONS = {
  doctors: 'doctors',
  availability_rules: 'availability_rules',
  availability_exceptions: 'availability_exceptions',
  appointments: 'appointments',
} as const;

// Doctor operations
export const createDoctor = async (doctorData: Omit<Doctor, 'id' | 'created_at' | 'updated_at'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.doctors), {
    ...doctorData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
};

export const updateDoctor = async (id: string, doctorData: Partial<Doctor>) => {
  const docRef = doc(db, COLLECTIONS.doctors, id);
  await updateDoc(docRef, {
    ...doctorData,
    updated_at: serverTimestamp(),
  });
};

export const deleteDoctor = async (id: string) => {
  // İlk olarak doktorun tüm müsaitlik kurallarını sil
  const rulesQuery = query(
    collection(db, COLLECTIONS.availability_rules),
    where('doctor_id', '==', id)
  );
  const rulesSnapshot = await getDocs(rulesQuery);
  for (const ruleDoc of rulesSnapshot.docs) {
    await deleteDoc(doc(db, COLLECTIONS.availability_rules, ruleDoc.id));
  }

  // Doktorun tüm müsaitlik istisnalarını sil
  const exceptionsQuery = query(
    collection(db, COLLECTIONS.availability_exceptions),
    where('doctor_id', '==', id)
  );
  const exceptionsSnapshot = await getDocs(exceptionsQuery);
  for (const exceptionDoc of exceptionsSnapshot.docs) {
    await deleteDoc(doc(db, COLLECTIONS.availability_exceptions, exceptionDoc.id));
  }

  // Doktorun tüm randevularını iptal et
  const appointmentsQuery = query(
    collection(db, COLLECTIONS.appointments),
    where('doctor_id', '==', id)
  );
  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  for (const appointmentDoc of appointmentsSnapshot.docs) {
    await updateDoc(doc(db, COLLECTIONS.appointments, appointmentDoc.id), {
      status: 'cancelled',
      updated_at: serverTimestamp(),
    });
  }

  // Son olarak doktoru sil
  await deleteDoc(doc(db, COLLECTIONS.doctors, id));
};

// Availability Rule operations
export const createAvailabilityRule = async (ruleData: Omit<AvailabilityRule, 'id' | 'created_at' | 'updated_at'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.availability_rules), {
    ...ruleData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
};

export const updateAvailabilityRule = async (id: string, ruleData: Partial<AvailabilityRule>) => {
  const docRef = doc(db, COLLECTIONS.availability_rules, id);
  await updateDoc(docRef, {
    ...ruleData,
    updated_at: serverTimestamp(),
  });
};

// Availability Exception operations
export const createAvailabilityException = async (exceptionData: Omit<AvailabilityException, 'id' | 'created_at' | 'updated_at'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.availability_exceptions), {
    ...exceptionData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
};

export const updateAvailabilityException = async (id: string, exceptionData: Partial<AvailabilityException>) => {
  const docRef = doc(db, COLLECTIONS.availability_exceptions, id);
  await updateDoc(docRef, {
    ...exceptionData,
    updated_at: serverTimestamp(),
  });
};

// Appointment operations
export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.appointments), {
    ...appointmentData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
};

export const updateAppointment = async (id: string, appointmentData: Partial<Appointment>) => {
  const docRef = doc(db, COLLECTIONS.appointments, id);
  await updateDoc(docRef, {
    ...appointmentData,
    updated_at: serverTimestamp(),
  });
};

export const deleteAppointment = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.appointments, id);
  await deleteDoc(docRef);
};

// Query helpers
export const getDoctorAvailabilityRules = async (doctorId: string) => {
  const q = query(
    collection(db, COLLECTIONS.availability_rules),
    where('doctor_id', '==', doctorId),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDoctorAppointments = async (doctorId: string, date: string) => {
  const q = query(
    collection(db, COLLECTIONS.appointments),
    where('doctor_id', '==', doctorId),
    where('appointment_date', '==', date),
    orderBy('appointment_time', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};