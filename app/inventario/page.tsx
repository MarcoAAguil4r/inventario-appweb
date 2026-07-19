'use client';

import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, clearSession, getToken } from '@/lib/api';
import type { Merma, MovimientoInventario, Producto, ProductoDanado, ResumenDia } from '@/lib/api';

type ProductoForm = {
  nombre: string;
  categoria: string;
  precio_compra: string;
  precio_venta: string;
  stock_actual: string;
  stock_minimo: string;
};

type SaleItem = {
  id_producto: number;
  cantidad: number;
};

type InventorySection =
  | 'resumen'
  | 'productos'
  | 'seleccionado'
  | 'registrar'
  | 'ajuste'
  | 'venta'
  | 'dano'
  | 'merma'
  | 'danados'
  | 'mermas'
  | 'historial-producto'
  | 'historial-reciente';

const emptyForm: ProductoForm = {
  nombre: '',
  categoria: '',
  precio_compra: '',
  precio_venta: '',
  stock_actual: '',
  stock_minimo: '',
};

const emptyResumen: ResumenDia = {
  margen_potencial: 0,
  ventas_dia: 0,
  perdidas: 0,
  valor_danado_vendible: 0,
  balance_potencial: 0,
};

export default function InventarioPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [productMovements, setProductMovements] = useState<MovimientoInventario[]>([]);
  const [productosDanados, setProductosDanados] = useState<ProductoDanado[]>([]);
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [resumenDia, setResumenDia] = useState<ResumenDia>(emptyResumen);
  const [statusFilter, setStatusFilter] = useState<'todos' | Producto['estado']>('todos');
  const [form, setForm] = useState<ProductoForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [damageForm, setDamageForm] = useState({ cantidad: '', precio_reducido: '', descripcion_dano: '' });
  const [wasteForm, setWasteForm] = useState({ cantidad: '', motivo: '' });
  const [saleForm, setSaleForm] = useState({ producto_id: '', cantidad: '', nota: '' });
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [adjustmentForm, setAdjustmentForm] = useState<{ tipo: 'entrada' | 'salida'; cantidad: string; motivo: string }>({
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
  });
  const [activeSection, setActiveSection] = useState<InventorySection>('resumen');
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
  const saleTotal = useMemo(() => {
    return saleItems.reduce((sum, item) => {
      const producto = productos.find((current) => current.id_producto === item.id_producto);
      return sum + item.cantidad * Number(producto?.precio_venta ?? 0);
    }, 0);
  }, [productos, saleItems]);
  const wasteEstimatedCost = useMemo(() => {
    const cantidad = Number(wasteForm.cantidad);

    if (!selectedProduct || !Number.isInteger(cantidad) || cantidad <= 0) return 0;

    return cantidad * Number(selectedProduct.precio_compra);
  }, [selectedProduct, wasteForm.cantidad]);
  const saleItemsDetailed = useMemo(
    () =>
      saleItems
        .map((item) => {
          const producto = productos.find((current) => current.id_producto === item.id_producto);
          return producto
            ? {
                ...item,
                producto,
                precio_unitario: Number(producto.precio_venta),
                subtotal: item.cantidad * Number(producto.precio_venta),
              }
            : null;
        })
        .filter(
          (item): item is SaleItem & { producto: Producto; precio_unitario: number; subtotal: number } =>
            Boolean(item),
        ),
    [productos, saleItems],
  );
  const loadProductos = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      const [productosData, movimientosData, danadosData, mermasData, resumenData] = await Promise.all([
        apiRequest<Producto[]>('/api/productos'),
        apiRequest<MovimientoInventario[]>('/api/productos/movimientos/recientes'),
        apiRequest<ProductoDanado[]>('/api/productos/danados-vendibles'),
        apiRequest<Merma[]>('/api/productos/mermas'),
        apiRequest<ResumenDia>('/api/productos/resumen/dia'),
      ]);
      setProductos(productosData);
      setMovimientos(movimientosData);
      setProductosDanados(danadosData);
      setMermas(mermasData);
      setResumenDia(resumenData);
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

    queueMicrotask(() => {
      void loadProductos();
    });
  }, [loadProductos, router]);

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => setProductMovements([]));
      return;
    }

    let ignore = false;

    async function loadProductMovements() {
      try {
        const data = await apiRequest<MovimientoInventario[]>(`/api/productos/${selectedId}/movimientos`);
        if (!ignore) setProductMovements(data);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'No se pudo cargar el historial del producto.';
        if (!ignore) setError(message);
      }
    }

    loadProductMovements();

    return () => {
      ignore = true;
    };
  }, [selectedId]);

  function updateForm(field: keyof ProductoForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(producto: Producto) {
    setEditingId(producto.id_producto);
    setSelectedId(producto.id_producto);
    setActiveSection('registrar');
    setForm({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio_compra: String(producto.precio_compra),
      precio_venta: String(producto.precio_venta),
      stock_actual: '',
      stock_minimo: String(producto.stock_minimo),
    });
    setStatus('');
    setError('');
  }

  function resetProductForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function selectProduct(producto: Producto) {
    setSelectedId(producto.id_producto);
    setActiveSection('seleccionado');
  }

  function validateQuantityAgainstStock(value: string) {
    if (!selectedProduct) return false;
    const cantidad = Number(value);
    return Number.isFinite(cantidad) && cantidad > 0 && cantidad <= selectedProduct.stock_actual;
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setStatus('');

    const payload: {
      nombre: string;
      categoria: string;
      precio_compra: number;
      precio_venta: number;
      stock_minimo: number;
      stock_actual?: number;
    } = {
      nombre: form.nombre,
      categoria: form.categoria,
      precio_compra: Number(form.precio_compra),
      precio_venta: Number(form.precio_venta),
      stock_minimo: Number(form.stock_minimo),
    };

    try {
      const path = editingId ? `/api/productos/${editingId}` : '/api/productos';
      const method = editingId ? 'PUT' : 'POST';
      if (!editingId) payload.stock_actual = Number(form.stock_actual);
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

    if (!validateQuantityAgainstStock(damageForm.cantidad)) {
      setError(`La cantidad no puede ser mayor al stock disponible (${selectedProduct.stock_actual}).`);
      return;
    }

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
      setStatus('Daño leve: se descontó stock y quedó vendible con precio reducido.');
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

    if (!validateQuantityAgainstStock(wasteForm.cantidad)) {
      setError(`La cantidad no puede ser mayor al stock disponible (${selectedProduct.stock_actual}).`);
      return;
    }

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      await apiRequest<Producto>(`/api/productos/${selectedProduct.id_producto}/merma`, {
        method: 'POST',
        body: JSON.stringify({
          cantidad: Number(wasteForm.cantidad),
          motivo: wasteForm.motivo,
        }),
      });
      setWasteForm({ cantidad: '', motivo: '' });
      setStatus('Merma: se descontó stock y se registró pérdida total.');
      await loadProductos();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar la merma.');
    } finally {
      setIsSaving(false);
    }
  }

  function tryAddSaleItem(idProducto: number, cantidad: number) {
    const producto = activeProducts.find((item) => item.id_producto === idProducto);

    if (!producto) {
      setError('Selecciona un producto activo.');
      return false;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError('La cantidad debe ser un entero mayor que cero.');
      return false;
    }

    const currentQuantity = saleItems.find((item) => item.id_producto === idProducto)?.cantidad ?? 0;

    if (currentQuantity + cantidad > producto.stock_actual) {
      setError(`La cantidad total no puede superar el stock disponible (${producto.stock_actual}).`);
      return false;
    }

    setSaleItems((current) => {
      const existing = current.find((item) => item.id_producto === idProducto);
      if (existing) {
        return current.map((item) =>
          item.id_producto === idProducto ? { ...item, cantidad: item.cantidad + cantidad } : item,
        );
      }

      return [...current, { id_producto: idProducto, cantidad }];
    });
    setError('');
    return true;
  }

  function addSaleItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const idProducto = Number(saleForm.producto_id);
    const cantidad = Number(saleForm.cantidad);

    if (tryAddSaleItem(idProducto, cantidad)) {
      setSaleForm((current) => ({ ...current, producto_id: '', cantidad: '' }));
    }
  }

  function updateSaleItemQuantity(idProducto: number, value: string) {
    const cantidad = Number(value);
    const producto = productos.find((item) => item.id_producto === idProducto);

    if (!Number.isInteger(cantidad) || cantidad <= 0 || !producto || cantidad > producto.stock_actual) return;

    setSaleItems((current) =>
      current.map((item) => (item.id_producto === idProducto ? { ...item, cantidad } : item)),
    );
  }

  function removeSaleItem(idProducto: number) {
    setSaleItems((current) => current.filter((item) => item.id_producto !== idProducto));
  }

  async function confirmSale() {
    if (saleItems.length === 0) {
      setError('La venta debe contener al menos un producto.');
      return;
    }

    for (const item of saleItemsDetailed) {
      if (!item.producto.activo) {
        setError('Solo pueden venderse productos activos.');
        return;
      }
      if (item.cantidad <= 0 || item.cantidad > item.producto.stock_actual) {
        setError(`Revisa la cantidad de ${item.producto.nombre}.`);
        return;
      }
    }

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      await apiRequest('/api/ventas', {
        method: 'POST',
        body: JSON.stringify({
          productos: saleItems.map((item) => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
          })),
          nota: saleForm.nota,
        }),
      });
      setSaleItems([]);
      setSaleForm({ producto_id: '', cantidad: '', nota: '' });
      setStatus('Venta registrada en una sola operacion.');
      await loadProductos();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar la venta.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStockAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;

    const cantidad = Number(adjustmentForm.cantidad);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError('La cantidad debe ser un entero mayor que cero.');
      return;
    }

    if (!adjustmentForm.motivo.trim()) {
      setError('El motivo es requerido.');
      return;
    }

    if (adjustmentForm.tipo === 'salida' && cantidad > selectedProduct.stock_actual) {
      setError(`La salida no puede ser mayor al stock disponible (${selectedProduct.stock_actual}).`);
      return;
    }

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      await apiRequest<{ producto: Producto; movimiento: MovimientoInventario }>(`/api/productos/${selectedProduct.id_producto}/ajustes`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: adjustmentForm.tipo,
          cantidad,
          motivo: adjustmentForm.motivo,
        }),
      });
      setAdjustmentForm({ tipo: 'entrada', cantidad: '', motivo: '' });
      setStatus('Ajuste manual registrado con movimiento historico.');
      await loadProductos();
      setActiveSection('historial-producto');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar el ajuste de stock.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisable(producto: Producto) {
    const confirmed = window.confirm(`¿Seguro que quieres desactivar "${producto.nombre}"? Se conservará su historial.`);

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

  const menuGroups: Array<{
    title: string;
    items: Array<{ id: InventorySection; label: string; description: string }>;
  }> = [
    {
      title: 'Panel',
      items: [{ id: 'resumen', label: 'Vista general', description: 'Resumen y acciones rápidas' }],
    },
    {
      title: 'Catálogo',
      items: [
        { id: 'productos', label: 'Productos', description: 'Inventario actual' },
        { id: 'registrar', label: editingId ? 'Editar producto' : 'Registrar producto', description: 'Alta y edición' },
        { id: 'seleccionado', label: 'Producto seleccionado', description: 'Detalle y acciones' },
        { id: 'ajuste', label: 'Ajustar stock', description: 'Entrada o salida manual' },
        { id: 'venta', label: 'Punto de venta', description: 'Venta con varios productos' },
      ],
    },
    {
      title: 'Movimientos',
      items: [
        { id: 'dano', label: 'Daño leve', description: 'Stock vendible reducido' },
        { id: 'merma', label: 'Merma', description: 'Pérdida total' },
      ],
    },
    {
      title: 'Reportes',
      items: [
        { id: 'danados', label: 'Daños vendibles', description: 'Unidades recuperables' },
        { id: 'mermas', label: 'Pérdidas / mermas', description: 'Registro de pérdidas' },
      ],
    },
    {
      title: 'Historial',
      items: [
        { id: 'historial-producto', label: 'Por producto', description: 'Trazabilidad individual' },
        { id: 'historial-reciente', label: 'Reciente', description: 'Últimos movimientos' },
      ],
    },
  ];
  const menuItems = menuGroups.flatMap((group) => group.items);
  const activeMenuItem = menuItems.find((item) => item.id === activeSection) ?? menuItems[0];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-r border-slate-800 bg-slate-950 px-5 py-6 text-white shadow-xl shadow-slate-950/20">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">Inventario</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Panel operativo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Control diario de stock, daños, mermas y trazabilidad.</p>
          </div>

          <nav className="mt-8 space-y-6">
            {menuGroups.map((group) => (
              <section key={group.title}>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{group.title}</p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full rounded-xl px-3.5 py-3 text-left transition ${
                        activeSection === item.id
                          ? 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="block text-sm font-extrabold">{item.label}</span>
                      <span className={`mt-0.5 block text-xs ${activeSection === item.id ? 'text-slate-800' : 'text-slate-500'}`}>
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sesión</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">Panel de inventario</p>
            <div className="mt-4 grid gap-2">
              <button onClick={loadProductos} className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-sky-300">
                Actualizar
              </button>
              <button onClick={logout} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-slate-200 bg-white px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-500">Inventario</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{activeMenuItem.label}</h1>
                <p className="mt-1 text-sm text-slate-500">{activeMenuItem.description}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Administrador
              </div>
            </div>
          </header>

          <div className="px-5 py-6 sm:px-8">
            {(error || status) && (
              <section className="mb-4 space-y-3">
                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
                {status && <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">{status}</p>}
              </section>
            )}

        {activeSection === 'resumen' && (
          <section className="mt-6 space-y-5">
            <section className="grid gap-4 lg:grid-cols-4">
              <Metric label="Ventas del día" value={formatCurrency(resumenDia.ventas_dia)} tone="success" />
              <Metric label="Pérdidas de hoy" value={formatCurrency(resumenDia.perdidas)} tone="danger" />
              <Metric label="Balance del día" value={formatCurrency(resumenDia.balance_potencial)} tone={resumenDia.balance_potencial < 0 ? 'danger' : 'success'} />
              <Metric label="Daño vendible de hoy" value={formatCurrency(resumenDia.valor_danado_vendible)} tone="warning" />
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <MiniMetric label="Activos" value={activeProducts.length} />
              <MiniMetric label="Bajo stock" value={lowStockCount} tone="warning" />
              <MiniMetric label="Agotados" value={exhaustedCount} tone="danger" />
              <MiniMetric label="Desactivados" value={disabledCount} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Acciones rápidas</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">Qué quieres hacer ahora</h2>
                  </div>
                  <button onClick={loadProductos} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                    Actualizar datos
                  </button>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <QuickAction title="Registrar producto" description="Alta de un producto nuevo." onClick={() => setActiveSection('registrar')} />
                  <QuickAction title="Revisar productos" description="Consulta, filtros y edición." onClick={() => setActiveSection('productos')} />
                  <QuickAction title="Ajustar stock" description="Entrada o salida con motivo." onClick={() => setActiveSection('ajuste')} disabled={!selectedProduct} />
                  <QuickAction title="Punto de venta" description="Registra varios productos en un ticket." onClick={() => setActiveSection('venta')} />
                  <QuickAction title="Registrar daño" description="Producto recuperable con precio reducido." onClick={() => setActiveSection('dano')} />
                </div>
              </section>

              <SelectedProductCard product={selectedProduct}>
                <button onClick={() => setActiveSection('productos')} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800">
                  Cambiar producto
                </button>
              </SelectedProductCard>
            </section>
          </section>
        )}

        {activeSection === 'productos' && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Productos</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Inventario actual</h2>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <button onClick={() => setActiveSection('registrar')} className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-sky-300">
                  Nuevo producto
                </button>
                <div className="flex flex-wrap gap-2">
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
              </div>
            </div>

            {isLoading ? (
              <p className="p-6 text-sm text-slate-500">Cargando inventario...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No hay productos para este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Producto</th>
                      <th className="px-5 py-4">Categoría</th>
                      <th className="px-5 py-4">Compra</th>
                      <th className="px-5 py-4">Venta</th>
                      <th className="px-5 py-4">Stock</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((producto) => (
                      <tr key={producto.id_producto} className={selectedId === producto.id_producto ? 'bg-sky-50/70' : 'bg-white'}>
                        <td className="px-5 py-4 font-semibold text-slate-950">{producto.nombre}</td>
                        <td className="px-5 py-4 text-slate-600">{producto.categoria}</td>
                        <td className="px-5 py-4 text-slate-600">{formatCurrency(producto.precio_compra)}</td>
                        <td className="px-5 py-4 text-slate-600">{formatCurrency(producto.precio_venta)}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {producto.stock_actual} / min {producto.stock_minimo}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge estado={producto.estado} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/inventario/productos/${producto.id_producto}`}
                              prefetch={false}
                              onClick={() => selectProduct(producto)}
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                            >
                              Ver detalle
                            </Link>
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
        )}

        {activeSection === 'registrar' && (
          <section className="mt-6 max-w-3xl">
            <ProductFormPanel
              editingId={editingId}
              form={form}
              isSaving={isSaving}
              onCancel={resetProductForm}
              onChange={updateForm}
              onSubmit={handleSaveProduct}
            />
          </section>
        )}

        {activeSection === 'seleccionado' && (
          <section className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <SelectedProductCard product={selectedProduct}>
              <button onClick={() => setActiveSection('productos')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Elegir otro
              </button>
            </SelectedProductCard>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operaciones</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Acciones para este producto</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <QuickAction title="Editar datos" description="Precio, categoría o stock mínimo." onClick={() => selectedProduct && startEdit(selectedProduct)} disabled={!selectedProduct} />
                <QuickAction title="Ajustar stock" description="Entrada o salida con motivo." onClick={() => setActiveSection('ajuste')} disabled={!selectedProduct} />
                <QuickAction title="Punto de venta" description="Armar ticket con varios productos." onClick={() => setActiveSection('venta')} disabled={activeProducts.length === 0} />
                <QuickAction title="Registrar daño leve" description="Unidades vendibles con descuento." onClick={() => setActiveSection('dano')} disabled={!selectedProduct?.activo} />
                <QuickAction title="Registrar merma" description="Descontar pérdida total." onClick={() => setActiveSection('merma')} disabled={!selectedProduct?.activo} />
                <QuickAction title="Ver historial" description="Movimientos de este producto." onClick={() => setActiveSection('historial-producto')} disabled={!selectedProduct} />
              </div>
            </section>
          </section>
        )}

        {activeSection === 'ajuste' && (
          <section className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,560px)]">
            <SelectedProductCard product={selectedProduct} />
            <ActionPanel title="Ajuste manual de stock" description="Registra una entrada o salida manual con motivo y trazabilidad.">
              <form onSubmit={handleStockAdjustment} className="grid gap-4">
                <ProductSelect
                  label="Producto del inventario"
                  productos={productos}
                  value={selectedProduct?.id_producto ?? null}
                  onChange={setSelectedId}
                />
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Tipo de ajuste</span>
                  <select
                    value={adjustmentForm.tipo}
                    onChange={(event) => setAdjustmentForm((current) => ({ ...current, tipo: event.target.value as 'entrada' | 'salida' }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </label>
                <Field
                  label="Cantidad"
                  type="number"
                  numericMode="integer"
                  min="1"
                  value={adjustmentForm.cantidad}
                  onChange={(value) => setAdjustmentForm((current) => ({ ...current, cantidad: value }))}
                />
                <Field
                  label="Motivo"
                  value={adjustmentForm.motivo}
                  onChange={(value) => setAdjustmentForm((current) => ({ ...current, motivo: value }))}
                />
                <button disabled={!selectedProduct || isSaving} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                  Registrar ajuste
                </button>
              </form>
            </ActionPanel>
          </section>
        )}

        {activeSection === 'venta' && (
          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <ActionPanel title="Punto de venta" description="Agrega productos activos al mismo ticket y confirma una sola venta.">
              <form onSubmit={addSaleItem} className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Producto del inventario</span>
                  <select
                    value={saleForm.producto_id}
                    onChange={(event) => setSaleForm((current) => ({ ...current, producto_id: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Selecciona un producto</option>
                    {activeProducts.map((producto) => (
                      <option key={producto.id_producto} value={producto.id_producto}>
                        {producto.nombre} - stock {producto.stock_actual}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Cantidad"
                  type="number"
                  numericMode="integer"
                  min="1"
                  value={saleForm.cantidad}
                  onChange={(value) => setSaleForm((current) => ({ ...current, cantidad: value }))}
                />
                <button className="rounded-xl bg-sky-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-300">
                  Agregar a la venta
                </button>
              </form>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Productos disponibles</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {activeProducts.map((producto) => {
                    const itemInSale = saleItems.find((item) => item.id_producto === producto.id_producto);
                    const remainingStock = producto.stock_actual - (itemInSale?.cantidad ?? 0);

                    return (
                      <button
                        key={producto.id_producto}
                        type="button"
                        onClick={() => tryAddSaleItem(producto.id_producto, 1)}
                        disabled={remainingStock <= 0}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <span className="block text-sm font-bold text-slate-950">{producto.nombre}</span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {formatCurrency(producto.precio_venta)} | stock disponible {remainingStock}
                        </span>
                        <span className="mt-3 inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">
                          Agregar 1
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ActionPanel>

            <ActionPanel title="Ticket de venta" description="Modifica cantidades enteras, elimina lineas y confirma una sola solicitud.">
              <div className="grid gap-4">
                {saleItemsDetailed.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                    Agrega productos al ticket para registrar la venta.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3">Precio</th>
                          <th className="px-4 py-3">Cantidad</th>
                          <th className="px-4 py-3">Stock</th>
                          <th className="px-4 py-3">Subtotal</th>
                          <th className="px-4 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {saleItemsDetailed.map((item) => (
                          <tr key={item.id_producto}>
                            <td className="px-4 py-3 font-semibold text-slate-950">{item.producto.nombre}</td>
                            <td className="px-4 py-3 text-slate-600">{formatCurrency(item.precio_unitario)}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                max={item.producto.stock_actual}
                                step="1"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.cantidad}
                                onChange={(event) => updateSaleItemQuantity(item.id_producto, event.target.value)}
                                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-600">{item.producto.stock_actual}</td>
                            <td className="px-4 py-3 font-bold text-slate-950">{formatCurrency(item.subtotal)}</td>
                            <td className="px-4 py-3">
                              <button type="button" onClick={() => removeSaleItem(item.id_producto)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Total estimado</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">{formatCurrency(saleTotal)}</p>
                </div>
                <Field label="Nota de venta" value={saleForm.nota} onChange={(value) => setSaleForm((current) => ({ ...current, nota: value }))} required={false} />
                <button type="button" onClick={confirmSale} disabled={saleItems.length === 0 || isSaving} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                  Confirmar venta
                </button>
              </div>
            </ActionPanel>
          </section>
        )}

        {activeSection === 'dano' && (
          <section className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,560px)]">
            <SelectedProductCard product={selectedProduct} />
            <ActionPanel title="Daño leve" description="Usa esta opción cuando el producto todavía puede venderse con precio reducido.">
              <form onSubmit={handleDamage} className="grid gap-4">
                <ProductSelect
                  label="Producto del inventario"
                  productos={activeProducts}
                  value={selectedProduct?.activo ? selectedProduct.id_producto : null}
                  onChange={setSelectedId}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cantidad" type="number" numericMode="integer" min="1" value={damageForm.cantidad} onChange={(value) => setDamageForm((current) => ({ ...current, cantidad: value }))} />
                  <Field label="Precio reducido" type="number" value={damageForm.precio_reducido} onChange={(value) => setDamageForm((current) => ({ ...current, precio_reducido: value }))} />
                </div>
                <Field label="Descripción del daño" value={damageForm.descripcion_dano} onChange={(value) => setDamageForm((current) => ({ ...current, descripcion_dano: value }))} />
                <button disabled={!selectedProduct?.activo || isSaving} className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-400">
                  Registrar daño leve
                </button>
              </form>
            </ActionPanel>
          </section>
        )}

        {activeSection === 'merma' && (
          <section className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,560px)]">
            <SelectedProductCard product={selectedProduct} />
            <ActionPanel title="Merma" description="Usa esta opción cuando el producto ya no puede venderse y debe salir del inventario.">
              <form onSubmit={handleWaste} className="grid gap-4">
                <ProductSelect
                  label="Producto del inventario"
                  productos={activeProducts}
                  value={selectedProduct?.activo ? selectedProduct.id_producto : null}
                  onChange={setSelectedId}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cantidad" type="number" numericMode="integer" min="1" value={wasteForm.cantidad} onChange={(value) => setWasteForm((current) => ({ ...current, cantidad: value }))} />
                  <Info label="Costo calculado" value={formatCurrency(wasteEstimatedCost)} />
                </div>
                <Field label="Motivo" value={wasteForm.motivo} onChange={(value) => setWasteForm((current) => ({ ...current, motivo: value }))} />
                <button disabled={!selectedProduct?.activo || isSaving} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400">
                  Registrar merma
                </button>
              </form>
            </ActionPanel>
          </section>
        )}

        {activeSection === 'danados' && (
          <section className="mt-6">
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
                      <td className="px-5 py-4 text-slate-600">{formatCurrency(item.precio_reducido)}</td>
                      <td className="max-w-xs px-5 py-4 text-slate-600">{item.descripcion_dano}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.activo ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTablePanel>
          </section>
        )}

        {activeSection === 'mermas' && (
          <section className="mt-6">
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
                    <th className="px-5 py-4">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mermas.map((item) => (
                    <tr key={item.id_merma}>
                      <td className="px-5 py-4 font-semibold text-slate-950">{item.producto}</td>
                      <td className="px-5 py-4 text-slate-600">{item.cantidad}</td>
                      <td className="max-w-xs px-5 py-4 text-slate-600">{item.motivo}</td>
                      <td className="px-5 py-4 text-slate-600">{formatCurrency(item.costo_perdida)}</td>
                      <td className="px-5 py-4 text-slate-600">{item.responsable ?? `Usuario ${item.id_usuario}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTablePanel>
          </section>
        )}

        {activeSection === 'historial-producto' && (
          <section className="mt-6">
            <TracePanel title="Historial del producto" subtitle={selectedProduct?.nombre ?? 'Selecciona un producto'} rows={productMovements} />
          </section>
        )}

        {activeSection === 'historial-reciente' && (
          <section className="mt-6">
            <TracePanel title="Historial reciente" subtitle="Últimos 12 movimientos registrados" rows={movimientos} />
          </section>
        )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProductFormPanel({
  editingId,
  form,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: {
  editingId: number | null;
  form: ProductoForm;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (field: keyof ProductoForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {editingId ? 'Actualizar' : 'Registrar'}
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {editingId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
        </div>
        {editingId && (
          <button type="button" onClick={onCancel} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
            Cancelar
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Nombre" value={form.nombre} onChange={(value) => onChange('nombre', value)} />
        <Field label="Categoría" value={form.categoria} onChange={(value) => onChange('categoria', value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio compra" type="number" value={form.precio_compra} onChange={(value) => onChange('precio_compra', value)} />
          <Field label="Precio venta" type="number" value={form.precio_venta} onChange={(value) => onChange('precio_venta', value)} />
          {!editingId && <Field label="Stock actual" type="number" numericMode="integer" value={form.stock_actual} onChange={(value) => onChange('stock_actual', value)} />}
          <Field label="Stock mínimo" type="number" numericMode="integer" value={form.stock_minimo} onChange={(value) => onChange('stock_minimo', value)} />
        </div>
      </div>

      <button
        disabled={isSaving}
        className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {isSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar producto'}
      </button>
    </form>
  );
}

function QuickAction({
  title,
  description,
  onClick,
  disabled = false,
}: {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="block text-sm font-black text-slate-950">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
    </button>
  );
}

function SelectedProductCard({ product, children }: { product: Producto | null; children?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Producto seleccionado</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{product?.nombre ?? 'Ninguno seleccionado'}</h2>
      {product ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="Categoría" value={product.categoria} />
            <Info label="Estado" value={product.estado} />
            <Info label="Stock" value={`${product.stock_actual}`} />
            <Info label="Mínimo" value={`${product.stock_minimo}`} />
          </div>
          {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">Selecciona un producto desde el catálogo para habilitar operaciones.</p>
      )}
    </section>
  );
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warning' | 'danger' | 'success' }) {
  const styles = {
    default: 'border-slate-200 bg-white text-slate-950',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-sky-200 bg-sky-50 text-sky-700',
  }[tone];

  return (
    <div className={`rounded-3xl border p-6 shadow-lg shadow-slate-950/5 ${styles}`}>
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <p className="mt-4 text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' | 'danger' }) {
  const toneClass = {
    default: 'border-slate-200 text-slate-950',
    warning: 'border-amber-200 text-amber-700',
    danger: 'border-red-200 text-red-700',
  }[tone];

  return (
    <div className={`rounded-2xl border bg-white px-5 py-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  numericMode = 'decimal',
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  required?: boolean;
  numericMode?: 'decimal' | 'integer';
  min?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        min={type === 'number' ? (min ?? '0') : undefined}
        step={type === 'number' ? (numericMode === 'integer' ? '1' : '0.01') : undefined}
        inputMode={type === 'number' ? (numericMode === 'integer' ? 'numeric' : 'decimal') : undefined}
        pattern={type === 'number' && numericMode === 'integer' ? '[0-9]*' : undefined}
        required={required}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}

function ProductSelect({
  label,
  productos,
  value,
  onChange,
}: {
  label: string;
  productos: Producto[];
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        required
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      >
        <option value="">Selecciona un producto</option>
        {productos.map((producto) => (
          <option key={producto.id_producto} value={producto.id_producto}>
            {producto.nombre} - stock {producto.stock_actual}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ estado }: { estado: Producto['estado'] }) {
  const styles = {
    disponible: 'bg-sky-50 text-sky-700 border-sky-200',
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

function ActionPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
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
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        {hasRows ? children : <p className="p-6 text-sm text-slate-500">{emptyText}</p>}
      </div>
    </section>
  );
}

function TracePanel({ title, subtitle, rows }: { title: string; subtitle: string; rows: MovimientoInventario[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trazabilidad</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">Aún no hay movimientos para mostrar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Movimiento</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((movimiento) => (
                <tr key={movimiento.id_movimiento} className="bg-white">
                  <td className="px-5 py-4 text-slate-600">{formatDate(movimiento.fecha)}</td>
                  <td className="px-5 py-4 font-semibold text-slate-950">{movimiento.producto}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {formatMovementType(movimiento.tipo_movimiento)}
                    </span>
                  </td>
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
  );
}

function formatMovementType(type: string) {
  const labels: Record<string, string> = {
    registro_inicial: 'Registro inicial',
    actualizacion_stock: 'Actualización de stock',
    ajuste_entrada: 'Ajuste entrada',
    ajuste_salida: 'Ajuste salida',
    venta: 'Venta',
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

function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(safeValue);
}
