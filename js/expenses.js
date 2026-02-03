import { state } from './state.js';
import { saveExpensesToFirebase } from './firebase-data.js';
import { showToast } from './toast.js';
import { formatTL } from './helpers.js';

window.updateRealTimeUI = function() {
    const expenseInput = document.getElementById('newExpense');
    const noteInput = document.getElementById('expenseNote');

    if(expenseInput) state.newExpense = expenseInput.value;
    if(noteInput) state.expenseNote = noteInput.value;

    const previewDiv = document.getElementById('gold-calc-preview');
    const addBtn = document.getElementById('btn-add-expense');

    if (previewDiv) {
        if (state.newExpense && state.goldPrice?.price) {
            const grams = (parseFloat(state.newExpense) / state.goldPrice.price).toFixed(4);
            previewDiv.innerHTML = `
                <div class="bg-amber-900 dark:bg-amber-800 text-white rounded-xl p-3 text-center animate-pulse-once">
                    <div class="text-2xl font-bold">${grams} gr</div>
                    <div class="text-[10px] text-amber-300 opacity-70">Bu tutara alınabilecek altın</div>
                </div>
            `;
        } else {
            previewDiv.innerHTML = '';
        }
    }

    if (addBtn) {
        const isValid = state.newExpense && state.selectedCategory && state.selectedSubcategory;
        addBtn.disabled = !isValid;
        if (isValid) {
            addBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            addBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
};

window.editExpense = function(dateKey, index) {
    event.stopPropagation();
    const exp = state.expenses[dateKey][index];

    state.editingExpense = { dateKey, index };
    state.newExpense = exp.amount.toString();
    state.expenseNote = exp.note || '';
    state.selectedCategory = exp.category;
    state.selectedSubcategory = exp.subcategory;

    window.render();

    setTimeout(() => {
        const expInput = document.getElementById('newExpense');
        if (expInput) expInput.focus();
    }, 100);
};

window.cancelEdit = function() {
    state.editingExpense = null;
    state.newExpense = '';
    state.expenseNote = '';
    state.selectedCategory = '';
    state.selectedSubcategory = '';
    window.render();
};

window.handleAddExpense = async function() {
    if (!state.newExpense || !state.selectedCategory || !state.selectedSubcategory) return;

    const expense = {
        amount: parseFloat(state.newExpense),
        note: state.expenseNote || '',
        category: state.selectedCategory,
        subcategory: state.selectedSubcategory,
        goldPrice: state.goldPrice?.price,
        isEstimated: state.goldPrice?.isEstimated || false,
        goldGrams: state.goldPrice?.price ? (parseFloat(state.newExpense) / state.goldPrice.price).toFixed(4) : null,
        timestamp: Date.now()
    };

    if (state.editingExpense) {
        const { dateKey, index } = state.editingExpense;
        state.expenses[dateKey][index] = {
            ...state.expenses[dateKey][index],
            ...expense
        };
        state.editingExpense = null;
        showToast('✅ Harcama güncellendi!');
    } else {
        const d = state.selectedDate;
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!state.expenses[dateKey]) state.expenses[dateKey] = [];
        state.expenses[dateKey].push(expense);
        showToast('✅ Harcama eklendi!');
    }

    await saveExpensesToFirebase();
    state.newExpense = ''; state.expenseNote = ''; state.selectedCategory = ''; state.selectedSubcategory = '';
    window.render();
};

window.removeExpense = async function(dateKey, index) {
    if(confirm("Bu harcamayı silmek istediğine emin misin?")) {
        state.expenses[dateKey].splice(index, 1);

        if (state.expenses[dateKey].length === 0) delete state.expenses[dateKey];

        await saveExpensesToFirebase();
        showToast('🗑️ Harcama silindi!');
        window.render();
    }
};

window.deleteAllData = async () => {
    window.requestSecurityCheck(async () => {
        state.expenses = {};
        await saveExpensesToFirebase();
        showToast('🗑️ Tüm veriler silindi!');
        window.render();
    });
};

window.deleteLastWeek = async () => {
    window.requestSecurityCheck(async () => {
        const limit = new Date(); limit.setDate(limit.getDate() - 7);
        await filterExpenses(d => d < limit);
        showToast('🗑️ Son 1 hafta silindi!');
    });
};

window.deleteLastMonth = async () => {
    window.requestSecurityCheck(async () => {
        const limit = new Date(); limit.setMonth(limit.getMonth() - 1);
        await filterExpenses(d => d < limit);
        showToast('🗑️ Son 1 ay silindi!');
    });
};

async function filterExpenses(predicate) {
    const newExp = {};
    for(const k in state.expenses) { if(predicate(new Date(k))) newExp[k] = state.expenses[k]; }
    state.expenses = newExp; await saveExpensesToFirebase(); window.render();
}
