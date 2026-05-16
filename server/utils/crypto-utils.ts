import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';



const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

// Estraiamo la chiave e validiamola subito
const rawKey = process.env.ENCRYPTION_KEY;

// Controllo di sicurezza all'avvio del modulo
if (!rawKey || rawKey.length !== 32) {
  throw new Error('CONFIG_ERROR: La variabile ENCRYPTION_KEY deve essere presente nel file .env e lunga 32 caratteri.');
}

// Ora definiamo una costante "sicura" che TypeScript tratterà come stringa non nulla
const VALID_KEY = rawKey;

export const encrypt = (text: string): string => {
  const iv = randomBytes(IV_LENGTH);
  // Usiamo VALID_KEY che ora è garantita essere string
  const cipher = createCipheriv(ALGORITHM, Buffer.from(VALID_KEY), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (hash: string): string => {
  // 1. Controllo di base: se non è una stringa o è vuota, restituisci l'input
  if (!hash || typeof hash !== 'string') return hash;

  // 2. Controllo del formato: deve avere esattamente due separatori ":" (iv:tag:text)
  const parts = hash.split(':');
  if (parts.length !== 3) {
    // Se il formato non è corretto, assumiamo che il dato sia in chiaro
    return hash;
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  
  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error('FORMAT_ERROR: Il dato cifrato non è nel formato corretto (iv:tag:text)');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(VALID_KEY), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Maschera un'email: mario.rossi@gmail.com -> m***i@gmail.com
 */
export const maskEmail = (email: string | undefined | null): string => {
  // 1. Gestione input nullo o vuoto
  if (!email || !email.includes('@')) {
    return '****@****';
  }

  const parts = email.split('@');
  const localPart = parts[0] || '';
  const domain = parts[1] || '';

  // 2. Se la parte locale è cortissima (es. a@gmail.com)
  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}***@${domain}`;
  }

  // 3. Mascheramento standard
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  
  return `${firstChar}***${lastChar}@${domain}`;
};

/**
 * Maschera un cognome: Rossi -> R****
 */
export const maskSurname = (surname: string | undefined | null): string => {
  if (!surname) return '****';
  
  const trimmed = surname.trim();
  if (trimmed.length === 0) return '****';
  
  // Mostra solo la prima lettera
  return `${trimmed[0]}****`;
};

/**
 * Funzione "All-in-One" per gestire la privacy in uscita.
 * Decripta il dato e decide se mascherarlo o lasciarlo in chiaro in base al ruolo.
 */
export const getSecureValue = (
  encryptedValue: string | undefined | null, 
  role: 'ADMIN' | 'MANAGER', 
  fieldType: 'email' | 'surname'
): string => {
  // 1. Gestione caso dato mancante
  if (!encryptedValue) return 'N/D';

  try {
    // 2. Decriptazione (usando la funzione decrypt che abbiamo scritto prima)
    const clearValue = decrypt(encryptedValue);

    // 3. Logica di mascheramento basata sul ruolo e sul tipo di campo
    if (role === 'ADMIN') {
      // L'Admin vede tutto mascherato
      return fieldType === 'email' ? maskEmail(clearValue) : maskSurname(clearValue);
    }

    if (role === 'MANAGER') {
      // Il Manager vede l'email mascherata, ma il cognome in chiaro (per operatività)
      return fieldType === 'email' ? maskEmail(clearValue) : clearValue;
    }

    return '****'; // Fallback di sicurezza
  } catch (error) {
    console.error(`Errore durante la decriptazione del campo ${fieldType}:`, error);
    return 'ERRORE_DATI';
  }
};

export const hashInternalPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
};