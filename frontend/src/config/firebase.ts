import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyCdu1Qa6gLovnGvpWm7RKXIuASzEx5mXjo',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'ops-pilot-fcbc7.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'ops-pilot-fcbc7',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'ops-pilot-fcbc7.firebasestorage.app',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '997542591226',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:997542591226:web:f6fd309eeeee8cbed7e743'
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');
githubProvider.addScope('read:user');
