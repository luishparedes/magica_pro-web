// Datos persistentes (se guardan en el navegador)
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let nombreEstablecimiento = localStorage.getItem('nombreEstablecimiento') || '';
let tasaBCVGuardada = parseFloat(localStorage.getItem('tasaBCV')) || 0;

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    actualizarLista();
});

// Carga los datos guardados en los campos del formulario
function cargarDatosIniciales() {
    document.getElementById('nombreEstablecimiento').value = nombreEstablecimiento;
    document.getElementById('tasaBCV').value = tasaBCVGuardada || '';
}

// ================= FUNCIONES PRINCIPALES =================

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

    // Crea el producto y lo guarda
    const producto = calcularProducto(nombre, descripcion, costo, ganancia, unidades, tasaBCV);
    guardarProductoEnLista(producto);
}

// ================= FUNCIONES DE GESTIÓN =================

// Actualiza la tasa BCV y recalcula todos los precios
function actualizarTasaBCV() {
    const nuevaTasa = parseFloat(document.getElementById('tasaBCV').value);
    
    if (!validarTasaBCV(nuevaTasa)) return;

    tasaBCVGuardada = nuevaTasa;
    localStorage.setItem('tasaBCV', tasaBCVGuardada);

    actualizarPreciosConNuevaTasa(nuevaTasa);
    actualizarLista();
    alert(`✅ Tasa BCV actualizada a: ${tasaBCVGuardada}\nTodos los precios en Bs han sido recalculados.`);
}

// Guarda el nombre del establecimiento
function guardarNombreEstablecimiento() {
    nombreEstablecimiento = document.getElementById('nombreEstablecimiento').value.trim();
    if (!nombreEstablecimiento) {
        alert("⚠️ Ingrese un nombre válido");
        return;
    }
    localStorage.setItem('nombreEstablecimiento', nombreEstablecimiento);
    alert(`✅ Nombre guardado: "${nombreEstablecimiento}"`);
}

// ================= NUEVA FUNCIÓN =================
// Muestra/oculta la lista de costos de productos
function mostrarListaCostos() {
    const container = document.getElementById('listaCostosContainer');
    const lista = document.getElementById('listaCostos');
    
    // Alternar entre mostrar y ocultar
    if (container.style.display === 'none') {
        // Generar la lista de costos
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

// ================= FUNCIONES DE VALIDACIÓN =================

// Valida que la tasa BCV sea correcta
function validarTasaBCV(tasa) {
    if (isNaN(tasa) || tasa <= 0) {
        alert("⚠️ Ingrese una tasa BCV válida (mayor a cero)");
        return false;
    }
    return true;
}

// Valida que los campos numéricos sean correctos
function validarCamposNumericos(costo, ganancia, unidades) {
    if (isNaN(costo) || costo <= 0 || isNaN(ganancia) || ganancia <= 0 || isNaN(unidades) || unidades <= 0) {
        alert("⚠️ Complete todos los campos con valores válidos (mayores a cero)");
        return false;
    }
    return true;
}

// Valida que los campos de texto no estén vacíos
function validarCamposTexto(nombre, descripcion) {
    if (!nombre || !descripcion) {
        alert("⚠️ Complete todos los campos");
        return false;
    }
    return true;
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
    alert("✅ Producto guardado exitosamente");
}

// Actualiza todos los precios cuando cambia la tasa BCV
function actualizarPreciosConNuevaTasa(nuevaTasa) {
    productos.forEach(producto => {
        producto.precioMayorBolivar = producto.precioMayorDolar * nuevaTasa;
        producto.precioUnitarioBolivar = producto.precioUnitarioDolar * nuevaTasa;
    });
    localStorage.setItem('productos', JSON.stringify(productos));
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
    }
}

// Elimina un producto
function eliminarProducto(index) {
    if (confirm(`¿Eliminar "${productos[index].nombre}"?`)) {
        productos.splice(index, 1);
        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
    }
}

// Limpia toda la lista de productos
function limpiarLista() {
    if (confirm("¿Borrar TODOS los productos?")) {
        productos = [];
        localStorage.removeItem('productos');
        actualizarLista();
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
