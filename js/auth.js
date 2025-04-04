// ======================
// 🔐 AUTH.JS - VERSIÓN COMPLETA Y CORREGIDA
// ======================

console.log('[AUTH] Inicializando sistema de autenticación');

// 🛡️ Configuración de errores
const AuthError = {
    INVALID_EMAIL: 'Correo inválido',
    WRONG_PASSWORD: 'Contraseña incorrecta',
    UNVERIFIED_EMAIL: 'Por favor verifica tu correo electrónico primero',
    VERIFICATION_SENT: '¡Correo de verificación enviado! Revisa tu bandeja de entrada',
    ACCOUNT_EXISTS: 'La cuenta ya existe con credenciales diferentes',
    WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres',
    DEFAULT: 'Error de autenticación'
};

// ⏳ Control de reenvío de verificación
const VerificationManager = {
    lastSent: null,
    
    canResend: function() {
        if (!this.lastSent) return true;
        const secondsElapsed = (Date.now() - this.lastSent) / 1000;
        return secondsElapsed > 120; // 2 minutos de espera
    },
    
    send: async function(user) {
        if (!this.canResend()) {
            throw new Error('Debes esperar antes de reenviar');
        }
        
        await user.sendEmailVerification();
        this.lastSent = Date.now();
        console.log('[AUTH] Correo de verificación reenviado');
        return true;
    }
};

// 🔄 Función para cambiar pestañas
function switchTab(tabName) {
    console.log(`[UI] Cambiando a pestaña: ${tabName}`);
    
    // Actualizar pestañas
    document.getElementById('loginTab').classList.toggle('active', tabName === 'login');
    document.getElementById('registerTab').classList.toggle('active', tabName === 'register');
    
    // Actualizar formularios
    document.getElementById('loginForm').classList.toggle('active-form', tabName === 'login');
    document.getElementById('registerForm').classList.toggle('active-form', tabName === 'register');
    
    // Limpiar errores
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}

// ✉️ Manejar reenvío de verificación
async function handleResendVerification() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await VerificationManager.send(user);
        alert(AuthError.VERIFICATION_SENT);
        startResendTimer();
    } catch (error) {
        alert(error.message);
    }
}

// ⏱️ Temporizador para reenvío
function startResendTimer() {
    const timerElement = document.getElementById('resendTimer');
    let seconds = 120;
    
    const interval = setInterval(() => {
        seconds--;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `Puedes reenviar en ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        
        if (seconds <= 0) {
            clearInterval(interval);
            timerElement.textContent = '';
        }
    }, 1000);
}

// 🔐 Funciones principales
async function loginEmail(email, password) {
    try {
        console.log(`[AUTH] Intentando login: ${email}`);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        if (!userCredential.user.emailVerified) {
            console.warn('[AUTH] Email no verificado');
            await VerificationManager.send(userCredential.user);
            await auth.signOut();
            
            document.getElementById('verifyEmailReminder').style.display = 'block';
            document.getElementById('loginEmail').value = email;
            
            throw new Error(AuthError.UNVERIFIED_EMAIL);
        }
        
        console.log('[AUTH] Login exitoso');
        return userCredential;
    } catch (error) {
        console.error('[AUTH] Error en login:', error);
        throw error;
    }
}

async function registerEmail(email, password, confirmPassword) {
    try {
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await VerificationManager.send(userCredential.user);
        
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            emailVerified: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert(AuthError.VERIFICATION_SENT);
        return userCredential;
    } catch (error) {
        console.error('[AUTH] Error en registro:', error);
        throw error;
    }
}

// 👁️ Observador de autenticación
auth.onAuthStateChanged(async (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        if (!user.emailVerified && user.providerData[0]?.providerId === 'password') {
            if (currentPage === 'dashboard.html') {
                await auth.signOut();
                window.location.href = `login.html?verify=1&email=${encodeURIComponent(user.email)}`;
                return;
            }
        }
        
        if (currentPage === 'login.html') {
            window.location.href = 'dashboard.html';
        }
    } else if (currentPage === 'dashboard.html') {
        window.location.href = 'login.html';
    }
});

// 🎛️ Configurar listeners
function setupListeners() {
    // Pestañas
    document.getElementById('loginTab')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('login');
    });
    
    document.getElementById('registerTab')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('register');
    });
    
    // Formularios
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await loginEmail(email, password);
        } catch (error) {
            document.getElementById('loginPasswordError').textContent = error.message;
        }
    });
    
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        
        try {
            await registerEmail(email, password, confirm);
            switchTab('login');
        } catch (error) {
            document.getElementById('registerPasswordError').textContent = error.message;
        }
    });
    
    // Botones
    document.getElementById('googleLogin')?.addEventListener('click', async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch (error) {
            alert('Error con Google: ' + error.message);
        }
    });
    
    document.getElementById('verifyEmailBtn')?.addEventListener('click', handleResendVerification);
}

// 🚀 Inicialización
function initAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('verify')) {
        document.getElementById('verifyEmailReminder').style.display = 'block';
        if (urlParams.has('email')) {
            document.getElementById('loginEmail').value = urlParams.get('email');
        }
    }
    
    setupListeners();
}

document.addEventListener('DOMContentLoaded', initAuth);