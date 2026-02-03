import { auth, reauthenticateWithCredential, EmailAuthProvider } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';

window.requestSecurityCheck = (actionFunction) => {
    const user = auth.currentUser;
    if (!user) return;

    state.pendingAction = actionFunction;

    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');

    if (isGoogleUser) {
        state.showFinalConfirmation = true;
        window.render();
    } else {
        state.showSecurityModal = true;
        state.securityPassword = '';
        state.securityError = '';
        window.render();

        setTimeout(() => {
            const pwdInput = document.getElementById('securityPasswordInput');
            if(pwdInput) pwdInput.focus();
        }, 100);
    }
};

window.confirmSecurityAction = async () => {
    if (!state.securityPassword) {
        state.securityError = 'Lütfen şifrenizi girin';
        window.render();
        return;
    }

    state.loading = true;
    window.render();

    const user = auth.currentUser;

    try {
        const credential = EmailAuthProvider.credential(user.email, state.securityPassword);
        await reauthenticateWithCredential(user, credential);

        const actionToRun = state.pendingAction;

        state.pendingAction = null;
        state.showSecurityModal = false;
        state.securityPassword = '';
        state.loading = false;
        state.securityError = '';

        window.render();

        if (actionToRun) {
            setTimeout(async () => {
                if(confirm("⚠️ Bu işlem geri alınamaz! Gerçekten devam etmek istiyor musunuz?")) {
                    await actionToRun();
                } else {
                    showToast('❌ İşlem iptal edildi.');
                }
            }, 50);
        }

    } catch (error) {
        state.loading = false;
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            state.securityError = '❌ Şifre yanlış!';
        } else if (error.code === 'auth/too-many-requests') {
            state.securityError = '⚠️ Çok fazla deneme yaptınız. Biraz bekleyin.';
        } else {
            state.securityError = 'Hata: ' + error.message;
        }
        window.render();
    }
};

window.closeSecurityModal = () => {
    state.showSecurityModal = false;
    state.securityPassword = '';
    state.pendingAction = null;
    state.securityError = '';
    window.render();
};

window.executeFinalAction = async () => {
    state.loading = true;
    state.showFinalConfirmation = false;
    window.render();

    if (state.pendingAction) {
        try {
            await state.pendingAction();
            state.pendingAction = null;
        } catch (e) {
            console.error(e);
            showToast('❌ İşlem sırasında hata oluştu.');
        }
    }

    state.loading = false;
    window.render();
};

window.cancelFinalAction = () => {
    state.showFinalConfirmation = false;
    state.pendingAction = null;
    showToast('ℹ️ İşlemden vazgeçildi.');
    window.render();
};
