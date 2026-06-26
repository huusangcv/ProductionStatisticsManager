// Utils folder: pure helper functions only.
export function joinPath() {
  return Array.from(arguments).filter(Boolean).join("/");
}
