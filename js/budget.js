// budget.js - Kompakt & Şık Versiyon 🤏✨

export function getBudgetHTML(state, isDark, formatTL, monthNames) {
    const limit = state.monthlyBudget || 0;
    const startDay = state.budgetStartDay || 1; 

    // --- TARİH HESAPLAMA MOTORU ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    let startDate, endDate;

    if (today.getDate() >= startDay) {
        startDate = new Date(today.getFullYear(), today.getMonth(), startDay);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, startDay - 1); 
    } else {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, startDay);
        endDate = new Date(today.getFullYear(), today.getMonth(), startDay - 1);
    }
    
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    const periodTitle = startDay === 1 
        ? `${monthNames[today.getMonth()]} Bütçesi` 
        : `Dönem: ${startDate.getDate()} ${monthNames[startDate.getMonth()].slice(0,3)} - ${endDate.getDate()} ${monthNames[endDate.getMonth()].slice(0,3)}`;    

    // --- HARCAMA TOPLAMA ---
    let currentPeriodTotal = 0;
    for (const dateKey in state.expenses) {
        const expDate = new Date(dateKey);
        expDate.setHours(12, 0, 0, 0); 

        if (expDate >= startDate && expDate <= endDate) {
            state.expenses[dateKey].forEach(exp => currentPeriodTotal += exp.amount);
        }
    }

    // --- BÜTÇE YOKSA ---
    if (limit === 0) {
        return `
            <div onclick="openBudgetModal()" class="mb-4 cursor-pointer group">
                <div class="${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-amber-100'} border rounded-2xl p-4 card-shadow flex items-center justify-between transition-all hover:scale-[1.01] relative overflow-hidden">
                    <div class="flex items-center gap-3 z-10">
                        <div class="p-2 rounded-full ${isDark ? 'bg-gray-700 text-amber-400' : 'bg-amber-50 text-amber-600'} group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        </div>
                        <div>
                            <div class="font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}">Bütçe Hedefi Belirle</div>
                            <div class="text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}">Aylık harcama limitini ayarla</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- ANALİZ ---
    const oneDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;
    const daysPassed = Math.round(Math.abs((today - startDate) / oneDay)) + 1;
    
    const timePercent = (daysPassed / totalDays) * 100;
    const budgetPercent = (currentPeriodTotal / limit) * 100;
    const deviation = budgetPercent - timePercent;

    let barColor = 'bg-emerald-500'; 
    let message = '';
    let statusIcon = '👍';
    
    if (currentPeriodTotal > limit) {
        barColor = 'bg-red-600';
        message = 'Limit aşıldı! 🚨';
        statusIcon = '🚨';
    } else {
        if (deviation < -15) {
            barColor = 'bg-emerald-500';
            message = 'Tasarruf modundasın';
            statusIcon = '👑';
        } else if (deviation <= 5) {
            barColor = 'bg-green-500';
            message = 'Her şey dengeli';
            statusIcon = '👌';
        } else if (deviation <= 15) {
            barColor = 'bg-yellow-500';
            message = 'Biraz hızlı gidiyorsun';
            statusIcon = '⚠️';
        } else {
            barColor = 'bg-orange-600';
            message = 'Bütçe alarm veriyor 🔥';
            statusIcon = '🔥';
        }
    }

    const visualPercent = Math.min(budgetPercent, 100);
    const remaining = limit - currentPeriodTotal;
    const remainingText = remaining >= 0 
        ? `Kalan: ₺${formatTL(remaining)}` 
        : `Aşılan: ₺${formatTL(Math.abs(remaining))}`;

    // --- KOMPAKT HTML ---
    return `
        <div class="mb-4 group relative">
            <div class="${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-white border-amber-100'} border rounded-2xl p-4 card-shadow relative overflow-hidden transition-all hover:shadow-md">
                
                <button onclick="openBudgetModal()" class="absolute top-3 right-3 z-20 p-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-sm transition-all duration-300 opacity-50 hover:opacity-100
                    ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-amber-400' : 'bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600'}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>

                <div class="flex justify-between items-end mb-3 relative z-10">
                    <div>
                        <div class="text-[10px] font-bold ${isDark ? 'text-amber-500/80' : 'text-amber-600/80'} uppercase tracking-wider mb-0.5">${periodTitle}</div>
                        <div class="flex items-baseline gap-1.5">
                            <div class="text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}" style="font-family: 'Outfit', sans-serif;">
                                ₺${formatTL(currentPeriodTotal)}
                            </div>
                            <span class="text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}">/ ₺${formatTL(limit)}</span>
                        </div>
                    </div>
                    
                    <div class="text-right mr-8">
                        <div class="text-xs font-bold ${remaining >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-red-500'}">
                           ${remainingText}
                        </div>
                        <div class="text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}">%${Math.round(budgetPercent)} Harcandı</div>
                    </div>
                </div>

                <div class="relative h-2.5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-full overflow-hidden mb-2">
                    <div class="h-full ${barColor} transition-all duration-1000 ease-out relative" style="width: ${visualPercent}%"></div>
                    <div class="absolute top-0 bottom-0 w-0.5 bg-black/20 dark:bg-white/30 z-10" style="left: ${Math.min(timePercent, 100)}%" title="Bugün"></div>
                </div>

                <div class="flex items-center gap-2 text-xs">
                    <span class="text-base">${statusIcon}</span>
                    <span class="${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium truncate">${message}</span>
                </div>

            </div>
        </div>
    `;
}