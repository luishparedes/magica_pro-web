// Datos persistentes (se guardan en el navegador)
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let nombreEstablecimiento = localStorage.getItem('nombreEstablecimiento') || '';
let tasaBCVGuardada = parseFloat(localStorage.getItem('tasaBCV')) || 0;

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    actualizarLista();
});

// ================= FUNCIONES PRINCIPALES =================

// Carga los datos guardados en los campos del formulario
function cargarDatosIniciales() {
    document.getElementById('nombreEstablecimiento').value = nombreEstablecimiento;
    document.getElementById('tasaBCV').value = tasaBCVGuardada || '';
}

// Calcula el precio de venta basado en los datos ingresados
function calcularPrecioVenta() {
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value);
    const unidades = parseFloat(document.getElementById('unidades').value);

    // Validaciones
    if (!validarTasaBCV(tasaBCV)) return;
    if (!validarCamposNumericos(costo, ganancia, unidades)) return;

    // Cálculos matemáticos
    const gananciaDecimal = ganancia / 100;
    const precioDolar = costo / (1 - gananciaDecimal);
    const precioBolivares = precioDolar * tasaBCV;
    const precioUnitarioDolar = precioDolar / unidades;
    const precioUnitarioBolivar = precioBolivares / unidades;

    // Mostrar resultados
    mostrarResultados(precioDolar, precioBolivares, precioUnitarioDolar, precioUnitarioBolivar);
}

// Guarda un nuevo producto en la lista
function guardarProducto() {
    const nombre = document.getElementById('producto').value.trim();
    const descripcion = document.getElementById('descripcion').value;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value);
    const unidades = parseFloat(document.getElementById('unidades').value);
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;

    // Validaciones
    if (!validarCamposTexto(nombre, descripcion)) return;
    if (!validarTasaBCV(tasaBCV)) return;
    if (!validarCamposNumericos(costo, ganancia, unidades)) return;

    // Verificar si el producto ya existe
    if (productoExiste(nombre)) {
        if (!confirm(`⚠️ "${nombre}" ya existe. ¿Deseas guardarlo de todos modos?`)) return;
    }

    // Crea el producto y lo guarda
    const producto = calcularProducto(nombre, descripcion, costo, ganancia, unidades, tasaBCV);
    guardarProductoEnLista(producto);
}

// ================= FUNCIONES DE GESTIÓN =================

// Actualiza la tasa BCV y recalcula todos los precios (FUNCIÓN CORREGIDA)
function actualizarTasaBCV() {
    const nuevaTasa = parseFloat(document.getElementById('tasaBCV').value);
    
    if (!validarTasaBCV(nuevaTasa)) return;

    // Guardar historial de tasas
    guardarTasaEnHistorial(nuevaTasa);

    // Actualizar tasa y recalcular
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

// Función clave que faltaba: Actualiza precios con nueva tasa
function actualizarPreciosConNuevaTasa(nuevaTasa) {
    productos.forEach(producto => {
        producto.precioMayorBolivar = producto.precioMayorDolar * nuevaTasa;
        producto.precioUnitarioBolivar = producto.precioUnitarioDolar * nuevaTasa;
    });
    localStorage.setItem('productos', JSON.stringify(productos));
}

// Guarda el nombre del establecimiento
function guardarNombreEstablecimiento() {
    nombreEstablecimiento = document.getElementById('nombreEstablecimiento').value.trim();
    if (!nombreEstablecimiento) {
        mostrarToast("⚠️ Ingrese un nombre válido", "error");
        return;
    }
    localStorage.setItem('nombreEstablecimiento', nombreEstablecimiento);
    mostrarToast(`✅ Nombre guardado: "${nombreEstablecimiento}"`);
}

// ================= FUNCIONES ADICIONALES =================

// Muestra/oculta la lista de costos de productos
function mostrarListaCostos() {
    const container = document.getElementById('listaCostosContainer');
    const lista = document.getElementById('listaCostos');
    
    if (container.style.display === 'none') {
        lista.innerHTML = '';
        
        if (productos.length === 0) {
            lista.innerHTML = '<li>No hay productos registrados</li>';
        } else {
            // Ordenar productos alfabéticamente
            const productosOrdenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            // Agregar cada producto a la lista
            productosOrdenados.forEach(producto => {
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

// Guarda histórico de tasas (últimas 6)
function guardarTasaEnHistorial(tasa) {
    let historial = JSON.parse(localStorage.getItem('historialTasas')) || [];
    historial.unshift({
        fecha: new Date().toLocaleString(),
        tasa: tasa
    });
    historial = historial.slice(0, 6);
    localStorage.setItem('historialTasas', JSON.stringify(historial));
}

// ================= FUNCIONES DE VALIDACIÓN =================

// Valida que la tasa BCV sea correcta
function validarTasaBCV(tasa) {
    if (isNaN(tasa) || tasa <= 0) {
        mostrarToast("⚠️ Ingrese una tasa BCV válida (mayor a cero)", "error");
        return false;
    }
    return true;
}

// Valida que los campos numéricos sean correctos
function validarCamposNumericos(costo, ganancia, unidades) {
    if (isNaN(costo) || costo <= 0 || isNaN(ganancia) || ganancia <= 0 || isNaN(unidades) || unidades <= 0) {
        mostrarToast("⚠️ Complete todos los campos con valores válidos (mayores a cero)", "error");
        return false;
    }
    return true;
}

// Valida que los campos de texto no estén vacíos
function validarCamposTexto(nombre, descripcion) {
    if (!nombre || !descripcion) {
        mostrarToast("⚠️ Complete todos los campos", "error");
        return false;
    }
    return true;
}

// Verifica si producto existe
function productoExiste(nombre) {
    return productos.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());
}

// ================= FUNCIONES DE CÁLCULO =================

// Realiza todos los cálculos para un producto
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
        precioUnitarioBolivar: precioBolivares / unidades
    };
}

// Guarda un producto en la lista y en el almacenamiento local
function guardarProductoEnLista(producto) {
    productos.push(producto);
    localStorage.setItem('productos', JSON.stringify(productos));
    actualizarLista();
    reiniciarCalculadora();
    mostrarToast("✅ Producto guardado exitosamente");
}

// ================= FUNCIONES DE INTERFAZ =================

// Actualiza la tabla con la lista de productos
function actualizarLista() {
    const tbody = document.querySelector('#listaProductos tbody');
    tbody.innerHTML = '';

    productos.forEach((producto, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.descripcion}</td>
            <td>$${producto.precioMayorDolar.toFixed(2)}</td>
            <td>Bs${producto.precioMayorBolivar.toFixed(2)}</td>
            <td>$${producto.precioUnitarioDolar.toFixed(2)}</td>
            <td>Bs${producto.precioUnitarioBolivar.toFixed(2)}</td>
            <td>
                <button class="editar" onclick="editarProducto(${index})">Editar</button>
                <button class="imprimir" onclick="imprimirTicket(${index})">Imprimir</button>
                <button class="eliminar" onclick="eliminarProducto(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Muestra los resultados del cálculo
function mostrarResultados(precioDolar, precioBolivares, precioUnitarioDolar, precioUnitarioBolivar) {
    document.getElementById('resultadoPrecioVenta').innerHTML = 
        `<strong>Precio al mayor:</strong> $${precioDolar.toFixed(2)} / Bs${precioBolivares.toFixed(2)}`;
    document.getElementById('precioUnitario').innerHTML = 
        `<strong>Precio unitario:</strong> $${precioUnitarioDolar.toFixed(2)} / Bs${precioUnitarioBolivar.toFixed(2)}`;
}

// Reinicia los campos del formulario
function reiniciarCalculadora() {
    document.getElementById('producto').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('ganancia').value = '';
    document.getElementById('unidades').value = '';
    document.getElementById('descripcion').selectedIndex = 0;
}

// ================= FUNCIONES DE BÚSQUEDA Y GESTIÓN =================

// Busca productos en la lista
function buscarProducto() {
    const filtro = document.getElementById('buscar').value.toLowerCase();
    const filas = document.querySelectorAll('#listaProductos tbody tr');

    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(filtro) ? '' : 'none';
    });
}

// Edita un producto existente
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

// Elimina un producto
function eliminarProducto(index) {
    if (confirm(`¿Eliminar "${productos[index].nombre}"?`)) {
        productos.splice(index, 1);
        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
        mostrarToast("✅ Producto eliminado");
    }
}

// Limpia toda la lista de productos
function limpiarLista() {
    if (confirm("¿Borrar TODOS los productos?")) {
        productos = [];
        localStorage.removeItem('productos');
        actualizarLista();
        mostrarToast("✅ Lista de productos limpiada");
    }
}

// ================= FUNCIONES DE IMPRESIÓN =================

// Genera un PDF con la lista de productos
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Lista de Productos - ${nombreEstablecimiento || 'Mi Negocio'}`, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    let y = 30;
    
    productos.forEach(producto => {
        doc.text(`• ${producto.nombre} (${producto.descripcion})`, 10, y);
        doc.text(`Mayor: $${producto.precioMayorDolar.toFixed(2)} | Bs${producto.precioMayorBolivar.toFixed(2)}`, 10, y + 5);
        doc.text(`Unitario: $${producto.precioUnitarioDolar.toFixed(2)} | Bs${producto.precioUnitarioBolivar.toFixed(2)}`, 10, y + 10);
        y += 15;
        
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    });
    
    doc.save('lista_productos.pdf');
    mostrarToast("✅ PDF generado con éxito");
}

// Imprime un ticket para un producto
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
                .price {
                    text-align: center;
                    font-size: 22px;
                    font-weight: bold;
                    margin: 10mm 0;
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
            <div class="price">Bs ${producto.precioUnitarioBolivar.toFixed(2).replace('.', ',')}</div>
            <div class="footer">¡Gracias por su compra!</div>
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

// ================= FUNCIONES DE NOTIFICACIÓN =================

// Muestra notificaciones Toast
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Detecta si es dispositivo móvil
function esDispositivoMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Función para cerrar sesión
function cerrarSesion() {
    let mensaje = "⚠️ Antes de cerrar:\n\n1. Recomendamos GENERAR UN PDF de respaldo.\n";
    
    if (esDispositivoMovil()) {
        mensaje += "\n📱 Advertencia para móviles:\n- La generación de PDF puede fallar.\n- Use una computadora para respaldos seguros.\n";
    }

    if (confirm(mensaje)) {
        mostrarToast("✅ Sesión cerrada. Tus datos están seguros.");
    }
}
