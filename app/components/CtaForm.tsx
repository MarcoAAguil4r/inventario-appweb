'use client';

import { useState } from 'react';

type Fields = { nombre: string; email: string };
type Errors = Partial<Fields>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
  if (!fields.email.trim()) {
    errors.email = 'El correo es obligatorio.';
  } else if (!emailRegex.test(fields.email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }
  return errors;
}

export default function CtaForm() {
  const [fields, setFields] = useState<Fields>({ nombre: '', email: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...fields, [name]: value };
    setFields(updated);
    if (touched[name as keyof Fields]) {
      setErrors(validate(updated));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const name = e.target.name as keyof Fields;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(fields));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ nombre: true, email: true });
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-900/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-2xl text-white">
          ✓
        </div>
        <p className="mt-6 text-lg font-semibold text-slate-950">¡Listo!</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Recibimos tus datos. Nos pondremos en contacto contigo pronto.
        </p>
      </div>
    );
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
            onBlur={handleBlur}
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? 'error-nombre' : undefined}
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:ring-2 focus:ring-slate-950/10 ${
              errors.nombre
                ? 'border-red-300 bg-red-50 focus:border-red-400'
                : 'border-slate-200 bg-slate-50 focus:border-slate-400 focus:bg-white'
            }`}
          />
          {errors.nombre && (
            <p id="error-nombre" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
              <span aria-hidden>⚠</span>
              {errors.nombre}
            </p>
          )}
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
            onBlur={handleBlur}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'error-email' : undefined}
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:ring-2 focus:ring-slate-950/10 ${
              errors.email
                ? 'border-red-300 bg-red-50 focus:border-red-400'
                : 'border-slate-200 bg-slate-50 focus:border-slate-400 focus:bg-white'
            }`}
          />
          {errors.email && (
            <p id="error-email" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
              <span aria-hidden>⚠</span>
              {errors.email}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Enviando…' : 'Solicitar acceso gratuito'}
        </button>

        <p className="text-center text-xs text-slate-400">
          Sin tarjeta de crédito · Respuesta en menos de 24 h
        </p>
      </div>
    </form>
  );
}
