import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export const setUserRole = functions.https.onCall(async (data, context) => {
  // Only admins can set roles
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set user roles'
    );
  }

  const { uid, role } = data;
  if (!uid || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid and role are required'
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error setting user role');
  }
});
