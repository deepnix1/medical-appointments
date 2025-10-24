import { NextResponse } from 'next/server';
import { addHours, isBefore, isAfter, format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface AppointmentRequest {
  doctor_id: string;
  caller_number: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_tc_number?: string;
  requested_date: string;
  requested_time: string;
}

const validatePhoneNumber = (phoneNumber: string): string => {
  // Simple phone number validation and normalization
  const cleaned = phoneNumber.replace(/\D/g, ''); // Remove non-digits
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error('Invalid phone number length');
  }
  
  // Add + prefix if not present
  return phoneNumber.startsWith('+') ? phoneNumber : `+${cleaned}`;
};

const validateDateTime = async (
  doctorId: string,
  date: string,
  time: string
): Promise<boolean> => {
  const doctorRef = doc(db, 'doctors', doctorId);
  const doctorSnap = await getDocs(query(collection(db, 'doctors'), where('id', '==', doctorId)));

  if (doctorSnap.empty) {
    throw new Error('Doctor not found');
  }

  // Convert requested time to UTC for comparison
  const requestedDateTime = new Date(`${date}T${time}`);

  if (isNaN(requestedDateTime.getTime())) {
    throw new Error('Invalid date or time format');
  }

  // Check if booking is too soon or too far in future
  const now = new Date();
  if (isBefore(requestedDateTime, addHours(now, 1))) {
    throw new Error('Booking must be at least 1 hour in advance');
  }

  if (isAfter(requestedDateTime, addHours(now, 90 * 24))) {
    throw new Error('Booking cannot be more than 90 days in advance');
  }

  // Check existing appointments
  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('doctor_id', '==', doctorId),
    where('appointment_date', '==', format(requestedDateTime, 'yyyy-MM-dd')),
    where('appointment_time', '==', format(requestedDateTime, 'HH:mm'))
  );

  const appointmentsSnap = await getDocs(appointmentsQuery);

  if (!appointmentsSnap.empty) {
    throw new Error('Time slot already booked');
  }

  return true;
};

export async function POST(request: Request) {
  try {
    // Verify RetellAI secret
    const retellSecret = process.env.RETELL_WEBHOOK_SECRET;
    const providedSecret = request.headers.get('x-retell-secret');

    if (!retellSecret || providedSecret !== retellSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as AppointmentRequest;
    const { 
      doctor_id, 
      caller_number, 
      patient_first_name,
      patient_last_name,
      patient_tc_number,
      requested_date, 
      requested_time 
    } = body;

    // Validate required fields
    if (!doctor_id || !caller_number || !requested_date || !requested_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = validatePhoneNumber(caller_number);

    // Validate appointment time
    await validateDateTime(doctor_id, requested_date, requested_time);

    // Create appointment using transaction
    const appointmentRef = doc(collection(db, 'appointments'));
    await runTransaction(db, async (transaction) => {
      // Check again for double booking within transaction
      const conflictingAppointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctor_id', '==', doctor_id),
        where('appointment_date', '==', requested_date),
        where('appointment_time', '==', requested_time)
      );

      const conflictingAppointments = await getDocs(conflictingAppointmentsQuery);

      if (!conflictingAppointments.empty) {
        throw new Error('Time slot already booked');
      }

      // Create the appointment
      transaction.set(appointmentRef, {
        doctor_id,
        patient_phone: normalizedPhone,
        patient_first_name: patient_first_name || null,
        patient_last_name: patient_last_name || null,
        patient_tc_number: patient_tc_number || null,
        appointment_date: requested_date,
        appointment_time: requested_time,
        duration_minutes: 15, // Default duration
        status: 'scheduled',
        source: 'retell_webhook',
        raw_payload: body,
        requested_at: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    });

    return NextResponse.json({
      status: 'accepted',
      appointment_id: appointmentRef.id,
      booked_date: requested_date,
      booked_time: requested_time,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 400 }
    );
  }
}
