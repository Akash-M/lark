import type { City } from './types';
import munich from '@/data/munich.json';

/** Cities are imported (bundled) so the game works as a static export with no
 *  runtime fetch and no base-path juggling. Add new cities here. */
const CITIES: Record<string, unknown> = { munich };

export const CITY_LIST = [{ id: 'munich', label: 'Munich · Altstadt' }];

export async function loadCity(id: string): Promise<City> {
  const c = CITIES[id];
  if (!c) throw new Error(`Unknown city "${id}"`);
  return c as unknown as City;
}
