export function hojeNoBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia" }).format(
    new Date(),
  );
}

export function paraData(texto: string): Date {
  return new Date(`${texto}T00:00:00.000Z`);
}

export function paraTexto(data: Date): string {
  return data.toISOString().slice(0, 10);
}
