// Operaciones con Firestore
const db = firebase.firestore();

// Función para guardar datos adicionales del usuario
async function saveUserData(user, additionalData = {}) {
    try {
        await db.collection("users").doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || additionalData.name || "",
            photoURL: user.photoURL || "",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: "employee", // Rol por defecto
            ...additionalData
        });
        return true;
    } catch (error) {
        console.error("Error guardando datos del usuario:", error);
        return false;
    }
}

// Función para registrar horas trabajadas
async function registerHours(userId, hoursData) {
    try {
        const docRef = await db.collection("hours").add({
            userId,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            ...hoursData,
            status: "pending"
        });
        return docRef.id;
    } catch (error) {
        console.error("Error registrando horas:", error);
        return null;
    }
}

// Función para obtener horas del usuario
async function getUserHours(userId) {
    try {
        const snapshot = await db.collection("hours")
            .where("userId", "==", userId)
            .orderBy("date", "desc")
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error obteniendo horas:", error);
        return [];
    }
}