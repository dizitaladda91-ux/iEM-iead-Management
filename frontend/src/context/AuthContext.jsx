import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  getProfile,
} from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const restoreSession = async () => {

      const token = localStorage.getItem("token");

      if (!token) {

        setLoading(false);

        return;

      }

      try {

        const response = await getProfile();
        const profileUser = response?.data || response?.user || null;

        setUser(profileUser);

      }

      catch {

        logout();

      }

      finally {

        setLoading(false);

      }

    };

    restoreSession();

  }, []);

  const login = async (credentials) => {

    const response = await loginUser(credentials);

    if (response?.success) {
      const payload = response.data || {};
      const token = payload.accessToken || payload.token;
      const refreshToken = payload.refreshToken || null;
      const userData = payload.user || null;

      if (token) {
        localStorage.setItem("token", token);
      }

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }
    }

    return response;

  };

 const logout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("refreshToken");

    localStorage.removeItem("user");

    setUser(null);

};
  return (

    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};

export const useAuth = () =>
useContext(AuthContext);