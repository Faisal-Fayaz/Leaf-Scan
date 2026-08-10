export function humanizeLabel(label: string): string {
  const [, condition] = label.split("___");
  const cleanCondition = (condition ?? label)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!condition) return cleanCondition.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return cleanCondition.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function cropFromLabel(label: string): string | undefined {
  const crop = label.split("___")[0];
  return crop
    ? crop.replace(/_/g, " ").replace(/\(including sour\)/i, "").trim()
    : undefined;
}
