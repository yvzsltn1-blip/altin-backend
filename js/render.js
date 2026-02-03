import { ADMIN_UIDS } from './config.js';
import { state, periods, monthNames, dayNames } from './state.js';
import { formatTL, getDaysInMonth, getTotalForDay, getCategoryTotals, getCategoryPeriodDetails } from './helpers.js';
import { getFilteredExpenses, calculateAnalysisStats } from './analysis.js';
import { getBudgetHTML } from './budget.js';

function guvenliYazi(yazi) {
    let div = document.createElement('div');
    div.textContent = yazi;
    return div.innerHTML;
}

function render() {
    const app = document.getElementById('app');
    const isDark = state.darkMode;

    // Loading ekranını yönet
    const loader = document.getElementById('global-loader');
    if (state.loading) {
        return;
    } else {
        if (loader) {
            loader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }

    if (!state.currentUser) {
        const remainingTime = state.codeExpiry ? Math.max(0, Math.floor((state.codeExpiry - Date.now()) / 1000)) : 0;
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const isExpired = state.codeExpiry && Date.now() > state.codeExpiry;

        if (state.pendingVerification) {
            app.innerHTML = `
                <div class="min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'} flex items-center justify-center p-4">
                    <div class="w-full max-w-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-3xl p-8 card-shadow text-center">
                        <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2">Email Doğrulama</h2>
                        <p class="${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2">
                            <span class="font-semibold text-amber-500">${state.verificationEmail}</span>
                        </p>
                        <p class="${isDark ? 'text-gray-500' : 'text-gray-500'} text-sm mb-6">
                            adresine gönderilen 4 haneli kodu girin
                        </p>

                        <div class="flex justify-center gap-3 mb-4">
                            ${[0, 1, 2, 3].map(i => `
                                <input
                                    type="text"
                                    id="code-input-${i}"
                                    maxlength="4"
                                    value="${state.codeInput[i]}"
                                    oninput="handleCodeInput(${i}, this.value)"
                                    onkeydown="handleCodeKeydown(${i}, event)"
                                    class="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-amber-200'} focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all ${isExpired ? 'opacity-50' : ''}"
                                    ${isExpired ? 'disabled' : ''}
                                    ${i === 0 ? 'autofocus' : ''}
                                >
                            `).join('')}
                        </div>

                        <div class="mb-6">
                            ${state.codeSending ? `
                                <div class="flex items-center justify-center gap-2 text-amber-500">
                                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Kod gönderiliyor...</span>
                                </div>
                            ` : isExpired ? `
                                <div class="text-red-500 font-medium">⏰ Kodun süresi doldu</div>
                            ` : `
                                <div class="${isDark ? 'text-gray-400' : 'text-gray-500'}">
                                    Kalan süre: <span data-timer class="font-mono font-bold text-amber-500">${timeDisplay}</span>
                                </div>
                            `}
                        </div>

                        ${state.loginError ? `<div class="text-red-500 text-sm mb-4 p-3 ${isDark ? 'bg-red-900/20' : 'bg-red-50'} rounded-lg">${state.loginError}</div>` : ''}

                        <div class="${isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4 mb-6 text-left">
                            <div class="flex items-start gap-3">
                                <span class="text-2xl">⚠️</span>
                                <div>
                                    <h3 class="font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-700'} mb-1">Email gelmediyse:</h3>
                                    <ul class="${isDark ? 'text-yellow-300/80' : 'text-yellow-600'} text-sm space-y-1">
                                        <li>📁 <strong>Spam/Gereksiz</strong> klasörünü kontrol edin</li>
                                        <li>📁 <strong>Promosyonlar</strong> sekmesine bakın (Gmail)</li>
                                        <li>⏳ 1-2 dakika bekleyin</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <button onclick="verifyCode()" ${isExpired || state.codeSending ? 'disabled' : ''} class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                Doğrula
                            </button>
                            <button onclick="resendVerificationCode()" ${state.codeSending ? 'disabled' : ''} class="w-full py-3 ${isDark ? 'bg-gray-700 text-amber-400 hover:bg-gray-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'} rounded-xl font-medium transition-all disabled:opacity-50">
                                ${state.codeSending ? 'Gönderiliyor...' : '🔄 Yeni Kod Gönder'}
                            </button>
                            <button onclick="backToLogin()" class="w-full py-2 text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors">
                                ← Giriş sayfasına dön
                            </button>
                        </div>
                    </div>
                </div>
                ${state.toastMessage ? `<div class="toast fixed bottom-6 left-1/2 transform -translate-x-1/2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} border shadow-2xl rounded-xl px-6 py-3 z-50 flex items-center gap-3"><span class="${isDark ? 'text-gray-200' : 'text-gray-800'} font-medium">${state.toastMessage}</span></div>` : ''}
            `;

            setTimeout(() => { const firstInput = document.getElementById('code-input-0'); if (firstInput) firstInput.focus(); }, 100);
            return;
        }

        app.innerHTML = `
            <div class="min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'} flex items-center justify-center p-4">
                <div class="w-full max-w-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-3xl p-8 card-shadow">
                    <h1 class="text-4xl font-bold gold-shimmer text-center mb-2" style="font-family: 'Playfair Display', serif;">Altın Bütçe</h1>
                    <p class="text-center ${isDark ? 'text-amber-400' : 'text-amber-700'} mb-8">Harcamalarınızı altınla takip edin</p>

                    <button onclick="handleGoogleLogin()" class="w-full py-3 mb-4 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'} rounded-xl font-medium transition-all flex items-center justify-center gap-3">
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google ile ${state.isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
                    </button>

                    <div class="flex items-center gap-4 mb-4">
                        <div class="flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}"></div>
                        <span class="${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm">veya</span>
                        <div class="flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}"></div>
                    </div>

                    <div class="space-y-4">
                        <input type="email" id="email" value="${state.loginForm.email}" class="w-full px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-amber-100'} focus:border-amber-400 outline-none" placeholder="E-posta">
                        <input type="password" id="password" value="${state.loginForm.password}" class="w-full px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-amber-100'} focus:border-amber-400 outline-none" placeholder="Şifre">
                        ${state.loginError ? `<div class="text-red-500 text-sm">${state.loginError}</div>` : ''}

                       ${state.isRegistering ? `
                        <div class="${isDark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-100'} border rounded-xl p-3 text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}">
                            <div class="flex items-start gap-2">
                                <span>🔐</span>
                                <div><strong>E-posta Aktivasyonu:</strong><br>Kayıt olduktan sonra e-postanıza bir doğrulama linki gönderilecek. Giriş yapabilmek için önce bu linke tıklamanız gerekmektedir.</div>
                            </div>
                        </div>
                        <div class="${isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-3 text-sm">
                            <div class="flex items-start gap-2">
                                <span>⚠️</span>
                                <div class="${isDark ? 'text-yellow-300' : 'text-yellow-700'}"><strong>Önemli:</strong> Doğrulama e-postası <strong>Spam/Gereksiz</strong> klasörüne düşebilir. Lütfen kontrol edin.</div>
                            </div>
                        </div>
                    ` : ''}

                        <button onclick="${state.isRegistering ? 'handleRegister()' : 'handleLogin()'}" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                            ${state.isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
                        </button>
                        <button onclick="toggleRegister()" class="w-full text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'} hover:underline">
                            ${state.isRegistering ? 'Zaten hesabım var - Giriş yap' : 'Hesabım yok - Kayıt ol'}
                        </button>
                    </div>

                    <div class="mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-amber-100'} flex justify-center">
                        <button onclick="toggleDarkMode()" class="flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-amber-400' : 'bg-amber-50 text-amber-700'} hover:opacity-80 transition-all">
                            ${isDark ? '☀️ Aydınlık Mod' : '🌙 Karanlık Mod'}
                        </button>
                    </div>
                </div>
            </div>`;
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');

        if (emailInput && passInput) {
            emailInput.addEventListener('input', e => state.loginForm.email = e.target.value);
            passInput.addEventListener('input', e => state.loginForm.password = e.target.value);

            const triggerSubmit = (e) => {
                if (e.key === 'Enter') {
                    state.isRegistering ? window.handleRegister() : window.handleLogin();
                }
            };

            emailInput.addEventListener('keydown', triggerSubmit);
            passInput.addEventListener('keydown', triggerSubmit);
        }
        return;
    }

    const { daysInMonth, startingDay } = getDaysInMonth();

    let calendarHTML = '';
    for(let i=0; i<startingDay; i++) calendarHTML += '<div></div>';
    for(let day=1; day<=daysInMonth; day++) {
        const total = getTotalForDay(day);
        const isToday = new Date().toDateString() === new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), day).toDateString();

        calendarHTML += `
            <button onclick="handleDateClick(${day})" class="aspect-square rounded-xl border-2 flex flex-col items-center transition-all
                ${total > 0 ? 'justify-between py-1.5' : 'justify-center'}
                ${isDark ? 'hover:border-amber-500 hover:bg-gray-700/50' : 'hover:border-amber-300 hover:bg-white/50'}
                ${isToday ? (isDark ? 'border-amber-500 bg-amber-900/30' : 'border-amber-400 bg-amber-50') : 'border-transparent'}
                ${total > 0 ? (isDark ? 'bg-gradient-to-br from-amber-900/40 to-yellow-900/40' : 'bg-gradient-to-br from-amber-100 to-yellow-100') : ''}">

                <span class="text-sm font-medium ${isToday ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-gray-300' : 'text-amber-800')}">${day}</span>

                ${total > 0 ? `
                    <div class="flex flex-col items-center w-full">
                        <div class="w-1 h-1 rounded-full bg-amber-500/30 mb-0.5"></div>
                        <span class="text-[10px] md:text-base font-bold leading-none ${isDark ? 'text-amber-400' : 'text-amber-700'}">₺${total >= 1000 ? (total/1000).toFixed(1) + 'K' : Math.round(total)}</span>
                    </div>
                ` : ''}
            </button>`;
    }

    let goldHTML = state.loadingGold ? 'Yükleniyor...' :
        state.goldPrice?.price ? `<span class="text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}">₺${formatTL(state.goldPrice.price)}</span>` :
        state.goldPrice?.error || 'Veri yok';

    let selDateKey = null;
    if (state.selectedDate) {
        const d = state.selectedDate;
        selDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const selDateExps = selDateKey ? state.expenses[selDateKey] || [] : [];

    const expListHTML = selDateExps.map((exp, i) => {
        const uniqueId = `modal-note-${i}`;
        const isEditing = state.editingExpense?.dateKey === selDateKey && state.editingExpense?.index === i;
        const isEstimated = exp.isEstimated === true;

        let cardClasses = "cursor-pointer p-3 rounded-lg border mb-2 transition-all ";

        if (isEditing) {
            cardClasses += "ring-2 ring-amber-500 edit-highlight ";
        } else if (isEstimated) {
            cardClasses += isDark
                ? "bg-gray-800/50 border-amber-500/50 border-dashed opacity-80 hover:opacity-100"
                : "bg-amber-50/50 border-amber-400 border-dashed opacity-80 hover:opacity-100";
        } else {
            cardClasses += isDark
                ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                : "bg-amber-50 border-amber-100 hover:bg-amber-100";
        }

        return `
        <div onclick="toggleNote('${uniqueId}')" class="${cardClasses}">
            <div class="flex justify-between items-center">
                <div>
                    <div class="flex items-center gap-2 text-xs mb-1">
                        <span>${state.categories[exp.category].icon}</span>
                        <span class="px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-amber-100'} border font-medium">${exp.subcategory}</span>

                        ${isEstimated ? `
                            <span class="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded animate-pulse" title="Bu harcama bugünün kuruyla hesaplandı, günü gelince güncellenecek.">
                                ⏳ Tahmini
                            </span>
                        ` : ''}
                    </div>

                    <div class="font-bold ${isDark ? 'text-white' : 'text-amber-900'} text-lg">₺${formatTL(exp.amount)}</div>

                    ${exp.goldGrams ? `
                        <div class="text-[10px] ${isDark ? 'text-amber-400' : 'text-amber-500'} flex items-center gap-1">
                            ≈ ${exp.goldGrams}g altın
                            ${isEstimated ? '<span class="text-xs opacity-50">?</span>' : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="flex items-center gap-1">
                    <button onclick="event.stopPropagation(); editExpense('${selDateKey}', ${i})" class="${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'} p-2 text-sm font-medium" title="Düzenle">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onclick="event.stopPropagation(); removeExpense('${selDateKey}', ${i})" class="text-red-400 hover:text-red-600 p-2 text-sm font-medium" title="Sil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>
            ${exp.note ? `<div id="${uniqueId}" class="hidden mt-2 pt-2 ${isDark ? 'border-gray-600 text-gray-300' : 'border-amber-200/50 text-amber-800'} border-t text-sm italic animate-[slideDown_0.2s]">📝 ${guvenliYazi(exp.note)}</div>` : ''}
        </div>
    `}).join('');

    const renderCategoryCard = (catKey) => {
        const cat = state.categories[catKey];
        const totals = getCategoryTotals(catKey);
        const isActive = state.activeCategoryCard === catKey;

        let periodOptionsHTML = '';
        if (isActive) {
            periodOptionsHTML = `
                <div class="details-enter mt-4 pt-4 border-t border-white/20 space-y-2">
                    ${Object.entries(periods).map(([periodKey, period]) => {
                        const isSelectedPeriod = state.selectedPeriod === periodKey;
                        const periodData = getCategoryPeriodDetails(catKey, periodKey);

                        let subcategoryListHTML = '';
                        if (isSelectedPeriod && periodData) {
                            subcategoryListHTML = `
                                <div class="accordion-wrapper open">
                                    <div class="accordion-inner">
                                        <div class="space-y-2 p-2 mt-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                            ${Object.entries(periodData.subcategoryData).filter(([_, data]) => data.total > 0).length > 0 ?
                                                Object.entries(periodData.subcategoryData).filter(([_, data]) => data.total > 0).map(([subKey, subData]) => {
                                                    const isExpandedSub = state.expandedSubcategory === `${catKey}-${periodKey}-${subKey}`;

                                                    let itemsHTML = '';
                                                    if (isExpandedSub && subData.items.length > 0) {
                                                        itemsHTML = `
                                                            <div class="mt-2 space-y-1.5">
                                                                ${subData.items.map((item, idx) => {
                                                                    const noteId = `note-${catKey}-${periodKey}-${subKey}-${idx}`;
                                                                    const dateStr = new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                                                                    return `
                                                                        <div onclick="toggleNote('${noteId}', event)" class="${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'} rounded-lg p-2.5 shadow-sm cursor-pointer transition-colors">
                                                                            <div class="flex justify-between items-center">
                                                                                <span class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}">${dateStr}</span>
                                                                                <span class="font-bold text-xs">₺${formatTL(item.amount)}</span>
                                                                            </div>
                                                                            <div class="flex justify-between text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1">
                                                                                <span>${item.goldGrams ? item.goldGrams + 'g altın' : ''}</span>
                                                                            </div>
                                                                            ${item.note ? `<div id="${noteId}" class="hidden mt-2 pt-2 ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-600'} border-t text-xs italic">📝 ${guvenliYazi(item.note)}</div>` : ''}
                                                                        </div>
                                                                    `;
                                                                }).join('')}
                                                            </div>
                                                        `;
                                                    }

                                                    return `
                                                        <div class="overflow-hidden">
                                                            <div onclick="toggleSubcategoryDetail(event, '${catKey}-${periodKey}-${subKey}')" class="${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} rounded-lg p-2.5 cursor-pointer transition-all">
                                                                <div class="flex justify-between items-center">
                                                                    <span class="font-medium text-xs ${isDark ? 'text-gray-200' : 'text-gray-700'}">${subKey}</span>
                                                                    <div class="flex items-center gap-2">
                                                                        <span class="font-bold text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}">₺${formatTL(subData.total)}</span>
                                                                        <svg class="w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} transition-transform ${isExpandedSub ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                                                                    </div>
                                                                </div>
                                                                <div class="text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-0.5">${subData.gold.toFixed(4)}g altın • ${subData.items.length} harcama</div>
                                                            </div>
                                                            ${isExpandedSub ? itemsHTML : ''}
                                                        </div>
                                                    `;
                                                }).join('')
                                            : `<div class="p-4 text-center text-xs text-white/60">Bu dönemde harcama yok</div>`}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }

                        return `
                            <div class="overflow-hidden">
                                <div onclick="selectPeriod(event, '${periodKey}')" class="bg-black/10 rounded-xl p-3 cursor-pointer hover:bg-black/20 transition-all flex justify-between items-center backdrop-blur-sm border border-white/5">
                                    <div class="flex items-center gap-2.5">
                                        <span class="text-lg">${period.icon}</span>
                                        <span class="text-sm font-semibold">${period.name}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="flex flex-col items-end mr-1">
                                            <span class="text-sm font-bold">₺${formatTL(periodData.total)}</span>
                                            <span class="text-[10px] opacity-70 font-medium tracking-tight">≈${periodData.totalGold.toFixed(2)}g</span>
                                        </div>
                                        <svg class="w-4 h-4 text-white/70 transition-transform ${isSelectedPeriod ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                                    </div>
                                </div>
                                ${subcategoryListHTML}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return `
            <div onclick="toggleCategoryCard('${catKey}')" class="cursor-pointer bg-gradient-to-br ${cat.gradient} rounded-2xl p-5 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-2xl">${cat.icon}</span>
                            <p class="text-white/90 text-xs font-bold uppercase tracking-wide">${cat.name}</p>
                        </div>
                        <p class="text-2xl font-bold mt-1">₺${formatTL(totals.total)}</p>
                        <p class="text-white/70 text-[10px] mt-1">≈ ${totals.totalGold.toFixed(4)}g altın</p>
                    </div>
                    <svg class="w-5 h-5 text-white/70 transition-transform ${isActive ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
                ${periodOptionsHTML}
            </div>
        `;
    };

    const nowYear = new Date().getFullYear();
    const yearList = [];
    for (let y = nowYear; y >= nowYear - 10; y--) yearList.push(y);
    const budgetHTML = getBudgetHTML(state, isDark, formatTL, monthNames);

    const nowMonth = state.currentDate.getMonth();
    const currentYear = state.currentDate.getFullYear();
    const selectClass = `appearance-none bg-transparent font-bold text-lg outline-none cursor-pointer transition-colors ${isDark ? 'text-white hover:text-amber-400' : 'text-gray-800 hover:text-amber-600'} text-center w-full`;
    const navBtnClass = `p-2 rounded-full transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-amber-400' : 'hover:bg-amber-100 text-gray-400 hover:text-amber-600'} active:scale-95`;

    app.innerHTML = `
        <div class="min-h-screen ${isDark ? 'dark bg-[#0f0f0f]' : 'bg-amber-50/50'} transition-colors duration-300 pb-20">

         <header class="${isDark ? 'bg-[#1a1a1a]/90 border-gray-800' : 'bg-white/90 border-amber-100'} border-b backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300 shadow-sm">
                <div class="max-w-5xl mx-auto px-4 py-3 relative">

                    <div class="flex justify-between items-center mb-2 md:mb-0">

                        <div class="flex items-center gap-2 group cursor-pointer select-none">
                            <div class="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                                <div class="absolute inset-0 bg-amber-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                                <span class="text-2xl md:text-3xl relative z-10 filter drop-shadow-sm">⚜️</span>
                            </div>
                            <div>
                                <h1 class="text-xl font-black tracking-tight bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 bg-clip-text text-transparent animate-shimmer" style="font-family: 'Playfair Display', serif;">
                                    YSS
                                </h1>
                                <p class="hidden md:block text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-amber-700/60'} tracking-[0.2em] uppercase leading-none ml-0.5">Bütçe Takip</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">



                            <div class="hidden md:flex items-center gap-2">
                                <button onclick="openAnalysis()" class="${navBtnClass}" title="Analiz">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                </button>

                                ${state.currentUser && typeof ADMIN_UIDS !== 'undefined' && ADMIN_UIDS.includes(state.currentUser.uid) ? `
                                <a href="admin.html" class="${navBtnClass} text-amber-600 bg-amber-100 hover:bg-amber-200" title="Admin Paneli">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                                </a>
                                ` : ''}

                                <div class="relative">
                                    <button onclick="toggleExportMenu()" class="${navBtnClass}" title="Dışa Aktar">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                    </button>
                                    ${state.showExportMenu ? `
                                        <div class="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl w-48 py-2 z-50 animate-[dropdownIn_0.2s] export-dropdown">
                                            <button onclick="exportToExcel()" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                                                <span>📊</span> Excel İndir
                                            </button>
                                            <button onclick="exportToPDF()" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                                                <span>📄</span> PDF İndir
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>

                                <div class="relative">
                                    <button onclick="toggleDeleteMenu()" class="${navBtnClass} hover:text-red-500" title="Sil">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                    ${state.showDeleteMenu ? `
                                        <div class="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 shadow-xl rounded-xl w-56 py-2 z-50 animate-[dropdownIn_0.2s] export-dropdown">
                                             <button onclick="deleteLastWeek()" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">
                                                <span>📅</span> Son 1 Haftayı Sil
                                            </button>
                                            <button onclick="deleteLastMonth()" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">
                                                <span>🗓️</span> Son 1 Ayı Sil
                                            </button>
                                            <div class="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                            <button onclick="deleteAllData()" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-bold transition-colors">
                                                <span>🗑️</span> Tüm Verileri Sıfırla
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>

                                <button onclick="handleLogout()" class="${navBtnClass} hover:text-red-500" title="Çıkış Yap">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>

                            <div class="relative md:hidden">
                                <button onclick="toggleMobileMenu()" class="${navBtnClass} ${state.showMobileMenu ? 'bg-amber-100 dark:bg-gray-700 text-amber-600 dark:text-amber-400' : ''}">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                                </button>

                                ${state.showMobileMenu ? `
                                    <div class="absolute right-0 top-12 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-amber-100'} border shadow-xl rounded-xl w-64 py-2 z-50 animate-[slideDown_0.2s] flex flex-col max-h-[80vh] overflow-y-auto">
                                        ${state.currentUser && typeof ADMIN_UIDS !== 'undefined' && ADMIN_UIDS.includes(state.currentUser.uid) ? `
                                    <a href="admin.html" class="text-left px-4 py-3 flex items-center gap-3 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-gray-700/30 font-bold border-b border-amber-100 dark:border-gray-700 hover:bg-amber-100 dark:hover:bg-gray-600 transition-colors">
                                        <span>⚜️</span> Admin Paneli
                                    </a>
                                ` : ''}
                                        <button onclick="openAnalysis(); toggleMobileMenu()" class="text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-amber-50'}">
                                            <span>📊</span> Analiz Et
                                        </button>

                                        <button onclick="toggleExportMenu()" class="text-left px-4 py-3 flex items-center justify-between gap-3 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-amber-50'} ${state.showExportMenu ? 'bg-gray-50 dark:bg-gray-700/50' : ''}">
                                            <div class="flex items-center gap-3"><span>📥</span> Dışa Aktar</div>
                                            <span class="text-xs opacity-50">${state.showExportMenu ? '▲' : '▼'}</span>
                                        </button>

                                        ${state.showExportMenu ? `
                                            <div class="bg-gray-50 dark:bg-black/20 border-y border-gray-100 dark:border-gray-700/50">
                                                <button onclick="exportToExcel(); toggleMobileMenu()" class="w-full text-left pl-12 pr-4 py-2.5 text-sm flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-amber-600'}">
                                                    📄 Excel İndir
                                                </button>
                                                <button onclick="exportToPDF(); toggleMobileMenu()" class="w-full text-left pl-12 pr-4 py-2.5 text-sm flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-amber-600'}">
                                                    📑 PDF İndir
                                                </button>
                                            </div>
                                        ` : ''}

                                        <button onclick="toggleDeleteMenu()" class="text-left px-4 py-3 flex items-center justify-between gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 ${state.showDeleteMenu ? 'bg-red-50 dark:bg-red-900/10' : ''}">
                                            <div class="flex items-center gap-3"><span>🗑️</span> Verileri Sil</div>
                                            <span class="text-xs opacity-50">${state.showDeleteMenu ? '▲' : '▼'}</span>
                                        </button>

                                        ${state.showDeleteMenu ? `
                                            <div class="bg-red-50/50 dark:bg-red-900/5 border-y border-red-100 dark:border-red-900/20">
                                                <button onclick="deleteLastWeek(); toggleMobileMenu()" class="w-full text-left pl-12 pr-4 py-2.5 text-sm flex items-center gap-2 text-red-600 dark:text-red-400 hover:underline">
                                                    📅 Son 1 Haftayı Sil
                                                </button>
                                                <button onclick="deleteLastMonth(); toggleMobileMenu()" class="w-full text-left pl-12 pr-4 py-2.5 text-sm flex items-center gap-2 text-red-600 dark:text-red-400 hover:underline">
                                                    🗓️ Son 1 Ayı Sil
                                                </button>
                                                <button onclick="deleteAllData(); toggleMobileMenu()" class="w-full text-left pl-12 pr-4 py-2.5 text-sm flex items-center gap-2 text-red-700 dark:text-red-300 font-bold hover:underline">
                                                    ❗ Tümünü Sıfırla
                                                </button>
                                            </div>
                                        ` : ''}

                                        <button onclick="handleLogout()" class="text-left px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} mt-1">
                                            <span>🚪</span> Çıkış Yap
                                        </button>
                                    </div>
                                ` : ''}
                            </div>

                            <button onclick="toggleDarkMode()" class="p-2 rounded-full transition-all ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-amber-50 text-amber-500'}">
                                <span class="text-lg">${isDark ? '🌙' : '☀️'}</span>
                            </button>

                            ${state.currentUser ? `
                                <img
                                    onclick="openProfileModal()"
                                    src="${state.currentUser.photoURL || `https://ui-avatars.com/api/?name=${state.currentUser.email[0]}&background=${isDark ? '333' : 'f59e0b'}&color=fff`}"
                                    class="w-8 h-8 rounded-full border-2 ${isDark ? 'border-gray-700' : 'border-white'} shadow-sm cursor-pointer"
                                    alt="Profil"
                                >
                            ` : ''}
                        </div>
                    </div>

                    <div class="flex justify-center md:absolute md:top-1/2 md:left-1/2 md:-translate-y-1/2 md:-translate-x-1/2 w-full md:w-auto">
                         <div class="flex items-center gap-1 ${isDark ? 'bg-[#111]/90 border-gray-800' : 'bg-white/60 border-amber-100/80'} p-1 rounded-xl backdrop-blur-md border shadow-sm">

                            <div class="flex items-center bg-transparent rounded-lg">
                                <button onclick="changeMonth(-1)" class="p-1.5 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-amber-600'}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>
                                <div class="relative group w-20">
                                    <select onchange="selectMonth(this.value)" class="${selectClass} text-sm py-1">
                                        ${monthNames.map((m, i) => `<option value="${i}" ${i === nowMonth ? 'selected' : ''} class="${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}">${m}</option>`).join('')}
                                    </select>
                                </div>
                                <button onclick="changeMonth(1)" class="p-1.5 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-amber-600'}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>
                            </div>

                            <div class="w-px h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}"></div>

                            <div class="relative group w-16 px-1">
                                <select onchange="selectYear(this.value)" class="${selectClass} text-sm py-1">
                                    ${yearList.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''} class="${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}">${y}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main class="max-w-5xl mx-auto px-4 pt-6">
                ${budgetHTML}

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    ${renderCategoryCard('zorunlu')}
                    ${renderCategoryCard('orta')}
                    ${renderCategoryCard('keyfi')}
                </div>


<div class="${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-3xl p-6 card-shadow mb-8">
    <div class="flex items-center justify-between mb-6 md:mb-10 relative z-10">
        <button onclick="prevMonth()" class="p-3 ${isDark ? 'hover:bg-gray-700 text-amber-400' : 'hover:bg-amber-50 text-amber-600'} rounded-xl transition-all">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
        </button>

        <div class="text-center relative" id="monthYearDisplay">
            <div class="text-4xl md:text-5xl font-light tracking-wider ${isDark ? 'text-white' : 'text-amber-950'} relative" style="font-family: 'Inter', serif;">
                <span id="currentMonth">${monthNames[state.currentDate.getMonth()]}</span>
            </div>
            <div class="mt-1 text-sm md:text-base font-light tracking-[0.35em] ${isDark ? 'text-white/50' : 'text-amber-700/70'} uppercase">
                ${state.currentDate.getFullYear()}
            </div>
            <div class="mt-3 flex justify-center">
                <div class="w-12 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
            </div>
        </div>

        <button onclick="nextMonth()" class="p-3 ${isDark ? 'hover:bg-gray-700 text-amber-400' : 'hover:bg-amber-50 text-amber-600'} rounded-xl transition-all">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </button>
    </div>

    <div class="grid grid-cols-7 gap-2 mb-3 text-center text-xs md:text-sm font-light ${isDark ? 'text-amber-400/70' : 'text-amber-500/70'} uppercase tracking-widest">
        ${dayNames.map(d => `<div>${d}</div>`).join('')}
    </div>

    <div class="grid grid-cols-7 gap-2 md:gap-3">
        ${calendarHTML}
    </div>
</div>
            </main>

            ${state.showModal ? `
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="if(event.target === this) closeModal()">
                <div class="modal-enter ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div class="bg-gradient-to-r from-amber-500 to-yellow-500 p-5 text-white flex justify-between items-center shrink-0">
                        <div>
                            <h3 class="font-bold text-lg">${state.selectedDate.getDate()} ${monthNames[state.selectedDate.getMonth()]}</h3>
                            <p class="text-amber-100 text-xs">${state.editingExpense ? '✏️ Harcama Düzenle' : 'Harcama Ekle & Detaylar'}</p>
                        </div>
                        <button onclick="closeModal()" class="bg-white/20 p-2 rounded-lg hover:bg-white/30"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                    <div class="p-6 overflow-y-auto">
                        <div class="${isDark ? 'bg-gray-700 border-gray-600' : 'bg-amber-50 border-amber-100'} rounded-xl p-3 border mb-6 flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                <span class="text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-800'}">Gram Altın (Satış)</span>
                            </div>
                            <div id="gold-price-area" class="text-right">${goldHTML}</div>
                        </div>

                        <div class="space-y-4 mb-6">
                            ${state.editingExpense ? `
                                <div class="${isDark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-100 border-amber-200'} border rounded-xl p-3 flex items-center justify-between">
                                    <span class="${isDark ? 'text-amber-400' : 'text-amber-700'} text-sm font-medium">✏️ Düzenleme Modu</span>
                                    <button onclick="cancelEdit()" class="text-xs ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} underline">İptal</button>
                                </div>
                            ` : ''}

                            <div class="grid grid-cols-3 gap-2">
                                ${Object.entries(state.categories).map(([key, cat]) => `
                                    <button onclick="selectCategory('${key}')" class="p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${state.selectedCategory === key ? `${isDark ? 'bg-amber-900/50 border-amber-500 text-amber-400' : `bg-${cat.color}-50 border-${cat.color}-500 text-${cat.color}-700`}` : `${isDark ? 'border-gray-600 hover:border-gray-500 text-gray-400' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}">
                                        <span class="text-xl">${cat.icon}</span>
                                        <span class="text-xs font-bold">${cat.name}</span>
                                    </button>
                                `).join('')}
                            </div>

                            ${state.selectedCategory ? `
${state.subcategoryEditMode ? `
    <div class="w-full mb-2 text-center text-xs font-bold text-red-500 animate-pulse">
        ⚠️ Düzenlemek istediğin kategoriye tıkla
    </div>
` : ''}

<div class="flex flex-wrap gap-2 animate-[fadeIn_0.3s]">
    ${state.categories[state.selectedCategory].subcategories.map(sub => `
        <button
            onclick="${state.subcategoryEditMode ? `handleSubcategoryEdit('${state.selectedCategory}', '${sub}')` : `selectSubcategory('${sub}')`}"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden
            ${state.subcategoryEditMode
                ? 'bg-red-100 text-red-600 border border-red-300 hover:bg-red-200 shake-animation'
                : (state.selectedSubcategory === sub
                    ? 'bg-amber-500 text-white shadow-md'
                    : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                  )
            }">
            ${sub}
            ${state.subcategoryEditMode ? '<span class="ml-1 text-[10px]">✏️</span>' : ''}
        </button>
    `).join('')}

    <button onclick="addCustomSubcategory('${state.selectedCategory}')" class="px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-dashed ${isDark ? 'border-gray-600 text-gray-400 hover:border-amber-500 hover:text-amber-500' : 'border-gray-300 text-gray-400 hover:border-amber-500 hover:text-amber-600'} transition-all opacity-80 hover:opacity-100">
        + Ekle
    </button>

    <button onclick="toggleSubcategoryEditMode()" class="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${state.subcategoryEditMode ? 'bg-red-500 text-white border-red-500 shadow-lg' : (isDark ? 'border-gray-600 text-gray-500 hover:bg-gray-700' : 'border-gray-300 text-gray-400 hover:bg-gray-100')}" title="Düzenle/Sil">
        ${state.subcategoryEditMode ? 'Bitti' : '✏️'}
    </button>
</div>
                            ` : ''}

                            <div class="grid grid-cols-2 gap-3">
                                <input type="number" id="newExpense" value="${state.newExpense}" class="w-full px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-amber-100'} focus:border-amber-400 outline-none text-lg" placeholder="0 TL">
                                <input type="text" id="expenseNote" value="${state.expenseNote}" class="w-full px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-amber-100'} focus:border-amber-400 outline-none" placeholder="Not (Opsiyonel)">
                            </div>

                            <div id="gold-calc-preview"></div>

                            <button id="btn-add-expense" onclick="handleAddExpense()" disabled class="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl font-bold opacity-50 cursor-not-allowed hover:shadow-lg transition-all flex justify-center items-center gap-2">
                                ${state.editingExpense ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Güncelle` : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg> Ekle`}
                            </button>
                        </div>
                        ${selDateExps.length > 0 ? (() => {
                            const dayTotalTL = selDateExps.reduce((acc, curr) => acc + curr.amount, 0);
                            const dayTotalGold = selDateExps.reduce((acc, curr) => acc + (parseFloat(curr.goldGrams) || 0), 0);

                            return `
                            <div class="border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} pt-4">
                                <div class="flex justify-between items-end mb-3">
                                    <h4 class="text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'} uppercase">Bugünkü Harcamalar</h4>
                                    <div class="text-right flex items-center gap-2">
                                         <span class="text-[10px] ${isDark ? 'text-amber-400/60' : 'text-amber-600/60'} font-medium">≈${dayTotalGold.toFixed(4)}g</span>
                                         <span class="text-sm font-bold ${isDark ? 'text-white' : 'text-amber-900'}">₺${formatTL(dayTotalTL)}</span>
                                    </div>
                                </div>
                                ${expListHTML}
                            </div>`;
                        })() : ''}
                    </div>
                </div>
            </div>
            ` : ''}

${state.showBudgetModal ? `
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]" onclick="if(event.target === this) closeBudgetModal()">
                <div class="modal-enter ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

                    <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <h3 class="font-bold text-xl relative z-10">Bütçe Ayarları</h3>
                        <p class="text-green-100 text-xs mt-1 relative z-10">Aylık hedefini ve döngünü belirle</p>
                    </div>

                    <div class="p-6 space-y-5">

                        <div>
                            <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-1 mb-1 block uppercase tracking-wide">Aylık Hedef (TL)</label>
                            <div class="relative">
                                <span class="absolute left-4 top-3.5 text-gray-400">₺</span>
                                <input type="number" id="budgetAmountInput"
                                    class="w-full pl-10 pr-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' : 'bg-gray-50 border-gray-200 focus:border-green-500'} outline-none transition-all font-bold text-lg"
                                    placeholder="Örn: 20000">
                            </div>
                        </div>

                        <div>
                            <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-1 mb-1 block uppercase tracking-wide">Bütçe Yenilenme Günü</label>
                            <div class="relative">
                                <span class="absolute left-4 top-3.5 text-gray-400">📅</span>
                                <input type="number" id="budgetDayInput" min="1" max="31"
                                    class="w-full pl-10 pr-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' : 'bg-gray-50 border-gray-200 focus:border-green-500'} outline-none transition-all font-bold"
                                    placeholder="Örn: 1 (Her ayın 1'i)">
                                <div class="text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1 ml-1">Maaş gününü veya ay başını (1) seçebilirsin.</div>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button onclick="closeBudgetModal()" class="flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">
                                Vazgeç
                            </button>
                            <button onclick="saveBudgetSettings()" class="flex-[2] py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:scale-[1.02] transition-all flex justify-center items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                Kaydet
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            ` : ''}


            ${state.showYearSelector ? `
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="if(event.target === this) toggleYearSelector()">
                <div class="${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl w-full max-w-xs p-6 shadow-2xl modal-enter">
                    <h3 class="text-lg font-bold ${isDark ? 'text-amber-400' : 'text-amber-900'} mb-4 text-center">Yıl Seçin</h3>
                    <div class="grid grid-cols-3 gap-3">
                        ${yearList.map(y => `
                            <button onclick="changeYear(${y})" class="py-3 rounded-xl font-semibold transition-all ${y === state.currentDate.getFullYear() ? 'bg-amber-500 text-white shadow-lg' : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-amber-900/50 hover:text-amber-400' : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-800'}`}">
                                ${y}
                            </button>
                        `).join('')}
                    </div>
                    <button onclick="toggleYearSelector()" class="mt-6 w-full py-3 ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} rounded-xl text-sm font-medium transition-colors">Vazgeç</button>
                </div>
            </div>
            ` : ''}

            ${state.showAnalysis ? (() => {
                const filteredExpenses = getFilteredExpenses();
                const stats = calculateAnalysisStats(filteredExpenses);
                const availableSubcategories = state.analysisCategory !== 'all' ? state.categories[state.analysisCategory].subcategories : [];

                return `
                <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="if(event.target === this) closeAnalysis()">
                    <div class="modal-enter ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-5 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 class="font-bold text-lg flex items-center gap-2">📈 Harcama Analizi</h3>
                                <p class="text-purple-100 text-xs">Detaylı filtreleme ve istatistikler</p>
                            </div>
                            <button onclick="closeAnalysis()" class="bg-white/20 p-2 rounded-lg hover:bg-white/30">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <div class="p-6 overflow-y-auto">
                            <div class="mb-4">
                                <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase mb-2 block">Hızlı Seçim</label>
                                <div class="flex flex-wrap gap-2">
                                    <button onclick="setQuickDateRange('today')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">Bugün</button>
                                    <button onclick="setQuickDateRange('week')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">Bu Hafta</button>
                                    <button onclick="setQuickDateRange('month')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">Bu Ay</button>
                                    <button onclick="setQuickDateRange('3months')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">Son 3 Ay</button>
                                    <button onclick="setQuickDateRange('year')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">Bu Yıl</button>
                                    <button onclick="setQuickDateRange('all')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">Tümü</button>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase mb-1 block">Başlangıç</label>
                                    <input type="date" value="${state.analysisDateStart || ''}" onchange="setAnalysisDateStart(this.value)" class="w-full px-3 py-2 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'} focus:border-purple-400 outline-none text-sm">
                                </div>
                                <div>
                                    <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase mb-1 block">Bitiş</label>
                                    <input type="date" value="${state.analysisDateEnd || ''}" onchange="setAnalysisDateEnd(this.value)" class="w-full px-3 py-2 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'} focus:border-purple-400 outline-none text-sm">
                                </div>
                                <div>
                                    <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase mb-1 block">Kategori</label>
                                    <select onchange="setAnalysisCategory(this.value)" class="w-full px-3 py-2 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'} focus:border-purple-400 outline-none text-sm">
                                        <option value="all" ${state.analysisCategory === 'all' ? 'selected' : ''}>Tümü</option>
                                        <option value="zorunlu" ${state.analysisCategory === 'zorunlu' ? 'selected' : ''}>⚠️ Zorunlu</option>
                                        <option value="orta" ${state.analysisCategory === 'orta' ? 'selected' : ''}>⚖️ Orta</option>
                                        <option value="keyfi" ${state.analysisCategory === 'keyfi' ? 'selected' : ''}>🎉 Keyfi</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase mb-1 block">Alt Kategori</label>
                                    <select onchange="setAnalysisSubcategory(this.value)" class="w-full px-3 py-2 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'} focus:border-purple-400 outline-none text-sm" ${state.analysisCategory === 'all' ? 'disabled' : ''}>
                                        <option value="all">Tümü</option>
                                        ${availableSubcategories.map(sub => `<option value="${sub}" ${state.analysisSubcategory === sub ? 'selected' : ''}>${sub}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="mb-6">
                                <input type="text" placeholder="🔍 Not veya alt kategoride ara..." value="${state.analysisSearchText}" oninput="setAnalysisSearch(this.value)" class="w-full px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'} focus:border-purple-400 outline-none">
                            </div>

                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div class="${isDark ? 'bg-gray-700' : 'bg-purple-50'} rounded-xl p-4 text-center">
                                    <div class="text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}">₺${formatTL(stats.totalAmount)}</div>
                                    <div class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}">Toplam Harcama</div>
                                </div>
                                <div class="${isDark ? 'bg-gray-700' : 'bg-amber-50'} rounded-xl p-4 text-center">
                                    <div class="text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}">${stats.totalGold.toFixed(2)}g</div>
                                    <div class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}">Toplam Altın</div>
                                </div>
                                <div class="${isDark ? 'bg-gray-700' : 'bg-blue-50'} rounded-xl p-4 text-center">
                                    <div class="text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}">${stats.count}</div>
                                    <div class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}">Harcama Sayısı</div>
                                </div>
                                <div class="${isDark ? 'bg-gray-700' : 'bg-green-50'} rounded-xl p-4 text-center">
                                    <div class="text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}">₺${formatTL(stats.avgDaily)}</div>
                                    <div class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}">Günlük Ortalama</div>
                                </div>
                            </div>

                            ${stats.count > 0 ? `
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div class="${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4">
                                    <div class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1">🏆 En Çok Harcanan Gün</div>
                                    <div class="font-bold ${isDark ? 'text-white' : 'text-gray-800'}">${stats.maxDay ? new Date(stats.maxDay).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                                    <div class="text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}">₺${formatTL(stats.maxDayAmount)}</div>
                                </div>
                                <div class="${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4">
                                    <div class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1">📁 En Çok Harcanan Kategori</div>
                                    <div class="font-bold ${isDark ? 'text-white' : 'text-gray-800'}">${stats.topCategory ? state.categories[stats.topCategory].icon + ' ' + state.categories[stats.topCategory].name : '-'}</div>
                                    <div class="text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}">₺${formatTL(stats.categoryBreakdown[stats.topCategory] || 0)}</div>
                                </div>
                                <div class="${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4">
                                    <div class="text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1">🏷️ En Çok Harcanan Etiket</div>
                                    <div class="font-bold ${isDark ? 'text-white' : 'text-gray-800'}">${stats.topSubcategory || '-'}</div>
                                </div>
                            </div>

                            <div class="mb-6">
                                <h4 class="text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3">Kategori Dağılımı</h4>
                                <div class="space-y-2">
                                    ${Object.entries(stats.categoryBreakdown).map(([catKey, amount]) => {
                                        const cat = state.categories[catKey];
                                        const percentage = stats.totalAmount > 0 ? (amount / stats.totalAmount * 100).toFixed(1) : 0;
                                        return `
                                            <div class="${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3">
                                                <div class="flex justify-between items-center mb-1">
                                                    <span class="text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}">${cat.icon} ${cat.name}</span>
                                                    <span class="text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}">₺${formatTL(amount)} (${percentage}%)</span>
                                                </div>
                                                <div class="w-full h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full overflow-hidden">
                                                    <div class="h-full bg-gradient-to-r ${cat.gradient} rounded-full transition-all" style="width: ${percentage}%"></div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            ` : ''}

                            <div>
                                <h4 class="text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3">Harcama Listesi (${filteredExpenses.length} adet)</h4>
                                <div class="space-y-2 max-h-64 overflow-y-auto">
                                    ${filteredExpenses.length > 0 ? filteredExpenses.map((exp, idx) => {
                                        const noteId = `analysis-note-${idx}`;
                                        return `
                                            <div onclick="toggleNote('${noteId}')" class="cursor-pointer ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} p-3 rounded-xl transition-colors">
                                                <div class="flex justify-between items-start">
                                                    <div>
                                                        <div class="flex items-center gap-2 text-xs mb-1">
                                                            <span>${state.categories[exp.category].icon}</span>
                                                            <span class="px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-600'} font-medium">${exp.subcategory}</span>
                                                            <span class="${isDark ? 'text-gray-500' : 'text-gray-400'}">${new Date(exp.date).toLocaleDateString('tr-TR')}</span>
                                                        </div>
                                                        <div class="font-bold ${isDark ? 'text-white' : 'text-gray-800'}">₺${formatTL(exp.amount)}</div>
                                                        ${exp.goldGrams ? `<div class="text-[10px] ${isDark ? 'text-amber-400' : 'text-amber-500'}">≈ ${exp.goldGrams}g altın</div>` : ''}
                                                    </div>
                                                </div>
                                                ${exp.note ? `<div id="${noteId}" class="hidden mt-2 pt-2 ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-600'} border-t text-sm italic">📝 ${guvenliYazi(exp.note)}</div>` : ''}
                                            </div>
                                        `;
                                    }).join('') : `<div class="text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}">Bu filtrelere uygun harcama bulunamadı</div>`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            })() : ''}

            ${state.toastMessage ? `<div class="toast fixed bottom-6 left-1/2 transform -translate-x-1/2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} border shadow-2xl rounded-xl px-6 py-3 z-50 flex items-center gap-3"><span class="${isDark ? 'text-gray-200' : 'text-gray-800'} font-medium">${state.toastMessage}</span></div>` : ''}
        </div>
             ${state.showProfileModal ? `
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]" onclick="if(event.target === this) closeProfileModal()">
                <div class="modal-enter ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

                    <div class="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div class="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 class="font-bold text-xl">Hesap Ayarları</h3>
                                <p class="text-gray-400 text-xs mt-1">Bilgilerinizi güncelleyin</p>
                            </div>
                            <button onclick="closeProfileModal()" class="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="p-6 space-y-5">
                        <div class="flex items-center gap-4 p-4 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-amber-50'} border ${isDark ? 'border-gray-600' : 'border-amber-100'}">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                ${state.currentUser.email[0].toUpperCase()}
                            </div>
                            <div>
                                <div class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase">Giriş Yapılan Hesap</div>
                                <div class="font-medium ${isDark ? 'text-white' : 'text-gray-800'} break-all">${state.currentUser.email}</div>
                            </div>
                        </div>

                        <div class="space-y-4">

                            <div>
                                <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-1 mb-1 block">E-posta Değiştir</label>
                                <div class="relative">
                                    <span class="absolute left-4 top-3.5 text-gray-400">📧</span>
                                    <input type="email"
                                        value="${state.profileForm.newEmail}"
                                        oninput="state.profileForm.newEmail = this.value"
                                        class="w-full pl-11 pr-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-amber-500' : 'bg-white border-gray-200 focus:border-amber-400'} outline-none transition-all"
                                        placeholder="Yeni e-posta adresi">
                                </div>
                            </div>

                            <div>
                                <label class="text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-1 mb-1 block">Şifre Değiştir (İsteğe Bağlı)</label>
                                <div class="relative">
                                    <span class="absolute left-4 top-3.5 text-gray-400">🔒</span>
                                    <input type="password"
                                        value="${state.profileForm.newPassword}"
                                        oninput="state.profileForm.newPassword = this.value"
                                        class="w-full pl-11 pr-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-amber-500' : 'bg-white border-gray-200 focus:border-amber-400'} outline-none transition-all"
                                        placeholder="Yeni şifre (Boş bırakılabilir)">
                                </div>
                            </div>

                            <div class="w-full h-px ${isDark ? 'bg-gray-700' : 'bg-gray-100'} my-2"></div>

                            <div class="${isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'} border p-4 rounded-xl">
                                <label class="text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'} mb-1 block flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                    Güvenlik Doğrulaması
                                </label>
                                <input type="password"
                                    value="${state.profileForm.currentPassword}"
                                    oninput="state.profileForm.currentPassword = this.value"
                                    class="w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-800 border-red-900/30 text-white placeholder-red-400/30 focus:border-red-500' : 'bg-white border-red-200 placeholder-red-300 focus:border-red-400'} outline-none transition-all text-sm"
                                    placeholder="⚠️ Mevcut şifrenizi girin">
                            </div>
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button onclick="closeProfileModal()" class="flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">
                                Vazgeç
                            </button>
                            <button onclick="handleUpdateProfile()" class="flex-[2] py-3 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:shadow-lg hover:scale-[1.02] transition-all flex justify-center items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                Değişiklikleri Kaydet
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            ` : ''}
            ${state.showSecurityModal ? `
            <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
                <div class="modal-enter ${isDark ? 'bg-gray-800 border border-red-900/50' : 'bg-white'} rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center relative">

                    <div class="bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-inner">
                            <span class="text-3xl">🔒</span>
                        </div>
                        <h3 class="font-bold text-xl relative z-10">Güvenlik Kontrolü</h3>
                        <p class="text-red-100 text-xs mt-1 relative z-10">Bu işlem geri alınamaz!</p>
                    </div>

                    <div class="p-6 space-y-5">
                        <p class="text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium">
                            Devam etmek için lütfen hesap şifrenizi girin.
                        </p>

                        <div class="relative">
                            <input type="password"
                                id="securityPasswordInput"
                                value="${state.securityPassword}"
                                oninput="state.securityPassword = this.value"
                                onkeydown="if(event.key === 'Enter') confirmSecurityAction()"
                                class="w-full px-4 py-3 rounded-xl border-2 text-center text-lg tracking-widest ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} outline-none transition-all"
                                placeholder="••••••">
                        </div>

                        ${state.securityError ? `
                            <div class="text-red-500 text-sm font-bold bg-red-100/10 py-2 rounded-lg animate-pulse">
                                ${state.securityError}
                            </div>
                        ` : ''}

                        <div class="flex gap-3 pt-2">
                            <button onclick="closeSecurityModal()" class="flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">
                                İptal
                            </button>
                            <button onclick="confirmSecurityAction()" class="flex-[2] py-3 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg hover:scale-[1.02] transition-all flex justify-center items-center gap-2">
                                ${state.loading ? '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>' : '🗑️ Onayla ve Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            ${state.showFinalConfirmation ? `
            <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
                <div class="modal-enter ${isDark ? 'bg-gray-800 border border-red-900/50' : 'bg-white'} rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center relative">

                    <div class="bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-inner animate-pulse">
                            <span class="text-3xl">⚠️</span>
                        </div>
                        <h3 class="font-bold text-xl relative z-10">Son Kararınız Mı?</h3>
                    </div>

                    <div class="p-6 space-y-4">
                        <div class="${isDark ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-800'} p-4 rounded-xl text-sm font-medium border ${isDark ? 'border-red-900/30' : 'border-red-100'}">
                            Bu işlem <strong>GERİ ALINAMAZ</strong>. Veriler kalıcı olarak silinecektir.
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button onclick="cancelFinalAction()" class="flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors">
                                Vazgeç
                            </button>
                            <button onclick="executeFinalAction()" class="flex-[2] py-3 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg hover:scale-[1.05] transition-all shadow-red-500/30">
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
    `;

    if (state.showModal) {
        setTimeout(() => {
            const eIn = document.getElementById('newExpense');
            const nIn = document.getElementById('expenseNote');
            if(eIn) eIn.oninput = () => window.updateRealTimeUI();
            if(nIn) nIn.oninput = () => window.updateRealTimeUI();
            window.updateRealTimeUI();
        }, 0);
    }
}

window.render = render;

export { render };
