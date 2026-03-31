'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from './firebase'
import type { UserDoc } from '@/types'

interface AuthContextValue {
  user: User | null
  userDoc: UserDoc | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserDoc: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchOrCreateUserDoc(firebaseUser: User): Promise<UserDoc> {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      return snap.data() as UserDoc
    }

    const newDoc: UserDoc = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      role: 'user',
      tier: 'free',
      dailyGenerations: 0,
      dailyRefinements: 0,
      lastGenerationDate: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(ref, {
      ...newDoc,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return newDoc
  }

  async function refreshUserDoc() {
    if (!user) return
    const udoc = await fetchOrCreateUserDoc(user)
    setUserDoc(udoc)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const udoc = await fetchOrCreateUserDoc(firebaseUser)
        setUserDoc(udoc)
      } else {
        setUserDoc(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signUpWithEmail(email: string, password: string, name: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setUserDoc(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshUserDoc,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
