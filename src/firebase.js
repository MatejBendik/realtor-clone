// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuOhjNdGaFd92pWCqIrc6LSyg9sd2jqm4",
  authDomain: "realtor-clone-c000f.firebaseapp.com",
  projectId: "realtor-clone-c000f",
  storageBucket: "realtor-clone-c000f.appspot.com",
  messagingSenderId: "952490097686",
  appId: "1:952490097686:web:afdc3a263ea9073c81c937",
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
