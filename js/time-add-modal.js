// Función para cargar el formulario de agregar tiempo
async function loadTimeAddForm() {
    try {
        const response = await fetch('time-add.html');
        const html = await response.text();
        
        // Extraer solo el contenido del formulario
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const formContent = doc.querySelector('.time-add-container').innerHTML;
        
        // Insertar en el modal
        document.getElementById('time-add-modal').innerHTML = formContent;
        
        // Inicializar el script de funcionalidad
        initTimeAddForm();
        
        return true;
    } catch (error) {
        console.error('Error loading time add form:', error);
        return false;
    }
}

// Función para mostrar el modal
function showTimeAddModal() {
    const container = document.getElementById('time-add-modal-container');
    const dashboard = document.querySelector('.container'); // Ajusta este selector según tu estructura
    
    // Aplicar blur al dashboard
    if (dashboard) {
        dashboard.style.filter = 'blur(3px)';
        dashboard.style.pointerEvents = 'none';
    }
    
    // Mostrar el modal
    container.style.display = 'block';
    
    // Configurar botón de cerrar
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'modal-close-btn';
    
    closeBtn.addEventListener('click', hideTimeAddModal);
    document.getElementById('time-add-modal').appendChild(closeBtn);
    
    // Cerrar al hacer clic en el backdrop
    document.getElementById('time-add-backdrop').addEventListener('click', hideTimeAddModal);
}

// Función para ocultar el modal
function hideTimeAddModal() {
    const container = document.getElementById('time-add-modal-container');
    const dashboard = document.querySelector('.container');
    
    // Restaurar el dashboard
    if (dashboard) {
        dashboard.style.filter = '';
        dashboard.style.pointerEvents = '';
    }
    
    // Ocultar el modal
    container.style.display = 'none';
}

// Función para inicializar el formulario
function initTimeAddForm() {
    // Aquí copia todo el código que estaba en time-add.js
    // pero cambia hideModal() por hideTimeAddModal()
    
    // Ejemplo:
    document.getElementById('cancel-btn')?.addEventListener('click', hideTimeAddModal);
    document.querySelector('.close-btn')?.addEventListener('click', hideTimeAddModal);
    
    // ... resto de tu código de time-add.js ...
}

// Configurar el botón en el dashboard
document.addEventListener('DOMContentLoaded', function() {
    const addTimeBtn = document.getElementById('add-time-btn');
    
    if (addTimeBtn) {
        addTimeBtn.addEventListener('click', async function() {
            const success = await loadTimeAddForm();
            if (success) {
                showTimeAddModal();
            } else {
                alert('Error al cargar el formulario');
            }
        });
    }
});