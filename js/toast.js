import { state } from './state.js';

function showToast(message) {
    const toast = document.createElement('div');
    const isDark = state.darkMode;

    toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white text-gray-800'} border shadow-2xl rounded-xl px-6 py-3 z-[100] flex items-center gap-3 transition-all duration-300 opacity-0 translate-y-4`;
    toast.innerHTML = `<span class="font-medium">${message}</span>`;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

window.showToast = showToast;

export { showToast };
