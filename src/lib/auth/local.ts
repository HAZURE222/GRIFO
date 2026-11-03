import { newId } from '../id';
import { readJSON, removeKey, writeJSON } from '../storage';
import { Account, AuthError, AuthGateway } from './types';

type StoredAccount = Account & { salt: string; hash: string };

const ACCOUNTS = 'grifo:accounts';
const SESSION = 'grifo:session';

async function digest(password: string, salt: string): Promise<string> {
  if (!crypto?.subtle) {
    throw new AuthError('unavailable', 'Abra o Grifo em localhost ou HTTPS para usar o login.');
  }
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

const publicAccount = ({ id, email, name }: StoredAccount): Account => ({ id, email, name });
const normalize = (email: string) => email.trim().toLowerCase();

export const localAuth: AuthGateway = {
  async getSession() {
    const id = readJSON<string | null>(SESSION, null);
    const found = readJSON<StoredAccount[]>(ACCOUNTS, []).find((a) => a.id === id);
    return found ? publicAccount(found) : null;
  },

  async signIn(email, password) {
    const found = readJSON<StoredAccount[]>(ACCOUNTS, []).find((a) => a.email === normalize(email));
    if (!found || (await digest(password, found.salt)) !== found.hash) {
      throw new AuthError('invalid-credentials', 'E-mail ou senha não conferem.');
    }
    writeJSON(SESSION, found.id);
    return publicAccount(found);
  },

  async signUp(name, email, password) {
    if (password.length < 8) {
      throw new AuthError('weak-password', 'Use pelo menos 8 caracteres na senha.');
    }
    const accounts = readJSON<StoredAccount[]>(ACCOUNTS, []);
    if (accounts.some((a) => a.email === normalize(email))) {
      throw new AuthError('email-taken', 'Já existe uma conta com esse e-mail.');
    }
    const salt = newId();
    const account: StoredAccount = {
      id: newId(),
      email: normalize(email),
      name: name.trim(),
      salt,
      hash: await digest(password, salt),
    };
    writeJSON(ACCOUNTS, [...accounts, account]);
    writeJSON(SESSION, account.id);
    return publicAccount(account);
  },

  async signOut() {
    removeKey(SESSION);
  },
};
