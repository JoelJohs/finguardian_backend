export function calculateRequiredSaving(
  remaining: number,
  daysLeft: number,
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
): number {
  let periods = 0;
  switch (frequency) {
    case "daily":
      periods = daysLeft;
      break;
    case "weekly":
      periods = Math.ceil(daysLeft / 7);
      break;
    case "biweekly":
      periods = Math.ceil(daysLeft / 14);
      break;
    case "monthly":
      periods = Math.ceil(daysLeft / 30);
      break;
  }
  return Math.ceil(remaining / periods);
}
