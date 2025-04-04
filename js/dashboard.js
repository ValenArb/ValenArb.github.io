document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Elementos del DOM
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutBtn = document.querySelector('.logout-btn');
    const modal = document.getElementById('modal');
    const closeModal = document.querySelector('.close-modal');
    const modalForm = document.getElementById('modal-form');
    const modalFields = document.getElementById('modal-fields');
    
    // Datos del usuario
    let currentUser = null;
    let userData = {};
    
    // Inicializar la aplicación
    initApp();
    
    function initApp() {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserData();
            updateUI();
            setupTimeAddModal(); // <-- Nueva función que agregaremos
        } else {
            window.location.href = 'login.html';
        }
    });
        
        // Configurar pestañas
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                // Remover clase active de todas las pestañas y contenidos
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Agregar clase active a la pestaña y contenido seleccionados
                tab.classList.add('active');
                tabContents[index].classList.add('active');
            });
        });
        
        // Configurar botón de logout
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            }
        });
        
        // Configurar modal
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Configurar botones para agregar registros
        document.getElementById('add-hours-btn').addEventListener('click', () => showModal('hours'));
        document.getElementById('add-km-btn').addEventListener('click', () => showModal('km'));
        document.getElementById('add-expense-btn').addEventListener('click', () => showModal('expense'));
        
        // Configurar formulario de configuración
        document.getElementById('settings-form').addEventListener('submit', saveSettings);
        
        // Establecer fecha actual
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', options);
    }
    
    function loadUserData() {
        if (!currentUser) return;
        
        // Cargar datos del usuario desde Firestore
        db.collection('users').doc(currentUser.uid).get()
            .then(doc => {
                if (doc.exists) {
                    userData = doc.data();
                    updateUserInfo();
                } else {
                    // Crear documento si no existe
                    db.collection('users').doc(currentUser.uid).set({
                        name: currentUser.displayName || 'Usuario',
                        email: currentUser.email,
                        hourlyRate: 750,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            })
            .catch(error => {
                console.error('Error cargando datos del usuario:', error);
            });
    }
    
    function updateUserInfo() {
        // Actualizar información del usuario en la UI
        const userName = userData.name || currentUser.displayName || currentUser.email.split('@')[0];
        const userEmail = currentUser.email;
        
        document.getElementById('user-name').textContent = userName;
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${userName[0]}`;
        
        // Actualizar formulario de configuración
        document.getElementById('user-fullname').value = userName;
        document.getElementById('user-email').value = userEmail;
        document.getElementById('hourly-rate').value = userData.hourlyRate || 750;
    }
    
    function updateUI() {
        // Actualizar selectores de mes/año
        updateDateSelectors();
        
        // Mostrar datos de ejemplo (serán reemplazados por datos reales)
        showPlaceholderData();
    }
    
    function updateDateSelectors() {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        // Llenar selectores de mes
        const monthSelectors = document.querySelectorAll('select[id$="-month-selector"]');
        monthSelectors.forEach(select => {
            select.innerHTML = '';
            
            // Agregar opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '0';
            defaultOption.textContent = 'Seleccionar mes';
            select.appendChild(defaultOption);
            
            // Agregar meses
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index + 1;
                option.textContent = `${month} ${currentYear}`;
                
                // Seleccionar mes actual
                if (index === currentMonth) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });
        });
        
        // Llenar selector de año
        const yearSelect = document.getElementById('year-selector');
        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }
    
    function showPlaceholderData() {
        // Mostrar placeholders en las métricas
        document.querySelectorAll('.value').forEach(el => {
            if (el.textContent.trim() === '') {
                el.textContent = 'X';
            }
        });
        
        // Mostrar mensaje de "Sin datos" en las tablas
        document.querySelectorAll('.no-data').forEach(el => {
            el.textContent = 'No hay datos disponibles';
        });
    }
    
    function showModal(type) {
        const modalTitle = document.getElementById('modal-title');
        modalFields.innerHTML = '';
        
        switch (type) {
            case 'hours':
                modalTitle.textContent = 'Nuevo Registro de Horas';
                createHoursForm();
                break;
            case 'km':
                modalTitle.textContent = 'Nuevo Registro de Kilómetros';
                createKmForm();
                break;
            case 'expense':
                modalTitle.textContent = 'Nuevo Registro de Gastos';
                createExpenseForm();
                break;
        }
        
        modal.style.display = 'block';
    }
    
    function createHoursForm() {
        const fields = [
            { type: 'date', id: 'hours-date', label: 'Fecha', required: true },
            { type: 'time', id: 'start-time', label: 'Hora de inicio', required: true },
            { type: 'time', id: 'end-time', label: 'Hora de fin', required: true },
            { type: 'select', id: 'hours-type', label: 'Tipo de día', options: [
                { value: 'workday', text: 'Día hábil' },
                { value: 'weekend', text: 'Fin de semana' },
                { value: 'holiday', text: 'Feriado' }
            ], required: true },
            { type: 'textarea', id: 'hours-notes', label: 'Notas' }
        ];
        
        renderFormFields(fields);
    }
    
    function createKmForm() {
        const fields = [
            { type: 'date', id: 'km-date', label: 'Fecha', required: true },
            { type: 'text', id: 'km-client', label: 'Cliente', required: true },
            { type: 'text', id: 'km-origin', label: 'Origen', required: true },
            { type: 'text', id: 'km-destination', label: 'Destino', required: true },
            { type: 'number', id: 'km-amount', label: 'Kilómetros', required: true },
            { type: 'text', id: 'km-purpose', label: 'Propósito', required: true }
        ];
        
        renderFormFields(fields);
    }
    
    function createExpenseForm() {
        const fields = [
            { type: 'date', id: 'expense-date', label: 'Fecha', required: true },
            { type: 'select', id: 'expense-category', label: 'Categoría', options: [
                { value: 'fuel', text: 'Combustible' },
                { value: 'food', text: 'Alimentación' },
                { value: 'office', text: 'Oficina' },
                { value: 'transport', text: 'Transporte' },
                { value: 'other', text: 'Otros' }
            ], required: true },
            { type: 'text', id: 'expense-description', label: 'Descripción', required: true },
            { type: 'number', id: 'expense-amount', label: 'Monto', required: true },
            { type: 'file', id: 'expense-receipt', label: 'Comprobante' }
        ];
        
        renderFormFields(fields);
    }
    
    function renderFormFields(fields) {
        fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group';
            
            const label = document.createElement('label');
            label.htmlFor = field.id;
            label.textContent = field.label;
            if (field.required) {
                label.innerHTML += ' <span style="color:red">*</span>';
            }
            
            let input;
            
            switch (field.type) {
                case 'select':
                    input = document.createElement('select');
                    input.id = field.id;
                    input.name = field.id;
                    input.required = field.required || false;
                    
                    if (field.options) {
                        field.options.forEach(option => {
                            const optElement = document.createElement('option');
                            optElement.value = option.value;
                            optElement.textContent = option.text;
                            input.appendChild(optElement);
                        });
                    }
                    break;
                
                case 'textarea':
                    input = document.createElement('textarea');
                    input.id = field.id;
                    input.name = field.id;
                    input.required = field.required || false;
                    input.rows = 3;
                    break;
                
                default:
                    input = document.createElement('input');
                    input.type = field.type;
                    input.id = field.id;
                    input.name = field.id;
                    input.required = field.required || false;
            }
            
            group.appendChild(label);
            group.appendChild(input);
            modalFields.appendChild(group);
        });
    }
    
    function saveSettings(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('user-fullname').value;
        const hourlyRate = parseFloat(document.getElementById('hourly-rate').value);
        
        if (!currentUser) return;
        
        db.collection('users').doc(currentUser.uid).update({
            name: fullName,
            hourlyRate: hourlyRate,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert('Configuración guardada correctamente');
            loadUserData(); // Recargar datos del usuario
        })
        .catch(error => {
            console.error('Error guardando configuración:', error);
            alert('Error al guardar la configuración');
        });
    }
});
function setupTimeAddModal() {
    const addTimeBtn = document.getElementById('add-time-btn');
    
    if (addTimeBtn) {
        addTimeBtn.addEventListener('click', () => {
            // Cargar el modal de registro de tiempo
            const modal = document.createElement('div');
            modal.innerHTML = `
                <iframe src="time-add.html" 
                        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                               border: none; z-index: 1000; background: white;">
                </iframe>
            `;
            document.body.appendChild(modal);
            
            // Agregar botón para cerrar
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.style.position = 'fixed';
            closeBtn.style.top = '15px';
            closeBtn.style.right = '15px';
            closeBtn.style.zIndex = '1001';
            closeBtn.style.background = 'white';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.width = '40px';
            closeBtn.style.height = '40px';
            closeBtn.style.fontSize = '20px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                document.body.removeChild(closeBtn);
            });
            
            document.body.appendChild(closeBtn);
        });
    }
}