import { state } from './state.js';
import { saveExpensesToFirebase } from './firebase-data.js';
import { showToast } from './toast.js';

window.toggleCategoryCard = (catKey) => {
    if (state.activeCategoryCard === catKey) {
        state.activeCategoryCard = null;
        state.selectedPeriod = null;
        state.expandedSubcategory = null;
    } else {
        state.activeCategoryCard = catKey;
        state.selectedPeriod = null;
        state.expandedSubcategory = null;
    }
    window.render();
};

window.selectPeriod = (e, period) => {
    e.stopPropagation();
    if (state.selectedPeriod === period) {
        state.selectedPeriod = null;
        state.expandedSubcategory = null;
    } else {
        state.selectedPeriod = period;
        state.expandedSubcategory = null;
    }
    window.render();
};

window.toggleSubcategoryDetail = (e, subKey) => {
    e.stopPropagation();
    state.expandedSubcategory = (state.expandedSubcategory === subKey) ? null : subKey;
    window.render();
};

window.toggleNote = (id, event) => {
    if(event) event.stopPropagation();
    const noteEl = document.getElementById(id);
    if(noteEl) {
        if(noteEl.classList.contains('hidden')) {
            noteEl.classList.remove('hidden');
        } else {
            noteEl.classList.add('hidden');
        }
    }
};

window.addCustomSubcategory = async (mainCategoryKey) => {
    const newName = prompt("Yeni alt kategori ismi nedir?");

    if (newName && newName.trim() !== "") {
        state.categories[mainCategoryKey].subcategories.push(newName.trim());

        await saveExpensesToFirebase();

        window.render();
        showToast(`✅ ${newName} eklendi!`);
    }
};

window.toggleSubcategoryEditMode = () => {
    state.subcategoryEditMode = !state.subcategoryEditMode;
    window.render();
};

window.handleSubcategoryEdit = async (mainCat, subName) => {
    const choice = prompt(
        `"${subName}" için işlem seçin:\n\n1. İsmini değiştirmek için yeni ismi yazın.\n2. Silmek için kutuyu tamamen BOŞ bırakıp Tamam'a basın.`,
        subName
    );

    if (choice === null) return;

    const categoryList = state.categories[mainCat].subcategories;
    const index = categoryList.indexOf(subName);

    if (index > -1) {
        if (choice.trim() === "") {
            if (confirm(`"${subName}" kategorisini gerçekten silmek istiyor musun?`)) {
                categoryList.splice(index, 1);
                showToast('🗑️ Kategori silindi!');
            }
        } else if (choice !== subName) {
            categoryList[index] = choice.trim();
            showToast('✅ İsim güncellendi!');
        }

        await saveExpensesToFirebase();
        state.subcategoryEditMode = false;
        window.render();
    }
};
