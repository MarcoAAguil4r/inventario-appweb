const highlights = [
  {
    title: 'Reporte instantáneo',
    description: 'Visualiza tu stock al momento y evita sorpresas en tu negocio.',
  },
  {
    title: 'Registro rápido',
    description: 'Captura compras y ventas en segundos desde tu teléfono o tablet.',
  },
  {
    title: 'Alertas inteligentes',
    description: 'Recibe notificaciones antes de quedarte sin los productos clave.',
  },
];

const impacts = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    stat: '0',
    unit: 'clientes perdidos',
    detail: 'por falta de stock',
    description: 'Recibe alertas automáticas antes de que el inventario llegue al límite crítico.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    stat: '< 5s',
    unit: 'por registro',
    detail: 'compra o venta',
    description: 'Captura cada movimiento al instante desde cualquier dispositivo, sin papeles.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    stat: '100%',
    unit: 'registros manuales',
    detail: 'eliminados',
    description: 'Olvida los cuadernos y las hojas de cálculo desactualizadas con errores.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    stat: '24/7',
    unit: 'disponibilidad',
    detail: 'desde cualquier lugar',
    description: 'Consulta y actualiza tu inventario en tiempo real desde donde estés.',
  },
];

const before = [
  'Cuaderno de registros físico',
  'Errores frecuentes de transcripción',
  'Stock desactualizado o desconocido',
  'Clientes sin atender por falta de datos',
];

const after = [
  'Sistema digital accesible desde cualquier dispositivo',
  'Registros automáticos sin errores humanos',
  'Inventario actualizado en tiempo real',
  'Alertas antes de quedarte sin stock',
];

export default function Features() {
  return (
    <section id="solucion" className="relative w-full overflow-hidden bg-white py-24">
      <div className="pointer-events-none absolute left-0 top-12 hidden h-72 w-72 rounded-full bg-sky-100/70 blur-3xl md:block" />
      <div className="mx-auto relative max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">La solución</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
            De la bitácora física al control digital instantáneo.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Un sistema ágil que reemplaza el cuaderno de registros, permitiendo capturar
            compras y ventas al instante con visibilidad total del stock.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="mx-auto flex max-w-sm flex-col items-center rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{item.title}</p>
              <p className="mt-4 text-base leading-7 text-slate-700">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Comparación antes / ahora */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="mx-auto rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
            <p className="mb-6 text-xs uppercase tracking-[0.25em] text-slate-400">Antes</p>
            <ul className="space-y-4">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-base leading-none text-slate-300">✕</span>
                  <span className="text-sm text-slate-400 line-through">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
            <p className="mb-6 text-xs uppercase tracking-[0.25em] text-slate-500">Ahora</p>
            <ul className="space-y-4">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-950">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tarjetas de impacto */}
        <div className="mt-20">
          <p className="mb-10 text-center text-sm uppercase tracking-[0.3em] text-slate-500">
            Impacto real
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {impacts.map((item) => (
              <div
                key={item.unit}
                className="group mx-auto flex max-w-xs flex-col items-center rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                  {item.icon}
                </div>
                <p className="mt-5 text-3xl font-semibold text-slate-950">{item.stat}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{item.unit}</p>
                <p className="text-xs text-slate-400">{item.detail}</p>
                <p className="mt-4 text-xs leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}