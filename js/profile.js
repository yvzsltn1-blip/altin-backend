import { auth, reauthenticateWithCredential, EmailAuthProvider, updateEmail, updatePassword, signOut } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';

window.openProfileModal = () => {
    state.showProfileModal = true;
    state.profileForm = { currentPassword: '', newEmail: state.currentUser.email, newPassword: '' };
    window.render();
};

window.closeProfileModal = () => {
    state.showProfileModal = false;
    window.render();
};

window.handleUpdateProfile = async () => {
    const { currentPassword, newEmail, newPassword } = state.profileForm;

    if (!currentPassword) {
        showToast('⚠️ İşlem yapmak için mevcut şifrenizi girmelisiniz!');
        return;
    }

    if (newEmail === state.currentUser.email && !newPassword) {
        showToast('⚠️ Değişiklik yapmadınız.');
        return;
    }

    state.loading = true;
    window.render();

    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);

        if (newEmail && newEmail !== user.email) {
            await updateEmail(user, newEmail);
            state.currentUser.email = newEmail;
            showToast('✅ E-posta adresi güncellendi!');
        }

        if (newPassword) {
            if (newPassword.length < 6) throw new Error('Yeni şifre en az 6 karakter olmalı.');
            await updatePassword(user, newPassword);
            showToast('✅ Şifre başarıyla değiştirildi!');
        }

        window.closeProfileModal();

    } catch (error) {
        console.error(error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            showToast('❌ Mevcut şifre hatalı!');
        } else if (error.code === 'auth/email-already-in-use') {
            showToast('❌ Bu e-posta zaten kullanımda.');
        } else if (error.code === 'auth/requires-recent-login') {
            showToast('❌ Güvenlik gereği tekrar giriş yapmalısınız.');
            await signOut(auth);
        } else {
            showToast('❌ Hata: ' + error.message);
        }
    }

    state.loading = false;
    window.render();
};
