import "./LeadsTable.css";
import {
  Phone,
  MessageCircle,
  Eye,
  CalendarPlus,
  Copy,
} from "lucide-react";
import { useState } from "react";
import LeadDetailsDrawer from "../../../common/LeadDetailsDrawer/LeadDetailsDrawer";
import {
  getPriorityBadgeClass,
  getStatusBadgeClass,
} from "../../../../utils/priorityEngine";

const LeadsTable = ({
  leads = [],
  loading = false,
  onRefresh = () => {},
}) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  const handleOpenLead = (lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="leads-table-card">
        <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
          Loading Leads...
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="leads-table-card">
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          <p className="font-semibold text-slate-700 text-base">No Leads Assigned</p>
          <p className="text-sm text-slate-500 mt-1">
            New leads assigned to you will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="leads-table-card">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Mobile</th>
              <th>Course</th>
              <th>Source</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Next Follow-up</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div
                    className="lead-info"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleOpenLead(lead)}
                  >
                    <div className="lead-avatar">
                      {lead.full_name
                        ?.split(" ")
                        .map((word) => word[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || "L"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <h5>{lead.full_name}</h5>
                        {(lead.is_duplicate || (lead.received_count && Number(lead.received_count) > 1)) && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              background: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fcd34d",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                            title={`Duplicate Lead (${lead.received_count || 2} submissions)`}
                          >
                            <Copy size={10} /> DUPLICATE {lead.received_count > 1 ? `(${lead.received_count}x)` : ""}
                          </span>
                        )}
                      </div>
                      <span>{lead.email || "-"}</span>
                    </div>
                  </div>
                </td>

                <td>{lead.mobile}</td>
                <td>{lead.interested_course || lead.campaign_name || "-"}</td>
                <td>{lead.source || "-"}</td>

                <td>
                  <span className={getStatusBadgeClass(lead.status)}>
                    {lead.status || "NEW"}
                  </span>
                </td>

                <td>
                  <span className={getPriorityBadgeClass(lead.priority)}>
                    {lead.priority || "LOW"}
                  </span>
                </td>

                <td>
                  {lead.next_followup
                    ? new Date(lead.next_followup).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                <td>
                  <div className="action-buttons">
                    {isMobile && (
                      <a
                        href={`tel:${lead.mobile}`}
                        className="action-btn call-btn"
                        title={`Call ${lead.full_name}`}
                      >
                        <Phone size={16} />
                      </a>
                    )}

                    <a
                      href={`https://wa.me/91${lead.mobile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn whatsapp-btn"
                      title={`WhatsApp ${lead.full_name}`}
                    >
                      <MessageCircle size={16} />
                    </a>

                    <button
                      title="Open Guided Counselling Drawer"
                      className="action-btn view-btn"
                      onClick={() => handleOpenLead(lead)}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      title="Follow-up & Notes"
                      className="action-btn followup-btn"
                      onClick={() => handleOpenLead(lead)}
                    >
                      <CalendarPlus size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unified Master Lead Details Drawer */}
      <LeadDetailsDrawer
        open={isDrawerOpen}
        lead={selectedLead}
        leadId={selectedLead?.id}
        mode="edit"
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLead(null);
        }}
        onUpdated={onRefresh}
        onStatusUpdated={onRefresh}
      />
    </>
  );
};

export default LeadsTable;