/* ==========================================
   1. REGISTROS BASE DE PRUEBA / LOCALSTORAGE
   ========================================== */
let nuevosMovimientos = JSON.parse(localStorage.getItem('historialMovimientos')) || [
    { codigo: "#HZ-1085", descripcion: "Epps - Casco de Seguridad", area: "Operaciones Planta", tipo: "Ingreso", cantidad: 50, estado: "Completado" },
    { codigo: "#HZ-3312", descripcion: "Juego de Llaves Mixtas", area: "Taller Mecánico", tipo: "Préstamo", cantidad: 2, estado: "Pendiente" },
    { codigo: "#HZ-9044", descripcion: "Amoladora Angular Bosch", area: "Pañol Central", tipo: "Ingreso", cantidad: 3, estado: "Completado" }
];

let datosAlmacen = {
    rotacionDias: 20.3,
    stockSeguridad: 18,
    herramientasEnTransito: 0,
    capacidadEstanteriaA: 85,
    capacidadEstanteriaB: 40
};

/* ==========================================
   2. ARRANQUE DEL APLICATIVO
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById('form-registro-movimiento');
    if (formulario) {
        formulario.addEventListener('submit', registrarMovimiento);
    }

    // ⚡ NUEVO: Escuchar cambios en el selector de filtros
    const filtroEstado = document.getElementById('filtro-estado');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', cargarHistorialMovimientos);
    }

    configurarNavegacionSPA();
    cargarHistorialMovimientos();
});
/* ==========================================
   3. ARQUITECTURA DE NAVEGACIÓN (SPA)
   ========================================== */
function configurarNavegacionSPA() {
    const pestañas = document.querySelectorAll('.nav-tab');
    const vistas = document.querySelectorAll('.tab-content');

    pestañas.forEach(pestaña => {
        pestaña.addEventListener('click', (e) => {
            e.preventDefault();
            
            pestañas.forEach(p => p.classList.remove('active'));
            vistas.forEach(v => v.classList.remove('active-view'));

            pestaña.classList.add('active');
            
            const targetId = pestaña.getAttribute('data-target');
            const vistaObjetivo = document.getElementById(targetId);
            if (vistaObjetivo) {
                vistaObjetivo.classList.add('active-view');
            }
        });
    });
}

/* ==========================================
   4. LOGICA DE REGISTRO CON VALIDACIONES (PUNTO 4)
   ========================================== */
function registrarMovimiento(e) {
    e.preventDefault();

    const codigoInput = document.getElementById('codigo-item');
    const descInput = document.getElementById('descripcion-item');
    const areaInput = document.getElementById('area-destino');
    const cantidadInput = document.getElementById('cantidad-item');
    const tipoSelect = document.getElementById('tipo-movimiento');

    // 1. Validar que no haya campos vacíos o solo espacios
    if (!codigoInput.value.trim() || !descInput.value.trim() || !areaInput.value.trim()) {
        // Antes: alert("Error: Por favor, complete todos los campos correctamente.");
        // Ahora:
        mostrarNotificacion("Por favor, complete todos los campos.", "error");
        return;
    }

    // 2. Validar cantidad (debe ser mayor a 0)
    const cantidad = parseInt(cantidadInput.value);
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Error: La cantidad debe ser un número mayor a 0.");
        cantidadInput.focus();
        return;
    }

    // 3. Validar longitud mínima del código (ejemplo: al menos 5 caracteres)
    if (codigoInput.value.trim().length < 5) {
        alert("Error: El código debe tener al menos 5 caracteres.");
        codigoInput.focus();
        return;
    }

    // Si todo está correcto, procesamos
    const nuevoMovimiento = {
        codigo: codigoInput.value.trim().toUpperCase(), // Convertimos a mayúsculas para estandarizar
        descripcion: descInput.value.trim(),
        area: areaInput.value.trim(),
        tipo: tipoSelect.value,
        cantidad: cantidad,
        estado: tipoSelect.value === "Préstamo" ? "Pendiente" : "Completado"
    };

    nuevosMovimientos.push(nuevoMovimiento);
    guardarEnLocalStorage();
    cargarHistorialMovimientos();
    e.target.reset(); // Limpia formulario
}

/* ==========================================
   5. RENDERIZADO DINÁMICO DE LA TABLA CON FILTROS
   ========================================= */
function cargarHistorialMovimientos() {
    const cuerpoTabla = document.getElementById('tabla-movimientos');
    if (!cuerpoTabla) return;
    
    cuerpoTabla.innerHTML = "";

    // ⚡ NUEVO: Leer el valor actual del filtro (si no existe, por defecto es "Todos")
    const filtro = document.getElementById('filtro-estado')?.value || "Todos";

    nuevosMovimientos.forEach((movimiento, index) => {
        // ⚡ NUEVO: Validar si el movimiento actual coincide con el filtro seleccionado
        if (filtro !== "Todos" && movimiento.estado !== filtro) {
            return; // Salta este registro si no coincide
        }

        const fila = document.createElement('tr');
        const claseBadge = movimiento.tipo === "Préstamo" ? "badge-out" : "badge-in";
        let claseEstado = "";
        
        if (movimiento.estado === "Pendiente") {
            claseEstado = "text-warning font-weight-bold";
            fila.style.backgroundColor = "rgba(245, 158, 11, 0.03)";
        } else {
            claseEstado = "text-success";
        }

        fila.innerHTML = `
            <td><strong>${movimiento.codigo}</strong></td>
            <td>${movimiento.descripcion}</td>
            <td>${movimiento.area}</td>
            <td><span class="badge ${claseBadge}">${movimiento.tipo}</span></td>
            <td>${movimiento.cantidad} uds</td>
            <td class="${claseEstado}">${movimiento.estado || 'Completado'}</td>
            <td>
                <button class="btn-delete-row" onclick="eliminarRegistro(${index})" title="Eliminar">🗑️</button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });

    // Mantener siempre actualizado el indicador de tránsito en base a los datos reales
    datosAlmacen.herramientasEnTransito = nuevosMovimientos.filter(m => m.tipo === "Préstamo" && m.estado === "Pendiente").length;
    calcularYActualizarPanel();
}

/* ==========================================
   6. ELIMINACIÓN DE REGISTROS (CRUD)
   ========================================== */
function eliminarRegistro(index) {
    // Eliminamos el confirm() para que sea instantáneo
    nuevosMovimientos.splice(index, 1);
    guardarEnLocalStorage();
    cargarHistorialMovimientos();
    
    // Mostramos la notificación flotante en lugar del alert
    mostrarNotificacion("Registro eliminado exitosamente.");
}
/* ==========================================
   7. SINCRONIZACIÓN DE MÉTRICAS Y TARJETAS
   ========================================== */
function calcularYActualizarPanel() {
    const txtRotacion = document.getElementById('metric-rotacion');
    const txtStockSeg = document.getElementById('metric-seguridad');
    const txtTransito = document.getElementById('metric-transito');

    if (txtRotacion) txtRotacion.textContent = `${datosAlmacen.rotacionDias} días`;
    if (txtStockSeg) txtStockSeg.textContent = `${datosAlmacen.stockSeguridad} Unidades`;
    if (txtTransito) txtTransito.textContent = `${datosAlmacen.herramientasEnTransito} ítems`;

    const barA = document.getElementById('bar-estanteria-a');
    const barB = document.getElementById('bar-estanteria-b');
    const valA = document.getElementById('val-estanteria-a');
    const valB = document.getElementById('val-estanteria-b');

    if (barA) barA.style.width = `${datosAlmacen.capacidadEstanteriaA}%`;
    if (valA) valA.textContent = `${datosAlmacen.capacidadEstanteriaA}%`;
    if (barB) barB.style.width = `${datosAlmacen.capacidadEstanteriaB}%`;
    if (valB) valB.textContent = `${datosAlmacen.capacidadEstanteriaB}%`;
}

function guardarEnLocalStorage() {
    localStorage.setItem('historialMovimientos', JSON.stringify(nuevosMovimientos));
}

/* ==========================================
   9. EXPORTACIÓN A CSV MEJORADA (PUNTO 3)
   ========================================== */
function exportarACSV() {
    if (nuevosMovimientos.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    // 1. Usamos punto y coma (;) como separador para que Excel lo abra directo
    // 2. Añadimos el BOM (\uFEFF) al principio para que reconozca tildes y ñ
    let csvContent = "\uFEFF"; 
    csvContent += "Código;Descripción;Área;Tipo;Cantidad;Estado\n";

    nuevosMovimientos.forEach(m => {
        // Aseguramos que los datos se separen por ;
        let fila = `${m.codigo};${m.descripcion};${m.area};${m.tipo};${m.cantidad};${m.estado}\n`;
        csvContent += fila;
    });

    // Crear el archivo con el tipo de contenido correcto
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Reporte_Panol_Inventario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ==========================================
   10. NOTIFICACIONES FLOTANTES (TOASTS)
   ========================================== */
function mostrarNotificacion(mensaje, tipo = "info") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast`;
    toast.textContent = mensaje;
    if (tipo === "error") toast.style.borderLeftColor = "#ef4444";
    
    container.appendChild(toast);
    
    // Eliminar tras 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}