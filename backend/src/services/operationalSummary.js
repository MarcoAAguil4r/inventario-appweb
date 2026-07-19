export const BUSINESS_TIME_ZONE = 'America/Mexico_City';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MEXICO_CITY_UTC_OFFSET_HOURS = 6;

function parseDateParts(date) {
  if (!DATE_PATTERN.test(date)) return null;

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function getLocalDateString(now = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function getMexicoCityUtcBounds(date) {
  const parts = parseDateParts(date);

  if (!parts) return null;

  const start = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, MEXICO_CITY_UTC_OFFSET_HOURS));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startUtc: start.toISOString().slice(0, 19).replace('T', ' '),
    endUtc: end.toISOString().slice(0, 19).replace('T', ' '),
  };
}

async function getExistingColumns(queryFn, tableName, columnNames) {
  const placeholders = columnNames.map(() => '?').join(', ');
  const rows = await queryFn(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME IN (${placeholders})`,
    [tableName, ...columnNames],
  );

  return new Set(rows.map((row) => row.COLUMN_NAME));
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function getOperationalSummary({ idUsuario, fecha, queryFn, now = new Date() }) {
  const selectedDate = fecha ? String(fecha).trim() : getLocalDateString(now);
  const bounds = getMexicoCityUtcBounds(selectedDate);

  if (!bounds) {
    return {
      status: 400,
      body: { error: 'Fecha invalida. Usa formato YYYY-MM-DD.' },
    };
  }

  const ventasColumns = await getExistingColumns(queryFn, 'ventas', ['fecha', 'creado_en', 'estado']);
  const salesDateColumn = ventasColumns.has('fecha') ? 'fecha' : 'creado_en';
  const salesStatusCondition = ventasColumns.has('estado') ? "AND v.estado = 'CONFIRMADA'" : '';

  const [ventasRow = {}] = await queryFn(
    `SELECT COALESCE(SUM(v.total), 0) AS ventas_confirmadas
     FROM ventas v
     WHERE v.id_usuario = ?
       ${salesStatusCondition}
       AND v.${salesDateColumn} >= ?
       AND v.${salesDateColumn} < ?`,
    [idUsuario, bounds.startUtc, bounds.endUtc],
  );
  const [perdidasRow = {}] = await queryFn(
    `SELECT COALESCE(SUM(m.costo_perdida), 0) AS perdidas
     FROM mermas m
     INNER JOIN productos p ON p.id_producto = m.id_producto
     WHERE p.id_usuario = ?
       AND m.creado_en >= ?
       AND m.creado_en < ?`,
    [idUsuario, bounds.startUtc, bounds.endUtc],
  );

  const ventasConfirmadas = numberOrZero(ventasRow.ventas_confirmadas);
  const perdidas = numberOrZero(perdidasRow.perdidas);
  const balance = ventasConfirmadas - perdidas;

  return {
    status: 200,
    body: {
      fecha: selectedDate,
      zona_horaria: BUSINESS_TIME_ZONE,
      ventas_confirmadas: ventasConfirmadas,
      perdidas,
      balance,
      ventas_dia: ventasConfirmadas,
      balance_potencial: balance,
      margen_potencial: 0,
      ganancia_potencial: 0,
      valor_danado_vendible: 0,
    },
  };
}
