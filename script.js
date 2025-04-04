// Datos persistentes
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let nombreEstablecimiento = localStorage.getItem('nombreEstablecimiento') || '';
let tasaBCVGuardada = parseFloat(localStorage.getItem('tasaBCV')) || 0;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    actualizarLista();
});

function cargarDatosIniciales() {
    document.getElementById('nombreEstablecimiento').value = nombreEstablecimiento;
    document.getElementById('tasaBCV').value = tasaBCVGuardada || '';
}

// ================= FUNCIONES PRINCIPALES =================

function calcularPrecioVenta() {
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value) || tasaBCVGuardada;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value);
    const unidades = parseFloat(document.getElementById('unidades').value);

    // Validaciones
    if (!validarTasaBCV(tasaBCV)) return;
    if (!validarCamposNumericos(costo, ganancia, unidades)) return;

    // Cálculos
    const gananciaDecimal = ganancia / 100;
    const precioDolar = costo / (1 - gananciaDecimal);
    const precioBolivares = precioDolar * tasaBCV;
    const precioUnitarioDolar = precioDolar / unidades;
    const precioUnitarioBolivar = precioBolivares / unidades;

    // Mostrar resultados
    mostrarResultados(precioDolar, precioBolivares, precioUnitarioDolar, precioUnitarioBolivar);
}

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

    // Cálculos y guardado
    const producto = calcularProducto(nombre, descripcion, costo, ganancia, unidades, tasaBCV);
    guardarProductoEnLista(producto);
}

// ================= FUNCIONES DE GESTIÓN =================

function actualizarTasaBCV() {
    const nuevaTasa = parseFloat(document.getElementById('tasaBCV').value);
    
    if (!validarTasaBCV(nuevaTasa)) return;

    tasaBCVGuardada = nuevaTasa;
    localStorage.setItem('tasaBCV', tasaBCVGuardada);

    actualizarPreciosConNuevaTasa(nuevaTasa);
    actualizarLista();
    alert(`✅ Tasa BCV actualizada a: ${tasaBCVGuardada}\nTodos los precios en Bs han sido recalculados.`);
}

function guardarNombreEstablecimiento() {
    nombreEstablecimiento = document.getElementById('nombreEstablecimiento').value.trim();
    if (!nombreEstablecimiento) {
        alert("⚠️ Ingrese un nombre válido");
        return;
    }
    localStorage.setItem('nombreEstablecimiento', nombreEstablecimiento);
    alert(`✅ Nombre guardado: "${nombreEstablecimiento}"`);
}

// ================= FUNCIONES DE IMPRESIÓN (MODIFICADA) =================

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

// ================= FUNCIONES AUXILIARES =================

function validarTasaBCV(tasa) {
    if (isNaN(tasa) || tasa <= 0) {
        alert("⚠️ Ingrese una tasa BCV válida (mayor a cero)");
        return false;
    }
    return true;
}

function validarCamposNumericos(costo, ganancia, unidades) {
    if (isNaN(costo) || costo <= 0 || isNaN(ganancia) || ganancia <= 0 || isNaN(unidades) || unidades <= 0) {
        alert("⚠️ Complete todos los campos con valores válidos (mayores a cero)");
        return false;
    }
    return true;
}

function validarCamposTexto(nombre, descripcion) {
    if (!nombre || !descripcion) {
        alert("⚠️ Complete todos los campos");
        return false;
    }
    return true;
}

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

function guardarProductoEnLista(producto) {
    productos.push(producto);
    localStorage.setItem('productos', JSON.stringify(productos));
    actualizarLista();
    reiniciarCalculadora();
    alert("✅ Producto guardado exitosamente");
}

function actualizarPreciosConNuevaTasa(nuevaTasa) {
    productos.forEach(producto => {
        producto.precioMayorBolivar = producto.precioMayorDolar * nuevaTasa;
        producto.precioUnitarioBolivar = producto.precioUnitarioDolar * nuevaTasa;
    });
    localStorage.setItem('productos', JSON.stringify(productos));
}

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
    }
}

function eliminarProducto(index) {
    if (confirm(`¿Eliminar "${productos[index].nombre}"?`)) {
        productos.splice(index, 1);
        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
    }
}

function reiniciarCalculadora() {
    document.getElementById('producto').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('ganancia').value = '';
    document.getElementById('unidades').value = '';
    document.getElementById('descripcion').selectedIndex = 0;
}

function buscarProducto() {
    const filtro = document.getElementById('buscar').value.toLowerCase();
    const filas = document.querySelectorAll('#listaProductos tbody tr');

    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(filtro) ? '' : 'none';
    });
}

function limpiarLista() {
    if (confirm("¿Borrar TODOS los productos?")) {
        productos = [];
        localStorage.removeItem('productos');
        actualizarLista();
    }
}

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
}

// Funciones de visualización
function mostrarResultados(precioDolar, precioBolivares, precioUnitarioDolar, precioUnitarioBolivar) {
    document.getElementById('resultadoPrecioVenta').innerHTML = 
        `<strong>Precio al mayor:</strong> $${precioDolar.toFixed(2)} / Bs${precioBolivares.toFixed(2)}`;
    document.getElementById('precioUnitario').innerHTML = 
        `<strong>Precio unitario:</strong> $${precioUnitarioDolar.toFixed(2)} / Bs${precioUnitarioBolivar.toFixed(2)}`;
}
