export type Producto = {
  id_producto: number;
  nombre: string;
  categoria: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  estado: 'disponible' | 'bajo stock' | 'agotado' | 'desactivado';
};

export type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: string;
};

export type LoginResponse = {
  token: string;
  usuario: Usuario;
};

export type MovimientoInventario = {
  id_movimiento: number;
  id_producto: number;
  producto: string;
  tipo_movimiento: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  fecha: string;
};

export type ProductoDanado = {
  id_producto_danado: number;
  id_producto_original: number;
  producto: string;
  cantidad: number;
  precio_reducido: number;
  descripcion_dano: string;
  vendible: boolean;
  activo: boolean;
  creado_en: string;
};

export type Merma = {
  id_merma: number;
  id_producto: number;
  producto: string;
  cantidad: number;
  motivo: string;
  costo_perdida: number;
  creado_en: string;
};

export type ResumenDia = {
  margen_potencial: number;
  perdidas: number;
  valor_danado_vendible: number;
  balance_potencial: number;
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('inventario_token');
}

export function saveSession(token: string, usuario: Usuario) {
  window.localStorage.setItem('inventario_token', token);
  window.localStorage.setItem('inventario_usuario', JSON.stringify(usuario));
}

export function clearSession() {
  window.localStorage.removeItem('inventario_token');
  window.localStorage.removeItem('inventario_usuario');
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${API_URL}. Verifica que el backend este corriendo.`);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(payload.error ?? 'Tu sesion expiro o no tienes autorizacion.');
    }

    if (response.status === 404) {
      throw new Error(payload.error ?? 'No se encontro el recurso solicitado.');
    }

    throw new Error(payload.error ?? `No se pudo completar la solicitud. Codigo ${response.status}.`);
  }

  return payload as T;
}
