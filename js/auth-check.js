// auth-check.js
document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Usuario no autenticado, redirigir a login
            window.location.href = "../auth/auth.html";
            return;
        }

        // Verificar email verificado
        if (!user.emailVerified) {
            await auth.signOut();
            window.location.href = "../auth/auth.html?error=verify-email";
            return;
        }

        // Verificar si estamos en la página de perfil
        if (window.location.pathname.includes('profile.html')) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().firstName) {
                // Si ya tiene perfil, redirigir a dashboard
                window.location.href = "../dashboard/dashboard.html";
            }
        }
        
        // Verificar si estamos en el dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || !userDoc.data().firstName) {
                // Si no tiene perfil, redirigir a profile
                window.location.href = "../profile/profile.html";
            }
        }
    });
});