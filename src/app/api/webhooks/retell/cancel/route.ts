import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

    const body = await request.json();
    const { appointment_id } = body;

    if (!appointment_id) {
      return NextResponse.json(
        { error: 'Missing appointment ID' },
        { status: 400 }
      );
    }

    const appointmentRef = doc(db, 'appointments', appointment_id);
    const appointmentSnap = await getDoc(appointmentRef);

    if (!appointmentSnap.exists()) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    await updateDoc(appointmentRef, {
      status: 'cancelled',
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({
      status: 'success',
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 400 }
    );
  }
}
