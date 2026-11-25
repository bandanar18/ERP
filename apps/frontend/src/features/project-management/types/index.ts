export interface PmUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  scopes: {
    companyIds: string[];
    projectIds: string[];
  };
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: PmUser;
  redirectUrl?: string;
}

export interface RedirectResponse {
  redirectUrl: string;
}

export interface LoginDto {
  /** Correo electrónico O nombre de usuario. */
  login: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}
