import axiosInstance from "../api/axiosInstance";

// ===============================
// Get All Leads
// ===============================

export const getLeads = async (params = {}) => {

  const response = await axiosInstance.get("/leads", {
    params,
  });

  return response.data;

};

// ===============================
// Get Lead By Id
// ===============================

export const getLeadById = async (id) => {

  const response = await axiosInstance.get(`/leads/${id}`);

  return response.data;

};

// ===============================
// Get Lead Statistics
// ===============================

export const getLeadStats = async () => {

  const response = await axiosInstance.get(
    "/leads/statistics"
  );

  return response.data;

};

// ===============================
// Delete Lead
// ===============================

export const deleteLead = async (id) => {

  const response = await axiosInstance.delete(
    `/leads/${id}`
  );

  return response.data;

};

// ===============================
// Restore Lead
// ===============================

export const restoreLead = async (id) => {

  const response = await axiosInstance.patch(
    `/leads/${id}/restore`
  );

  return response.data;

};

// ===============================
// Update Full Lead
// ===============================
export const updateLead = async (id, data) => {
  const response = await axiosInstance.put(`/leads/${id}`, data);
  return response.data;
};

// ===============================
// Update Lead Status
// ===============================
export const updateLeadStatus = async (leadId, data) => {
  const response = await axiosInstance.patch(
    `/leads/${leadId}/status`,
    data
  );

  return response.data;
};

// ===============================
// Get Lead Timeline
// ===============================
export const getLeadTimeline = async (id) => {
  const response = await axiosInstance.get(`/leads/${id}/timeline`);
  return response.data;
};

// ===============================
// Get Lead Notes
// ===============================
export const getLeadNotes = async (id) => {
  const response = await axiosInstance.get(`/leads/${id}/notes`);
  return response.data;
};

// ===============================
// Add Lead Note
// ===============================
export const addLeadNote = async (id, data) => {
  const response = await axiosInstance.post(`/leads/${id}/notes`, data);
  return response.data;
};