export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-500">Detalle de producto</p>
          <div className="mt-3 h-9 w-64 rounded-xl bg-slate-200" />
        </div>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
          <p className="text-sm font-semibold text-slate-500">Cargando producto...</p>
        </section>
      </section>
    </main>
  );
}
