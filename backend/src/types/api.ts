export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  status: 'active' | 'disabled';
  emailVerifiedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AuthUserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: Date | null;
  status: 'active' | 'disabled';
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  display_name: string | null;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};
