// Email regex requiring a domain with at least one dot (e.g. user@domain.com)
// Rejects incomplete addresses like "user@gmail" or "user@domain"
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}
