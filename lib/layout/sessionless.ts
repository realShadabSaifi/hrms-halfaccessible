export function isSessionlessPath(path: string): boolean {
  return (
    path === "/sw.js" ||
    path === "/manifest.webmanifest" ||
    path.startsWith("/pwa/")
  );
}
