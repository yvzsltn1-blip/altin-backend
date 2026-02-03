import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_UIDS = [
    "eq3Gz056elTc4uv8nT7LjbcSF7I3",
    "zH4fSotT2wONTpjEmLuhEyB1QeU2"
];

// EmailJS Yapılandırması
const EMAILJS_PUBLIC_KEY = "69evAT7YVkcEVLN4E";
const EMAILJS_SERVICE_ID = "service_unomeqi";
const EMAILJS_TEMPLATE_ID = "template_w3zotzc";

const firebaseConfig = {
    apiKey: "AIzaSyCAeEg9FE0xHb4NExWbIPOowrCX13etuPg",
    authDomain: "altin-butce.firebaseapp.com",
    projectId: "altin-butce",
    storageBucket: "altin-butce.firebasestorage.app",
    messagingSenderId: "285997815342",
    appId: "1:285997815342:web:317b2bb0247a4b147071bf",
    measurementId: "G-BVF1EMDJPK"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
enableIndexedDbPersistence(db)
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.log("Çok fazla sekme açık, offline mod sadece tek sekmede çalışır.");
      } else if (err.code == 'unimplemented') {
          console.log("Tarayıcınız offline modu desteklemiyor.");
      }
  });
const googleProvider = new GoogleAuthProvider();
const BACKEND_URL = "https://gold-760939137722.europe-west1.run.app/";

export {
    auth, db, googleProvider, BACKEND_URL, ADMIN_UIDS,
    EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
    // Firebase auth fonksiyonları
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged,
    signInWithPopup, sendEmailVerification, updateEmail, updatePassword,
    reauthenticateWithCredential, EmailAuthProvider,
    // Firebase firestore fonksiyonları
    doc, setDoc, getDoc, deleteDoc
};
