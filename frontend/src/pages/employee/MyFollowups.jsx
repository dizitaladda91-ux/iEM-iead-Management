import { useState, useEffect, useCallback } from "react";
import {
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plus,
  X,
  MessageSquare,
  Mail,
  UserCheck,
  AlertCircle,
  CalendarClock
} from "lucide-react";
import {
  getFollowups,
  completeFollowup,
  rescheduleFollowup,
  getFollowupStatistics,
} from "../../services/followupService";
import { useNavigate } from "react-router-dom";
import "./MyFollowups.css";

const MyFollowups = () => {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING"); // PENDING, TODAY, COMPLETED, ALL
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    dueToday: 0,
    completed: 0,
    pending: 0,
  });

  // Modal States
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);

  const [outcome, setOutcome] = useState("INTERESTED");
  const [remarks, setRemarks] = useState("");
  const [newNextDate, setNewNextDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === "PENDING") params.status = "PENDING";
      if (activeTab === "COMPLETED") params.status = "COMPLETED";
      if (activeTab === "TODAY") params.date = new Date().toISOString().split("T")[0];
      if (priorityFilter) params.priority = priorityFilter;
      if (typeFilter) params.followup_type = typeFilter;
      if (search) params.search = search;

      const res = await getFollowups(params);
      const list = res.data || res.followups || (Array.isArray(res) ? res : []);
      setFollowups(list);
    } catch (err) {
      console.error("Error fetching followups:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, priorityFilter, typeFilter, search]);

  const fetchStats = async () => {
    try {
      const res = await getFollowupStatistics();
      if (res.data) {
        setStats({
          total: res.data.total_followups || res.data.total || 0,
          dueToday: res.data.today_followups || res.data.dueToday || 0,
          completed: res.data.completed_followups || res.data.completed || 0,
          pending: res.data.pending_followups || res.data.pending || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching followup stats:", err);
    }
  };

  useEffect(() => {
    fetchFollowups();
    fetchStats();
  }, [fetchFollowups]);

  const handleOpenCompleteModal = (fu) => {
    setSelectedFollowup(fu);
    setOutcome("INTERESTED");
    setRemarks("");
    setCompleteModalOpen(true);
  };

  const handleOpenRescheduleModal = (fu) => {
    setSelectedFollowup(fu);
    setNewNextDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16)); // tomorrow
    setRemarks("");
    setRescheduleModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    setActionLoading(true);
    try {
      await completeFollowup(selectedFollowup.id, { outcome, remarks });
      setCompleteModalOpen(false);
      fetchFollowups();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark followup complete");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    setActionLoading(true);
    try {
      await rescheduleFollowup(selectedFollowup.id, {
        next_followup_at: newNextDate,
        remarks,
      });
      setRescheduleModalOpen(false);
      fetchFollowups();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reschedule followup");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="my-followups-container">
      {/* Header */}
      <div className="followups-header">
        <div>
          <h1 className="header-title">My Follow-ups</h1>
          <p className="header-subtitle">Track and manage your lead calls, meetings, and interactions</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="followups-stats-grid">
        <div className="fu-stat-card">
          <div className="stat-icon yellow">
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-lbl">Pending Follow-ups</div>
            <div className="stat-val">{stats.pending || followups.filter(f => f.status === "PENDING").length}</div>
          </div>
        </div>

        <div className="fu-stat-card">
          <div className="stat-icon red">
            <CalendarClock size={22} />
          </div>
          <div>
            <div className="stat-lbl">Due Today</div>
            <div className="stat-val">{stats.dueToday || 0}</div>
          </div>
        </div>

        <div className="fu-stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-lbl">Completed</div>
            <div className="stat-val">{stats.completed || 0}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Toolbar */}
      <div className="followups-toolbar-card">
        <div className="tab-filters">
          <button
            className={`tab-btn ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("PENDING")}
          >
            Pending
          </button>
          <button
            className={`tab-btn ${activeTab === "TODAY" ? "active" : ""}`}
            onClick={() => setActiveTab("TODAY")}
          >
            Due Today
          </button>
          <button
            className={`tab-btn ${activeTab === "COMPLETED" ? "active" : ""}`}
            onClick={() => setActiveTab("COMPLETED")}
          >
            Completed
          </button>
          <button
            className={`tab-btn ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            All Logs
          </button>
        </div>

        <div className="toolbar-controls">
          <div className="search-box font-sans">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search lead or remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="CALL">Call</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
          </select>

          <button className="refresh-btn" onClick={fetchFollowups} title="Refresh">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Followups List / Table */}
      <div className="followups-content">
        {loading ? (
          <div className="fu-loading-state">
            <RefreshCw size={28} className="spin text-blue-600" />
            <p>Fetching scheduled follow-ups...</p>
          </div>
        ) : followups.length === 0 ? (
          <div className="fu-empty-state">
            <CheckCircle2 size={48} className="empty-icon text-green-500" />
            <h3>No Follow-ups Found</h3>
            <p>You have no pending follow-up schedules in this view.</p>
          </div>
        ) : (
          <div className="fu-cards-grid">
            {followups.map((fu) => (
              <div key={fu.id} className={`fu-card priority-${fu.priority?.toLowerCase()}`}>
                <div className="fu-card-header">
                  <div className="fu-type-badge">
                    {fu.followup_type === "CALL" && <PhoneCall size={14} />}
                    {fu.followup_type === "WHATSAPP" && <MessageSquare size={14} />}
                    {fu.followup_type === "EMAIL" && <Mail size={14} />}
                    <span>{fu.followup_type || "CALL"}</span>
                  </div>
                  <span className={`priority-tag ${fu.priority?.toLowerCase()}`}>
                    {fu.priority || "MEDIUM"}
                  </span>
                </div>

                <div className="fu-lead-info">
                  <h4 className="lead-name" onClick={() => navigate(`/employee/leads/${fu.lead_id}`)}>
                    {fu.lead_name || fu.Lead?.full_name || `Lead #${fu.lead_id}`}
                  </h4>
                  <div className="lead-contact">
                    {fu.lead_mobile || fu.Lead?.mobile}
                  </div>
                </div>

                {fu.remarks && (
                  <div className="fu-remarks">
                    "{fu.remarks}"
                  </div>
                )}

                <div className="fu-scheduled-at">
                  <Calendar size={14} />
                  <span>
                    {fu.next_followup_at
                      ? new Date(fu.next_followup_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "No Date Specified"}
                  </span>
                </div>

                <div className="fu-card-actions">
                  {fu.status === "PENDING" ? (
                    <>
                      <button
                        className="btn-action complete"
                        onClick={() => handleOpenCompleteModal(fu)}
                      >
                        <CheckCircle2 size={14} />
                        <span>Complete</span>
                      </button>
                      <button
                        className="btn-action reschedule"
                        onClick={() => handleOpenRescheduleModal(fu)}
                      >
                        <CalendarClock size={14} />
                        <span>Reschedule</span>
                      </button>
                    </>
                  ) : (
                    <span className="status-completed-badge">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  )}
                  <button
                    className="btn-action view"
                    onClick={() => navigate(`/employee/leads/${fu.lead_id}`)}
                  >
                    View Lead
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Modal */}
      {completeModalOpen && (
        <div className="modal-backdrop">
          <div className="fu-modal">
            <div className="modal-header">
              <h2>Mark Follow-up Complete</h2>
              <button className="close-btn" onClick={() => setCompleteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCompleteSubmit}>
              <div className="form-field mb-4">
                <label>Call / Interaction Outcome</label>
                <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                  <option value="INTERESTED">Interested in Admission</option>
                  <option value="CALLBACK_REQUESTED">Callback Requested</option>
                  <option value="NOT_INTERESTED">Not Interested</option>

                  <option value="NO_RESPONSE">No Response / Unreachable</option>
                  <option value="ADMISSION_CONFIRMED">Admission Confirmed</option>
                </select>
              </div>

              <div className="form-field mb-4">
                <label>Interaction Remarks / Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record summary of discussion with student..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCompleteModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Updating..." : "Complete Followup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="modal-backdrop">
          <div className="fu-modal">
            <div className="modal-header">
              <h2>Reschedule Follow-up</h2>
              <button className="close-btn" onClick={() => setRescheduleModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-field mb-4">
                <label>New Follow-up Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newNextDate}
                  onChange={(e) => setNewNextDate(e.target.value)}
                />
              </div>

              <div className="form-field mb-4">
                <label>Reschedule Reason / Note</label>
                <textarea
                  rows={3}
                  placeholder="Reason for rescheduling..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setRescheduleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Updating..." : "Reschedule Followup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFollowups;