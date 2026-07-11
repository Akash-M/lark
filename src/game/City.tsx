'use client';
import { useMemo } from 'react';
import type { City } from '@/lib/types';
import { buildCity } from './cityMesh';

export function CityView({ city }: { city: City }) {
  const group = useMemo(() => buildCity(city), [city]);
  return <primitive object={group} />;
}
