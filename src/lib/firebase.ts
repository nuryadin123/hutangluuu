// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1sTMLEJUoRziGCekKsYYksVQfIgSFRv8",
  authDomain: "hutang-42718.firebaseapp.com",
  projectId: "hutang-42718",
  storageBucket: "hutang-42718.appspot.com",
  messagingSenderId: "1079155791553",
  appId: "1:1079155791553:web:492ca19aace275f0ad2640"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
