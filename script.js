// Datos persistentes (se guardan en el navegador)
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let nombreEstablecimiento = localStorage.getItem('nombreEstablecimiento') || '';
let tasaBCVGuardada = parseFloat(localStorage.getItem('tasaBCV')) || 0;

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    actualizarLista();
});

// ================= FUNCIONES PRINCIPALES (OPTIMIZADAS) =================

function cargarDatosIniciales() {
    document.getElementById('nombreEstablecimiento').value = nombreEstablecimiento;
    document.getElementById('tasaBCV').value = tasaBCVGuardada || '';
}

function calcularPrecioVenta() {
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value);
    const unidades = parseFloat(document.getElementById('unidades').value);

    if (!validarTasaBCV(tasaBCV)) return;
    if (!validarCamposNumericos(costo, ganancia, unidades)) return;

    const gananciaDecimal = ganancia / 100;
    const precioDolar = costo / (1 - gananciaDecimal);
    const precioBolivares = precioDolar * tasaBCV;
    const precioUnitarioDolar = precioDolar / unidades;
    const precioUnitarioBolivar = precioBolivares / unidades;

    mostrarResultados(precioDolar, precioBolivares, precioUnitarioDolar, precioUnitarioBolivar);
}

function guardarProducto() {
    const nombre = document.getElementById('producto').value.trim();
    const descripcion = document.getElementById('descripcion').value;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value);
    const unidades = parseFloat(document.getElementById('unidades').value);
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;

    if (!validarCamposTexto(nombre, descripcion)) return;
    if (!validarTasaBCV(tasaBCV)) return;
    if (!validarCamposNumericos(costo, ganancia, unidades)) return;

    if (productoExiste(nombre)) {
        if (!confirm(`⚠️ "${nombre}" ya existe. ¿Deseas guardarlo de todos modos?`)) return;
    }

    const producto = calcularProducto(nombre, descripcion, costo, ganancia, unidades, tasaBCV);
    guardarProductoEnLista(producto);
}

// ================= FUNCIONES DE GESTIÓN (CON ORDENAMIENTO) =================

function actualizarTasaBCV() {
    const nuevaTasa = parseFloat(document.getElementById('tasaBCV').value);
    
    if (!validarTasaBCV(nuevaTasa)) return;

    guardarTasaEnHistorial(nuevaTasa);

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

// ================= FUNCIONES DE LISTADO (ORDENADAS ALFABÉTICAMENTE) =================

function mostrarListaCostos() {
    const container = document.getElementById('listaCostosContainer');
    const lista = document.getElementById('listaCostos');
    
    if (container.style.display === 'none') {
        lista.innerHTML = '';
        
        if (productos.length === 0) {
            lista.innerHTML = '<li>No hay productos registrados</li>';
        } else {
            obtenerProductosOrdenados().forEach(producto => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span><strong>${producto.nombre}</strong> (${producto.descripcion})</span>
                    <span>$${producto.costo.toFixed(2)} | Bs${(producto.costo * tasaBCVGuardada).toFixed(2)}</span>
                `;
                lista.appendChild(li);
            });
        }
        
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function actualizarLista() {
    const tbody = document.querySelector('#listaProductos tbody');
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No hay productos registrados</td></tr>';
        return;
    }

    obtenerProductosOrdenados().forEach(producto => {
        const originalIndex = productos.findIndex(p => p.nombre === producto.nombre);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.descripcion}</td>
            <td>$${producto.precioMayorDolar.toFixed(2)}</td>
            <td>Bs${producto.precioMayorBolivar.toFixed(2)}</td>
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

// Función auxiliar para ordenamiento (optimizada)
function obtenerProductosOrdenados() {
    return [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
}

// ================= FUNCIONES DE VALIDACIÓN (ORIGINALES) =================

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

// ================= FUNCIONES DE CÁLCULO (ORIGINALES) =================

function calcularProducto(nombre, descripcion, costo, ganancia, unidades, tasaBCV) {
    const gananciaDecimal = ganancia / 100;
    const precioDolar = costo / (1 - gananciaDecimal);
    const precioBolivares = precioDolar * tasaBCV;

    return {
        nombre,
        descripcion,
        costo,
        ganancia: gananciaDecimal,
        unidades,
        precioMayorDolar: precioDolar,
        precioMayorBolivar: precioBolivares,
        precioUnitarioDolar: precioDolar / unidades,
        precioUnitarioBolivar: precioBolivares / unidades,
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

// ================= FUNCIONES DE INTERFAZ (ORIGINALES) =================

function mostrarResultados(precioDolar, precioBolivares, precioUnitarioDolar, precioUnitarioBolivar) {
    document.getElementById('resultadoPrecioVenta').innerHTML = 
        `<strong>Precio al mayor:</strong> $${precioDolar.toFixed(2)} / Bs${precioBolivares.toFixed(2)}`;
    document.getElementById('precioUnitario').innerHTML = 
        `<strong>Precio unitario:</strong> $${precioUnitarioDolar.toFixed(2)} / Bs${precioUnitarioBolivar.toFixed(2)}`;
}

function reiniciarCalculadora() {
    document.getElementById('producto').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('ganancia').value = '';
    document.getElementById('unidades').value = '';
    document.getElementById('descripcion').selectedIndex = 0;
}

// ================= FUNCIONES DE BÚSQUEDA Y GESTIÓN (ORIGINALES) =================

function buscarProducto() {
    const filtro = document.getElementById('buscar').value.toLowerCase();
    const filas = document.querySelectorAll('#listaProductos tbody tr');

    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(filtro) ? '' : 'none';
    });
}

function editarProducto(index) {
    const producto = productos[index];
    const nuevoNombre = prompt("Nombre:", producto.nombre);
    const nuevaDescripcion = prompt("Descripción:", producto.descripcion);
    const nuevoCosto = parseFloat(prompt("Costo ($):", producto.costo));
    const nuevaGanancia = parseFloat(prompt("Ganancia (%):", producto.ganancia * 100));
    const nuevasUnidades = parseFloat(prompt("Unidades:", producto.unidades));

    if (nuevoNombre && nuevaDescripcion && !isNaN(nuevoCosto) && !isNaN(nuevaGanancia) && !isNaN(nuevasUnidades)) {
        productos[index] = calcularProducto(
            nuevoNombre,
            nuevaDescripcion,
            nuevoCosto,
            nuevaGanancia,
            nuevasUnidades,
            tasaBCVGuardada
        );
        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
        mostrarToast("✅ Producto actualizado");
    }
}

function eliminarProducto(index) {
    if (confirm(`¿Eliminar "${productos[index].nombre}"?`)) {
        productos.splice(index, 1);
        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
        mostrarToast("✅ Producto eliminado");
    }
}

function limpiarLista() {
    if (confirm("¿Borrar TODOS los productos?")) {
        productos = [];
        localStorage.removeItem('productos');
        actualizarLista();
        mostrarToast("✅ Lista de productos limpiada");
    }
}

// ================= FUNCIONES DE IMPRESIÓN (OPTIMIZADAS) =================

function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Lista de Productos - ${nombreEstablecimiento || 'Mi Negocio'}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Tasa BCV: ${tasaBCVGuardada} | Fecha: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    const columns = [
        { header: 'Producto', dataKey: 'nombre' },
        { header: 'Descripción', dataKey: 'descripcion' },
        { header: 'Precio $', dataKey: 'precioDolar' },
        { header: 'Precio Bs', dataKey: 'precioBolivar' },
        { header: 'Unitario $', dataKey: 'unitarioDolar' },
        { header: 'Unitario Bs', dataKey: 'unitarioBolivar' }
    ];
    
    const rows = obtenerProductosOrdenados().map(producto => ({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precioDolar: `$${producto.precioMayorDolar.toFixed(2)}`,
        precioBolivar: `Bs${producto.precioMayorBolivar.toFixed(2)}`,
        unitarioDolar: `$${producto.precioUnitarioDolar.toFixed(2)}`,
        unitarioBolivar: `Bs${producto.precioUnitarioBolivar.toFixed(2)}`
    }));
    
    doc.autoTable({
        startY: 30,
        head: [columns.map(col => col.header)],
        body: rows.map(row => columns.map(col => row[col.dataKey])),
        margin: { horizontal: 5 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    doc.save('lista_productos.pdf');
    mostrarToast("✅ PDF generado con éxito");
}

function imprimirTicket(index) {
    const producto = productos[index];
    const ventana = window.open('', '_blank', 'width=80mm,height=150px');
    
    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket</title>
            <meta charset="UTF-8">
            <style>
                @page { size: 80mm auto; margin: 0; }
                body {
                    font-family: Arial, sans-serif;
                    width: 80mm;
                    margin: 0;
                    padding: 2mm;
                    font-size: 14px;
                    line-height: 1.3;
                }
                .header {
                    text-align: center;
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 3mm;
                }
                .producto {
                    text-align: center;
                    font-size: 18px;
                    margin: 2mm 0;
                }
                .price {
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    margin: 5mm 0;
                }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 3mm auto;
                    width: 70%;
                }
                .footer {
                    text-align: center;
                    font-style: italic;
                    margin-top: 3mm;
                }
            </style>
        </head>
        <body>
            <div class="header">${nombreEstablecimiento || 'Mi Negocio'}</div>
            <div class="producto">${producto.nombre}</div>
            <div class="price">Bs ${producto.precioUnitarioBolivar.toFixed(2).replace('.', ',')}</div>
            <div class="divider"></div>
            <div class="footer">${new Date().toLocaleDateString()}</div>
            <script>
                setTimeout(function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 100);
                }, 50);
            </script>
        </body>
        </html>
    `);
    ventana.document.close();
}

// ================= FUNCIONES DE NOTIFICACIÓN (ORIGINALES) =================

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
