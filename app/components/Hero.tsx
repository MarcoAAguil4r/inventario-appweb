import React from 'react';

export default function Hero() {
  return (
    // min-h-screen y flex items-center para cubrir todo el alto de la pantalla
    <section id="inicio" className="relative w-full min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white transition-colors duration-300">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_45%)]" />
      
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 md:gap-12 px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <span className="relative z-10 inline-flex self-center rounded-full border border-slate-500/30 bg-white/5 px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.35em] text-sky-300 backdrop-blur">
          Control de inventario ágil
        </span>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          
          <div className="space-y-6 md:space-y-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="max-w-2xl space-y-4 md:space-y-6">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
                Organiza tu inventario con claridad, velocidad y cero papel.
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-200 sm:text-lg lg:text-xl mx-auto lg:mx-0">
                Gestiona entradas, salidas y stock desde un mismo lugar, sin errores ni cálculos manuales.
              </p>
            </div>

            <div className="flex flex-col w-full sm:w-auto gap-4 sm:flex-row sm:items-center">
              <a href="#demo" className="inline-flex items-center justify-center rounded-full bg-sky-400 px-8 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-300 w-full sm:w-auto">
                Comenzar demo
              </a>
              <a href="#solucion" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-slate-200 hover:bg-white/10 w-full sm:w-auto">
                Ver solución
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl w-full max-w-lg lg:max-w-none mx-auto lg:mx-0">
            <div className="space-y-4 md:space-y-6">
              <div className="rounded-3xl bg-slate-950/90 p-5 sm:p-6 text-slate-100">
                <p className="text-xs sm:text-sm uppercase tracking-[0.28em] text-sky-300">Resultados reales</p>
                <p className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-white">+30% menos tiempo perdido</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Optimiza tus operaciones diarias con alertas inteligentes y control en tiempo real.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100">
                  <p className="text-2xl sm:text-3xl font-bold text-white">0%</p>
                  <p className="mt-2 text-sm text-slate-300">Errores de stock manual</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100">
                  <p className="text-2xl sm:text-3xl font-bold text-white">24/7</p>
                  <p className="mt-2 text-sm text-slate-300">Acceso desde cualquier dispositivo</p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {['Inventario claro', 'Registros rápidos', 'Alertas automáticas'].map((label) => (
                  <div key={label} className="rounded-2xl sm:rounded-3xl bg-white/10 px-4 py-3 text-center text-sm text-slate-200">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}