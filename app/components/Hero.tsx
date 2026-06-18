import Image from 'next/image';

export default function Hero() {
  return (
    <section
      id="inicio"
      data-feature="hero-v2"
      className="relative w-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
      aria-labelledby="hero-heading"
      aria-describedby="hero-desc"
      role="region"
    >
      {/* Efecto de luz superior (decorativo) */}
      <div
        className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_45%)]"
        aria-hidden="true"
      />

      {/* Contenedor principal alineado con el Navbar */}
      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">

          {/* Columna Izquierda: Textos y Botones */}
          <header className="space-y-8 flex flex-col items-center text-center">
            <p className="sr-only" aria-live="polite">Sección Hero implementada — título, descripción, CTA e imagen.</p>
            <p className="inline-flex rounded-full border border-slate-500/30 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-sky-300 backdrop-blur">
              Control de inventario ágil
            </p>

            <h1 id="hero-heading" className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Organiza tu inventario con claridad, velocidad y cero papel.
            </h1>

            <p id="hero-desc" className="max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Gestiona entradas, salidas y stock desde un mismo lugar, sin errores ni cálculos manuales.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#demo"
                aria-label="Comenzar demo — ir a la sección demo"
                className="inline-flex items-center justify-center rounded-full bg-sky-400 px-8 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
              >
                Comenzar demo
              </a>
              <a
                href="#solucion"
                aria-label="Ver solución — ir a la sección solución"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
              >
                Ver solución
              </a>
            </div>
          </header>

          {/* Columna Derecha: Tarjeta de Métricas */}
          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl" aria-labelledby="hero-stats-title">
            <div className="mb-6 flex justify-center">
              <Image
                src="/hero-illustration.svg"
                alt="Vista previa del panel de control de inventario"
                className="w-full max-w-[260px] rounded-xl"
                width={600}
                height={400}
                priority
              />
            </div>
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-950/90 p-6 text-slate-100">
                <h2 id="hero-stats-title" className="text-sm uppercase tracking-[0.28em] text-sky-300">Resultados reales</h2>
                <p className="mt-4 text-3xl font-bold">+30% menos tiempo perdido</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Optimiza tus operaciones diarias con alertas inteligentes y control en tiempo real.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2" role="list">
                <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100" role="listitem">
                  <p className="text-3xl font-bold">0%</p>
                  <p className="mt-2 text-sm text-slate-300">Errores de stock manual</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100" role="listitem">
                  <p className="text-3xl font-bold">24/7</p>
                  <p className="mt-2 text-sm text-slate-300">Acceso desde cualquier dispositivo</p>
                </div>
              </div>

              <ul className="grid gap-4 sm:grid-cols-3" role="list">
                {['Inventario claro', 'Registros rápidos', 'Alertas automáticas'].map((label) => (
                  <li key={label} className="rounded-3xl bg-white/10 px-4 py-3 text-center text-sm text-slate-200">
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
}
