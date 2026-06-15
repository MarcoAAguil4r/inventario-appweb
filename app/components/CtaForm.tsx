'use client';

import { useState } from 'react';

type Fields = { nombre: string; email: string };

export default function CtaForm() {
  const [fields, setFields] = useState<Fields>({ nombre: '', email: '' });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:p-10"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Empieza gratis</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
        Prueba el sistema sin compromiso.
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Déjanos tus datos y te contactamos para activar tu acceso.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium text-slate-700">
            Nombre completo
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            value={fields.nombre}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-950/10"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={fields.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-950/10"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
        >
          Solicitar acceso gratuito
        </button>

        <p className="text-center text-xs text-slate-400">
          Sin tarjeta de crédito · Respuesta en menos de 24 h
        </p>
      </div>
    </form>
  );
}
