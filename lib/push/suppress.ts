export function shouldSuppressNotification(input: {
  focusedClientPaths: string[];
  url: string;
}): boolean {
  const dest = input.url.split("?")[0];
  if (!dest || dest === "/") return false;
  return input.focusedClientPaths.some((raw) => {
    const path = raw.split("?")[0];
    return path === dest;
  });
}
