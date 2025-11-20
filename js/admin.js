// ============================================
// FIREBASE ADMIN PANEL
// ============================================

import { app, database, analytics } from './firebase-config.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    ref, 
    onValue,
    update 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// DOM Elements - Wait for DOM to load
let loginSection, dashboardSection, loginForm, googleLoginBtn, logoutBtn;
let errorMessage, errorText, userEmail, messagesTbody, noMessagesDiv;
let messageModal, closeModalBtn, modalContent;
let totalMessagesEl, unreadMessagesEl, readMessagesEl;

// Initialize DOM elements after page loads
document.addEventListener('DOMContentLoaded', () => {
    loginSection = document.getElementById('login-section');
    dashboardSection = document.getElementById('dashboard-section');
    loginForm = document.getElementById('login-form');
    googleLoginBtn = document.getElementById('google-login-btn');
    logoutBtn = document.getElementById('logout-btn');
    errorMessage = document.getElementById('error-message');
    errorText = document.getElementById('error-text');
    userEmail = document.getElementById('user-email');
    messagesTbody = document.getElementById('messages-tbody');
    noMessagesDiv = document.getElementById('no-messages');
    messageModal = document.getElementById('message-modal');
    closeModalBtn = document.getElementById('close-modal-btn');
    modalContent = document.getElementById('modal-content');
    totalMessagesEl = document.getElementById('total-messages');
    unreadMessagesEl = document.getElementById('unread-messages');
    readMessagesEl = document.getElementById('read-messages');
    
    // Setup event listeners after DOM is ready
    setupEventListeners();
});

// ============================================
// AUTHENTICATION
// ============================================

// Setup event listeners
function setupEventListeners() {
    // Email/Password Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
                showError(getErrorMessage(error.code));
            }
        });
    }

    // Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            hideError();
            
            try {
                await signInWithPopup(auth, googleProvider);
            } catch (error) {
                showError(getErrorMessage(error.code));
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }

    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            messageModal.classList.add('hidden');
        });
    }
}

// Check auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        showDashboard(user);
        loadMessages();
    } else {
        // User is signed out
        showLogin();
    }
});

// ============================================
// UI FUNCTIONS
// ============================================

function showLogin() {
    if (loginSection && dashboardSection) {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}

function showDashboard(user) {
    if (loginSection && dashboardSection && userEmail) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userEmail.textContent = user.email;
    }
}

function showError(message) {
    if (errorText && errorMessage) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

function hideError() {
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }
}

function getErrorMessage(code) {
    const errorMessages = {
        'auth/invalid-email': 'El correo electrónico no es válido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Credenciales inválidas',
        'auth/popup-closed-by-user': 'Inicio de sesión cancelado',
        'auth/cancelled-popup-request': 'Inicio de sesión cancelado'
    };
    
    return errorMessages[code] || 'Error al iniciar sesión. Intenta de nuevo.';
}

// ============================================
// MESSAGES MANAGEMENT
// ============================================

function loadMessages() {
    const messagesRef = ref(database, 'contact-messages');
    
    onValue(messagesRef, (snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            const message = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            messages.push(message);
        });
        
        // Sort by timestamp (newest first)
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        displayMessages(messages);
        updateStats(messages);
    });
}

function displayMessages(messages) {
    if (!messagesTbody || !noMessagesDiv) return;
    
    if (messages.length === 0) {
        messagesTbody.innerHTML = '';
        noMessagesDiv.classList.remove('hidden');
        return;
    }
    
    noMessagesDiv.classList.add('hidden');
    
    messagesTbody.innerHTML = messages.map(message => `
        <tr class="hover:bg-slate-800/30 transition-colors cursor-pointer" onclick="window.viewMessage('${message.id}')">
            <td class="px-6 py-4 whitespace-nowrap">
                ${message.read 
                    ? '<span class="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500"><i class="fas fa-check mr-1"></i> Leído</span>'
                    : '<span class="px-2 py-1 text-xs rounded-full bg-secondary/20 text-secondary"><i class="fas fa-circle mr-1 text-xs"></i> Nuevo</span>'
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-white">${escapeHtml(message.name)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-400">${escapeHtml(message.email)}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-slate-400 truncate max-w-xs">${escapeHtml(message.message)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-400">${formatDate(message.timestamp)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="window.viewMessage('${message.id}'); event.stopPropagation();" 
                    class="text-primary hover:text-primary-light transition-colors">
                    <i class="fas fa-eye mr-1"></i> Ver
                </button>
                ${!message.read ? 
                    `<button onclick="window.markAsRead('${message.id}'); event.stopPropagation();" 
                        class="ml-3 text-green-500 hover:text-green-400 transition-colors">
                        <i class="fas fa-check-circle mr-1"></i> Marcar
                    </button>` 
                    : ''
                }
            </td>
        </tr>
    `).join('');
}

function updateStats(messages) {
    if (!totalMessagesEl || !unreadMessagesEl || !readMessagesEl) return;
    
    const total = messages.length;
    const unread = messages.filter(m => !m.read).length;
    const read = messages.filter(m => m.read).length;
    
    totalMessagesEl.textContent = total;
    unreadMessagesEl.textContent = unread;
    readMessagesEl.textContent = read;
}

// ============================================
// MESSAGE ACTIONS
// ============================================

window.viewMessage = (messageId) => {
    const messagesRef = ref(database, `contact-messages/${messageId}`);
    
    onValue(messagesRef, (snapshot) => {
        const message = snapshot.val();
        if (!message) return;
        
        modalContent.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                    <p class="text-white font-medium">${escapeHtml(message.name)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Email</label>
                    <p class="text-white">${escapeHtml(message.email)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Mensaje</label>
                    <p class="text-white whitespace-pre-wrap">${escapeHtml(message.message)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Fecha</label>
                    <p class="text-white">${formatDate(message.timestamp)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Estado</label>
                    <p class="text-white">
                        ${message.read 
                            ? '<span class="text-green-500"><i class="fas fa-check-circle mr-2"></i>Leído</span>' 
                            : '<span class="text-secondary"><i class="fas fa-circle mr-2 text-xs"></i>No leído</span>'
                        }
                    </p>
                </div>
                ${!message.read ? 
                    `<button onclick="window.markAsRead('${messageId}')" 
                        class="w-full py-3 px-5 text-sm font-medium text-center text-white rounded-lg bg-green-600 hover:bg-green-700 transition-all">
                        <i class="fas fa-check-circle mr-2"></i> Marcar como Leído
                    </button>` 
                    : ''
                }
            </div>
        `;
        
        showModal();
    }, { onlyOnce: true });
};

window.markAsRead = async (messageId) => {
    const messageRef = ref(database, `contact-messages/${messageId}`);
    
    try {
        await update(messageRef, { read: true });
        closeModal();
    } catch (error) {
        console.error('Error marking message as read:', error);
        alert('Error al marcar el mensaje. Intenta de nuevo.');
    }
};

function showModal() {
    messageModal.classList.remove('hidden');
    messageModal.classList.add('flex');
}

function closeModal() {
    messageModal.classList.add('hidden');
    messageModal.classList.remove('flex');
}

closeModalBtn.addEventListener('click', closeModal);
messageModal.addEventListener('click', (e) => {
    if (e.target === messageModal) {
        closeModal();
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
        return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

console.log('✓ Admin panel cargado correctamente');
