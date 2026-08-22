import axiosInstance from "../api/axiosInstance";

/**
 * Get all admissions (Admin)
 */
export const getAdmissions = async (params = {}) => {
  const response = await axiosInstance.get("/admissions", { params });
  return response.data;
};

/**
 * Get counsellor's own admissions
 */
export const getMyAdmissions = async (search = "") => {
  const response = await axiosInstance.get("/admissions/my-admissions", {
    params: { search },
  });
  return response.data;
};

/**
 * Get admission & fee statistics
 */
export const getAdmissionStats = async () => {
  const response = await axiosInstance.get("/admissions/stats");
  return response.data;
};

/**
 * Get single admission with payment ledger
 */
export const getAdmissionDetails = async (id) => {
  const response = await axiosInstance.get(`/admissions/${id}`);
  return response.data;
};

/**
 * Create new admission
 */
export const createAdmission = async (admissionData) => {
  const response = await axiosInstance.post("/admissions", admissionData);
  return response.data;
};

/**
 * Collect / Record fee payment installment
 */
export const addAdmissionPayment = async (admissionId, paymentData) => {
  const response = await axiosInstance.post(
    `/admissions/${admissionId}/payments`,
    paymentData
  );
  return response.data;
};

/**
 * Get WhatsApp fee reminder link & template
 */
export const getWhatsAppReminder = async (admissionId) => {
  const response = await axiosInstance.get(
    `/admissions/${admissionId}/whatsapp-reminder`
  );
  return response.data;
};
