export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  mustResetPassword: boolean;
  user: AuthUser;
  accessToken?: string;
}

export interface ResetPasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ApiSuccessResponse {
  success: boolean;
  message: string;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
}

export interface StoredAuthSession {
  user: AuthUser;
  mustResetPassword: boolean;
  accessToken?: string;
}
