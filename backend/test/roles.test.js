import test from 'node:test';
import assert from 'node:assert/strict';
import { assignableRoles, getBusinessOwnerId, hasPermission, normalizeRole, PERMISSIONS } from '../src/services/roles.js';

test('normaliza admin legacy como propietario', () => {
  assert.equal(normalizeRole('admin'), 'propietario');
});

test('propietario conserva permisos criticos', () => {
  assert.equal(hasPermission('propietario', PERMISSIONS.USERS_MANAGE), true);
  assert.equal(hasPermission('propietario', PERMISSIONS.SALES_CANCEL), true);
  assert.equal(hasPermission('propietario', PERMISSIONS.REPORTS_VIEW), true);
});

test('encargado puede operar inventario pero no cancelar ventas', () => {
  assert.equal(hasPermission('encargado', PERMISSIONS.PRODUCTS_CREATE), true);
  assert.equal(hasPermission('encargado', PERMISSIONS.STOCK_ADJUST), true);
  assert.equal(hasPermission('encargado', PERMISSIONS.SALES_CANCEL), false);
});

test('vendedor solo tiene permisos de venta y consulta basica', () => {
  assert.equal(hasPermission('vendedor', PERMISSIONS.PRODUCTS_VIEW), true);
  assert.equal(hasPermission('vendedor', PERMISSIONS.SALES_CREATE), true);
  assert.equal(hasPermission('vendedor', PERMISSIONS.STOCK_ADJUST), false);
});

test('el panel solo asigna roles operativos', () => {
  assert.equal(assignableRoles.has('encargado'), true);
  assert.equal(assignableRoles.has('vendedor'), true);
  assert.equal(assignableRoles.has('propietario'), false);
});

test('obtiene propietario del usuario o usa el propio usuario', () => {
  assert.equal(getBusinessOwnerId({ id_usuario: 10, id_propietario: 3 }), 3);
  assert.equal(getBusinessOwnerId({ id_usuario: 10 }), 10);
});
