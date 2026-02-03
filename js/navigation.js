import { state } from './state.js';
import { fetchGoldPrice } from './gold.js';

window.prevMonth = () => { state.currentDate.setMonth(state.currentDate.getMonth() - 1); window.render(); };
window.nextMonth = () => { state.currentDate.setMonth(state.currentDate.getMonth() + 1); window.render(); };
window.changeYear = (y) => { state.currentDate.setFullYear(y); state.showYearSelector = false; window.render(); };
window.toggleYearSelector = () => { state.showYearSelector = !state.showYearSelector; window.render(); };
window.toggleDeleteMenu = () => { state.showDeleteMenu = !state.showDeleteMenu; window.render(); };
window.toggleExportMenu = () => { state.showExportMenu = !state.showExportMenu; window.render(); };

window.handleDateClick = (day) => {
    state.selectedDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), day);
    state.showModal = true;
    state.editingExpense = null;
    state.newExpense = '';
    state.expenseNote = '';
    state.selectedCategory = '';
    state.selectedSubcategory = '';
    state.goldPrice = null;
    state.loadingGold = true;
    window.render();
    fetchGoldPrice(state.selectedDate);
};

window.closeModal = () => {
    state.showModal = false;
    state.editingExpense = null;
    state.newExpense = '';
    state.expenseNote = '';
    state.selectedCategory = '';
    state.selectedSubcategory = '';
    window.render();
};

window.selectCategory = (cat) => {
    state.selectedCategory = cat;
    state.selectedSubcategory = '';
    window.render();
    window.updateRealTimeUI();
};

window.selectSubcategory = (sub) => {
    state.selectedSubcategory = sub;
    window.render();
    window.updateRealTimeUI();
};

window.changeMonth = (delta) => {
    state.currentDate.setMonth(state.currentDate.getMonth() + delta);
    window.render();
};
window.selectMonth = (m) => {
    state.currentDate.setMonth(parseInt(m));
    window.render();
};
window.selectYear = (y) => {
    state.currentDate.setFullYear(parseInt(y));
    window.render();
};

window.toggleMobileMenu = () => {
    state.showMobileMenu = !state.showMobileMenu;
    window.render();
};
