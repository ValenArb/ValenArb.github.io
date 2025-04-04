// Inicializar Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAf4bMnjPPULgl2KBE67vPafDQAD-lwAIY",
    authDomain: "codehoras.firebaseapp.com",
    projectId: "codehoras",
    storageBucket: "codehoras.appspot.com",
    messagingSenderId: "762823211222",
    appId: "1:762823211222:web:c7b8f6957164c129a5b177",
    measurementId: "G-H8CEFQB3YF"
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  // Inicializar Select2
  $(document).ready(function() {
      $('.js-select2').select2();
      
      // Cargar datos del usuario si está logueado
      auth.onAuthStateChanged(user => {
          if (user) {
              // Mostrar el email del usuario autenticado
              document.getElementById('email').value = user.email;
              loadUserData(user.uid);
          } else {
              // Redirigir a login si no está autenticado
              window.location.href = '../auth/auth.html';
          }
      });
      
      // Manejar la subida de la imagen (solo para vista previa por ahora)
      document.getElementById('avatar-upload').addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = function(event) {
                  document.getElementById('avatar-image').src = event.target.result;
              };
              reader.readAsDataURL(file);
          }
      });
      
      // Manejar el clic en el avatar (para abrir el selector de archivos)
      document.querySelector('.avatar-preview').addEventListener('click', function() {
          document.getElementById('avatar-upload').click();
      });
      
      // Manejar el envío del formulario
      document.getElementById('profile-form').addEventListener('submit', function(e) {
          e.preventDefault();
          saveProfile();
      });
      
      // Manejar el botón de cancelar
      document.getElementById('cancel-btn').addEventListener('click', function() {
          auth.onAuthStateChanged(user => {
              if (user) {
                  loadUserData(user.uid);
              }
          });
      });
  });
  
  // Cargar datos del usuario desde Firestore
  function loadUserData(userId) {
      db.collection('users').doc(userId).get()
          .then(doc => {
              if (doc.exists) {
                  const userData = doc.data();
                  document.getElementById('first-name').value = userData.firstName || '';
                  document.getElementById('last-name').value = userData.lastName || '';
                  document.getElementById('country').value = userData.country || '';
                  document.getElementById('income-type').value = userData.incomeType || '';
                  document.getElementById('currency').value = userData.currency || 'ARS';
                  document.getElementById('income-amount').value = userData.incomeAmount || '';
                  
                  // Establecer la imagen (usamos una por defecto por ahora)
                  document.getElementById('avatar-image').src = userData.avatarUrl || '../assets/images/default.png';
                  
                  // Forzar a Select2 a actualizar el valor
                  $('#country').trigger('change');
              } else {
                  // Si no existe el documento, crear uno con datos básicos
                  saveInitialProfile(userId);
              }
          })
          .catch(error => {
              console.error("Error al cargar datos del usuario:", error);
          });
  }
  
  // Guardar perfil inicial si no existe
  function saveInitialProfile(userId) {
      const user = auth.currentUser;
      if (!user) return;
  
      db.collection('users').doc(userId).set({
          firstName: '',
          lastName: '',
          country: '',
          incomeType: '',
          currency: 'ARS',
          incomeAmount: '',
          avatarUrl: '../assets/images/default.png',
          email: user.email, // Guardar el email del usuario
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      })
      .catch(error => {
          console.error("Error al crear perfil inicial:", error);
      });
  }
  
  // Guardar los datos del perfil en Firestore
  function saveProfile() {
      const user = auth.currentUser;
      if (!user) return;
  
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const country = document.getElementById('country').value;
      const incomeType = document.getElementById('income-type').value;
      const currency = document.getElementById('currency').value;
      const incomeAmount = document.getElementById('income-amount').value;
      
      // Usamos una URL genérica para la imagen por ahora
      const avatarUrl = '../assets/images/default.png';
  
      // Guardar en Firestore
      db.collection('users').doc(user.uid).set({
          firstName,
          lastName,
          country,
          incomeType,
          currency,
          incomeAmount,
          avatarUrl,
          email: user.email, // Siempre mantener el email actualizado
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }) // Usamos merge para no sobrescribir otros campos
      .then(() => {
          alert('Perfil actualizado correctamente');
      })
      .catch(error => {
          console.error("Error al guardar el perfil:", error);
          alert('Error al guardar el perfil: ' + error.message);
      })
      .then(() => {
        alert('Perfil actualizado correctamente');
        window.location.href = "../dashboard/dashboard.html";
    });
  }