import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const impacts = [
  {
    icon: '📦',
    stat: '0',
    unit: 'clientes perdidos',
    detail: 'por falta de stock',
    description:
      'Recibe alertas antes de que el inventario llegue al límite crítico y actúa con tiempo.',
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
    icon: '✏️',
    stat: '100%',
    unit: 'registros manuales',
    detail: 'eliminados',
    description:
      'Olvida los cuadernos desactualizados. Todo queda digitalizado y centralizado.',
  },
  {
    icon: '📱',
    stat: '24/7',
    unit: 'disponibilidad',
    detail: 'desde cualquier lugar',
    description:
      'Consulta y actualiza tu inventario en tiempo real desde donde te encuentres.',
  },
];

const before = [
  'Cuaderno de registros físico difícil de actualizar',
  'Errores frecuentes de transcripción',
  'Stock desactualizado o desconocido',
  'Clientes sin atender por falta de datos',
  'Pérdida de tiempo buscando información',
];

const after = [
  'Sistema digital accesible desde cualquier dispositivo',
  'Registros automáticos sin errores humanos',
  'Inventario actualizado en tiempo real',
  'Alertas antes de quedarte sin stock',
  'Toda la información centralizada en segundos',
];

const features = [
  {
    icon: '🔄',
    title: 'Registro instantáneo',
    description:
      'Cada compra o venta se registra al momento. Sin esperar, sin pendientes acumulados al final del día.',
  },
  {
    icon: '🔔',
    title: 'Alertas de stock bajo',
    description:
      'Define umbrales mínimos por producto y recibe notificaciones antes de quedarte sin existencias.',
  },
  {
    icon: '👥',
    title: 'Multi-usuario',
    description:
      'Todo tu equipo registra movimientos al mismo tiempo desde distintos puntos de venta.',
  },
  {
    icon: '📊',
    title: 'Historial completo',
    description:
      'Consulta cada movimiento con fecha, usuario y detalle. Sin perder ni un solo registro.',
  },
  {
    icon: '☁️',
    title: 'En la nube',
    description:
      'Sin instalaciones ni servidores propios. Accede desde el navegador en cualquier momento.',
  },
  {
    icon: '🔒',
    title: 'Datos seguros',
    description:
      'Tu información está protegida con respaldos automáticos y cifrado de extremo a extremo.',
  },
];

export default function SolucionPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-slate-50 pb-24 pt-16">
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-slate-950/8 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-28 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-6 sm:px-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              La solución
            </span>

            <h1 className="mt-8 text-5xl font-semibold leading-[1.1] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Tu inventario,<br />siempre actualizado.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Un sistema digital ágil que reemplaza la bitácora física, permitiendo
              registrar compras y ventas al instante desde cualquier dispositivo.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="rounded-full bg-slate-950 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800">
                Empieza gratis
              </button>
              <button className="rounded-full border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50">
                Ver demo
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {['Sin tarjeta de crédito', 'Configuración en minutos', 'Soporte en español'].map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── El problema + Antes / Ahora ── */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-start">

              <div className="space-y-6 lg:pt-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">El problema</p>
                <h2 className="text-3xl font-semibold leading-snug text-slate-950 sm:text-4xl">
                  La bitácora física<br />limita tu negocio.
                </h2>
                <p className="text-base leading-8 text-slate-600">
                  Registrar compras y ventas a mano genera errores, retrasos y pérdida de
                  información crítica. Cuando el stock se desactualiza, pierdes clientes
                  sin siquiera darte cuenta.
                </p>
                <p className="text-base leading-8 text-slate-600">
                  Nuestro sistema reemplaza ese proceso manual por una plataforma digital
                  donde cada movimiento queda registrado al instante, con historial
                  completo visible para todo el equipo.
                </p>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    El cambio clave
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    De un cuaderno que solo tú entiendes a un panel centralizado donde
                    cualquier miembro del equipo registra y consulta movimientos en tiempo
                    real, desde su celular o computadora.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Antes */}
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-8 py-7">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-400">
                      ✕
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Antes — bitácora física
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {before.map((item) => (
                      <li key={item} className="text-sm text-slate-400 line-through">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ahora */}
                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-8 py-7 shadow-xl shadow-slate-900/5">
                  <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[2rem] bg-slate-950" />
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                      ✓
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Ahora — sistema digital
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {after.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                        <span className="flex-shrink-0 text-slate-300">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tarjetas de impacto ── */}
        <section className="py-24 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
            <div className="mb-14 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Impacto real</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
                Lo que cambia desde el primer día.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-8 text-slate-600">
                Resultados concretos que tu negocio empieza a ver en cuanto digitaliza su inventario.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {impacts.map((item) => (
                <div
                  key={item.unit}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="mt-5 text-5xl font-semibold tracking-tight text-slate-950">
                    {item.stat}
                  </p>
                  <div className="my-4 h-px bg-slate-100" />
                  <p className="text-sm font-medium text-slate-700">{item.unit}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.detail}</p>
                  <p className="mt-4 text-xs leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Características ── */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
            <div className="mb-14 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Características</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
                Todo lo que necesitas en un solo lugar.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  className="group relative rounded-[2rem] border border-slate-200 bg-slate-50 p-8 transition duration-300 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5"
                >
                  <span className="absolute right-7 top-7 text-xs font-semibold tabular-nums text-slate-300">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-2xl">{feat.icon}</span>
                  <h3 className="mt-5 text-base font-semibold text-slate-950">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA oscuro ── */}
        <section className="bg-slate-950 py-24">
          <div className="mx-auto max-w-3xl px-6 sm:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Empieza hoy</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Deja de perder clientes<br />por falta de stock.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-slate-400">
              Activa tu cuenta gratis y empieza a registrar compras y ventas al instante.
              Sin tarjeta de crédito.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100">
                Crear cuenta gratis
              </button>
              <button className="rounded-full border border-slate-700 px-8 py-4 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white">
                Hablar con el equipo
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
