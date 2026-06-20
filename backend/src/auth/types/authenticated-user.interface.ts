export interface AuthenticatedUser {
  sub: string; // user id
  email: string;
  fullName: string;
  roleKey: string;
  permissions: string[];
}
