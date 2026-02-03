import {
    auth, db, googleProvider, doc, getDoc, setDoc,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
    onAuthStateChanged, signInWithPopup,
    EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID
} from './config.js';
import { state } from './state.js';
import { loadExpensesFromFirebase } from './firebase-data.js';
import { showToast } from './toast.js';

// Auth işlemi devam ediyor mu? (Yarış durumunu önlemek için)
let isProcessingAuth = false;

// --- AUTH ---
onAuthStateChanged(auth, async (user) => {
    if (isProcessingAuth) {
        return;
    }

    if (user) {
        const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

        if (!isGoogleUser) {
            try {
                const verificationDoc = await getDoc(doc(db, "verified_users", user.uid));

                if (!verificationDoc.exists() || !verificationDoc.data().verified) {
                    state.currentUser = null;
                    state.loading = false;
                    window.render();
                    return;
                }
            } catch (e) {
                console.error('Doğrulama kontrolü hatası:', e);
            }
        }

        state.currentUser = { uid: user.uid, email: user.email };
        state.pendingVerification = false;
        await loadExpensesFromFirebase();
        window.checkAndFixFutureExpenses();
    } else {
        state.currentUser = null;
        state.expenses = {};
    }
    state.loading = false;
    window.render();
});

window.handleLogin = async function() {
    if (!state.loginForm.email || !state.loginForm.password) return;

    isProcessingAuth = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, state.loginForm.email, state.loginForm.password);

        const isGoogleUser = userCredential.user.providerData.some(p => p.providerId === 'google.com');

        if (!isGoogleUser) {
            const verificationDoc = await getDoc(doc(db, "verified_users", userCredential.user.uid));

            if (!verificationDoc.exists() || !verificationDoc.data().verified) {
                await signOut(auth);
                state.loginError = 'Email doğrulaması tamamlanmamış. Lütfen önce kayıt olun.';
                isProcessingAuth = false;
                window.render();
                return;
            }
        }

        state.currentUser = { uid: userCredential.user.uid, email: userCredential.user.email };
        state.loginError = '';
        await loadExpensesFromFirebase();

    } catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            state.loginError = 'Email veya şifre hatalı';
        } else {
            state.loginError = 'Giriş yapılamadı: ' + error.message;
        }
    }

    isProcessingAuth = false;
    window.render();
};

// 4 Haneli kod gönderme fonksiyonu
async function sendVerificationCode(email) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    try {
        emailjs.init(EMAILJS_PUBLIC_KEY);

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            verification_code: code,
            to_name: email.split('@')[0]
        });

        return code;
    } catch (error) {
        console.error('EmailJS hatası:', error);
        throw new Error('Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
    }
}

let timerInterval = null;

function startVerificationTimer() {
    if (timerInterval) clearInterval(timerInterval);

    updateTimerUI();

    timerInterval = setInterval(() => {
        const now = Date.now();

        if (now > state.codeExpiry) {
            clearInterval(timerInterval);
            window.render();
            return;
        }

        updateTimerUI();
    }, 1000);
}

function updateTimerUI() {
    const timerElement = document.querySelector('[data-timer]');
    if (!timerElement) return;

    const remaining = Math.max(0, Math.floor((state.codeExpiry - Date.now()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;

    timerElement.className = remaining < 60 ? 'font-mono font-bold text-red-500' : 'font-mono font-bold text-amber-500';
    timerElement.textContent = timeDisplay;
}

window.handleRegister = async function() {
    if (!state.loginForm.email || !state.loginForm.password) return;

    if (state.loginForm.password.length < 6) {
        state.loginError = 'Şifre en az 6 karakter olmalı';
        window.render();
        return;
    }

    state.codeSending = true;
    state.loginError = '';
    window.render();

    try {
        const code = await sendVerificationCode(state.loginForm.email);

        state.verificationEmail = state.loginForm.email;
        state.tempPassword = state.loginForm.password;
        state.verificationCode = code;
        state.codeExpiry = Date.now() + (3 * 60 * 1000);
        state.codeInput = ['', '', '', ''];
        state.pendingVerification = true;
        state.codeSending = false;

        showToast('📧 Doğrulama kodu gönderildi!');

        window.render();
        startVerificationTimer();

    } catch (error) {
        state.loginError = error.message;
        state.codeSending = false;
        window.render();
    }
};

window.handleCodeInput = function(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);

    state.codeInput[index] = digit;

    const currentInput = document.getElementById(`code-input-${index}`);
    if (currentInput) {
        currentInput.value = digit;
    }

    if (digit && index < 3) {
        const nextInput = document.getElementById(`code-input-${index + 1}`);
        if (nextInput) {
            nextInput.focus();
        }
    }
};

window.handleCodeKeydown = function(index, event) {
    if (event.key === 'Backspace' && !state.codeInput[index] && index > 0) {
        setTimeout(() => {
            document.getElementById(`code-input-${index - 1}`)?.focus();
        }, 0);
    }
};

window.verifyCode = async function() {
    const enteredCode = state.codeInput.join('');

    if (enteredCode.length !== 4) {
        state.loginError = 'Lütfen 4 haneli kodu girin';
        window.render();
        return;
    }

    if (Date.now() > state.codeExpiry) {
        state.loginError = 'Kodun süresi doldu. Lütfen yeni kod isteyin.';
        window.render();
        return;
    }

    if (enteredCode !== state.verificationCode) {
        state.loginError = 'Hatalı kod. Lütfen tekrar deneyin.';
        state.codeInput = ['', '', '', ''];
        window.render();
        setTimeout(() => {
            document.getElementById('code-input-0')?.focus();
        }, 100);
        return;
    }

    isProcessingAuth = true;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, state.verificationEmail, state.tempPassword);

        await setDoc(doc(db, "verified_users", userCredential.user.uid), {
            email: state.verificationEmail,
            verified: true,
            verifiedAt: new Date().toISOString()
        });

        state.currentUser = { uid: userCredential.user.uid, email: state.verificationEmail };
        state.pendingVerification = false;
        state.verificationCode = '';
        state.tempPassword = '';
        state.loginError = '';
        showToast('✅ Hesabınız oluşturuldu!');

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            state.loginError = 'Bu email zaten kayıtlı. Giriş yapmayı deneyin.';
        } else {
            state.loginError = 'Hesap oluşturulamadı: ' + error.message;
        }
        state.pendingVerification = false;
    }

    isProcessingAuth = false;
    window.render();
};

window.resendVerificationCode = async function() {
    state.codeSending = true;
    state.loginError = '';
    window.render();

    try {
        const code = await sendVerificationCode(state.verificationEmail);
        state.verificationCode = code;
        state.codeExpiry = Date.now() + (3 * 60 * 1000);
        state.codeInput = ['', '', '', ''];
        state.codeSending = false;
        showToast('📧 Yeni kod gönderildi!');
    } catch (error) {
        state.loginError = error.message;
        state.codeSending = false;
    }

    window.render();
};

window.backToLogin = function() {
    state.pendingVerification = false;
    state.verificationEmail = '';
    state.verificationCode = '';
    state.tempPassword = '';
    state.codeInput = ['', '', '', ''];
    state.loginError = '';
    window.render();
};

window.handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        state.currentUser = { uid: result.user.uid, email: result.user.email };
        state.loginError = '';
        await loadExpensesFromFirebase();
        window.render();
    } catch (error) {
        console.error("Google Login Detayı:", error);

        if (error.code !== 'auth/popup-closed-by-user') {
            state.loginError = 'Hata: ' + error.message;
            window.render();
        }
    }
};

window.handleLogout = async () => { await signOut(auth); state.currentUser = null; state.expenses = {}; window.render(); };
window.toggleRegister = () => { state.isRegistering = !state.isRegistering; state.loginError = ''; window.render(); };
window.toggleDarkMode = () => {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    document.documentElement.classList.toggle('dark', state.darkMode);
    window.render();
};
