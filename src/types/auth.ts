export const Role = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  EXECUTIVE: 'EXECUTIVE',
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
