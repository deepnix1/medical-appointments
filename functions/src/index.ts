import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import { addHours, isBefore, isAfter, format } from 'date-fns';

admin.initializeApp();
const db = admin.firestore();
const phoneUtil = PhoneNumberUtil.getInstance();

interface AppointmentRequest {
  doctor_id: string;
  caller_number: string;
  requested_date: string;
  requested_time: string;
}

const validatePhoneNumber = (phoneNumber: string): string => {
  try {
    const number = phoneUtil.parse(phoneNumber);
    if (!phoneUtil.isValidNumber(number)) {
      throw new Error('Invalid phone number');
    }
    return phoneUtil.format(number, PhoneNumberFormat.E164);
  } catch (error) {
    throw new Error('Invalid phone number format');
  }
};

const validateDateTime = async (
  doctorId: string,
  date: string,
  time: string
): Promise<boolean> => {
  const doctorRef = db.collection('doctors').doc(doctorId);
  const doctor = await doctorRef.get();

  if (!doctor.exists) {
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
  const appointmentsSnapshot = await db
    .collection('appointments')
    .where('doctor_id', '==', doctorId)
    .where('appointment_date', '==', format(requestedDateTime, 'yyyy-MM-dd'))
    .where('appointment_time', '==', format(requestedDateTime, 'HH:mm'))
    .get();

  if (!appointmentsSnapshot.empty) {
    throw new Error('Time slot already booked');
  }

  return true;
};

export const createAppointment = functions.https.onRequest(async (req, res) => {
  try {
    // Verify request method
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    // Verify RetellAI secret
    const retellSecret = functions.config().retell?.secret;
    const providedSecret = req.headers['x-retell-secret'];

    if (!retellSecret || providedSecret !== retellSecret) {
      res.status(401).send('Unauthorized');
      return;
    }

    const {
      doctor_id,
      caller_number,
      requested_date,
      requested_time,
    } = req.body as AppointmentRequest;

    // Validate required fields
    if (!doctor_id || !caller_number || !requested_date || !requested_time) {
      res.status(400).send('Missing required fields');
      return;
    }

    // Normalize phone number
    const normalizedPhone = validatePhoneNumber(caller_number);

    // Validate appointment time
    await validateDateTime(doctor_id, requested_date, requested_time);

    // Create appointment using transaction
    const appointmentRef = db.collection('appointments').doc();
    await db.runTransaction(async (transaction) => {
      // Check again for double booking within transaction
      const conflictingAppointments = await transaction.get(
        db.collection('appointments')
          .where('doctor_id', '==', doctor_id)
          .where('appointment_date', '==', requested_date)
          .where('appointment_time', '==', requested_time)
      );

      if (!conflictingAppointments.empty) {
        throw new Error('Time slot already booked');
      }

      // Create the appointment
      transaction.set(appointmentRef, {
        doctor_id,
        patient_phone: normalizedPhone,
        appointment_date: requested_date,
        appointment_time: requested_time,
        duration_minutes: 15, // Default duration
        status: 'scheduled',
        source: 'retell_webhook',
        raw_payload: req.body,
        requested_at: admin.firestore.FieldValue.serverTimestamp(),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({
      status: 'accepted',
      appointment_id: appointmentRef.id,
      booked_date: requested_date,
      booked_time: requested_time,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

export const cancelAppointment = functions.https.onRequest(async (req, res) => {
  try {
    // Verify request method
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    // Verify RetellAI secret
    const retellSecret = functions.config().retell?.secret;
    const providedSecret = req.headers['x-retell-secret'];

    if (!retellSecret || providedSecret !== retellSecret) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { appointment_id } = req.body;

    if (!appointment_id) {
      res.status(400).send('Missing appointment ID');
      return;
    }

    const appointmentRef = db.collection('appointments').doc(appointment_id);
    const appointment = await appointmentRef.get();

    if (!appointment.exists) {
      res.status(404).send('Appointment not found');
      return;
    }

    await appointmentRef.update({
      status: 'cancelled',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});