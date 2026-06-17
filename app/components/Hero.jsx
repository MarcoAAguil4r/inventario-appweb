export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pb-24 pt-12 sm:pt-16">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-slate-950/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-10">
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
              Gestión de inventarios sin complicaciones
            </div>

            <div className="max-w-2xl space-y-6">
              <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl leading-tight">
                Controla tu inventario con claridad, velocidad y confianza.
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Administra entradas, salidas y movimientos en tiempo real en una plataforma diseñada para equipos que necesitan datos claros y decisiones rápidas.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800">
                Empieza gratis
              </button>
              <button className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
                Ver demo
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm">
                Actualizaciones en tiempo real
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm">
                Reportes inteligentes
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm">
                Control multi-usuario
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] lg:grid-cols-none lg:grid-rows-[minmax(0,1fr)_auto]">
            <div className="order-2 grid gap-6 md:order-1">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Inventario activo</p>
                    <p className="mt-4 text-3xl font-semibold text-slate-950">1,248</p>
                  </div>
                  <div className="rounded-3xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                    +12%
                  </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-[1.5rem] bg-slate-100 p-6">
                  <div className="h-36 rounded-[1.25rem] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"></div>
                  <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                    <span>Movimientos del día</span>
                    <span>78</span>
                  </div>
                </div>
                <p className="mt-5 text-sm text-slate-500">Visualiza cada cambio en segundos y evita faltantes en tu stock.</p>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Ajuste inteligente</p>
                <div className="mt-5 rounded-full bg-slate-100 p-3">
                  <div className="h-2 rounded-full bg-slate-950" style={{ width: '74%' }}></div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>Precisión</span>
                  <span>74%</span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Resumen rápido</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">MAY</p>
                </div>
                <div className="rounded-3xl bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.17em] text-slate-600">
                  Últimos 30 días
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Entradas</span>
                  <span>1,520</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Salidas</span>
                  <span>1,128</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Alertas</span>
                  <span>42</span>
                </div>
              </div>

              <button className="mt-8 w-full rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Ver panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
