function estadoProducto(producto) {
  if (!producto.activo) return 'desactivado';
  if (Number(producto.stock_actual) <= 0) return 'agotado';
  if (Number(producto.stock_actual) <= Number(producto.stock_minimo)) return 'bajo stock';
  return 'disponible';
}

export function mapProducto(producto) {
  return {
    ...producto,
    precio_compra: Number(producto.precio_compra),
    precio_venta: Number(producto.precio_venta),
    stock_actual: Number(producto.stock_actual),
    stock_minimo: Number(producto.stock_minimo),
    activo: Boolean(producto.activo),
    estado: estadoProducto(producto),
  };
}

export async function getProductDetail({ idParam, idUsuario, queryFn }) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      status: 400,
      body: { error: 'Producto invalido.' },
    };
  }

  const productos = await queryFn(
    'SELECT * FROM productos WHERE id_producto = ? AND id_usuario = ? LIMIT 1',
    [id, idUsuario],
  );
  const producto = productos[0];

  if (!producto) {
    return {
      status: 404,
      body: { error: 'Producto no encontrado.' },
    };
  }

  return {
    status: 200,
    body: mapProducto(producto),
  };
}
