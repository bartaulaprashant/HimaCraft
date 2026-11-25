const multipliers: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function durationToMilliseconds(value: string): number {
  const match = value.trim().match(/^([1-9]\d*)(s|m|h|d)$/);

  if (!match) {
    throw new Error(`Invalid token duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  return amount * multipliers[unit];
}