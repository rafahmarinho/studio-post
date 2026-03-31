import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })

export const adminDb = getFirestore(app)
export const adminStorage = getStorage(app)
