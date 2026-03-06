const STORAGE_KEY = 'xenom_wallet_v1';

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function storeWallet(mnemonic, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(mnemonic));

  const payload = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    ct: Array.from(new Uint8Array(ciphertext)),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadWallet(password) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  const { salt, iv, ct } = JSON.parse(raw);
  const key = await deriveKey(password, new Uint8Array(salt));

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(ct),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error('Wrong password');
  }
}

export function hasStoredWallet() {
  return !!localStorage.getItem(STORAGE_KEY);
}

export function deleteWallet() {
  localStorage.removeItem(STORAGE_KEY);
}
