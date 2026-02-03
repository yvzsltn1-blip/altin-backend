import { db, doc, setDoc, getDoc } from './config.js';
import { state, defaultCategories } from './state.js';

async function saveExpensesToFirebase() {
    if (!state.currentUser) return;
    try {
        // Sadece harcamaları ve kategorileri kaydet, bütçeye DOKUNMA!
        await setDoc(doc(db, "users", state.currentUser.uid), {
            email: state.currentUser.email,
            expenses: state.expenses,
            categories: state.categories,
            updatedAt: new Date().toISOString()
        }, { merge: true }); // merge: true sayesinde bütçe verisi silinmez, korunur.
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

// SADECE BÜTÇEYİ KAYDEDEN YENİ FONKSİYON
async function saveBudgetToFirebase() {
    if (!state.currentUser) return;
    try {
        await setDoc(doc(db, "users", state.currentUser.uid), {
            monthlyBudget: state.monthlyBudget,
            budgetStartDay: state.budgetStartDay,
            updatedAt: new Date().toISOString()
        }, { merge: true }); // merge: true sayesinde harcamalara dokunmaz
    } catch (e) { console.error('Bütçe kaydetme hatası:', e); }
}

export { saveExpensesToFirebase, loadExpensesFromFirebase, saveBudgetToFirebase };
