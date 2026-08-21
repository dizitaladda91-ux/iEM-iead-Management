/**
 * Automated Lead Priority Engine
 * 
 * Rules:
 * - HIGH Priority: Walked In / WALK_IN_SCHEDULED / QUALIFIED / INTERESTED
 * - MEDIUM Priority: FOLLOW_UP / FOLLOW_UP_REQUIRED
 * - LOW Priority: CONTACTED / NOT_CONTACTED / NEW / PENDING / LOST / REJECTED / ENROLLED / ADMISSION_DONE
 */

export const calculateLeadPriority = (status) => {
  if (!status) return "LOW";

  const normalized = String(status).trim().toUpperCase().replace(/\s+/g, "_");

  const highStatuses = [
    "WALKED_IN",
    "WALK_IN_SCHEDULED",
    "QUALIFIED",
    "INTERESTED",
    "WALKIN",
  ];

  const mediumStatuses = [
    "FOLLOW_UP",
    "FOLLOW_UP_REQUIRED",
    "FOLLOWUP",
  ];

  if (highStatuses.includes(normalized)) {
    return "HIGH";
  }

  if (mediumStatuses.includes(normalized)) {
    return "MEDIUM";
  }

  return "LOW";
};

export const getPriorityBadgeClass = (priority) => {
  const p = String(priority || "LOW").toUpperCase();
  switch (p) {
    case "HIGH":
      return "priority-badge-high";
    case "MEDIUM":
      return "priority-badge-medium";
    case "LOW":
    default:
      return "priority-badge-low";
  }
};

export const getStatusBadgeClass = (status) => {
  const s = String(status || "NEW").toUpperCase().replace(/\s+/g, "_");
  switch (s) {
    case "NEW":
    case "PENDING":
      return "status-badge-new";
    case "CONTACTED":
    case "NOT_CONTACTED":
      return "status-badge-contacted";
    case "FOLLOW_UP":
    case "FOLLOW_UP_REQUIRED":
      return "status-badge-followup";
    case "QUALIFIED":
    case "INTERESTED":
    case "WALKED_IN":
    case "WALK_IN_SCHEDULED":
      return "status-badge-interested";
    case "ENROLLED":
    case "ADMISSION_DONE":
    case "COMPLETED":
      return "status-badge-enrolled";
    case "REJECTED":
    case "LOST":
      return "status-badge-lost";
    default:
      return "status-badge-default";
  }
};
