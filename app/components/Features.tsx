const impacts = [
  {
    icon: '📦',
    stat: '0',
    unit: 'clientes perdidos',
    detail: 'por falta de stock',
    description:
      'Recibe alertas automáticas antes de que el inventario llegue al límite crítico.',
  },
  {
    icon: '⚡',
    stat: '< 5s',
    unit: 'por registro',
    detail: 'compra o venta',
    description:
      'Captura cada movimiento al instante desde cualquier dispositivo, sin papeles.',
  },
  {
    icon: '❌',
    stat: '100%',
    unit: 'registros manuales',
    detail: 'eliminados',
    description:
      'Olvida los cuadernos y las hojas de cálculo desactualizadas con errores.',
  },
  {
    icon: '📱',
    stat: '24/7',
    unit: 'disponibilidad',
    detail: 'desde cualquier lugar',
    description:
      'Consulta y actualiza tu inventario en tiempo real desde donde estés.',
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
    <section id="solucion-detalle" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">

        {/* Header */}
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">La solución</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl leading-tight">
            De la bitácora física al control digital instantáneo.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Un sistema ágil que reemplaza el cuaderno de registros, permitiendo capturar
            compras y ventas al instante con visibilidad total del stock.
          </p>
        </div>

        {/* Comparación antes / ahora */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
            <p className="mb-6 text-xs uppercase tracking-[0.25em] text-slate-400">Antes</p>
            <ul className="space-y-4">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-slate-300 text-base leading-none">✕</span>
                  <span className="text-sm text-slate-400 line-through">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
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
                className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
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
