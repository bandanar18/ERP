const API_URL = "/api/auth";

export const authService = {
  async login(credentials: { email: string; password: any }) {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) throw { error: data.error || data.message || "Error al iniciar sesión", code: data.code };
    return data;
  },

  async register(userData: any) {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) throw { error: data.error || data.message || "Error al registrarse", code: data.code };
    return data;
  },

  async me(token: string) {
    const response = await fetch(`${API_URL}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data.user;
  },

  async sendOtp(email: string) {
    const response = await fetch(`${API_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  async verifyOtp(email: string, code: string): Promise<{ verified: boolean; error?: string }> {
    const response = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { verified: false, error: data.error || "Error al verificar el código" };
    }
    return { verified: true };
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_URL}/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Error al solicitar el reset" };
    }
    return { success: true };
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Error al resetear la contraseña" };
    }
    return { success: true };
  },

  async refreshToken(refreshToken: string) {
    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    if (!response.ok) throw { error: data.error || "Error al refrescar token", code: data.code };
    return data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  },

  saveTokens(tokens: { accessToken: string; refreshToken: string }) {
    localStorage.setItem("token", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  },

  saveUser(user: any) {
    localStorage.setItem("user", JSON.stringify(user));
  },

  getUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};
