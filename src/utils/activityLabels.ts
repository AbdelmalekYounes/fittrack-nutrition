import type { TypeActivite } from '../types';

export const ACTIVITY_LABELS: Record<TypeActivite, string> = {
  musculation: 'Musculation',
  course: 'Course',
  velo: 'Vélo',
  marche: 'Marche',
  natation: 'Natation',
  football: 'Football',
  boxe: 'Boxe',
  hiit: 'HIIT',
  padel: 'Padel',
  eva_esport: 'EVA - Esport Virtual Arena',
  autre: 'Autre',
};

export const ACTIVITY_COLORS: Record<TypeActivite, string> = {
  musculation: '#2563eb',
  course: '#16a34a',
  velo: '#f59e0b',
  marche: '#0ea5e9',
  natation: '#06b6d4',
  football: '#65a30d',
  boxe: '#dc2626',
  hiit: '#db2777',
  padel: '#9333ea',
  eva_esport: '#0891b2',
  autre: '#6b7280',
};
