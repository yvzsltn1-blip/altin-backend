import {
    auth, googleProvider, ADMIN_UIDS, // <-- BURAYA ADMIN_UIDS EKLENDİ
    signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut,
    onAuthStateChanged, signInWithPopup
} from './config.js';
import { state } from './state.js';
import { loadExpensesFromFirebase } from './firebase-data.js';
import { showToast } from './toast.js';

// Auth işlemi devam ediyor mu? (Üst üste tıklamaları engellemek için)
let isProcessingAuth = false;

// ==========================================
// 1. KULLANICI GİRİŞ DURUMU KONTROLÜ
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (isProcessingAuth) return;

    if (user) {
        const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

        // EĞER KULLANICI GOOGLE İLE GİRMEDİYSE VE MAİLİNİ DOĞRULAMADIYSA:
        // Admin kontrolünü buraya da ekliyoruz
const isAdmin = ADMIN_UIDS.includes(user.uid);

// EĞER KULLANICI GOOGLE İLE GİRMEDİYSE VE MAİLİ ONAYLI DEĞİLSE VE ADMİN DEĞİLSE:
if (!isGoogleUser && !user.emailVerified && !isAdmin) {
    await signOut(auth); // Sistemden at
            state.currentUser = null;
            state.loading = false;
            window.render();
            return;
        }

        // Kullanıcı giriş yaptı ve doğrulandı, verileri yükle
        state.currentUser = { uid: user.uid, email: user.email };
        await loadExpensesFromFirebase();
        window.checkAndFixFutureExpenses();
    } else {
        // Çıkış yapıldıysa veya oturum yoksa verileri sıfırla
        state.currentUser = null;
        state.expenses = {};
    }
    state.loading = false;
    window.render();
});

// ==========================================
// 2. GİRİŞ YAP (LOGIN) FONKSİYONU
// ==========================================
window.handleLogin = async function() {
    if (!state.loginForm.email || !state.loginForm.password) return;

    isProcessingAuth = true;
    state.loginError = '';
    window.render();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, state.loginForm.email, state.loginForm.password);

        // Google kullanıcısı değilse doğrulama kontrolü yap
        // Google kullanıcısı değilse ve ADMİN DEĞİLSE doğrulama kontrolü yap
const isGoogleUser = userCredential.user.providerData.some(p => p.providerId === 'google.com');
const isAdmin = ADMIN_UIDS.includes(userCredential.user.uid); // <-- Admin mi diye baktık

// Eğer Google kullanıcısı değilse VE maili doğrulanmadıysa VE admin değilse:
if (!isGoogleUser && !userCredential.user.emailVerified && !isAdmin) {
            await signOut(auth);
            state.loginError = 'Lütfen önce e-posta adresinizi doğrulayın. Gelen kutunuzu (veya Spam/Gereksiz klasörünü) kontrol edin.';
            isProcessingAuth = false;
            window.render();
            return;
        }

        // Başarılı giriş
        state.currentUser = { uid: userCredential.user.uid, email: userCredential.user.email };
        await loadExpensesFromFirebase();

    } catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            state.loginError = 'Email veya şifre hatalı!';
        } else if (error.code === 'auth/too-many-requests') {
            state.loginError = 'Çok fazla deneme yaptınız. Lütfen biraz bekleyip tekrar deneyin.';
        } else {
            state.loginError = 'Giriş yapılamadı: ' + error.message;
        }
    }

    isProcessingAuth = false;
    window.render();
};

// ==========================================
// 3. KAYIT OL (REGISTER) FONKSİYONU
// ==========================================
window.handleRegister = async function() {
    if (!state.loginForm.email || !state.loginForm.password) return;

    if (state.loginForm.password.length < 6) {
        state.loginError = 'Şifre en az 6 karakter olmalı!';
        window.render();
        return;
    }

    state.codeSending = true; // Yükleniyor efekti
    state.loginError = '';
    window.render();

    try {
        // 1. Adım: Kullanıcıyı oluştur
        const userCredential = await createUserWithEmailAndPassword(auth, state.loginForm.email, state.loginForm.password);

        // 2. Adım: Firebase Doğrulama Linki Gönder
        await sendEmailVerification(userCredential.user);

        // 3. Adım: Kullanıcıyı sistemden at (Mailini doğrulamadan giremesin)
        await signOut(auth);

        // 4. Adım: Ekranı temizle ve bilgi ver
        state.isRegistering = false;
        state.loginForm.password = '';
        showToast('📧 Başarılı! E-posta adresinize bir doğrulama linki gönderdik. Tıklayıp hesabınızı aktifleştirin.');

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            state.loginError = 'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.';
        } else if (error.code === 'auth/invalid-email') {
            state.loginError = 'Geçersiz bir e-posta adresi girdiniz.';
        } else {
            state.loginError = 'Hesap oluşturulamadı: ' + error.message;
        }
    }

    state.codeSending = false;
    window.render();
};

// ==========================================
// 4. GOOGLE İLE GİRİŞ FONKSİYONU
// ==========================================
window.handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        state.currentUser = { uid: result.user.uid, email: result.user.email };
        state.loginError = '';
        await loadExpensesFromFirebase();
        window.render();
    } catch (error) {
        console.error("Google Login Hatası:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
            state.loginError = 'Giriş yapılamadı: ' + error.message;
            window.render();
        }
    }
};

// ==========================================
// 5. ÇIKIŞ VE ARAYÜZ YARDIMCI FONKSİYONLARI
// ==========================================
window.handleLogout = async () => {
    await signOut(auth);
    state.currentUser = null;
    state.expenses = {};
    window.render();
};

window.toggleRegister = () => {
    state.isRegistering = !state.isRegistering;
    state.loginError = '';
    window.render();
};

window.toggleDarkMode = () => {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    document.documentElement.classList.toggle('dark', state.darkMode);
    window.render();
};