'use client';

import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, clearSession, getToken } from '@/lib/api';
import type { Merma, MovimientoInventario, Producto, ProductoDanado } from '@/lib/api';

type ProductoForm = {
  nombre: string;
  categoria: string;
  precio_compra: string;
  precio_venta: string;
  stock_actual: string;
  stock_minimo: string;
};

const emptyForm: ProductoForm = {
  nombre: '',
  categoria: '',
  precio_compra: '',
  precio_venta: '',
  stock_actual: '',
  stock_minimo: '',
};

export default function InventarioPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [productosDanados, setProductosDanados] = useState<ProductoDanado[]>([]);
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [statusFilter, setStatusFilter] = useState<'todos' | Producto['estado']>('todos');
  const [form, setForm] = useState<ProductoForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [damageForm, setDamageForm] = useState({ cantidad: '', precio_reducido: '', descripcion_dano: '' });
  const [wasteForm, setWasteForm] = useState({ cantidad: '', motivo: '', costo_perdida: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeProducts = useMemo(() => productos.filter((producto) => producto.activo), [productos]);
  const lowStockCount = useMemo(() => productos.filter((producto) => producto.estado === 'bajo stock').length, [productos]);
  const exhaustedCount = useMemo(() => productos.filter((producto) => producto.estado === 'agotado').length, [productos]);
  const disabledCount = useMemo(() => productos.filter((producto) => producto.estado === 'desactivado').length, [productos]);
  const filteredProducts = useMemo(
    () => (statusFilter === 'todos' ? productos : productos.filter((producto) => producto.estado === statusFilter)),
    [productos, statusFilter],
  );
  const selectedProduct = useMemo(
    () => productos.find((producto) => producto.id_producto === selectedId) ?? null,
    [productos, selectedId],
  );

  const loadProductos = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      const [productosData, movimientosData, danadosData, mermasData] = await Promise.all([
        apiRequest<Producto[]>('/api/productos'),
        apiRequest<MovimientoInventario[]>('/api/productos/movimientos/recientes'),
        apiRequest<ProductoDanado[]>('/api/productos/danados-vendibles'),
        apiRequest<Merma[]>('/api/productos/mermas'),
      ]);
      setProductos(productosData);
      setMovimientos(movimientosData);
      setProductosDanados(danadosData);
      setMermas(mermasData);
      setSelectedId((current) => current ?? productosData[0]?.id_producto ?? null);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'No se pudo cargar el inventario.';
      setError(message);
      if (message.toLowerCase().includes('token')) {
        clearSession();
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

    loadProductos();
  }, [loadProductos, router]);

  function updateForm(field: keyof ProductoForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(producto: Producto) {
    setEditingId(producto.id_producto);
    setSelectedId(producto.id_producto);
    setForm({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio_compra: String(producto.precio_compra),
      precio_venta: String(producto.precio_venta),
      stock_actual: String(producto.stock_actual),
      stock_minimo: String(producto.stock_minimo),
    });
    setStatus('');
    setError('');
  }

  function resetProductForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setStatus('');

    const payload = {
      nombre: form.nombre,
      categoria: form.categoria,
      precio_compra: Number(form.precio_compra),
      precio_venta: Number(form.precio_venta),
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
    };

    try {
      const path = editingId ? `/api/productos/${editingId}` : '/api/productos';
      const method = editingId ? 'PUT' : 'POST';
      const producto = await apiRequest<Producto>(path, {
        method,
        body: JSON.stringify(payload),
      });

      setStatus(editingId ? 'Producto actualizado correctamente.' : 'Producto registrado correctamente.');
      setSelectedId(producto.id_producto);
      resetProductForm();
      await loadProductos();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDamage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      await apiRequest<Producto>(`/api/productos/${selectedProduct.id_producto}/danado`, {
        method: 'POST',
        body: JSON.stringify({
          cantidad: Number(damageForm.cantidad),
          precio_reducido: Number(damageForm.precio_reducido),
          descripcion_dano: damageForm.descripcion_dano,
        }),
      });
      setDamageForm({ cantidad: '', precio_reducido: '', descripcion_dano: '' });
      setStatus('Producto dañado vendible registrado y descontado del stock normal.');
      await loadProductos();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar el producto dañado.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleWaste(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      await apiRequest<Producto>(`/api/productos/${selectedProduct.id_producto}/merma`, {
        method: 'POST',
        body: JSON.stringify({
          cantidad: Number(wasteForm.cantidad),
          motivo: wasteForm.motivo,
          costo_perdida: Number(wasteForm.costo_perdida),
        }),
      });
      setWasteForm({ cantidad: '', motivo: '', costo_perdida: '' });
      setStatus('Merma registrada y descontada del stock normal.');
      await loadProductos();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar la merma.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisable(producto: Producto) {
    const confirmed = window.confirm(`Seguro que quieres desactivar "${producto.nombre}"? Se conservara su historial.`);

    if (!confirmed) return;

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      await apiRequest<Producto>(`/api/productos/${producto.id_producto}/desactivar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: 'Producto desactivado desde el panel de inventario' }),
      });
      setStatus('Producto desactivado sin eliminar su historial.');
      await loadProductos();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo desactivar el producto.');
    } finally {
      setIsSaving(false);
    }
  }

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Inventario MVP</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Gestión de inventario</h1>
          </div>
          <button
            onClick={logout}
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Productos activos" value={activeProducts.length} />
          <Metric label="Bajo stock" value={lowStockCount} tone="warning" />
          <Metric label="Agotados" value={exhaustedCount} tone="danger" />
          <Metric label="Desactivados" value={disabledCount} />
        </section>

        {(error || status) && (
          <section className="mt-6 space-y-3">
            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            {status && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{status}</p>}
          </section>
        )}

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.45fr]">
          <form onSubmit={handleSaveProduct} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {editingId ? 'Actualizar' : 'Registrar'}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {editingId ? 'Editar producto' : 'Nuevo producto'}
                </h2>
              </div>
              {editingId && (
                <button type="button" onClick={resetProductForm} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                  Cancelar
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" value={form.nombre} onChange={(value) => updateForm('nombre', value)} />
              <Field label="Categoría" value={form.categoria} onChange={(value) => updateForm('categoria', value)} />
              <Field label="Precio compra" type="number" value={form.precio_compra} onChange={(value) => updateForm('precio_compra', value)} />
              <Field label="Precio venta" type="number" value={form.precio_venta} onChange={(value) => updateForm('precio_venta', value)} />
              <Field label="Stock actual" type="number" value={form.stock_actual} onChange={(value) => updateForm('stock_actual', value)} />
              <Field label="Stock mínimo" type="number" value={form.stock_minimo} onChange={(value) => updateForm('stock_minimo', value)} />
            </div>

            <button
              disabled={isSaving}
              className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar producto'}
            </button>
          </form>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Productos</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Inventario actual</h2>
              </div>
              <button onClick={loadProductos} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                Actualizar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-4">
              {[
                ['todos', 'Todos'],
                ['bajo stock', 'Bajo stock'],
                ['agotado', 'Agotados'],
                ['desactivado', 'Desactivados'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value as typeof statusFilter)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    statusFilter === value
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="p-6 text-sm text-slate-500">Cargando inventario...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Producto</th>
                      <th className="px-5 py-4">Categoría</th>
                      <th className="px-5 py-4">Precio</th>
                      <th className="px-5 py-4">Stock</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((producto) => (
                      <tr key={producto.id_producto} className={selectedId === producto.id_producto ? 'bg-sky-50/60' : 'bg-white'}>
                        <td className="px-5 py-4 font-semibold text-slate-950">{producto.nombre}</td>
                        <td className="px-5 py-4 text-slate-600">{producto.categoria}</td>
                        <td className="px-5 py-4 text-slate-600">${producto.precio_venta.toFixed(2)}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {producto.stock_actual} / min {producto.stock_minimo}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge estado={producto.estado} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setSelectedId(producto.id_producto)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Seleccionar
                            </button>
                            <button onClick={() => startEdit(producto)} className="rounded-lg bg-sky-100 px-3 py-2 text-xs font-bold text-sky-700">
                              Editar
                            </button>
                            {producto.activo && (
                              <button onClick={() => handleDisable(producto)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                                Desactivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ActionPanel title="Producto dañado vendible" description="Descuenta stock normal y registra unidades con precio reducido.">
            <form onSubmit={handleDamage} className="grid gap-4 sm:grid-cols-3">
              <Field label="Cantidad" type="number" value={damageForm.cantidad} onChange={(value) => setDamageForm((current) => ({ ...current, cantidad: value }))} />
              <Field label="Precio reducido" type="number" value={damageForm.precio_reducido} onChange={(value) => setDamageForm((current) => ({ ...current, precio_reducido: value }))} />
              <Field label="Descripción" value={damageForm.descripcion_dano} onChange={(value) => setDamageForm((current) => ({ ...current, descripcion_dano: value }))} />
              <button disabled={!selectedProduct || isSaving} className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-400 sm:col-span-3">
                Registrar daño leve
              </button>
            </form>
          </ActionPanel>

          <ActionPanel title="Merma o pérdida total" description="Descuenta stock normal y registra la pérdida para trazabilidad.">
            <form onSubmit={handleWaste} className="grid gap-4 sm:grid-cols-3">
              <Field label="Cantidad" type="number" value={wasteForm.cantidad} onChange={(value) => setWasteForm((current) => ({ ...current, cantidad: value }))} />
              <Field label="Costo pérdida" type="number" value={wasteForm.costo_perdida} onChange={(value) => setWasteForm((current) => ({ ...current, costo_perdida: value }))} />
              <Field label="Motivo" value={wasteForm.motivo} onChange={(value) => setWasteForm((current) => ({ ...current, motivo: value }))} />
              <button disabled={!selectedProduct || isSaving} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:col-span-3">
                Registrar merma
              </button>
            </form>
          </ActionPanel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <DataTablePanel
            title="Productos dañados vendibles"
            eyebrow="Daño leve"
            emptyText="Aún no hay productos dañados vendibles."
            hasRows={productosDanados.length > 0}
          >
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Producto original</th>
                  <th className="px-5 py-4">Cantidad</th>
                  <th className="px-5 py-4">Precio reducido</th>
                  <th className="px-5 py-4">Descripción</th>
                  <th className="px-5 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosDanados.map((item) => (
                  <tr key={item.id_producto_danado}>
                    <td className="px-5 py-4 font-semibold text-slate-950">{item.producto}</td>
                    <td className="px-5 py-4 text-slate-600">{item.cantidad}</td>
                    <td className="px-5 py-4 text-slate-600">${item.precio_reducido.toFixed(2)}</td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">{item.descripcion_dano}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTablePanel>

          <DataTablePanel
            title="Pérdidas / mermas"
            eyebrow="Daño severo"
            emptyText="Aún no hay mermas registradas."
            hasRows={mermas.length > 0}
          >
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Producto</th>
                  <th className="px-5 py-4">Cantidad</th>
                  <th className="px-5 py-4">Motivo</th>
                  <th className="px-5 py-4">Costo pérdida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mermas.map((item) => (
                  <tr key={item.id_merma}>
                    <td className="px-5 py-4 font-semibold text-slate-950">{item.producto}</td>
                    <td className="px-5 py-4 text-slate-600">{item.cantidad}</td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">{item.motivo}</td>
                    <td className="px-5 py-4 text-slate-600">${item.costo_perdida.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTablePanel>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Trazabilidad</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Historial reciente</h2>
            </div>
            <p className="text-sm text-slate-500">Últimos 12 movimientos registrados</p>
          </div>

          {movimientos.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Aún no hay movimientos de inventario.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-5 py-4">Producto</th>
                    <th className="px-5 py-4">Movimiento</th>
                    <th className="px-5 py-4">Cantidad</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.id_movimiento} className="bg-white">
                      <td className="px-5 py-4 text-slate-600">{formatDate(movimiento.fecha)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-950">{movimiento.producto}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {formatMovementType(movimiento.tipo_movimiento)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{movimiento.cantidad}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {movimiento.stock_anterior} &rarr; {movimiento.stock_nuevo}
                      </td>
                      <td className="max-w-xs px-5 py-4 text-slate-600">{movimiento.motivo ?? 'Sin motivo'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-4 text-sm text-slate-500">
          Producto seleccionado: <span className="font-semibold text-slate-700">{selectedProduct?.nombre ?? 'ninguno'}</span>
        </p>
      </div>
    </main>
  );
}

function Metric({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' | 'danger' }) {
  const toneClass = {
    default: 'text-slate-950',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-3 text-4xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        required
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}

function StatusBadge({ estado }: { estado: Producto['estado'] }) {
  const styles = {
    disponible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bajo stock': 'bg-amber-50 text-amber-700 border-amber-200',
    agotado: 'bg-red-50 text-red-700 border-red-200',
    desactivado: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${styles[estado]}`}>
      {estado}
    </span>
  );
}

function formatMovementType(type: string) {
  const labels: Record<string, string> = {
    registro_inicial: 'Registro inicial',
    actualizacion_stock: 'Actualización de stock',
    producto_danado_vendible: 'Producto dañado',
    merma: 'Merma',
    desactivacion: 'Desactivación',
  };

  return labels[type] ?? type.replaceAll('_', ' ');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function ActionPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function DataTablePanel({
  title,
  eyebrow,
  emptyText,
  hasRows,
  children,
}: {
  title: string;
  eyebrow: string;
  emptyText: string;
  hasRows: boolean;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        {hasRows ? children : <p className="p-6 text-sm text-slate-500">{emptyText}</p>}
      </div>
    </section>
  );
}
