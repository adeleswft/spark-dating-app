/**
 * Sanitize user objects before sending to clients.
 * Strips passwordHash and other sensitive fields.
 */

/**
 * Remove sensitive fields from a single user object.
 */
export function sanitizeUser(user: any): any {
  if (!user) return null;
  const { passwordHash, password_hash, ...safe } = user;
  return safe;
}

/**
 * Remove sensitive fields from an array of user objects.
 */
export function sanitizeUsers(users: any[]): any[] {
  return users.map(sanitizeUser).filter(Boolean);
}
