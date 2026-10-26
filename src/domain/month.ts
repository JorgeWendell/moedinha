const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentMonth(date = new Date()) {
  return localISODate(date).slice(0, 7);
}

export function shiftMonth(month: string, delta: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const next = new Date(year, monthIndex - 1 + delta, 1);
  return currentMonth(next);
}

export function formatMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return `${MONTHS[monthIndex - 1]} ${year}`;
}

export function monthRange(month: string) {
  const start = `${month}-01`;
  const [year, monthIndex] = month.split("-").map(Number);
  const next = new Date(year, monthIndex, 1);
  const end = localISODate(next);
  return { start, end };
}

export function formatDayLabel(iso: string, today = localISODate()) {
  if (iso === today) return "Hoje";
  const [year, month, day] = today.split("-").map(Number);
  const yesterday = localISODate(new Date(year, month - 1, day - 1));
  if (iso === yesterday) return "Ontem";
  const [, monthIndex, dayNumber] = iso.split("-").map(Number);
  return `${dayNumber} de ${MONTHS[monthIndex - 1]}`;
}

export function formatLongDate(iso: string) {
  const [year, monthIndex, day] = iso.split("-").map(Number);
  return `${day} de ${MONTHS[monthIndex - 1]} de ${year}`;
}
