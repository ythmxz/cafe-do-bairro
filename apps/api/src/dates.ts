// "en-CA" == AAAA-MM-DD.
// "America/Bahia" == UTC-3.
export function todayInBrazil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia" }).format(
    new Date(),
  );
}

export function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toBrazilianDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
