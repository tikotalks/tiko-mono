// Basic tokenizer that splits on whitespace and separates punctuation
export function tokenize(input: string): string[] {
  if (!input) return []
  // Normalize spaces and ensure punctuation is tokenized separately
  const separated = input
    .replace(/([.,!?;:\(\)\[\]\{\]"'…—-])/g, ' $1 ')
    .replace(/\s+/g, ' ') // collapse spaces
    .trim()
  return separated ? separated.split(' ') : []
}
