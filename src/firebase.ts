import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCDlirRQWxM0XtvUdnrK1OLGmAzi22N-dI",
  authDomain: "chanwoo-ab6d2.firebaseapp.com",
  databaseURL: "https://chanwoo-ab6d2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chanwoo-ab6d2",
  storageBucket: "chanwoo-ab6d2.firebasestorage.app",
  messagingSenderId: "911033556778",
  appId: "1:911033556778:web:c1b6a15eebb4e2eb434853",
  measurementId: "G-F5F10TT2JC"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
