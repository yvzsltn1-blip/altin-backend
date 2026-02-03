import { BACKEND_URL } from './config.js';
import { state } from './state.js';
import { saveExpensesToFirebase } from './firebase-data.js';
import { showToast } from './toast.js';

async function checkAndFixFutureExpenses() {
    console.log("🕵️‍♂️ Dedektif çalıştı: Tahmini harcamalar kontrol ediliyor...");

    const todayStr = new Date().toISOString().split('T')[0];
    let needsSave = false;
    let updateCount = 0;

    for (const dateKey in state.expenses) {
        if (dateKey > todayStr) continue;

        for (const exp of state.expenses[dateKey]) {
            if (exp.isEstimated === true) {
                console.log(`🔄 Güncelleniyor: ${dateKey} tarihli harcama...`);

                const dateParts = dateKey.split('-');
                try {
                    const response = await fetch(`${BACKEND_URL}/api/altin/${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`);
                    const data = await response.json();

                    if (data.basarili && data.gram_altin > 0) {
                        exp.goldPrice = data.gram_altin;
                        exp.goldGrams = (exp.amount / data.gram_altin).toFixed(4);
                        exp.isEstimated = false;

                        needsSave = true;
                        updateCount++;
                    }
                } catch (err) {
                    console.error("Otomatik güncelleme hatası:", err);
                }
            }
        }
    }

    if (needsSave) {
        await saveExpensesToFirebase();
        window.render();
        showToast(`✅ ${updateCount} adet harcamanın altın kuru güncellendi!`);
    }
}

window.checkAndFixFutureExpenses = checkAndFixFutureExpenses;

export { checkAndFixFutureExpenses };
