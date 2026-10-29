/** Simulates network latency so loading states are visible in the demo. */
export function simulateLatency(min = 250, max = 700): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  const ms = min + Math.random() * (max - min);
  return new Promise((r) => setTimeout(r, ms));
}
