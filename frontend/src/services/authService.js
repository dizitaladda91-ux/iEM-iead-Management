import axiosInstance from "../api/axiosInstance";

export const loginUser = async (credentials) => {

  const response = await axiosInstance.post(

    "/auth/login",

    credentials

  );

  return response.data;

};

export const getProfile = async () => {

  const response = await axiosInstance.get(

    "/auth/me"

  );

  return response.data;

};

export const refreshAccessToken = async (refreshToken) => {
  const response = await axiosInstance.post(
    "/auth/refresh-token",
    { refreshToken }
  );

  return response.data;
};

export const changePassword = async (payload) => {
    const response = await axiosInstance.put(
        "/auth/change-password",
        payload
    );
    return response.data;
};

export const directResetPassword = async (payload) => {
    const response = await axiosInstance.post(
        "/auth/direct-reset-password",
        payload
    );
    return response.data;
};

export const updateUserProfile = async (payload) => {
    try {
        const response = await axiosInstance.patch(
            "/auth/profile",
            payload
        );
        return response.data;
    } catch (err) {
        if (err.response?.status === 404) {
            try {
                const altResponse = await axiosInstance.patch(
                    "/employee/profile",
                    payload
                );
                return altResponse.data;
            } catch (altErr) {
                const putResponse = await axiosInstance.put(
                    "/auth/profile",
                    payload
                );
                return putResponse.data;
            }
        }
        throw err;
    }
};