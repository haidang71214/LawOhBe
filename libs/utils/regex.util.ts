/**
 * Escapes special characters for use in regular expressions to prevent Regex Injection & ReDoS attacks.
 * @param str Raw string input
 * @returns Escaped safe string for RegExp
 */
export function escapeRegex(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
