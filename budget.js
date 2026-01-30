// budget.js - Akıllı Maaş Döngüsü Versiyonu 🧠

export function getBudgetHTML(state, isDark, formatTL, monthNames) {
    const limit = state.monthlyBudget || 0;
    const startDay = state.budgetStartDay || 1; // Kullanıcının seçtiği gün (Örn: 15)

    // --- TARİH HESAPLAMA MOTORU ---
    const today = new Date();
    let startDate, endDate;

    // Eğer bugün, seçilen günden büyükse veya eşitse (Örn: Bugün ayın 20'si, Maaş 15'i)
    // O zaman döngü BU AYIN 15'inde başladı.
    if (today.getDate() >= startDay) {
        startDate = new Date(today.getFullYear(), today.getMonth(), startDay);
        // Bitiş tarihi: Gelecek ayın (seçilen gün - 1)'i
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, startDay - 1); 
    } 
    // Eğer bugün, seçilen günden küçükse (Örn: Bugün ayın 10'u, Maaş 15'i)
    // O zaman döngü GEÇEN AYIN 15'inde başladı.
    else {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, startDay);
        endDate = new Date(today.getFullYear(), today.getMonth(), startDay - 1);
    }

    // Saat ayarı (Tam kapsama için)
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Başlık metni oluştur (Örn: 15 Oca - 14 Şub)
    const startStr = `${startDate.getDate()} ${monthNames[startDate.getMonth()].slice(0,3)}`;
    const endStr = `${endDate.getDate()} ${monthNames[endDate.getMonth()].slice(0,3)}`;
    const periodTitle = startDay === 1 
        ? `AYLIK BÜTÇE (${monthNames[today.getMonth()]})` // Ayın 1'i ise klasik göster
        : `DÖNEM BÜTÇESİ (${startStr} - ${endStr})`;    // Değilse aralık göster

    // --- HARCAMA TOPLAMA ---
    let currentPeriodTotal = 0;
    
    // Tüm harcamaları gez ve tarih aralığına uyanları topla
    for (const dateKey in state.expenses) {
        // dateKey formatı: "2026-01-30" -> Date objesine çevir
        const expDate = new Date(dateKey);
        expDate.setHours(12, 0, 0, 0); // Saat farkı sorunu olmasın diye öğlen yapıyoruz

        if (expDate >= startDate && expDate <= endDate) {
            state.expenses[dateKey].forEach(exp => currentPeriodTotal += exp.amount);
        }
    }

    // --- HTML ÇIKTISI (Eski kodla aynı, sadece başlık dinamik) ---
    
    if (limit === 0) {
        return `
            <div onclick="setMonthlyBudget()" class="mb-6 cursor-pointer group">
                <div class="${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-amber-100'} border rounded-xl p-4 card-shadow flex items-center justify-between transition-all hover:scale-[1.01]">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-amber-50 text-amber-600'} group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        </div>
                        <div>
                            <div class="font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}">Bütçe Döngüsü Belirle</div>
                            <div class="text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}">Maaş gününü ve limitini ayarla</div>
                        </div>
                    </div>
                    <span class="text-amber-500 font-bold text-sm">+ Ayarla</span>
                </div>
            </div>
        `;
    }

    // Hesaplamalar
    const percent = Math.min((currentPeriodTotal / limit) * 100, 100);
    let barColor = 'bg-green-500'; 
    let message = 'Harika gidiyorsun! 👍';
    
    if (percent > 100) { barColor = 'bg-red-600'; message = 'Limit aşıldı! 🚨'; } 
    else if (percent > 85) { barColor = 'bg-red-500'; message = 'Dikkat, limit dolmak üzere! ⚠️'; } 
    else if (percent > 50) { barColor = 'bg-yellow-500'; message = 'Yarısını geçtin.'; }

    const remaining = limit - currentPeriodTotal;
    const remainingText = remaining >= 0 
        ? `Kalan: ₺${formatTL(remaining)}` 
        : `Aşılan: ₺${formatTL(Math.abs(remaining))}`;

    return `
        <div onclick="setMonthlyBudget()" class="mb-6 cursor-pointer group">
            <div class="${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-amber-100'} border rounded-xl p-4 card-shadow relative overflow-hidden">
                
                <div class="flex justify-between items-end mb-2 relative z-10">
                    <div>
                        <div class="text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-1">${periodTitle}</div>
                        <div class="text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}" style="font-family: 'Outfit', sans-serif;">
                            ₺${formatTL(currentPeriodTotal)} 
                            <span class="text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}">/ ₺${formatTL(limit)}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-bold ${remaining >= 0 ? (isDark ? 'text-green-400' : 'text-green-600') : 'text-red-500'} mb-1">${remainingText}</div>
                        <div class="text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}">${message}</div>
                    </div>
                </div>

                <div class="w-full h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full overflow-hidden relative z-10">
                    <div class="h-full ${barColor} transition-all duration-1000 ease-out relative" style="width: ${percent}%">
                        <div class="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]" style="transform: skewX(-20deg);"></div>
                    </div>
                </div>

                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-xs bg-black/50 text-white px-2 py-1 rounded">✏️ Düzenle</span>
                </div>
            </div>
        </div>
    `;
}