import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  MessageSquare,
  Plus,
  RefreshCw,
  Tag,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getLeads, updateLead } from "../../services/leadService";
import { getFollowups, createFollowup } from "../../services/followupService";
import "./LeadDetailsPage.css";

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [followupType, setFollowupType] = useState("CALL");
  const [priority, setPriority] = useState("MEDIUM");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeadDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // get lead by ID
      const res = await getLeads({ id });
      const list = res.data || res.leads || (Array.isArray(res) ? res : []);
      const found = list.find((l) => String(l.id) === String(id)) || list[0];
      if (found) {
        setLead(found);
      } else {
        setError("Lead record not found");
      }

      // Fetch followups for this lead
      const fuRes = await getFollowups({ lead_id: id });
      const fuList = fuRes.data || fuRes.followups || (Array.isArray(fuRes) ? fuRes : []);
      setFollowups(fuList);
    } catch (err) {
      console.error("Error loading lead details:", err);
      setError("Failed to load lead details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateLead(id, { status: newStatus });
      setLead((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddFollowupSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createFollowup({
        lead_id: id,
        followup_type: followupType,
        priority,
        next_followup_at: nextFollowupDate,
        remarks,
      });
      setIsFollowupModalOpen(false);
      setRemarks("");
      fetchLeadDetails();
    } catch (err) {
      alert("Failed to schedule followup: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lead-details-loading">
        <RefreshCw size={32} className="spin text-blue-600" />
        <p>Loading lead profile...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="lead-details-error">
        <AlertCircle size={48} className="text-red-500 mb-2" />
        <h2>{error || "Lead Not Found"}</h2>
        <button className="btn-primary mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="lead-details-container">
      {/* Top Bar Navigation */}
      <div className="lead-details-topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          <span>Back to Leads</span>
        </button>
        <div className="lead-code-badge">{lead.lead_code || `#${lead.id}`}</div>
      </div>

      {/* Main Grid */}
      <div className="lead-details-grid">
        {/* Left Column: Lead Info Card */}
        <div className="lead-main-card">
          <div className="lead-card-header">
            <div className="avatar-large">
              {lead.full_name?.charAt(0).toUpperCase() || "L"}
            </div>
            <div>
              <h1 className="lead-title">{lead.full_name}</h1>
              <div className="lead-meta">
                <span>{lead.interested_course || "Course N/A"}</span>
                <span>•</span>
                <span>{lead.city || lead.state || "India"}</span>
              </div>
            </div>
          </div>

          <div className="quick-actions-bar">
            {lead.mobile && (
              <a href={`tel:${lead.mobile}`} className="action-pill call">
                <Phone size={15} /> Call
              </a>
            )}
            {lead.mobile && (
              <a
                href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="action-pill whatsapp"
              >
                <MessageSquare size={15} /> WhatsApp
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="action-pill email">
                <Mail size={15} /> Email
              </a>
            )}
          </div>

          <div className="details-section">
            <h3 className="section-title">Contact & Basic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label"><Phone size={14} /> Phone</span>
                <span className="info-value">{lead.mobile || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Mail size={14} /> Email</span>
                <span className="info-value">{lead.email || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><MapPin size={14} /> City / State</span>
                <span className="info-value">{[lead.city, lead.state].filter(Boolean).join(", ") || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><BookOpen size={14} /> Course Interested</span>
                <span className="info-value font-semibold text-blue-600">{lead.interested_course || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Tag size={14} /> Lead Source</span>
                <span className="info-value">{lead.source || "Direct"}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Calendar size={14} /> Created Date</span>
                <span className="info-value">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Lead Status Manager */}
          <div className="details-section">
            <h3 className="section-title">Manage Lead Status</h3>
            <div className="status-selector-grid">
              {["NEW", "CONTACTED", "FOLLOW_UP", "QUALIFIED", "ADMISSION_DONE", "LOST"].map((st) => (
                <button
                  key={st}
                  className={`status-btn ${lead.status === st ? "active" : ""}`}
                  onClick={() => handleStatusChange(st)}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Followup History */}
        <div className="lead-side-card">
          <div className="side-card-header">
            <h3>Follow-up History</h3>
            <button className="btn-primary btn-sm" onClick={() => setIsFollowupModalOpen(true)}>
              <Plus size={16} /> Schedule
            </button>
          </div>

          <div className="timeline-container">
            {followups.length === 0 ? (
              <div className="timeline-empty">
                <Clock size={32} className="text-gray-300 mb-2" />
                <p>No follow-ups logged yet.</p>
                <button className="btn-secondary btn-sm mt-2" onClick={() => setIsFollowupModalOpen(true)}>
                  Log First Follow-up
                </button>
              </div>
            ) : (
              <div className="timeline-list">
                {followups.map((fu) => (
                  <div key={fu.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="fu-type font-semibold">{fu.followup_type}</span>
                        <span className={`status-badge ${fu.status?.toLowerCase()}`}>
                          {fu.status}
                        </span>
                      </div>
                      <p className="timeline-remarks">"{fu.remarks || "No remarks"}"</p>
                      <div className="timeline-date">
                        <Calendar size={12} />
                        {fu.next_followup_at
                          ? new Date(fu.next_followup_at).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : new Date(fu.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for adding followup */}
      {isFollowupModalOpen && (
        <div className="modal-backdrop">
          <div className="lead-modal">
            <div className="modal-header">
              <h2>Schedule Follow-up</h2>
              <button className="close-btn" onClick={() => setIsFollowupModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddFollowupSubmit}>
              <div className="form-field mb-3">
                <label>Follow-up Type</label>
                <select value={followupType} onChange={(e) => setFollowupType(e.target.value)}>
                  <option value="CALL">Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Meeting</option>
                </select>
              </div>

              <div className="form-field mb-3">
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="form-field mb-3">
                <label>Next Follow-up Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                />
              </div>

              <div className="form-field mb-4">
                <label>Remarks / Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Notes about discussion or agenda for follow up..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsFollowupModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Followup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;