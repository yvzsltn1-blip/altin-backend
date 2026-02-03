import { state } from './state.js';

function formatTL(n) { return Math.round(n).toLocaleString('tr-TR'); }

function getDaysInMonth() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const first = new Date(year, month, 1);
    let start = first.getDay() - 1; if (start < 0) start = 6;
    return { daysInMonth: new Date(year, month + 1, 0).getDate(), startingDay: start };
}

function getTotalForDay(day) {
    const targetDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), day);
    const k = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    const exps = state.expenses[k];
    return exps ? exps.reduce((s, e) => s + e.amount, 0) : 0;
}

function getCategoryTotals(categoryKey) {
    let total = 0;
    let totalGold = 0;

    for (const dateKey in state.expenses) {
        if (state.expenses[dateKey]) {
            for (const exp of state.expenses[dateKey]) {
                if (exp.category === categoryKey) {
                    total += exp.amount;
                    if (exp.goldGrams) totalGold += parseFloat(exp.goldGrams);
                }
            }
        }
    }

    return { total, totalGold };
}

function getCategoryPeriodDetails(categoryKey, period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = null;
    let endDate = null;

    if (period === 'today') {
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek + 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    let total = 0;
    let totalGold = 0;
    const subcategoryData = {};

    state.categories[categoryKey].subcategories.forEach(sub => {
        subcategoryData[sub] = { total: 0, gold: 0, items: [] };
    });

    for (const dateKey in state.expenses) {
        const expDate = new Date(dateKey);
        if (period !== 'total') {
            if (expDate < startDate || expDate > endDate) continue;
        }

        if (state.expenses[dateKey]) {
            for (const exp of state.expenses[dateKey]) {
                if (exp.category !== categoryKey) continue;

                total += exp.amount;
                if (exp.goldGrams) totalGold += parseFloat(exp.goldGrams);

                if (subcategoryData[exp.subcategory]) {
                    subcategoryData[exp.subcategory].total += exp.amount;
                    if (exp.goldGrams) subcategoryData[exp.subcategory].gold += parseFloat(exp.goldGrams);
                    subcategoryData[exp.subcategory].items.push({
                        ...exp,
                        date: dateKey
                    });
                }
            }
        }
    }

    return { total, totalGold, subcategoryData };
}

export { formatTL, getDaysInMonth, getTotalForDay, getCategoryTotals, getCategoryPeriodDetails };
