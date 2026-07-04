export function isValidPasscode(passcode) {
  const expected = process.env.ADMIN_PASSCODE || 'poruwa2026';
  return typeof passcode === 'string' && passcode.length > 0 && passcode === expected;
}