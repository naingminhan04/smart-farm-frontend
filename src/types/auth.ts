export type OAuthProvider = "google" | "github";

export type AdminUser = {
  id: number;
  username: string;
};

export type AdminSessionResponse = {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
};

export type AdminProfileResponse = {
  admin: {
    id: number;
    username: string;
    createdAt: string;
  } | null;
};

export type AdminRefreshResponse = AdminSessionResponse & {
  accessTokenExpiresInSeconds: number;
};
