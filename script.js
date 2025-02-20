let productos = JSON.parse(localStorage.getItem('productos')) || [];

function calcularPrecioVenta() {
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value);
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value) / 100;
    const unidades = parseFloat(document.getElementById('unidades').value);

    if (isNaN(tasaBCV) || isNaN(costo) || isNaN(ganancia) || isNaN(unidades)) {
        alert("Por favor, complete todos los campos correctamente.");
        return;
    }

    const precioDolar = costo / (1 - ganancia);
    const precioBolivares = precioDolar * tasaBCV;
    const precioUnitarioDolar = precioDolar / unidades;
    const precioUnitarioBolivar = precioBolivares / unidades;

    document.getElementById('resultadoPrecioVenta').innerText = `Precio al mayor: $${precioDolar.toFixed(2)} / Bs${precioBolivares.toFixed(2)}`;
    document.getElementById('precioUnitario').innerText = `Precio unitario: $${precioUnitarioDolar.toFixed(2)} / Bs${precioUnitarioBolivar.toFixed(2)}`;
}

function guardarProducto() {
    const nombre = document.getElementById('producto').value;
    const descripcion = document.getElementById('descripcion').value;
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value) / 100;
    const unidades = parseFloat(document.getElementById('unidades').value);
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value);

    if (!nombre || !descripcion || isNaN(costo) || isNaN(ganancia) || isNaN(unidades) || isNaN(tasaBCV)) {
        alert("Por favor, complete todos los campos correctamente.");
        return;
    }

    const precioDolar = costo / (1 - ganancia);
    const precioBolivares = precioDolar * tasaBCV;
    const precioUnitarioDolar = precioDolar / unidades;
    const precioUnitarioBolivar = precioBolivares / unidades;

    const producto = {
        nombre,
        descripcion,
        costo,
        ganancia,
        unidades,
        precioMayorDolar: precioDolar,
        precioMayorBolivar: precioBolivares,
        precioUnitarioDolar: precioUnitarioDolar,
        precioUnitarioBolivar: precioUnitarioBolivar,
    };

    productos.push(producto);
    localStorage.setItem('productos', JSON.stringify(productos));
    actualizarLista();
    reiniciarCalculadora();
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
                <button class="editar" onclick="modificarProducto(${index})">Editar</button>
                <button class="eliminar" onclick="eliminarProducto(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function modificarProducto(index) {
    const producto = productos[index];
    const nuevoNombre = prompt("Nuevo nombre:", producto.nombre);
    const nuevaDescripcion = prompt("Nueva descripción:", producto.descripcion);
    const nuevoCosto = parseFloat(prompt("Nuevo costo:", producto.costo));
    const nuevaGanancia = parseFloat(prompt("Nueva ganancia (%):", producto.ganancia * 100));
    const nuevasUnidades = parseFloat(prompt("Nuevas unidades:", producto.unidades));

    if (nuevoNombre && nuevaDescripcion && !isNaN(nuevoCosto) && !isNaN(nuevaGanancia) && !isNaN(nuevasUnidades)) {
        producto.nombre = nuevoNombre;
        producto.descripcion = nuevaDescripcion;
        producto.costo = nuevoCosto;
        producto.ganancia = nuevaGanancia / 100;
        producto.unidades = nuevasUnidades;

        const tasaBCV = parseFloat(document.getElementById('tasaBCV').value);
        const precioDolar = producto.costo / (1 - producto.ganancia);
        const precioBolivares = precioDolar * tasaBCV;

        producto.precioMayorDolar = precioDolar;
        producto.precioMayorBolivar = precioBolivares;
        producto.precioUnitarioDolar = precioDolar / producto.unidades;
        producto.precioUnitarioBolivar = precioBolivares / producto.unidades;

        localStorage.setItem('productos', JSON.stringify(productos));
        actualizarLista();
    }
}

function eliminarProducto(index) {
    productos.splice(index, 1);
    localStorage.setItem('productos', JSON.stringify(productos));
    actualizarLista();
}

function limpiarLista() {
    productos = [];
    localStorage.removeItem('productos');
    actualizarLista();
}

function reiniciarCalculadora() {
    document.getElementById('producto').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('ganancia').value = '';
    document.getElementById('unidades').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('resultadoPrecioVenta').innerText = 'Precio al mayor: ';
    document.getElementById('precioUnitario').innerText = 'Precio unitario: ';
}

function generarPDF() {
    window.jsPDF = window.jspdf.jsPDF; // Inicializar jsPDF
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Lista de Productos", 105, 15, { align: "center" });

    doc.setFontSize(12);
    let y = 30;
    const tasaBCV = parseFloat(document.getElementById('tasaBCV').value);

    productos.forEach(producto => {
        doc.text(`Producto: ${producto.nombre}`, 10, y);
        doc.text(`Descripción: ${producto.descripcion}`, 10, y + 5);
        doc.text(`Precio Mayor: $${producto.precioMayorDolar.toFixed(2)} / Bs${producto.precioMayorBolivar.toFixed(2)}`, 10, y + 10);
        doc.text(`Precio Unitario: $${producto.precioUnitarioDolar.toFixed(2)} / Bs${producto.precioUnitarioBolivar.toFixed(2)}`, 10, y + 15);
        y += 25;

        if (y > 250) {
            doc.addPage();
            y = 30;
        }
    });

    doc.save('lista_productos.pdf');
}

// Cargar productos al inicio
actualizarLista();
