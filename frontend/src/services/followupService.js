import axiosInstance from "../api/axiosInstance";

/**
 * Get followups list with filtering and pagination
 */
export const getFollowups = async (params = {}) => {
  const response = await axiosInstance.get("/followups", { params });
  return response.data;
};

/**
 * Get followup statistics
 */
export const getFollowupStatistics = async () => {
  const response = await axiosInstance.get("/followups/statistics");
  return response.data;
};

/**
 * Get followup by ID
 */
export const getFollowupById = async (id) => {
  const response = await axiosInstance.get(`/followups/${id}`);
  return response.data;
};

/**
 * Create new followup
 */
export const createFollowup = async (data) => {
  const response = await axiosInstance.post("/followups", data);
  return response.data;
};

/**
 * Update followup
 */
export const updateFollowup = async (id, data) => {
  const response = await axiosInstance.put(`/followups/${id}`, data);
  return response.data;
};

/**
 * Mark followup as completed
 */
export const completeFollowup = async (id, data = {}) => {
  const response = await axiosInstance.patch(`/followups/${id}/complete`, data);
  return response.data;
};

/**
 * Reschedule followup
 */
export const rescheduleFollowup = async (id, data) => {
  const response = await axiosInstance.patch(`/followups/${id}/reschedule`, data);
  return response.data;
};

/**
 * Delete followup
 */
export const deleteFollowup = async (id) => {
  const response = await axiosInstance.delete(`/followups/${id}`);
  return response.data;
};

/**
 * Get lead timeline
 */
export const getLeadTimeline = async (leadId) => {
  const response = await axiosInstance.get(`/followups/timeline/${leadId}`);
  return response.data;
};
