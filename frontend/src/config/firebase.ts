import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyOpsPilotAI2026DummyKey',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'opspilot-ai.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'opspilot-ai',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'opspilot-ai.appspot.com',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
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
