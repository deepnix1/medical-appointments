import { Timestamp } from 'firebase/firestore';

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  timezone: string;
  slot_length: number;
  active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AvailabilityRule {
  id: string;
  doctor_id: string;
  recurrence_type: 'weekly' | 'daily' | 'monthly' | 'single';
  day_of_week?: number;
  date?: string;
  start_time: string;
  end_time: string;
  start_date?: string;
  end_date?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AvailabilityException {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_phone: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_tc_number?: string;
  requested_at: Timestamp;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  source: 'retell_webhook' | 'manual' | 'admin';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  raw_payload: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
}