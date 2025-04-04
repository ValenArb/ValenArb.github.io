// Operaciones con Firestore (usa db ya declarado)

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