export function prefix(url: string): string {
  let contextPath = "/Wegas";

  if ("config" in window) {
    const config = (window as unknown as { config: { contextPath: string } })
      .config;
    contextPath = config.contextPath;
  }

  return `${contextPath}${url}`;
}

export default async function jsonFetch(
  url: string,
  options: RequestInit = {}
) {
  const response = await fetch(prefix(url), {
    ...options,
    credentials: "same-origin",
  });

  if (response.ok) {
    return response.json();
  } else {
    throw Promise.reject(response.statusText);
  }
}
