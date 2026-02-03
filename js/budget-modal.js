import { state } from './state.js';
import { saveExpensesToFirebase } from './firebase-data.js';
import { showToast } from './toast.js';
import { formatTL } from './helpers.js';

window.openBudgetModal = () => {
    state.showBudgetModal = true;
    window.render();

    setTimeout(() => {
        const amountInput = document.getElementById('budgetAmountInput');
        const dayInput = document.getElementById('budgetDayInput');
        if (amountInput) amountInput.value = state.monthlyBudget || 0;
        if (dayInput) dayInput.value = state.budgetStartDay || 1;
    }, 50);
};

window.closeBudgetModal = () => {
    state.showBudgetModal = false;
    window.render();
};

window.saveBudgetSettings = async () => {
    const amountVal = document.getElementById('budgetAmountInput').value;
    const dayVal = document.getElementById('budgetDayInput').value;

    const amount = parseFloat(amountVal);
    const day = parseInt(dayVal);

    if (!isNaN(amount) && amount >= 0 && !isNaN(day) && day > 0 && day <= 31) {
        state.monthlyBudget = amount;
        state.budgetStartDay = day;

        state.showBudgetModal = false;
        await saveExpensesToFirebase();
        window.render();
        showToast(`✅ Bütçe güncellendi! (Hedef: ₺${formatTL(amount)})`);
    } else {
        showToast('⚠️ Geçersiz değer girdiniz. Lütfen kontrol edin.');
    }
};
