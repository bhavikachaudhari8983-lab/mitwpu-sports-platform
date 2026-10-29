/** Demo mode shows OTPs on screen and exposes demo helper data. Never enable in production. */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
