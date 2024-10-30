let productos = [];

function calcularPrecioVenta() {
    const costo = parseFloat(document.getElementById('costo').value);
    const ganancia = parseFloat(document.getElementById('ganancia').value) / 100;
    const moneda = document.getElementById('moneda').value;
    const unidades = parseFloat(document.getElementById('unidades').value);

    if (isNaN(costo) || isNaN(ganancia) || ganancia >= 1 || isNaN(unidades)) {
        document.getElementById('resultadoPrecioVenta').innerText = 'Por favor, introduce valores válidos';
        return;
    }

    const precioMayor = costo / (1 - ganancia);
    const precioUnitario = precioMayor / unidades;

    document.getElementById('resultadoPrecioVenta').innerText = `Precio al mayor: ${moneda} ${precioMayor.toFixed(2)}`;
    document.getElementById('precioUnitario').innerText = `Precio unitario: ${moneda} ${precioUnitario.toFixed(2)}`;
}

function guardarProducto() {
    const producto = document.getElementById('producto').value;
    const descripcion = document.getElementById('descripcion').value;
    const precioMayor = document.getElementById('resultadoPrecioVenta').innerText;
    const precioUnitario = document.getElementById('precioUnitario').innerText;

    if (producto === '' || descripcion === '' || precioMayor === 'Precio al mayor: ') {
        alert('Por favor, completa todos los campos y calcula el precio de venta');
        return;
    }

    productos.push({
        nombre: producto,
        descripcion: descripcion,
        precioMayor: precioMayor,
        precioUnitario: precioUnitario
    });

    actualizarLista();
    reiniciarCalculadora();
}

function mostrarLista() {
    const lista = document.getElementById('listaProductos');
    lista.innerHTML = productos.map((producto, index) => `
        <div class="product-item">
            <span>${producto.nombre} - ${producto.descripcion} - ${producto.precioMayor} - ${producto.precioUnitario}</span>
            <button onclick="eliminarProducto(${index})">Borrar</button>
            <button onclick="modificarProducto(${index})">Modificar</button>
        </div>
    `).join('');
}

function actualizarLista() {
    mostrarLista();
}

function eliminarProducto(index) {
    productos.splice(index, 1);
    actualizarLista();
}

function modificarProducto(index) {
    const nuevoPrecioMayor = prompt('Introduce el nuevo precio al mayor:', productos[index].precioMayor);
    const nuevoPrecioUnitario = prompt('Introduce el nuevo precio unitario:', productos[index].precioUnitario);
    if (nuevoPrecioMayor && nuevoPrecioUnitario) {
        productos[index].precioMayor = nuevoPrecioMayor;
        productos[index].precioUnitario = nuevoPrecioUnitario;
        actualizarLista();
    }
}

function reiniciarCalculadora() {
    document.getElementById('producto').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('ganancia').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('resultadoPrecioVenta').innerText = 'Precio al mayor: ';
    document.getElementById('precioUnitario').innerText = 'Precio unitario: ';
}

function compartirLista() {
    let mensaje = "Lista de productos:\n";
    productos.forEach(producto => {
        mensaje += `${producto.nombre} - ${producto.descripcion} - ${producto.precioMayor} - ${producto.precioUnitario}\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url);
}
