// Helper to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a random salt.
 * @param {number} length The length of the salt.
 * @returns {string} The generated salt as a hex string.
 */
export const generateSalt = (length = 16): string => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
};

/**
 * Hashes a password with a salt using SHA-256.
 * @param {string} password The password to hash.
 * @param {string} salt The salt to use.
 * @returns {Promise<string>} The hashed password as a hex string.
 */
export const hashPassword = async (password: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
};

/**
 * Verifies a password against a stored salt and hash.
 * @param {string} password The password to verify.
 * @param {string} salt The stored salt.
 * @param {string} hash The stored hash.
 * @returns {Promise<boolean>} True if the password is correct, false otherwise.
 */
export const verifyPassword = async (password: string, salt: string, hash: string): Promise<boolean> => {
    const newHash = await hashPassword(password, salt);
    return newHash === hash;
};
