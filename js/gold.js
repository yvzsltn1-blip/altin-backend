import { BACKEND_URL } from './config.js';
import { state } from './state.js';
import { formatTL } from './helpers.js';

async function fetchGoldPrice(date) {
    state.loadingGold = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    let isFuture = checkDate > today;
    let fetchDate = date;

    if (isFuture) {
        fetchDate = new Date();
    }

    updateGoldPriceUI(isFuture);

    const year = fetchDate.getFullYear();
    const month = fetchDate.getMonth() + 1;
    const day = fetchDate.getDate();

    try {
        const response = await fetch(`${BACKEND_URL}/api/altin/${year}/${month}/${day}`);
        const data = await response.json();

        if (data.basarili) {
            state.goldPrice = {
                price: data.gram_altin,
                date: data.tarih,
                isEstimated: isFuture
            };
        } else {
            state.goldPrice = { error: data.hata || 'Fiyat bulunamadı' };
        }
    } catch (e) {
        state.goldPrice = { error: 'Veri alınamadı (Piyasa kapalı olabilir)' };
    }

    state.loadingGold = false;
    updateGoldPriceUI(isFuture);
}

function updateGoldPriceUI(isFuture = false) {
    const goldPriceArea = document.getElementById('gold-price-area');
    if (!goldPriceArea) return;

    const isDark = state.darkMode;

    if (state.loadingGold) {
        goldPriceArea.innerHTML = `<span class="${isDark ? 'text-gray-400' : 'text-gray-500'} animate-pulse">Kur Yükleniyor...</span>`;
    } else if (state.goldPrice?.price) {
        let html = `<div class="flex flex-col items-end">`;

        html += `<span class="text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}">₺${formatTL(state.goldPrice.price)}</span>`;

        if (state.goldPrice.isEstimated || isFuture) {
            html += `<span class="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Bugünün Kuru
                     </span>`;
        }

        html += `</div>`;
        goldPriceArea.innerHTML = html;

    } else {
        goldPriceArea.innerHTML = `<span class="${isDark ? 'text-red-400' : 'text-red-500'} text-sm">${state.goldPrice?.error || 'Veri yok'}</span>`;
    }
}

export { fetchGoldPrice, updateGoldPriceUI };
