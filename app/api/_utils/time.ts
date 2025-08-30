export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd
}

export function durationHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return eh + em / 60 - (sh + sm / 60)
}
