import { RegistryData } from '../types';

export async function loadRegistryData(): Promise<RegistryData> {
  const response = await fetch(`${import.meta.env.BASE_URL}registry-data.json`);
  if (!response.ok) {
    throw new Error('Failed to load registry data');
  }
  return response.json();
}

