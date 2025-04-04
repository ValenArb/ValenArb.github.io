// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAtA6ClL-wa0kuUDSunupt5XN57-hrsfHg",
  authDomain: "codeirohoras.firebaseapp.com",
  projectId: "codeirohoras",
  storageBucket: "codeirohoras.appspot.com",
  messagingSenderId: "365035529456",
  appId: "1:365035529456:web:ccb25f8ea909e9876fce35"
};

// Inicialización (únicas declaraciones globales)
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

console.log("Firebase inicializado correctamente");