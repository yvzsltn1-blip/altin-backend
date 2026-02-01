import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- AYARLAR ---
const ADMIN_UIDS = [
    "eq3Gz056elTc4uv8nT7LjbcSF7I3", 
    "zH4fSotT2wONTpjEmLuhEyB1QeU2" 
];

const firebaseConfig = {
    apiKey: "AIzaSyCAeEg9FE0xHb4NExWbIPOowrCX13etuPg",
    authDomain: "altin-butce.firebaseapp.com",
    projectId: "altin-butce",
    storageBucket: "altin-butce.firebasestorage.app",
    messagingSenderId: "285997815342",
    appId: "1:285997815342:web:317b2bb0247a4b147071bf",
    measurementId: "G-BVF1EMDJPK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allUsersCache = []; // Filtreleme için veriyi hafızada tutuyoruz

// --- BAŞLANGIÇ KONTROLÜ ---
onAuthStateChanged(auth, (user) => {
    const loadingScreen = document.getElementById('loading-screen');
    const adminPanel = document.getElementById('admin-panel');

    if (user && ADMIN_UIDS.includes(user.uid)) {
        // Admin giriş yaptı, her şey yolunda
        document.getElementById('admin-email').textContent = user.email;
        if(loadingScreen) loadingScreen.classList.add('hidden');
        if(adminPanel) adminPanel.classList.remove('hidden');
        fetchAllUsers(); 
    } else {
        // BURAYI GÜNCELLİYORUZ:
        
        // Eğer kullanıcı varsa (giriş yapmış) ama admin değilse uyarı ver
        if (user) {
            alert("Yetkisiz erişim! Bu hesabın admin yetkisi yok.");
        }
        
        // Kullanıcı yoksa (çıkış yapılmışsa) veya yetkisizse ana sayfaya yönlendir
        window.location.href = "index.html";
    }
});

window.fetchAllUsers = async () => {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-500">Veriler yükleniyor...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        allUsersCache = [];
        
        let totalVolume = 0;
        let activeUsers = 0;
        const currentMonth = new Date().toISOString().slice(0, 7); // 2024-02 gibi

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const expenses = data.expenses || {};
            
            // İstatistik Hesaplama
            let total = 0;
            let zorunlu = 0, orta = 0, keyfi = 0;
            let lastTxDate = null;

            Object.entries(expenses).forEach(([date, dayList]) => {
                // En son işlem tarihini bul
                if (!lastTxDate || date > lastTxDate) lastTxDate = date;

                dayList.forEach(exp => {
                    const amt = parseFloat(exp.amount || 0);
                    total += amt;
                    
                    // Kategori Analizi
                    if(exp.category === 'zorunlu') zorunlu += amt;
                    else if(exp.category === 'orta') orta += amt;
                    else if(exp.category === 'keyfi') keyfi += amt;
                });
            });

            totalVolume += total;
            if (lastTxDate && lastTxDate.startsWith(currentMonth)) activeUsers++;

            allUsersCache.push({
                uid: doc.id,
                email: data.email || "Email Yok (Eski Kayıt)", // Email burada okunuyor
                lastUpdate: lastTxDate || "İşlem Yok",
                budget: data.monthlyBudget || 0,
                total,
                breakdown: { zorunlu, orta, keyfi },
                fullData: data
            });
        });

        // İstatistikleri Güncelle
        document.getElementById('stat-users').textContent = allUsersCache.length;
        document.getElementById('stat-volume').textContent = `₺${Math.round(totalVolume).toLocaleString('tr-TR')}`;
        document.getElementById('stat-active').textContent = activeUsers;

        renderTable(allUsersCache);

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Hata: ${error.message}</td></tr>`;
    }
};

// Arama Fonksiyonu
window.filterUsers = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    const filtered = allUsersCache.filter(u => 
        u.email.toLowerCase().includes(term) || 
        u.uid.toLowerCase().includes(term)
    );
    renderTable(filtered);
};

function renderTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    // Son işlem tarihine göre sırala (En yeni en üstte)
    users.sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));

    users.forEach(user => {
        // Yüzdelik hesaplama
        const total = user.total || 1; // Sıfıra bölünme hatası olmasın
        const pZ = Math.round((user.breakdown.zorunlu / total) * 100);
        const pO = Math.round((user.breakdown.orta / total) * 100);
        const pK = Math.round((user.breakdown.keyfi / total) * 100);

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors border-b";
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="font-bold text-gray-900">${user.email}</div>
                <div class="text-xs text-gray-400 font-mono mt-1">${user.uid}</div>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${user.lastUpdate}</span>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm">Hedef: <span class="font-medium">₺${user.budget.toLocaleString()}</span></div>
                <div class="text-sm font-bold text-amber-600">Toplam: ₺${user.total.toLocaleString()}</div>
            </td>
            <td class="px-6 py-4">
                <div class="flex h-2 w-24 rounded-full overflow-hidden bg-gray-200">
                    <div class="bg-red-500 h-full" style="width: ${pZ}%" title="Zorunlu: %${pZ}"></div>
                    <div class="bg-orange-400 h-full" style="width: ${pO}%" title="Orta: %${pO}"></div>
                    <div class="bg-green-500 h-full" style="width: ${pK}%" title="Keyfi: %${pK}"></div>
                </div>
                <div class="text-[10px] text-gray-500 mt-1 space-x-1">
                    <span class="text-red-600">%${pZ} Z</span>
                    <span class="text-orange-600">%${pO} O</span>
                    <span class="text-green-600">%${pK} K</span>
                </div>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="viewUserDetail('${user.uid}')" class="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm font-medium transition-colors">İncele</button>
                <button onclick="deleteUser('${user.uid}')" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors ml-2">Sil</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.viewUserDetail = (uid) => {
    const user = allUsersCache.find(u => u.uid === uid);
    if (!user) return;

    const modal = document.getElementById('user-detail-modal');
    const content = document.getElementById('modal-content');
    
    // Harcamaları listeye dök
    let flatExpenses = [];
    Object.entries(user.fullData.expenses || {}).forEach(([date, dayList]) => {
        dayList.forEach(exp => flatExpenses.push({ date, ...exp }));
    });
    flatExpenses.sort((a, b) => b.date.localeCompare(a.date));

    content.innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div>
                <h4 class="text-xl font-bold text-gray-800">${user.email}</h4>
                <p class="text-sm text-gray-500">${user.uid}</p>
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-amber-600">₺${user.total.toLocaleString()}</div>
                <div class="text-xs text-gray-500">Toplam Harcama</div>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-red-50 p-3 rounded-lg border border-red-100">
                <div class="text-xs text-red-600 uppercase font-bold">Zorunlu</div>
                <div class="text-lg font-bold text-red-700">₺${user.breakdown.zorunlu.toLocaleString()}</div>
            </div>
            <div class="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <div class="text-xs text-orange-600 uppercase font-bold">Orta</div>
                <div class="text-lg font-bold text-orange-700">₺${user.breakdown.orta.toLocaleString()}</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg border border-green-100">
                <div class="text-xs text-green-600 uppercase font-bold">Keyfi</div>
                <div class="text-lg font-bold text-green-700">₺${user.breakdown.keyfi.toLocaleString()}</div>
            </div>
        </div>

        <h5 class="font-bold text-gray-700 mb-2 border-b pb-2">Harcama Geçmişi</h5>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="p-2 text-left">Tarih</th>
                        <th class="p-2 text-left">Kategori</th>
                        <th class="p-2 text-left">Alt Kategori</th>
                        <th class="p-2 text-left">Tutar</th>
                        <th class="p-2 text-left">Not</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${flatExpenses.map(exp => `
                        <tr>
                            <td class="p-2 text-gray-500">${exp.date}</td>
                            <td class="p-2">
                                <span class="px-2 py-0.5 rounded text-xs 
                                    ${exp.category==='zorunlu'?'bg-red-100 text-red-700':
                                      exp.category==='orta'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'}">
                                    ${exp.category}
                                </span>
                            </td>
                            <td class="p-2 font-medium">${exp.subcategory}</td>
                            <td class="p-2 font-bold">₺${exp.amount.toLocaleString()}</td>
                            <td class="p-2 text-gray-500 italic text-xs max-w-xs truncate">${exp.note || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.closeModal = () => document.getElementById('user-detail-modal').classList.add('hidden');

window.deleteUser = async (uid) => {
    if(!confirm(`DİKKAT! ${uid} kullanıcısının verileri silinecek. Onaylıyor musun?`)) return;
    try {
        await deleteDoc(doc(db, "users", uid));
        await deleteDoc(doc(db, "verified_users", uid));
        alert("Kullanıcı verileri silindi.");
        fetchAllUsers();
    } catch(e) { alert("Hata: " + e.message); }
};

window.logout = async () => {
    await signOut(auth);
    window.location.href = "index.html";
};