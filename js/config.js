import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification, // <-- İŞTE BURADA: Doğrulama maili gönderme komutu
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Sadece senin admin UID'lerin (Eski EmailJS kodlarını buradan sildik)
const ADMIN_UIDS = [
    "eq3Gz056elTc4uv8nT7LjbcSF7I3",
    "zH4fSotT2wONTpjEmLuhEyB1QeU2"
];

// Senin Firebase ayarların (Değişmedi)
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

// Çevrimdışı (İnternetsiz) çalışma özelliği
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

// --- DİĞER SAYFALARIN KULLANABİLMESİ İÇİN DIŞA AKTARIYORUZ ---
export {
    auth, db, googleProvider, BACKEND_URL, ADMIN_UIDS,
    // Temel Giriş/Çıkış Fonksiyonları
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendEmailVerification, // <-- Diğer sayfalar kullanabilsin diye dışa aktardık
    signOut, 
    onAuthStateChanged,
    signInWithPopup, 
    // Profil Güncelleme Fonksiyonları
    updateEmail, 
    updatePassword,
    reauthenticateWithCredential, 
    EmailAuthProvider,
    // Veritabanı Fonksiyonları
    doc, setDoc, getDoc, deleteDoc
};