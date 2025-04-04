import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAf4bMnjPPULgl2KBE67vPafDQAD-lwAIY",
  authDomain: "codehoras.firebaseapp.com",
  projectId: "codehoras",
  storageBucket: "codehoras.firebasestorage.app",
  messagingSenderId: "762823211222",
  appId: "1:762823211222:web:c7b8f6957164c129a5b177",
  measurementId: "G-H8CEFQB3YF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const resetForm = document.getElementById('reset-form');
const showResetLink = document.getElementById('show-reset');
const backToLoginBtn = document.getElementById('back-to-login');

// Manejo de pestañas
document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const formType = e.target.id.split('-')[0];
        switchForms(formType);
    });
});

function switchForms(formType) {
    // Resetear mensajes de error
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.getElementById('reset-success').textContent = '';
    
    // Ocultar todos los formularios primero
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
        form.classList.add('hidden');
    });
    
    // Mostrar el formulario solicitado
    const formToShow = document.getElementById(`${formType}-form`);
    if (formToShow) {
        formToShow.classList.remove('hidden');
        formToShow.classList.add('active');
    }
    
    // Actualizar tabs activos
    document.querySelectorAll('.tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
    const tabToActivate = document.getElementById(`${formType}-tab`);
    if (tabToActivate) {
        tabToActivate.classList.add('active');
    }
    
    // Mostrar los tabs si estamos en login/register
    const tabsElement = document.querySelector('.tabs');
    if (formType === 'login' || formType === 'register') {
        tabsElement.classList.remove('hidden');
    } else {
        tabsElement.classList.add('hidden');
    }
}

// Validación de contraseña
function validatePassword(password) {
    const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: (password.match(/[a-z]/g) || []).length >= 2,
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Actualizar UI de validación
    Object.keys(validations).forEach(key => {
        const element = document.getElementById(`validation-${key}`);
        if (element) {
            element.style.color = validations[key] ? '#2ecc71' : '#e74c3c';
            element.style.fontWeight = validations[key] ? 'bold' : 'normal';
        }
    });
    
    return Object.values(validations).every(v => v);
}

// Evento para validar contraseña en tiempo real
document.getElementById('register-password')?.addEventListener('input', (e) => {
    validatePassword(e.target.value);
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Limpiar estados previos
    errorElement.innerHTML = '';
    errorElement.className = 'error-message';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
            await auth.signOut();
            
            // Mensaje de verificación
            errorElement.innerHTML = `
                <div class="verification-notice">
                    <p>🔒 Por favor verifica tu correo electrónico antes de iniciar sesión.</p>
                    <p>¿No recibiste el correo?</p>
                    <button id="resend-verification" class="btn-outline small">
                        Reenviar correo de verificación
                    </button>
                </div>
            `;
            
            document.getElementById('resend-verification')?.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await sendEmailVerification(userCredential.user);
                    errorElement.className = 'success-message';
                    errorElement.innerHTML = '✅ Correo de verificación reenviado. Revisa tu bandeja de entrada.';
                } catch (error) {
                    errorElement.className = 'error-message';
                    errorElement.textContent = `Error al reenviar: ${error.message}`;
                }
            });
            return;
        }
        
        // Verificar si el usuario tiene perfil completo
        const userDoc = await firebase.firestore().collection('users').doc(userCredential.user.uid).get();
        
        if (userDoc.exists && userDoc.data().firstName && userDoc.data().lastName) {
            // Perfil completo - ir al dashboard
            window.location.href = "../dashboard/dashboard.html";
        } else {
            // Perfil incompleto - ir al formulario de perfil
            window.location.href = "../profile/profile.html";
        }
        
    } catch (error) {
        // Manejo de errores (mantenido igual)
        errorElement.className = 'error-message';
        if (error.code === 'auth/too-many-requests') {
            errorElement.textContent = '⛔ Demasiados intentos fallidos. Tu cuenta ha sido temporalmente bloqueada. Por favor, inténtalo más tarde o restablece tu contraseña.';
        } else {
            switch (error.code) {
                case 'auth/user-not-found':
                    errorElement.textContent = '🔍 Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorElement.textContent = '🔑 Contraseña incorrecta';
                    break;
                case 'auth/user-disabled':
                    errorElement.textContent = '🚫 Cuenta deshabilitada';
                    break;
                default:
                    errorElement.textContent = '❌ Error al iniciar sesión: ' + error.message;
            }
        }
    }
});

// Registro de usuario
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorElement = document.getElementById('register-error');
    
    // Validar contraseña
    if (!validatePassword(password)) {
        errorElement.textContent = 'La contraseña no cumple con los requisitos';
        return;
    }
    
    if (password !== confirmPassword) {
        errorElement.textContent = 'Las contraseñas no coinciden';
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Enviar correo de verificación
        await sendEmailVerification(userCredential.user);
        
        alert('¡Cuenta creada con éxito! Por favor verifica tu correo electrónico.');
        switchForms('login');
    } catch (error) {
        let errorMessage = 'Error al registrar usuario';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este correo ya está registrado';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Correo electrónico inválido';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es muy débil';
                break;
        }
        errorElement.textContent = errorMessage;
    }
});

// Recuperación de contraseña
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    const errorElement = document.getElementById('reset-error');
    const successElement = document.getElementById('reset-success');
    
    try {
        await sendPasswordResetEmail(auth, email);
        successElement.textContent = 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.';
        errorElement.textContent = '';
    } catch (error) {
        let errorMessage = 'Error al enviar correo de recuperación';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este correo';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Correo electrónico inválido';
                break;
        }
        errorElement.textContent = errorMessage;
        successElement.textContent = '';
    }
});

// Login con Google
document.querySelectorAll('.btn-google').forEach(btn => {
    btn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        const errorElement = document.querySelector('.auth-form.active .error-message');
        
        try {
            const result = await signInWithPopup(auth, provider);
            // Verificar si es nuevo usuario (registro)
            if (result._tokenResponse?.isNewUser) {
                alert('¡Registro exitoso con Google!');
            }
            window.location.href = "../index.html";
        } catch (error) {
            let errorMessage = 'Error al autenticar con Google';
            switch (error.code) {
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'Este correo ya está registrado con otro método';
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Ventana de autenticación cerrada';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = 'Solicitud cancelada';
                    break;
            }
            if (errorElement) errorElement.textContent = errorMessage;
        }
    });
});

// Eventos adicionales
showResetLink?.addEventListener('click', (e) => {
    e.preventDefault();
    
    // 1. Oculta todos los formularios
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
        form.classList.add('hidden');
    });
    
    // 2. Muestra solo el formulario de recuperación
    resetForm.classList.remove('hidden');
    resetForm.classList.add('active');
    
    // 3. Oculta los tabs principales
    document.querySelector('.tabs').classList.add('hidden');
    
    // 4. Asegura que ningún tab aparezca como activo
    document.querySelectorAll('.tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
});

backToLoginBtn?.addEventListener('click', () => {
    // 1. Oculta el formulario de recuperación
    resetForm.classList.add('hidden');
    resetForm.classList.remove('active');
    
    // 2. Muestra los tabs principales
    document.querySelector('.tabs').classList.remove('hidden');
    
    // 3. Reactiva el tab de login y su formulario
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('login-form').classList.add('active');
    document.getElementById('login-form').classList.remove('hidden');
    
    // 4. Asegura que otros formularios estén ocultos
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('register-form').classList.add('hidden');
});