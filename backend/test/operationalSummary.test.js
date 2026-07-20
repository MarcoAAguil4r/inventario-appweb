import test from 'node:test';
import assert from 'node:assert/strict';
import { getMexicoCityUtcBounds, getOperationalSummary } from '../src/services/operationalSummary.js';

function createSummaryQuery({ sales = 0, losses = 0, columns = ['fecha', 'creado_en', 'estado'] } = {}) {
  const calls = [];
  const queryFn = async (sql, params) => {
    calls.push({ sql, params });

    if (/INFORMATION_SCHEMA\.COLUMNS/.test(sql)) {
      return columns.map((COLUMN_NAME) => ({ COLUMN_NAME }));
    }

    if (/FROM ventas/.test(sql)) {
      return [{ ventas_confirmadas: sales }];
    }

    if (/FROM mermas/.test(sql)) {
      return [{ perdidas: losses }];
    }

    return [];
  };

  return { calls, queryFn };
}

test('calcula ventas confirmadas, perdidas y balance para una fecha con operaciones', async () => {
  const { queryFn } = createSummaryQuery({ sales: 500, losses: 80 });

  const result = await getOperationalSummary({
    idUsuario: 8,
    fecha: '2026-07-15',
    queryFn,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    fecha: '2026-07-15',
    zona_horaria: 'America/Mexico_City',
    ventas_confirmadas: 500,
    perdidas: 80,
    balance: 420,
    ventas_dia: 500,
    balance_potencial: 420,
    margen_potencial: 0,
    ganancia_potencial: 0,
    valor_danado_vendible: 0,
  });
});

test('devuelve ceros para un dia sin operaciones', async () => {
  const { queryFn } = createSummaryQuery();

  const result = await getOperationalSummary({
    idUsuario: 8,
    fecha: '2026-07-16',
    queryFn,
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.ventas_confirmadas, 0);
  assert.equal(result.body.perdidas, 0);
  assert.equal(result.body.balance, 0);
});

test('rechaza fecha con formato invalido', async () => {
  const { calls, queryFn } = createSummaryQuery();

  const result = await getOperationalSummary({
    idUsuario: 8,
    fecha: '15-07-2026',
    queryFn,
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: 'Fecha invalida. Usa formato YYYY-MM-DD.' });
  assert.equal(calls.length, 0);
});

test('consulta solo ventas confirmadas y aisla por usuario autenticado', async () => {
  const { calls, queryFn } = createSummaryQuery({ sales: 300, losses: 40 });

  await getOperationalSummary({
    idUsuario: 22,
    fecha: '2026-07-15',
    queryFn,
  });

  const salesCall = calls.find((call) => /FROM ventas/.test(call.sql));
  const lossesCall = calls.find((call) => /FROM mermas/.test(call.sql));

  assert.match(salesCall.sql, /v\.estado = 'CONFIRMADA'/);
  assert.deepEqual(salesCall.params, [22, '2026-07-15 06:00:00', '2026-07-16 06:00:00']);
  assert.deepEqual(lossesCall.params, [22, '2026-07-15 06:00:00', '2026-07-16 06:00:00']);
});

test('calcula limites UTC del dia local America/Mexico_City', () => {
  assert.deepEqual(getMexicoCityUtcBounds('2026-07-15'), {
    startUtc: '2026-07-15 06:00:00',
    endUtc: '2026-07-16 06:00:00',
  });
});

test('usa la fecha local actual cuando se omite fecha', async () => {
  const { queryFn } = createSummaryQuery();

  const result = await getOperationalSummary({
    idUsuario: 8,
    queryFn,
    now: new Date('2026-07-16T05:30:00.000Z'),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.fecha, '2026-07-15');
});

test('mantiene compatibilidad con ventas sin columna estado usando creado_en', async () => {
  const { calls, queryFn } = createSummaryQuery({ columns: ['creado_en'] });

  await getOperationalSummary({
    idUsuario: 8,
    fecha: '2026-07-15',
    queryFn,
  });

  const salesCall = calls.find((call) => /FROM ventas/.test(call.sql));
  assert.doesNotMatch(salesCall.sql, /v\.estado = 'CONFIRMADA'/);
  assert.match(salesCall.sql, /v\.creado_en >= \?/);
});
