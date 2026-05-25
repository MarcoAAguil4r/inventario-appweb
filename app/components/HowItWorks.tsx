export default function HowItWorks() {
  const steps = [
    {
      title: 'Agrega productos',
      description: 'Registra cada artículo con fotos, precios y cantidades para tener control total desde el primer día.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )
    },
    {
      title: 'Controla movimientos',
      description: 'Sigue entradas, salidas y traslados con un panel centralizado que muestra el estado real del inventario.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      )
    },
    {
      title: 'Genera reportes',
      description: 'Obtén reportes automáticos para tomar decisiones rápidas sobre stock, compras y ventas.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    }
  ];

  return (
    <section id="como-funciona" className="relative overflow-hidden w-full bg-slate-50 py-24">
      {/* Efecto de luz de fondo */}
      <div className="pointer-events-none absolute left-0 top-0 hidden h-64 w-64 rounded-full bg-sky-200/30 blur-3xl md:block" />
      
      {/* Contenedor principal alineado exactamente con Navbar, Hero y Features */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Solución completa</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
            Tres pasos para tener tu inventario siempre listo.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Nuestro flujo está pensado para que tu equipo pueda registrar productos y validar stock sin perder tiempo.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group mx-auto flex max-w-sm flex-col items-center rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-xl text-white shadow-lg shadow-slate-950/10">
                {step.icon}
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{step.description}</p>
              <div className="mt-6 flex justify-center">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                  Paso {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-950">¿Listo para probarlo?</p>
          <p className="mt-4 text-slate-600">Activa tu demo y comienza a llevar el control desde hoy.</p>
          <a
            href="#contacto"
            className="mt-8 inline-flex rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Iniciar prueba gratis
          </a>
        </div>
        
      </div>
    </section>
  );
}