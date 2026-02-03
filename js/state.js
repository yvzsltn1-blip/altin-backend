let defaultCategories = {
    zorunlu: { name: "Zorunlu", color: "red", icon: "⚠️", gradient: "from-red-500 to-rose-600", subcategories: ["Faturalar", "Kira", "Market", "Sağlık", "Ulaşım", "Eğitim", "Diğer"] },
    orta: { name: "Orta", color: "amber", icon: "⚖️", gradient: "from-amber-500 to-orange-500", subcategories: ["Giyim", "Ev Eşyası", "Bakım", "Telefon/İnternet", "Sigorta", "Diğer"] },
    keyfi: { name: "Keyfi", color: "green", icon: "🎉", gradient: "from-green-500 to-emerald-600", subcategories: ["Yemek Siparişi", "Gezme/Eğlence", "Hobi", "Abonelikler", "Hediye", "Diğer"] }
};

const periods = {
    today: { name: "Bugün", icon: "📅" },
    week: { name: "Bu Hafta", icon: "📆" },
    month: { name: "Bu Ay", icon: "🗓️" },
    total: { name: "Toplam", icon: "📊" }
};

let state = {
    currentUser: null,
    showSecurityModal: false,
    securityPassword: '',
    pendingAction: null,
    securityError: '',
    showBudgetModal: false,
    showMobileMenu: false,
    budgetStartDay: 1,
    currentDate: new Date(),
    selectedDate: null,
    showProfileModal: false,
    profileForm: {
        currentPassword: '',
        newEmail: '',
        newPassword: ''
    },
    expenses: {},
    categories: defaultCategories,
    showModal: false,
    subcategoryEditMode: false,
    monthlyBudget: 0,
    showDeleteMenu: false,
    showYearSelector: false,
    showExportMenu: false,
    activeCategoryCard: null,
    selectedPeriod: null,
    expandedSubcategory: null,
    expandedNotes: {},
    newExpense: '',
    expenseNote: '',
    selectedCategory: '',
    selectedSubcategory: '',
    goldPrice: null,
    loadingGold: false,
    loginForm: { email: '', password: '', name: '' },
    loginError: '',
    isRegistering: false,
    loading: true,
    darkMode: localStorage.getItem('darkMode') === 'true',
    editingExpense: null,
    toastMessage: null,
    pendingVerification: false,
    verificationEmail: '',
    verificationCode: '',
    codeInput: ['', '', '', ''],
    codeExpiry: null,
    codeSending: false,
    tempPassword: '',
    // ANALİZ SAYFASI STATE'LERİ
    showAnalysis: false,
    analysisDateStart: null,
    analysisDateEnd: null,
    analysisCategory: 'all',
    analysisSubcategory: 'all',
    analysisSearchText: ''
};

window.state = state;

const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// Dark mode'u başlangıçta uygula
if (state.darkMode) {
    document.documentElement.classList.add('dark');
}

export { state, defaultCategories, periods, monthNames, dayNames };
