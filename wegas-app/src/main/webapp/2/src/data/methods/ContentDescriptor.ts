// Define Map type
export class TMap<T> {
  [key: string]: T | undefined;
}

// Insert element
export const mapAdd: <T>(map: TMap<T>, key: string, value: T) => TMap<T> = (
  map,
  key,
  value,
) => {
  const newMap = { ...map };
  newMap[key] = value;
  return newMap;
};

// Remove element
export const mapRemove: <T>(map: TMap<T>, key: string) => TMap<T> = (
  map,
  key,
) => {
  const newMap: typeof map = {};
  Object.keys(map)
    .filter(k => k !== key)
    .map(k => {
      newMap[k] = map[k];
    });
  return newMap;
};
