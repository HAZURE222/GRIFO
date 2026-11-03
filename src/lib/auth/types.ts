export type Account = { id: string; email: string; name: string };

export type AuthErrorCode = 'invalid-credentials' | 'email-taken' | 'weak-password' | 'unavailable';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthGateway {
  getSession(): Promise<Account | null>;
  signIn(email: string, password: string): Promise<Account>;
  signUp(name: string, email: string, password: string): Promise<Account>;
  signOut(): Promise<void>;
}
