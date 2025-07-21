// Datos persistentes
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let nombreEstablecimiento = localStorage.getItem('nombreEstablecimiento') || '';
let tasaBCVGuardada = parseFloat(localStorage.getItem('tasaBCV')) || 0;
let ventasDiarias = JSON.parse(localStorage.getItem('ventasDiarias')) || [];

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    actualizarLista();
});

// ================= FUNCIONES PRINCIPALES =================

function cargarDatosIniciales() {
    document.getElementById('nombreEstablecimiento').value = nombreEstablecimiento;
    document.getElementById('tasaBCV').value = tasaBCVGuardada || '';
}

function calcularPrecioVenta() {
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value);
    const unidadesPorCaja = parseFloat(document.getElementById('unidadesPorCaja').value);
    const unidadesExistentes = parseFloat(document.getElementById('unidadesExistentes').value) || 0;

    if (!validarTasaBCV(tasaBCV)) return;
    if (!validarCamposNumericos(costo, ganancia, unidadesPorCaja)) return;

    const gananciaDecimal = ganancia / 100;
    const precioDolar = costo / (1 - gananciaDecimal);
    const precioBolivares = precioDolar * tasaBCV;
    const precioUnitarioDolar = precioDolar / unidadesPorCaja;
    const precioUnitarioBolivar = precioBolivares / unidadesPorCaja;

    mostrarResultados(precioUnitarioDolar, precioUnitarioBolivar);
}

function guardarProducto() {
    const nombre = document.getElementById('producto').value.trim();
    const descripcion = document.getElementById('descripcion').value;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value);
    const unidadesPorCaja = parseFloat(document.getElementById('unidadesPorCaja').value);
    const unidadesExistentes = parseFloat(document.getElementById('unidadesExistentes').value) || 0;
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;

    if (!validarCamposTexto(nombre, descripcion)) return;
    if (!validarTasaBCV(tasaBCV)) return;
    if (!validarCamposNumericos(costo, ganancia, unidadesPorCaja)) return;

    if (productoExiste(nombre)) {
        if (!confirm(`⚠️ "${nombre}" ya existe. ¿Deseas actualizarlo?`)) return;
        const index = productos.findIndex(p => p.nombre.toLowerCase() === nombre.toLowerCase());
        productos.splice(index, 1);
    }

    const producto = calcularProducto(nombre, descripcion, costo, ganancia, unidadesPorCaja, tasaBCV, unidadesExistentes);
    guardarProductoEnLista(producto);
}

// ================= FUNCIONES DE LISTA DE COSTOS =================

function mostrarListaCostos() {
    const container = document.getElementById('listaCostosContainer');
    const lista = document.getElementById('listaCostos');
    
    if (productos.length === 0) {
        mostrarToast("⚠️ No hay productos registrados", "warning");
        container.style.display = 'none';
        return;
    }

    // Alternar la visibilidad
    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'block';
        actualizarListaCostos();
    } else {
        container.style.display = 'none';
    }
}

function actualizarListaCostos() {
    const lista = document.getElementById('listaCostos');
    lista.innerHTML = '';

    // Ordenar por costo más alto
    const productosOrdenados = [...productos].sort((a, b) => b.costo - a.costo);
    
    productosOrdenados.forEach(producto => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${producto.nombre} (${producto.descripcion})</span>
            <span>$${producto.costo.toFixed(2)} / Bs${(producto.costo * tasaBCVGuardada).toFixed(2)}</span>
        `;
        lista.appendChild(li);
    });
}

function generarPDFCostos() {
    if (productos.length === 0) {
        mostrarToast("⚠️ No hay productos para generar el PDF", "warning");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Lista de Costos - ${nombreEstablecimiento || 'Mi Negocio'}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()} | Tasa BCV: ${tasaBCVGuardada}`, 105, 22, { align: 'center' });
    
    // Tabla de costos
    const columns = [
        { header: 'Producto', dataKey: 'nombre' },
        { header: 'Descripción', dataKey: 'descripcion' },
        { header: 'Costo ($)', dataKey: 'costoDolar' },
        { header: 'Costo (Bs)', dataKey: 'costoBolivar' }
    ];
    
    const rows = productos.map(producto => ({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        costoDolar: `$${producto.costo.toFixed(2)}`,
        costoBolivar: `Bs${(producto.costo * tasaBCVGuardada).toFixed(2)}`
    }));
    
    doc.autoTable({
        startY: 30,
        head: [columns.map(col => col.header)],
        body: rows.map(row => columns.map(col => row[col.dataKey])),
        margin: { horizontal: 10 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    doc.save(`lista_costos_${new Date().toISOString().split('T')[0]}.pdf`);
    mostrarToast("✅ Lista de costos generada en PDF");
}

// ================= FUNCIONES DE RESPALDO =================

function generarRespaldoCompleto() {
    if (productos.length === 0 && ventasDiarias.length === 0) {
        mostrarToast("⚠️ No hay datos para respaldar", "warning");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Página 1: Información general
    doc.setFontSize(16);
    doc.text(`Respaldo Completo - ${nombreEstablecimiento || 'Mi Negocio'}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
    doc.text(`Tasa BCV: ${tasaBCVGuardada}`, 105, 28, { align: 'center' });
    
    // Resumen
    doc.text(`Total Productos: ${productos.length}`, 20, 40);
    doc.text(`Total Ventas Hoy: ${ventasDiarias.length}`, 20, 46);
    
    const totalVentasDolar = ventasDiarias.reduce((sum, venta) => sum + venta.totalDolar, 0);
    const totalVentasBolivar = ventasDiarias.reduce((sum, venta) => sum + venta.totalBolivar, 0);
    doc.text(`Ventas Totales $: ${totalVentasDolar.toFixed(2)}`, 20, 52);
    doc.text(`Ventas Totales Bs: ${totalVentasBolivar.toFixed(2)}`, 20, 58);
    
    // Página 2: Lista de productos
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`Inventario de Productos`, 105, 15, { align: 'center' });
    
    const columns = [
        { header: 'Producto', dataKey: 'nombre' },
        { header: 'Descripción', dataKey: 'descripcion' },
        { header: 'Existencias', dataKey: 'existencias' },
        { header: 'Precio ($)', dataKey: 'precioDolar' },
        { header: 'Precio (Bs)', dataKey: 'precioBolivar' }
    ];
    
    const rows = productos.map(producto => ({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        existencias: producto.unidadesExistentes,
        precioDolar: `$${producto.precioUnitarioDolar.toFixed(2)}`,
        precioBolivar: `Bs${producto.precioUnitarioBolivar.toFixed(2)}`
    }));
    
    doc.autoTable({
        startY: 25,
        head: [columns.map(col => col.header)],
        body: rows.map(row => columns.map(col => row[col.dataKey])),
        margin: { horizontal: 10 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [26, 188, 156], textColor: 255 },
        didDrawCell: (data) => {
            if (data.column.dataKey === 'existencias' && data.cell.raw <= 5) {
                doc.setTextColor(255, 0, 0);
            }
        }
    });
    
    // Página 3: Ventas diarias (si hay)
    if (ventasDiarias.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text(`Registro de Ventas`, 105, 15, { align: 'center' });
        
        const ventasColumns = [
            { header: 'Producto', dataKey: 'producto' },
            { header: 'Cantidad', dataKey: 'cantidad' },
            { header: 'Precio ($)', dataKey: 'precioDolar' },
            { header: 'Precio (Bs)', dataKey: 'precioBolivar' },
            { header: 'Total ($)', dataKey: 'totalDolar' },
            { header: 'Total (Bs)', dataKey: 'totalBolivar' }
        ];
        
        const ventasRows = ventasDiarias.map(venta => ({
            producto: venta.producto,
            cantidad: venta.cantidad,
            precioDolar: `$${venta.precioUnitarioDolar.toFixed(2)}`,
            precioBolivar: `Bs${venta.precioUnitarioBolivar.toFixed(2)}`,
            totalDolar: `$${venta.totalDolar.toFixed(2)}`,
            totalBolivar: `Bs${venta.totalBolivar.toFixed(2)}`
        }));
        
        doc.autoTable({
            startY: 25,
            head: [ventasColumns.map(col => col.header)],
            body: ventasRows.map(row => ventasColumns.map(col => row[col.dataKey])),
            margin: { horizontal: 10 },
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [155, 89, 182], textColor: 255 }
        });
    }
    
    doc.save(`respaldo_completo_${new Date().toISOString().split('T')[0]}.pdf`);
    mostrarToast("✅ Respaldo completo generado en PDF");
}

// ================= FUNCIONES DE GESTIÓN =================

function actualizarTasaBCV() {
    const nuevaTasa = parseFloat(document.getElementById('tasaBCV').value);
    
    if (!validarTasaBCV(nuevaTasa)) return;

    tasaBCVGuardada = nuevaTasa;
    localStorage.setItem('tasaBCV', tasaBCVGuardada);
    
    if (productos.length > 0) {
        actualizarPreciosConNuevaTasa(nuevaTasa);
        actualizarLista();
        mostrarToast(`✅ Tasa BCV actualizada a: ${nuevaTasa}\n${productos.length} productos recalculados.`);
    } else {
        mostrarToast("✅ Tasa BCV actualizada (no hay productos para recalcular)");
    }
}

function actualizarPreciosConNuevaTasa(nuevaTasa) {
    productos.forEach(producto => {
        producto.precioMayorBolivar = producto.precioMayorDolar * nuevaTasa;
        producto.precioUnitarioBolivar = producto.precioUnitarioDolar * nuevaTasa;
    });
    localStorage.setItem('productos', JSON.stringify(productos));
}

function guardarNombreEstablecimiento() {
    nombreEstablecimiento = document.getElementById('nombreEstablecimiento').value.trim();
    if (!nombreEstablecimiento) {
        mostrarToast("⚠️ Ingrese un nombre válido", "error");
        return;
    }
    localStorage.setItem('nombreEstablecimiento', nombreEstablecimiento);
    mostrarToast(`✅ Nombre guardado: "${nombreEstablecimiento}"`);
}

// ================= FUNCIONES DE INVENTARIO =================

function ajustarInventario(index, operacion) {
    const producto = productos[index];
    const cantidad = parseInt(prompt(`Cantidad a ${operacion === 'sumar' ? 'sumar' : 'restar'}:`, "1")) || 0;
    
    if (cantidad <= 0) {
        mostrarToast("⚠️ Ingrese una cantidad válida", "error");
        return;
    }

    if (operacion === 'restar' && producto.unidadesExistentes < cantidad) {
        mostrarToast("⚠️ No hay suficientes unidades en inventario", "error");
        return;
    }

    if (operacion === 'sumar') {
        producto.unidadesExistentes += cantidad;
    } else {
        producto.unidadesExistentes -= cantidad;
        const venta = {
            fecha: new Date().toLocaleString(),
            producto: producto.nombre,
            cantidad: cantidad,
            precioUnitarioDolar: producto.precioUnitarioDolar,
            precioUnitarioBolivar: producto.precioUnitarioBolivar,
            totalDolar: cantidad * producto.precioUnitarioDolar,
            totalBolivar: cantidad * producto.precioUnitarioBolivar
        };
        ventasDiarias.push(venta);
        localStorage.setItem('ventasDiarias', JSON.stringify(ventasDiarias));
    }

    localStorage.setItem('productos', JSON.stringify(productos));
    actualizarLista();
    mostrarToast(`✅ Inventario actualizado: ${producto.nombre} - ${operacion === 'sumar' ? '+' : '-'}${cantidad}`);
}

function generarReporteDiario() {
    if (ventasDiarias.length === 0) {
        mostrarToast("⚠️ No hay ventas registradas hoy", "warning");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Reporte Diario - ${nombreEstablecimiento || 'Mi Negocio'}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    const totalDolar = ventasDiarias.reduce((sum, venta) => sum + venta.totalDolar, 0);
    const totalBolivar = ventasDiarias.reduce((sum, venta) => sum + venta.totalBolivar, 0);
    
    doc.text(`Total Ventas $: ${totalDolar.toFixed(2)}`, 105, 30, { align: 'center' });
    doc.text(`Total Ventas Bs: ${totalBolivar.toFixed(2)}`, 105, 36, { align: 'center' });
    
    const columns = [
        { header: 'Producto', dataKey: 'producto' },
        { header: 'Cantidad', dataKey: 'cantidad' },
        { header: 'Precio Unit ($)', dataKey: 'precioUnitarioDolar' },
        { header: 'Precio Unit (Bs)', dataKey: 'precioUnitarioBolivar' },
        { header: 'Total ($)', dataKey: 'totalDolar' },
        { header: 'Total (Bs)', dataKey: 'totalBolivar' }
    ];
    
    const rows = ventasDiarias.map(venta => ({
        producto: venta.producto,
        cantidad: venta.cantidad,
        precioUnitarioDolar: `$${venta.precioUnitarioDolar.toFixed(2)}`,
        precioUnitarioBolivar: `Bs${venta.precioUnitarioBolivar.toFixed(2)}`,
        totalDolar: `$${venta.totalDolar.toFixed(2)}`,
        totalBolivar: `Bs${venta.totalBolivar.toFixed(2)}`
    }));
    
    doc.autoTable({
        startY: 45,
        head: [columns.map(col => col.header)],
        body: rows.map(row => columns.map(col => row[col.dataKey])),
        margin: { horizontal: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`Inventario Actual - ${nombreEstablecimiento || 'Mi Negocio'}`, 105, 15, { align: 'center' });
    
    const inventarioColumns = [
        { header: 'Producto', dataKey: 'nombre' },
        { header: 'Descripción', dataKey: 'descripcion' },
        { header: 'Existencias', dataKey: 'unidadesExistentes' },
        { header: 'Precio Unit ($)', dataKey: 'precioUnitarioDolar' },
        { header: 'Precio Unit (Bs)', dataKey: 'precioUnitarioBolivar' }
    ];
    
    const inventarioRows = productos.map(producto => ({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        unidadesExistentes: producto.unidadesExistentes,
        precioUnitarioDolar: `$${producto.precioUnitarioDolar.toFixed(2)}`,
        precioUnitarioBolivar: `Bs${producto.precioUnitarioBolivar.toFixed(2)}`
    }));
    
    doc.autoTable({
        startY: 25,
        head: [inventarioColumns.map(col => col.header)],
        body: inventarioRows.map(row => inventarioColumns.map(col => row[col.dataKey])),
        margin: { horizontal: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [26, 188, 156], textColor: 255 },
        didDrawCell: (data) => {
            if (data.column.dataKey === 'unidadesExistentes' && data.cell.raw <= 5) {
                doc.setTextColor(255, 0, 0);
            }
        }
    });
    
    doc.save(`reporte_diario_${new Date().toISOString().split('T')[0]}.pdf`);
    mostrarToast("✅ Reporte diario generado con éxito");
}

// ================= FUNCIONES DE CÁLCULO =================

function calcularProducto(nombre, descripcion, costo, ganancia, unidadesPorCaja, tasaBCV, unidadesExistentes = 0) {
    const gananciaDecimal = ganancia / 100;
    const precioDolar = costo / (1 - gananciaDecimal);
    const precioBolivares = precioDolar * tasaBCV;

    return {
        nombre,
        descripcion,
        costo,
        ganancia: gananciaDecimal,
        unidadesPorCaja,
        unidadesExistentes: unidadesExistentes || 0,
        precioMayorDolar: precioDolar,
        precioMayorBolivar: precioBolivares,
        precioUnitarioDolar: precioDolar / unidadesPorCaja,
        precioUnitarioBolivar: precioBolivares / unidadesPorCaja,
        fechaActualizacion: new Date().toISOString()
    };
}

function guardarProductoEnLista(producto) {
    productos.push(producto);
    localStorage.setItem('productos', JSON.stringify(productos));
    actualizarLista();
    reiniciarCalculadora();
    mostrarToast("✅ Producto guardado exitosamente");
}

// ================= FUNCIONES DE INTERFAZ =================

function actualizarLista() {
    const tbody = document.querySelector('#listaProductos tbody');
    tbody.innerHTML = '';

    const productosOrdenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    productosOrdenados.forEach((producto, index) => {
        const originalIndex = productos.findIndex(p => p.nombre === producto.nombre);
        const inventarioBajo = producto.unidadesExistentes <= 5;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.descripcion}</td>
            <td class="${inventarioBajo ? 'inventario-bajo' : ''}">${producto.unidadesExistentes}</td>
            <td>
                <div class="ajuste-inventario">
                    <button onclick="ajustarInventario(${originalIndex}, 'sumar')">+</button>
                    <button onclick="ajustarInventario(${originalIndex}, 'restar')">-</button>
                </div>
            </td>
            <td>$${producto.precioUnitarioDolar.toFixed(2)}</td>
            <td>Bs${producto.precioUnitarioBolivar.toFixed(2)}</td>
            <td>
                <button class="editar" onclick="editarProducto(${originalIndex})">Editar</button>
                <button class="imprimir" onclick="imprimirTicket(${originalIndex})">Imprimir</button>
                <button class="eliminar" onclick="eliminarProducto(${originalIndex})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Actualizar también la lista de costos si está visible
    if (document.getElementById('listaCostosContainer').style.display === 'block') {
        actualizarListaCostos();
    }
}

function mostrarResultados(precioUnitarioDolar, precioUnitarioBolivar) {
    document.getElementById('precioUnitario').innerHTML = 
        `<strong>Precio unitario:</strong> $${precioUnitarioDolar.toFixed(2)} / Bs${precioUnitarioBolivar.toFixed(2)}`;
}

function reiniciarCalculadora() {
    document.getElementById('producto').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('ganancia').value = '';
    document.getElementById('unidadesPorCaja').value = '';
    document.getElementById('unidadesExistentes').value = '';
    document.getElementById('descripcion').selectedIndex = 0;
}

// ================= FUNCIONES DE VALIDACIÓN =================

function validarTasaBCV(tasa) {
    if (isNaN(tasa) || tasa <= 0) {
        mostrarToast("⚠️ Ingrese una tasa BCV válida (mayor a cero)", "error");
        return false;
    }
    return true;
}

function validarCamposNumericos(costo, ganancia, unidades) {
    if (isNaN(costo) || costo <= 0 || isNaN(ganancia) || ganancia <= 0 || isNaN(unidades) || unidades <= 0) {
        mostrarToast("⚠️ Complete todos los campos con valores válidos (mayores a cero)", "error");
        return false;
    }
    return true;
}

function validarCamposTexto(nombre, descripcion) {
    if (!nombre || !descripcion) {
        mostrarToast("⚠️ Complete todos los campos", "error");
        return false;
    }
    return true;
}

function productoExiste(nombre) {
    return productos.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());
}

// ================= FUNCIONES DE NOTIFICACIÓN =================

function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function esDispositivoMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function cerrarSesion() {
    let mensaje = "⚠️ Antes de cerrar:\n\n1. Recomendamos GENERAR UN PDF de respaldo.\n";
    
    if (esDispositivoMovil()) {
        mensaje += "\n📱 Advertencia para móviles:\n- La generación de PDF puede fallar.\n- Use una computadora para respaldos seguros.\n";
    }

    if (confirm(mensaje)) {
        mostrarToast("✅ Sesión cerrada. Tus datos están seguros.");
    }
}

function limpiarLista() {
    if (confirm("⚠️ ¿Estás seguro de limpiar toda la lista de productos? Esta acción no se puede deshacer.")) {
        productos = [];
        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
        mostrarToast("🗑️ Todos los productos han sido eliminados");
    }
}

function buscarProducto() {
    const termino = document.getElementById('buscar').value.trim().toLowerCase();
    if (!termino) {
        actualizarLista();
        return;
    }

    const resultados = productos.filter(p => 
        p.nombre.toLowerCase().includes(termino) || 
        p.descripcion.toLowerCase().includes(termino)
    );

    const tbody = document.querySelector('#listaProductos tbody');
    tbody.innerHTML = '';

    resultados.forEach((producto, index) => {
        const originalIndex = productos.findIndex(p => p.nombre === producto.nombre);
        const inventarioBajo = producto.unidadesExistentes <= 5;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.descripcion}</td>
            <td class="${inventarioBajo ? 'inventario-bajo' : ''}">${producto.unidadesExistentes}</td>
            <td>
                <div class="ajuste-inventario">
                    <button onclick="ajustarInventario(${originalIndex}, 'sumar')">+</button>
                    <button onclick="ajustarInventario(${originalIndex}, 'restar')">-</button>
                </div>
            </td>
            <td>$${producto.precioUnitarioDolar.toFixed(2)}</td>
            <td>Bs${producto.precioUnitarioBolivar.toFixed(2)}</td>
            <td>
                <button class="editar" onclick="editarProducto(${originalIndex})">Editar</button>
                <button class="imprimir" onclick="imprimirTicket(${originalIndex})">Imprimir</button>
                <button class="eliminar" onclick="eliminarProducto(${originalIndex})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ================= FUNCIONES ADICIONALES =================

function editarProducto(index) {
    const producto = productos[index];
    
    document.getElementById('producto').value = producto.nombre;
    document.getElementById('descripcion').value = producto.descripcion;
    document.getElementById('costo').value = producto.costo;
    document.getElementById('ganancia').value = producto.ganancia * 100;
    document.getElementById('unidadesPorCaja').value = producto.unidadesPorCaja;
    document.getElementById('unidadesExistentes').value = producto.unidadesExistentes;
    
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;
    const precioUnitarioDolar = producto.precioUnitarioDolar;
    const precioUnitarioBolivar = precioUnitarioDolar * tasaBCV;
    
    mostrarResultados(precioUnitarioDolar, precioUnitarioBolivar);
    
    productos.splice(index, 1);
    localStorage.setItem('productos', JSON.stringify(productos));
    
    mostrarToast(`✏️ Editando producto: ${producto.nombre}`);
}

function eliminarProducto(index) {
    const producto = productos[index];
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
        productos.splice(index, 1);
        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
        mostrarToast(`🗑️ Producto eliminado: ${producto.nombre}`);
    }
}

function imprimirTicket(index) {
    const producto = productos[index];
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html>
            <head>
                <title>Ticket - ${producto.nombre}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .ticket { max-width: 300px; margin: 0 auto; border: 1px dashed #ccc; padding: 15px; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .producto { font-weight: bold; font-size: 18px; }
                    .precios { margin-top: 10px; }
                    .fecha { font-size: 12px; text-align: right; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <div class="header">
                        <h3>${nombreEstablecimiento || 'Mi Negocio'}</h3>
                    </div>
                    <div class="producto">${producto.nombre}</div>
                    <div>${producto.descripcion}</div>
                    <div class="precios">
                        <div>Precio: $${producto.precioUnitarioDolar.toFixed(2)}</div>
                        <div>Precio: Bs${producto.precioUnitarioBolivar.toFixed(2)}</div>
                    </div>
                    <div class="fecha">${new Date().toLocaleString()}</div>
                </div>
                <script>window.print();</script>
            </body>
        </html>
    `);
    ventana.document.close();
}
