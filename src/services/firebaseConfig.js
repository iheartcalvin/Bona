import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration using Expo Constants or Environment Variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

console.log('Firebase Config Debug:', {
    apiKeyLength: firebaseConfig.apiKey?.length,
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with Long Polling (Fix for Android Emulator)
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
