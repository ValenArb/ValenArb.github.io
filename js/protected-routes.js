// Lista de páginas protegidas
const protectedPages = ["dashboard.html"];

// Verificar si la página actual está protegida
const currentPage = window.location.pathname.split('/').pop();
if (protectedPages.includes(currentPage)) {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "login.html";
        }
    });
}