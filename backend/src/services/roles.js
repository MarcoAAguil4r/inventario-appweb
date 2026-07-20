export const ROLES = {
  PROPIETARIO: 'propietario',
  ENCARGADO: 'encargado',
  VENDEDOR: 'vendedor',
};

export const LEGACY_ROLE_MAP = {
  admin: ROLES.PROPIETARIO,
};

export const ROLE_LABELS = {
  [ROLES.PROPIETARIO]: 'Propietario',
  [ROLES.ENCARGADO]: 'Encargado',
  [ROLES.VENDEDOR]: 'Vendedor',
};

export const PERMISSIONS = {
  REPORTS_VIEW: 'reports:view',
  USERS_MANAGE: 'users:manage',
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DISABLE: 'products:disable',
  STOCK_ADJUST: 'stock:adjust',
  WASTE_CREATE: 'waste:create',
  WASTE_VIEW: 'waste:view',
  DAMAGED_PRODUCTS_MANAGE: 'damaged-products:manage',
  MOVEMENTS_VIEW: 'movements:view',
  SALES_CREATE: 'sales:create',
  SALES_VIEW_ALL: 'sales:view-all',
  SALES_VIEW_OWN: 'sales:view-own',
  SALES_CANCEL: 'sales:cancel',
};

export const ROLE_PERMISSIONS = {
  [ROLES.PROPIETARIO]: new Set(Object.values(PERMISSIONS)),
  [ROLES.ENCARGADO]: new Set([
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_DISABLE,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.WASTE_CREATE,
    PERMISSIONS.WASTE_VIEW,
    PERMISSIONS.DAMAGED_PRODUCTS_MANAGE,
    PERMISSIONS.MOVEMENTS_VIEW,
  ]),
  [ROLES.VENDEDOR]: new Set([
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_VIEW_OWN,
  ]),
};

export const assignableRoles = new Set([ROLES.ENCARGADO, ROLES.VENDEDOR]);

export function normalizeRole(role) {
  const normalized = String(role ?? '').trim().toLowerCase();
  return LEGACY_ROLE_MAP[normalized] ?? normalized;
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(normalizeRole(role));
}

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[normalizeRole(role)]?.has(permission) ?? false;
}

export function getBusinessOwnerId(user) {
  return Number(user?.id_propietario ?? user?.id_usuario);
}
