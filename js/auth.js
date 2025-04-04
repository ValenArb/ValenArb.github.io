// Funciones de Autenticación
const auth = firebase.auth();

function loginEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            let errorMessage;
            switch (error.code) {
                case "auth/invalid-email":
                    errorMessage = "Correo inválido";
                    break;
                case "auth/user-not-found":
                case "auth/wrong-password":
                    errorMessage = "Correo o contraseña incorrectos";
                    break;
                case "auth/user-disabled":
                    errorMessage = "Cuenta deshabilitada";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Demasiados intentos. Intente más tarde";
                    break;
                default:
                    errorMessage = "Error al iniciar sesión: " + error.message;
            }
            throw new Error(errorMessage);
        });
}

function registerEmail(email, password) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Enviar verificación por email
            return userCredential.user.sendEmailVerification()
                .then(() => userCredential); // Devolver el userCredential completo
        })
        .catch(error => {
            let errorMessage;
            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage = "El correo ya está registrado";
                    break;
                case "auth/weak-password":
                    errorMessage = "La contraseña debe tener al menos 6 caracteres";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Correo electrónico no válido";
                    break;
                case "auth/operation-not-allowed":
                    errorMessage = "Operación no permitida";
                    break;
                default:
                    errorMessage = "Error al registrar: " + error.message;
            }
            throw new Error(errorMessage);
        });
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider)
        .then((result) => {
            // Puedes acceder a la información del usuario con result.user
            return result;
        })
        .catch(error => {
            console.error("Error en Google Sign-In:", error);
            throw error;
        });
}

function sendPasswordReset(email) {
    return auth.sendPasswordResetEmail(email)
        .then(() => {
            return "Correo de recuperación enviado. Revisa tu bandeja de entrada.";
        })
        .catch(error => {
            let errorMessage = "Error al enviar correo de recuperación";
            if (error.code === "auth/user-not-found") {
                errorMessage = "No existe una cuenta con este correo";
            }
            throw new Error(errorMessage);
        });
}

// Observador de autenticación global
auth.onAuthStateChanged(user => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        // Verificar si el email está verificado (solo para email/password)
        if (user.providerData[0].providerId === 'password' && !user.emailVerified) {
            if (currentPage !== 'index.html') {
                auth.signOut();
                window.location.href = 'index.html?verify_email=true';
            }
        } else if (currentPage === 'index.html') {
            window.location.href = 'dashboard.html';
        }
    } else if (currentPage === 'dashboard.html') {
        window.location.href = 'index.html';
    }
});

// Manejadores de eventos del DOM
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay parámetro de verificación de email
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('verify_email')) {
        alert('Por favor verifica tu correo electrónico antes de iniciar sesión.');
    }

    // Toggle entre Login/Registro
    document.getElementById('loginTab')?.addEventListener('click', () => {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('registerTab').classList.remove('active');
    });
    
    document.getElementById('registerTab')?.addEventListener('click', () => {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registerTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
    });
    
    // Login con Email
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await loginEmail(email, password);
        } catch (error) {
            document.getElementById('loginPasswordError').textContent = error.message;
        }
    });
    
    // Registro con Email
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        
        if (password !== confirm) {
            document.getElementById('registerConfirmError').textContent = "Las contraseñas no coinciden";
            return;
        }
        
        try {
            const userCredential = await registerEmail(email, password);
            alert("¡Registro exitoso! Por favor verifica tu correo electrónico antes de iniciar sesión.");
            // Cambiar a pestaña de login después del registro
            document.getElementById('loginTab').click();
            // Opcional: autocompletar email en login
            document.getElementById('loginEmail').value = email;
        } catch (error) {
            document.getElementById('registerPasswordError').textContent = error.message;
        }
    });
    
    // Login con Google
    document.getElementById('googleLogin')?.addEventListener('click', async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            alert("Error al autenticar con Google: " + error.message);
        }
    });
    
    // Recuperar contraseña
    document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt("Ingresa tu correo para recuperar contraseña:");
        if (email) {
            sendPasswordReset(email)
                .then(message => alert(message))
                .catch(error => alert(error.message));
        }
    });
});

function clearErrors() {
    // Limpiar todos los mensajes de error
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}