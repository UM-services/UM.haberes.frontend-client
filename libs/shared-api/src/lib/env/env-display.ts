export type EnvDisplayKey = 'local' | 'develop' | 'staging' | 'production' | 'unknown';

export interface EnvDisplay {
  key: EnvDisplayKey;
  label: string;
  badgeClass: string;
}

const ENV_NAME_KEYS: Record<string, EnvDisplayKey> = {
  local: 'local',
  localhost: 'local',
  develop: 'develop',
  dev: 'develop',
  desarrollo: 'develop',
  staging: 'staging',
  stage: 'staging',
  preprod: 'staging',
  preproduccion: 'staging',
  production: 'production',
  prod: 'production',
  produccion: 'production'
};

export const ENV_DISPLAYS: Record<EnvDisplayKey, EnvDisplay> = {
  local: { key: 'local', label: 'LOCAL', badgeClass: 'bg-gray-100 text-gray-700 ring-gray-400' },
  develop: { key: 'develop', label: 'DESARROLLO', badgeClass: 'bg-amber-50 text-amber-700 ring-amber-400' },
  staging: { key: 'staging', label: 'STAGING', badgeClass: 'bg-purple-50 text-purple-700 ring-purple-400' },
  production: { key: 'production', label: 'PRODUCCIÓN', badgeClass: 'bg-green-50 text-green-700 ring-green-400' },
  unknown: { key: 'unknown', label: 'SIN DEFINIR', badgeClass: 'bg-red-50 text-red-700 ring-red-400' }
};

export function getEnvDisplay(name: string | null | undefined): EnvDisplay {
  const normalized = (name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s-]+/g, '');
  const key = ENV_NAME_KEYS[normalized] ?? 'unknown';
  return ENV_DISPLAYS[key];
}
