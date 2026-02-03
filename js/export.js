import { state } from './state.js';
import { showToast } from './toast.js';

window.exportToExcel = function() {
    const allExpenses = [];
    for (const dateKey in state.expenses) {
        for (const exp of state.expenses[dateKey]) {
            allExpenses.push({
                'Tarih': dateKey,
                'Kategori': state.categories[exp.category]?.name || exp.category,
                'Alt Kategori': exp.subcategory,
                'Tutar (TL)': exp.amount,
                'Altın (g)': exp.goldGrams || '-',
                'Not': exp.note || '-'
            });
        }
    }

    if (allExpenses.length === 0) {
        showToast('⚠️ Dışa aktarılacak veri yok!');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(allExpenses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Harcamalar");
    XLSX.writeFile(wb, `altin-butce-${new Date().toISOString().split('T')[0]}.xlsx`);

    state.showExportMenu = false;
    showToast('✅ Excel dosyası indirildi!');
    window.render();
};

window.exportToPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Altin Butce Raporu", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Olusturulma: ${new Date().toLocaleDateString('tr-TR')}`, 105, 28, { align: "center" });

    const tableData = [];
    for (const dateKey in state.expenses) {
        for (const exp of state.expenses[dateKey]) {
            tableData.push([
                dateKey,
                state.categories[exp.category]?.name || exp.category,
                exp.subcategory,
                `${exp.amount.toLocaleString('tr-TR')} TL`,
                exp.goldGrams ? `${exp.goldGrams}g` : '-'
            ]);
        }
    }

    if (tableData.length === 0) {
        showToast('⚠️ Dışa aktarılacak veri yok!');
        return;
    }

    doc.autoTable({
        startY: 35,
        head: [['Tarih', 'Kategori', 'Alt Kategori', 'Tutar', 'Altin']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [212, 175, 55] }
    });

    doc.save(`altin-butce-rapor-${new Date().toISOString().split('T')[0]}.pdf`);

    state.showExportMenu = false;
    showToast('✅ PDF raporu indirildi!');
    window.render();
};
