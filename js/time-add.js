document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const modal = document.querySelector('.time-add-container');
    const backdrop = document.getElementById('modal-backdrop');
    const closeBtn = document.getElementById('close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('time-add-form');
    const hasBreakCheckbox = document.getElementById('has-break');
    const breakContainer = document.getElementById('break-container');
    const summarySection = document.getElementById('summary-section');
    
    // Mostrar el modal y backdrop al cargar (en producción esto se activaría con un botón)
    function showModal() {
        modal.style.display = 'block';
        backdrop.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Previene el scroll del fondo
        setCurrentDate();
    }
    
    // Ocultar el modal
    function hideModal() {
        modal.style.display = 'none';
        backdrop.style.display = 'none';
        document.body.style.overflow = ''; // Restaura el scroll
    }
    
    // Establecer fecha actual como valor predeterminado
    function setCurrentDate() {
        const today = new Date();
        const formattedDate = formatDateForInput(today);
        document.getElementById('date').value = formattedDate;
        determineDayType(formattedDate);
    }
    
    // Formatear fecha para input type="date" (YYYY-MM-DD)
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Determinar automáticamente el tipo de día (laboral, fin de semana o feriado)
    function determineDayType(dateString) {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0 (Domingo) a 6 (Sábado)
        
        // Lista de feriados (debería venir de una API/BD en producción)
        const holidays = [
            '2025-01-01', // Año Nuevo
            '2025-02-24', // Carnaval
            '2025-02-25', // Carnaval
            '2025-03-24', // Día Nacional de la Memoria
            '2025-04-02', // Día del Veterano de Malvinas
            // Agregar más feriados según necesidad
        ];
        
        const dayTypeSelect = document.getElementById('day-type');
        
        if (holidays.includes(dateString)) {
            dayTypeSelect.value = 'holiday';
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayTypeSelect.value = 'weekend';
        } else {
            dayTypeSelect.value = 'workday';
        }
        
        calculateHours();
    }
    
    // Mostrar/ocultar campos de pausa
    function toggleBreakFields() {
        if (hasBreakCheckbox.checked) {
            breakContainer.classList.remove('hidden');
            document.getElementById('break-start').required = true;
            document.getElementById('break-end').required = true;
        } else {
            breakContainer.classList.add('hidden');
            document.getElementById('break-start').required = false;
            document.getElementById('break-end').required = false;
            document.getElementById('break-start').value = '';
            document.getElementById('break-end').value = '';
        }
        calculateHours();
    }
    
    // Convertir tiempo HH:MM a horas decimales
    function timeToDecimal(time) {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours + (minutes / 60);
    }
    
    // Calcular horas trabajadas
    function calculateHours() {
        const dayType = document.getElementById('day-type').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const breakStart = document.getElementById('break-start').value;
        const breakEnd = document.getElementById('break-end').value;
        
        // Validación básica
        if (!startTime || !endTime || startTime >= endTime) {
            summarySection.classList.add('hidden');
            return;
        }
        
        // Convertir a horas decimales
        const start = timeToDecimal(startTime);
        const end = timeToDecimal(endTime);
        let totalHours = end - start;
        
        // Restar pausa si existe
        if (hasBreakCheckbox.checked && breakStart && breakEnd) {
            const breakStartDec = timeToDecimal(breakStart);
            const breakEndDec = timeToDecimal(breakEnd);
            const breakDuration = breakEndDec - breakStartDec;
            
            if (breakDuration > 0) {
                totalHours -= breakDuration;
            }
        }
        
        // Calcular según tipo de día
        let normalHours = 0;
        let extraHours150 = 0;
        let extraHours200 = 0;
        
        switch (dayType) {
            case 'workday':
                normalHours = Math.min(totalHours, 8);
                extraHours150 = Math.max(0, totalHours - 8);
                break;
                
            case 'weekend':
                extraHours200 = totalHours * 0.5; // 50% extra (equivalente a 150%)
                break;
                
            case 'holiday':
                extraHours200 = totalHours; // 100% extra (equivalente a 200%)
                break;
        }
        
        // Mostrar resultados
        document.getElementById('normal-hours').textContent = normalHours.toFixed(2);
        document.getElementById('extra-hours-150').textContent = extraHours150.toFixed(2);
        document.getElementById('extra-hours-200').textContent = extraHours200.toFixed(2);
        document.getElementById('total-hours').textContent = totalHours.toFixed(2);
        
        summarySection.classList.remove('hidden');
    }
    
    // Validar formulario antes de enviar
    function validateForm() {
        let isValid = true;
        
        // Validar campos requeridos
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        // Validar que hora fin sea mayor a hora inicio
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        
        if (startTime && endTime && startTime >= endTime) {
            document.getElementById('end-time').classList.add('error');
            isValid = false;
        }
        
        // Validar pausa si está marcada
        if (hasBreakCheckbox.checked) {
            const breakStart = document.getElementById('break-start').value;
            const breakEnd = document.getElementById('break-end').value;
            
            if (!breakStart || !breakEnd || breakStart >= breakEnd) {
                document.getElementById('break-start').classList.add('error');
                document.getElementById('break-end').classList.add('error');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    // Enviar formulario (simulado)
    function submitForm(event) {
        event.preventDefault();
        
        if (validateForm()) {
            // Obtener datos del formulario
            const formData = {
                date: document.getElementById('date').value,
                dayType: document.getElementById('day-type').value,
                startTime: document.getElementById('start-time').value,
                endTime: document.getElementById('end-time').value,
                hasBreak: hasBreakCheckbox.checked,
                breakStart: document.getElementById('break-start').value || null,
                breakEnd: document.getElementById('break-end').value || null,
                notes: document.getElementById('notes').value || null,
                normalHours: parseFloat(document.getElementById('normal-hours').textContent),
                extraHours150: parseFloat(document.getElementById('extra-hours-150').textContent),
                extraHours200: parseFloat(document.getElementById('extra-hours-200').textContent),
                totalHours: parseFloat(document.getElementById('total-hours').textContent)
            };
            
            console.log('Datos a enviar:', formData);
            
            // Aquí iría el fetch() para enviar los datos al servidor
            // Ejemplo:
            /*
            fetch('/api/time-entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                alert('Jornada registrada correctamente');
                hideModal();
                form.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al registrar la jornada');
            });
            */
            
            // Simulación de envío exitoso
            alert('Jornada registrada correctamente');
            hideModal();
            form.reset();
            setCurrentDate();
        } else {
            alert('Por favor complete todos los campos requeridos correctamente');
        }
    }
    
    // Event Listeners
    showModal(); // En producción esto se llamaría al hacer clic en un botón
    
    closeBtn.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);
    backdrop.addEventListener('click', hideModal);
    
    hasBreakCheckbox.addEventListener('change', toggleBreakFields);
    
    // Calcular horas cuando cambian los inputs relevantes
    const calcInputs = ['date', 'day-type', 'start-time', 'end-time', 'break-start', 'break-end'];
    calcInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', calculateHours);
    });
    
    form.addEventListener('submit', submitForm);
    
    // Inicialización
    setCurrentDate();
});