const timers: { [label: string]: NodeJS.Timeout } = {};
export function debounceAction(
  label: string,
  action: () => void,
  timeout: number = 100,
) {
  if (timers[label] !== undefined) {
    clearTimeout(timers[label]);
  }
  timers[label] = setTimeout(action, timeout);
}
