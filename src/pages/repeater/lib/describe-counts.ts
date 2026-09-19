export interface CountPart {
  count: number;
  /** Singular noun; the "s" is added when the count is not 1. */
  noun: string;
}

/**
 * "3 collections · 12 endpoints", dropping whichever part is zero.
 *
 * The confirmation dialogs all answer the same question — how much is about to be destroyed — so
 * the pluralisation lives in one place. Two copies of this drifted apart the moment the second
 * dialog wanted a different noun, and a count that reads "1 endpoints" undermines the number it is
 * trying to make you read carefully.
 *
 * `emptyLabel` covers the both-zero case: rendering an empty string would leave the dialog looking
 * like it had failed to load rather than telling you there is nothing to lose.
 */
export function describeCounts(parts: CountPart[], emptyLabel: string): string {
  const rendered = parts
    .filter((part) => part.count > 0)
    .map((part) => `${part.count} ${part.noun}${part.count === 1 ? '' : 's'}`);

  return rendered.length > 0 ? rendered.join(' · ') : emptyLabel;
}
