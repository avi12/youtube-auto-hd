export function getValue(value: unknown) {
  try {
    return JSON.parse(value as string);
  } catch {
    return value;
  }
}
