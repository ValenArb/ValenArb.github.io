// Funciones de Autenticación
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
                default:
                    errorMessage = "Error al iniciar sesión";
            }
            throw new Error(errorMessage);
        });
}

function registerEmail(email, password) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => userCredential.user.sendEmailVerification())
        .catch(error => {
            let errorMessage;
            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage = "El correo ya está registrado";
                    break;
                case "auth/weak-password":
                    errorMessage = "La contraseña debe tener al menos 6 caracteres";
                    break;
                default:
                    errorMessage = "Error al registrar";
            }
            throw new Error(errorMessage);
        });
}

function loginWithGoogle() {
    return auth.signInWithPopup(googleProvider);
}

function sendPasswordReset(email) {
    return auth.sendPasswordResetEmail(email)
        .catch(error => {
            throw new Error("Error al enviar correo de recuperación");
        });
}

// Observador de autenticación
auth.onAuthStateChanged(user => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        if (currentPage === "index.html") {
            window.location.href = "dashboard.html";
        }
    } else {
        if (currentPage === "dashboard.html") {
            window.location.href = "index.html";
        }
    }
});

// Manejadores de eventos del DOM
document.addEventListener('DOMContentLoaded', () => {
    // Toggle entre Login/Registro
    document.getElementById('loginTab').addEventListener('click', () => {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('registerTab').classList.remove('active');
    });
    
    document.getElementById('registerTab').addEventListener('click', () => {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registerTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
    });
    
    // Login con Email
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await loginEmail(email, password);
        } catch (error) {
            document.getElementById('loginPasswordError').textContent = error.message;
        }
    });
    
    // Registro con Email
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        
        if (password !== confirm) {
            document.getElementById('registerConfirmError').textContent = "Las contraseñas no coinciden";
            return;
        }
        
        try {
            await registerEmail(email, password);
            alert("¡Registro exitoso! Verifica tu correo electrónico.");
        } catch (error) {
            document.getElementById('registerPasswordError').textContent = error.message;
        }
    });
    
    // Login con Google
    document.getElementById('googleLogin').addEventListener('click', async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            alert("Error al autenticar con Google: " + error.message);
        }
    });
    
    // Recuperar contraseña
    document.getElementById('forgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt("Ingresa tu correo para recuperar contraseña:");
        if (email) {
            sendPasswordReset(email)
                .then(() => alert("Correo de recuperación enviado"))
                .catch(() => alert("Error al enviar correo"));
        }
    });
});