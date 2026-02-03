import { db, doc, setDoc, getDoc } from './config.js';
import { state, defaultCategories } from './state.js';

async function saveExpensesToFirebase() {
    if (!state.currentUser) return;
    try {
        await setDoc(doc(db, "users", state.currentUser.uid), {
            email: state.currentUser.email,
            expenses: state.expenses,
            categories: state.categories,
            monthlyBudget: state.monthlyBudget || 0,
            budgetStartDay: state.budgetStartDay || 1,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (e) { console.error('Hata:', e); }
}

async function loadExpensesFromFirebase() {
    if (!state.currentUser) return;
    try {
        const docSnap = await getDoc(doc(db, "users", state.currentUser.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            state.expenses = data.expenses || {};
            state.monthlyBudget = data.monthlyBudget || 0;
            state.budgetStartDay = data.budgetStartDay || 1;

            if (data.categories) {
                state.categories = data.categories;
            } else {
                state.categories = defaultCategories;
            }
        } else {
            state.expenses = {};
            state.categories = defaultCategories;
            state.monthlyBudget = 0;
        }
    } catch (e) { console.error('Veri yükleme hatası:', e); }
}

export { saveExpensesToFirebase, loadExpensesFromFirebase };
