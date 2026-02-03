// Ana giriş noktası - tüm modülleri import eder ve başlatır

import './config.js';
import { state } from './state.js';
import './helpers.js';
import './toast.js';
import './firebase-data.js';
import './gold.js';
import './auto-update.js';
import './auth.js';
import './expenses.js';
import './analysis.js';
import './categories.js';
import './security.js';
import './export.js';
import './profile.js';
import './navigation.js';
import './budget-modal.js';
import { render } from './render.js';

// --- TIKLAMA İLE MENÜLERİ KAPATMA (BOŞLUĞA TIKLAYINCA) ---
document.addEventListener('click', function(e) {
    let needsRender = false;

    if (state.showMobileMenu) {
        if (!e.target.closest('.relative.md\\:hidden')) {
            state.showMobileMenu = false;
            state.showExportMenu = false;
            state.showDeleteMenu = false;
            needsRender = true;
        }
    }

    if (state.showExportMenu && !state.showMobileMenu) {
        if (!e.target.closest('[onclick="toggleExportMenu()"]') && !e.target.closest('.export-dropdown')) {
            state.showExportMenu = false;
            needsRender = true;
        }
    }

    if (state.showDeleteMenu && !state.showMobileMenu) {
        if (!e.target.closest('[onclick="toggleDeleteMenu()"]') && !e.target.closest('.export-dropdown')) {
            state.showDeleteMenu = false;
            needsRender = true;
        }
    }

    if (needsRender) {
        render();
    }
});

render();
