import { state } from './state.js';

window.openAnalysis = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    state.showAnalysis = true;
    state.analysisDateStart = firstDayOfMonth.toISOString().split('T')[0];
    state.analysisDateEnd = today.toISOString().split('T')[0];
    state.analysisCategory = 'all';
    state.analysisSubcategory = 'all';
    state.analysisSearchText = '';
    window.render();
};

window.closeAnalysis = () => {
    state.showAnalysis = false;
    window.render();
};

window.setAnalysisDateStart = (value) => {
    state.analysisDateStart = value;
    window.render();
};

window.setAnalysisDateEnd = (value) => {
    state.analysisDateEnd = value;
    window.render();
};

window.setAnalysisCategory = (value) => {
    state.analysisCategory = value;
    state.analysisSubcategory = 'all';
    window.render();
};

window.setAnalysisSubcategory = (value) => {
    state.analysisSubcategory = value;
    window.render();
};

window.setAnalysisSearch = (value) => {
    state.analysisSearchText = value;
    window.render();
};

window.setQuickDateRange = (range) => {
    const today = new Date();
    let startDate = new Date();

    switch(range) {
        case 'today':
            startDate = new Date(today);
            break;
        case 'week':
            const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
            startDate.setDate(today.getDate() - dayOfWeek + 1);
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case '3months':
            startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
        case 'all':
            startDate = new Date(2020, 0, 1);
            break;
    }

    state.analysisDateStart = startDate.toISOString().split('T')[0];
    state.analysisDateEnd = today.toISOString().split('T')[0];
    window.render();
};

function getFilteredExpenses() {
    const startDateStr = state.analysisDateStart || null;
    const endDateStr = state.analysisDateEnd || null;

    const filtered = [];

    for (const dateKey in state.expenses) {
        if (startDateStr && dateKey < startDateStr) continue;
        if (endDateStr && dateKey > endDateStr) continue;

        for (const exp of state.expenses[dateKey]) {
            if (state.analysisCategory !== 'all' && exp.category !== state.analysisCategory) continue;
            if (state.analysisSubcategory !== 'all' && exp.subcategory !== state.analysisSubcategory) continue;

            if (state.analysisSearchText) {
                const searchLower = state.analysisSearchText.toLowerCase();
                const noteMatch = exp.note && exp.note.toLowerCase().includes(searchLower);
                const subMatch = exp.subcategory.toLowerCase().includes(searchLower);
                if (!noteMatch && !subMatch) continue;
            }

            filtered.push({
                ...exp,
                date: dateKey
            });
        }
    }

    filtered.sort((a, b) => b.date.localeCompare(a.date));

    return filtered;
}

function calculateAnalysisStats(expenses) {
    if (expenses.length === 0) {
        return {
            totalAmount: 0,
            totalGold: 0,
            count: 0,
            avgDaily: 0,
            maxDay: null,
            maxDayAmount: 0,
            topCategory: null,
            topSubcategory: null,
            categoryBreakdown: {},
            dailyBreakdown: {}
        };
    }

    let totalAmount = 0;
    let totalGold = 0;
    const categoryTotals = {};
    const subcategoryTotals = {};
    const dailyTotals = {};

    for (const exp of expenses) {
        totalAmount += exp.amount;
        if (exp.goldGrams) totalGold += parseFloat(exp.goldGrams);

        if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
        categoryTotals[exp.category] += exp.amount;

        const subKey = `${exp.category}|${exp.subcategory}`;
        if (!subcategoryTotals[subKey]) subcategoryTotals[subKey] = 0;
        subcategoryTotals[subKey] += exp.amount;

        if (!dailyTotals[exp.date]) dailyTotals[exp.date] = 0;
        dailyTotals[exp.date] += exp.amount;
    }

    let maxDay = null;
    let maxDayAmount = 0;
    for (const day in dailyTotals) {
        if (dailyTotals[day] > maxDayAmount) {
            maxDayAmount = dailyTotals[day];
            maxDay = day;
        }
    }

    let topCategory = null;
    let topCategoryAmount = 0;
    for (const cat in categoryTotals) {
        if (categoryTotals[cat] > topCategoryAmount) {
            topCategoryAmount = categoryTotals[cat];
            topCategory = cat;
        }
    }

    let topSubcategory = null;
    let topSubAmount = 0;
    for (const sub in subcategoryTotals) {
        if (subcategoryTotals[sub] > topSubAmount) {
            topSubAmount = subcategoryTotals[sub];
            topSubcategory = sub.split('|')[1];
        }
    }

    const uniqueDays = Object.keys(dailyTotals).length;
    const avgDaily = uniqueDays > 0 ? totalAmount / uniqueDays : 0;

    return {
        totalAmount,
        totalGold,
        count: expenses.length,
        avgDaily,
        maxDay,
        maxDayAmount,
        topCategory,
        topSubcategory,
        categoryBreakdown: categoryTotals,
        dailyBreakdown: dailyTotals
    };
}

export { getFilteredExpenses, calculateAnalysisStats };
