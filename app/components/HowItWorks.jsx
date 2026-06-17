export default function HowItWorks() {
  const steps = [
    {
      title: 'Agrega productos',
      description: 'Registra cada artículo con fotos, precios y cantidades para tener control total desde el primer día.',
      icon: '➕'
    },
    {
      title: 'Controla movimientos',
      description: 'Sigue entradas, salidas y traslados con un panel centralizado que muestra el estado real del inventario.',
      icon: '↔️'
    },
    {
      title: 'Genera reportes',
      description: 'Obtén reportes automáticos para tomar decisiones rápidas sobre stock, compras y ventas.',
      icon: '📊'
    }
  ];

  return (
    <section id="solucion" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Solución completa</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
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
              className="group rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-xl text-white shadow-lg shadow-slate-950/10">
                {step.icon}
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{step.description}</p>
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
          <button className="mt-8 rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Iniciar prueba gratis
          </button>
        </div>
      </div>
    </section>
  );
}
