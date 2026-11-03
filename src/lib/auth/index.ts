import { localAuth } from './local';
import { AuthGateway } from './types';

export const auth: AuthGateway = localAuth;
export * from './types';
