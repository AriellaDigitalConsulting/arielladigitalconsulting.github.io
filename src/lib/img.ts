import images from '../data/images.json';

const map = images as Record<string, { file: string; w: number; h: number }>;

/** Local path of an image migrated from Wix, looked up by its original media id. */
export function img(id: string): string {
  const hit = map[id];
  if (!hit) throw new Error(`Unknown image id: ${id}`);
  return hit.file;
}
