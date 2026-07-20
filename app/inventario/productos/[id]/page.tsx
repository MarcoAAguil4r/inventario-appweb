'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest, clearSession, getToken } from '@/lib/api';
import type { Producto } from '@/lib/api';

export default function ProductoDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = useMemo(() => String(params?.id ?? '').trim(), [params?.id]);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

    if (!productId) {
      queueMicrotask(() => {
        setError('Producto invalido.');
        setIsLoading(false);
      });
      return;
    }

    let ignore = false;

    async function loadProductDetail() {
      setIsLoading(true);
      setError('');

      try {
        const data = await apiRequest<Producto>(`/api/productos/${productId}`);
        if (!ignore) setProducto(data);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'No se pudo cargar el producto.';
        if (!ignore) {
          setProducto(null);
          setError(message);
        }

        if (message.toLowerCase().includes('token')) {
          clearSession();
          router.replace('/login');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadProductDetail();

    return () => {
      ignore = true;
    };
  }, [productId, router]);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-500">Detalle de producto</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {producto?.nombre ?? 'Producto'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Consulta formal de informacion del inventario.</p>
          </div>
          <Link
            href="/inventario"
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Volver al inventario
          </Link>
        </header>

        {isLoading ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <p className="text-sm font-semibold text-slate-500">Cargando producto...</p>
          </section>
        ) : error ? (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-xl shadow-slate-950/5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-500">No encontrado</p>
            <h2 className="mt-2 text-2xl font-black text-red-800">Producto no disponible</h2>
            <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
          </section>
        ) : producto ? (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Informacion general</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{producto.nombre}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{producto.categoria}</p>
                </div>
                <StatusBadge estado={producto.estado} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <DetailItem label="Precio compra" value={formatCurrency(producto.precio_compra)} />
                <DetailItem label="Precio venta" value={formatCurrency(producto.precio_venta)} />
                <DetailItem label="Stock actual" value={String(producto.stock_actual)} />
                <DetailItem label="Stock minimo" value={String(producto.stock_minimo)} />
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Estado operativo</p>
              <div className="mt-4 space-y-3">
                <DetailItem label="ID producto" value={String(producto.id_producto)} />
                <DetailItem label="Activo" value={producto.activo ? 'Si' : 'No'} />
                <DetailItem label="Estado" value={producto.estado} />
              </div>
            </aside>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black capitalize text-slate-950">{value}</p>
    </div>
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
    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${styles[estado]}`}>
      {estado}
    </span>
  );
}

function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(safeValue);
}
