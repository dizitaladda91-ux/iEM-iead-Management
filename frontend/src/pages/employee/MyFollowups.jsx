import { useState, useEffect, useCallback } from "react";
import {
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  X,
  MessageSquare,
  Mail,
  AlertCircle,
  CalendarClock,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import {
  getFollowups,
  completeFollowup,
  rescheduleFollowup,
  getFollowupStatistics,
} from "../../services/followupService";
import LeadDetailsDrawer from "../../components/common/LeadDetailsDrawer/LeadDetailsDrawer";
import "./MyFollowups.css";

const MyFollowups = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL_PENDING"); // ALL_PENDING, TODAY, OVERDUE, COMPLETED, ALL
  const [viewMode, setViewMode] = useState("cards"); // cards, table
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    dueToday: 0,
    overdue: 0,
    completed: 0,
    pending: 0,
  });

  // Modal States
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const [outcome, setOutcome] = useState("INTERESTED");
  const [remarks, setRemarks] = useState("");
  const [newNextDate, setNewNextDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === "ALL_PENDING") params.status = "PENDING";
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
          overdue: res.data.overdue_followups || res.data.overdue || 0,
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

  const handleOpenDrawer = (leadId) => {
    if (!leadId) return;
    setSelectedLeadId(leadId);
    setDrawerOpen(true);
  };

  const handleOpenCompleteModal = (fu) => {
    setSelectedFollowup(fu);
    setOutcome("INTERESTED");
    setRemarks("");
    setCompleteModalOpen(true);
  };

  const handleOpenRescheduleModal = (fu) => {
    setSelectedFollowup(fu);
    setNewNextDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
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

  // Direct WhatsApp Launch
  const handleWhatsApp = (fu) => {
    const rawPhone = fu.lead_mobile || fu.mobile || fu.Lead?.mobile || "";
    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, "");
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const name = fu.lead_name || fu.full_name || fu.Lead?.full_name || "Student";
    const course = fu.interested_course || fu.Lead?.interested_course || "our programs";

    const msg = `Hello *${name}*,\n\nFollowing up regarding your inquiry for *${course}* at *Institute of Event Management (IEM)*.\n\nAre you available for a quick discussion today?\n\nWarm regards,\n*IEM Admissions Team*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Filter items for tabs like OVERDUE
  const displayedFollowups = followups.filter((item) => {
    if (activeTab === "OVERDUE") {
      return (
        item.status === "PENDING" &&
        item.next_followup_at &&
        new Date(item.next_followup_at) < new Date()
      );
    }
    return true;
  });

  return (
    <div className="my-followups-container">
      {/* Header */}
      <div className="followups-header">
        <div>
          <h1 className="header-title">
            <CalendarClock className="header-icon" /> My Follow-ups & Task Planner
          </h1>
          <p className="header-subtitle">
            Manage your daily student calls, schedule callbacks, record discussion notes, and trigger direct WhatsApp messages.
          </p>
        </div>

        <div className="header-view-toggle">
          <button
            className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
            onClick={() => setViewMode("cards")}
            title="Card Grid View"
          >
            <LayoutGrid size={16} /> Grid
          </button>
          <button
            className={`view-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table View"
          >
            <List size={16} /> Table
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="followups-stats-grid">
        <div className="fu-stat-card yellow" onClick={() => setActiveTab("ALL_PENDING")}>
          <div className="stat-icon yellow">
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-lbl">Pending Follow-ups</div>
            <div className="stat-val">{stats.pending || followups.filter((f) => f.status === "PENDING").length}</div>
          </div>
        </div>

        <div className="fu-stat-card red" onClick={() => setActiveTab("TODAY")}>
          <div className="stat-icon red">
            <CalendarClock size={22} />
          </div>
          <div>
            <div className="stat-lbl">Due Today</div>
            <div className="stat-val">{stats.dueToday || 0}</div>
          </div>
        </div>

        <div className="fu-stat-card orange" onClick={() => setActiveTab("OVERDUE")}>
          <div className="stat-icon orange">
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="stat-lbl">Overdue Follow-ups</div>
            <div className="stat-val">
              {followups.filter(
                (f) => f.status === "PENDING" && f.next_followup_at && new Date(f.next_followup_at) < new Date()
              ).length}
            </div>
          </div>
        </div>

        <div className="fu-stat-card green" onClick={() => setActiveTab("COMPLETED")}>
          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-lbl">Completed Calls</div>
            <div className="stat-val">{stats.completed || 0}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Toolbar */}
      <div className="followups-toolbar-card">
        <div className="tab-filters">
          <button
            className={`tab-btn ${activeTab === "ALL_PENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL_PENDING")}
          >
            All Pending
          </button>
          <button
            className={`tab-btn ${activeTab === "TODAY" ? "active" : ""}`}
            onClick={() => setActiveTab("TODAY")}
          >
            Due Today
          </button>
          <button
            className={`tab-btn overdue ${activeTab === "OVERDUE" ? "active" : ""}`}
            onClick={() => setActiveTab("OVERDUE")}
          >
            ?? Overdue
          </button>
          <button
            className={`tab-btn ${activeTab === "COMPLETED" ? "active" : ""}`}
            onClick={() => setActiveTab("COMPLETED")}
          >
            Completed Logs
          </button>
          <button
            className={`tab-btn ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            All Follow-ups
          </button>
        </div>

        <div className="toolbar-controls">
          <div className="search-box font-sans">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search student or course..."
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
            <option value="HIGH">?? High Priority</option>
            <option value="MEDIUM">? Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Interaction Types</option>
            <option value="CALL">Phone Call</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Campus Visit / Walk-in</option>
          </select>

          <button className="refresh-btn" onClick={fetchFollowups} title="Refresh Follow-ups">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Followups Content */}
      <div className="followups-content">
        {loading ? (
          <div className="fu-loading-state">
            <RefreshCw size={28} className="spin text-blue-600" />
            <p>Loading your follow-up schedule...</p>
          </div>
        ) : displayedFollowups.length === 0 ? (
          <div className="fu-empty-state">
            <CheckCircle2 size={48} className="empty-icon text-green-500" />
            <h3>No Follow-ups in this view</h3>
            <p>You have cleared all pending schedules for the selected filter.</p>
          </div>
        ) : viewMode === "cards" ? (
          /* ============================================================
             CARDS GRID VIEW
             ============================================================ */
          <div className="fu-cards-grid">
            {displayedFollowups.map((fu) => {
              const leadName = fu.lead_name || fu.full_name || fu.Lead?.full_name || `Lead #${fu.lead_id}`;
              const leadMobile = fu.lead_mobile || fu.mobile || fu.Lead?.mobile || "";
              const course = fu.interested_course || fu.Lead?.interested_course;
              const isOverdue =
                fu.status === "PENDING" &&
                fu.next_followup_at &&
                new Date(fu.next_followup_at) < new Date();

              return (
                <div
                  key={fu.id}
                  className={`fu-card priority-${fu.priority?.toLowerCase()} ${isOverdue ? "card-overdue" : ""}`}
                >
                  <div className="fu-card-header">
                    <div className="fu-type-badge">
                      {fu.followup_type === "CALL" && <PhoneCall size={14} />}
                      {fu.followup_type === "WHATSAPP" && <MessageSquare size={14} />}
                      {fu.followup_type === "EMAIL" && <Mail size={14} />}
                      <span>{fu.followup_type || "CALL"}</span>
                    </div>

                    <div className="fu-tags">
                      {isOverdue && <span className="overdue-pill">?? Overdue</span>}
                      <span className={`priority-tag ${fu.priority?.toLowerCase()}`}>
                        {fu.priority || "MEDIUM"}
                      </span>
                    </div>
                  </div>

                  <div className="fu-lead-info">
                    <h4 className="lead-name" onClick={() => handleOpenDrawer(fu.lead_id)}>
                      {leadName}
                    </h4>
                    {course && <div className="lead-course">{course}</div>}
                    <div className="lead-contact">
                      <a href={`tel:${leadMobile}`} className="phone-link">
                        <PhoneCall size={12} /> {leadMobile}
                      </a>
                    </div>
                  </div>

                  {fu.remarks && <div className="fu-remarks">"{fu.remarks}"</div>}

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

                  {/* Action Buttons */}
                  <div className="fu-card-actions">
                    {/* 1-Click Phone Call */}
                    <a href={`tel:${leadMobile}`} className="btn-fu-circle call" title="Call Student">
                      <PhoneCall size={15} />
                    </a>

                    {/* 1-Click WhatsApp */}
                    <button
                      className="btn-fu-circle wa"
                      title="Send WhatsApp"
                      onClick={() => handleWhatsApp(fu)}
                    >
                      <MessageSquare size={15} />
                    </button>

                    {/* Open Counselling Drawer */}
                    <button
                      className="btn-fu-action drawer-btn"
                      title="Open 4-Step Guided Counselling Drawer"
                      onClick={() => handleOpenDrawer(fu.lead_id)}
                    >
                      <Sparkles size={14} />
                      <span>Counselling</span>
                    </button>

                    {fu.status === "PENDING" ? (
                      <>
                        <button
                          className="btn-fu-action complete"
                          onClick={() => handleOpenCompleteModal(fu)}
                        >
                          <CheckCircle2 size={14} />
                          <span>Done</span>
                        </button>
                        <button
                          className="btn-fu-action reschedule"
                          onClick={() => handleOpenRescheduleModal(fu)}
                        >
                          <CalendarClock size={14} />
                        </button>
                      </>
                    ) : (
                      <span className="status-completed-badge">
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ============================================================
             TABLE VIEW
             ============================================================ */
          <div className="fu-table-wrapper">
            <table className="fu-table">
              <thead>
                <tr>
                  <th>Student Details</th>
                  <th>Course</th>
                  <th>Interaction Type</th>
                  <th>Priority</th>
                  <th>Scheduled Date & Time</th>
                  <th>Notes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedFollowups.map((fu) => {
                  const leadName = fu.lead_name || fu.full_name || fu.Lead?.full_name || `Lead #${fu.lead_id}`;
                  const leadMobile = fu.lead_mobile || fu.mobile || fu.Lead?.mobile || "";
                  const course = fu.interested_course || fu.Lead?.interested_course;
                  const isOverdue =
                    fu.status === "PENDING" &&
                    fu.next_followup_at &&
                    new Date(fu.next_followup_at) < new Date();

                  return (
                    <tr key={fu.id} className={isOverdue ? "row-overdue" : ""}>
                      <td>
                        <div className="table-lead-name" onClick={() => handleOpenDrawer(fu.lead_id)}>
                          {leadName}
                        </div>
                        <div className="table-lead-mobile">
                          <a href={`tel:${leadMobile}`}>{leadMobile}</a>
                        </div>
                      </td>
                      <td>{course || "—"}</td>
                      <td>
                        <span className="type-badge-pill">{fu.followup_type || "CALL"}</span>
                      </td>
                      <td>
                        <span className={`priority-tag ${fu.priority?.toLowerCase()}`}>
                          {fu.priority || "MEDIUM"}
                        </span>
                      </td>
                      <td>
                        <div className={`table-date ${isOverdue ? "text-red" : ""}`}>
                          {fu.next_followup_at
                            ? new Date(fu.next_followup_at).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </div>
                      </td>
                      <td className="table-remarks">{fu.remarks || "—"}</td>
                      <td>
                        <div className="table-actions">
                          <a href={`tel:${leadMobile}`} className="btn-table-icon call" title="Call">
                            <PhoneCall size={14} />
                          </a>
                          <button
                            className="btn-table-icon wa"
                            title="WhatsApp"
                            onClick={() => handleWhatsApp(fu)}
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            className="btn-table-drawer"
                            onClick={() => handleOpenDrawer(fu.lead_id)}
                          >
                            <Sparkles size={13} /> Update
                          </button>
                          {fu.status === "PENDING" && (
                            <>
                              <button
                                className="btn-table-complete"
                                onClick={() => handleOpenCompleteModal(fu)}
                              >
                                Done
                              </button>
                              <button
                                className="btn-table-reschedule"
                                onClick={() => handleOpenRescheduleModal(fu)}
                              >
                                Reschedule
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                <label>Call / Interaction Outcome *</label>
                <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                  <option value="INTERESTED">Interested in Admission</option>
                  <option value="CALLBACK_REQUESTED">Callback Requested</option>
                  <option value="ADMISSION_CONFIRMED">Admission Confirmed / Enrolled</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="NO_RESPONSE">No Response / Unreachable</option>
                </select>
              </div>

              <div className="form-field mb-4">
                <label>Discussion Remarks / Summary *</label>
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
                  placeholder="e.g. Student requested callback after 5 PM..."
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

      {/* 4-Step Guided Counselling Drawer */}
      <LeadDetailsDrawer
        open={drawerOpen}
        leadId={selectedLeadId}
        onClose={() => setDrawerOpen(false)}
        onUpdated={() => {
          fetchFollowups();
          fetchStats();
        }}
      />
    </div>
  );
};

export default MyFollowups;
