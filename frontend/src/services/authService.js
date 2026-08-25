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

export const updateUserProfile = async (payload) => {
    const response = await axiosInstance.patch(
        "/auth/profile",
        payload
    );
    return response.data;
};