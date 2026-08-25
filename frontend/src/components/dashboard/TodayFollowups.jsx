import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard/TodayFollowups.css";
import {
  CalendarDays,
  Phone,
  MessageCircle,
  Clock3,
  ArrowRight,
} from "lucide-react";

const priorityClasses = {
  HIGH: "priority-high",
  MEDIUM: "priority-medium",
  LOW: "priority-low",
};

const TodayFollowups = ({
  followups = [],
  loading = false,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h3>Today&apos;s Follow-ups</h3>
            <p>Loading scheduled follow-ups...</p>
          </div>
        </div>
        <div className="loading-state">Loading...</div>
      </section>
    );
  }

  const handleCall = (e, mobile) => {
    e.stopPropagation();
    if (mobile) window.open(`tel:${mobile}`, "_self");
  };

  const handleWhatsApp = (e, item) => {
    e.stopPropagation();
    const cleanMobile = String(item.mobile || "").replace(/[^0-9]/g, "");
    const phone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const msg = `Hello ${item.full_name || "Student"}, Greetings from Institute of Event Management (IEM). Following up on your inquiry for ${item.course || "event management programs"}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h3>Today&apos;s Follow-ups</h3>
          <p>Scheduled counselling follow-ups</p>
        </div>

        <button className="view-all-btn" onClick={() => navigate("/leads")}>
          <span>View All Follow-ups</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {followups.length === 0 ? (
        <div className="followup-empty">
          <CalendarDays size={46} />
          <h4>No Follow-ups Scheduled</h4>
          <p>Today&apos;s scheduled follow-ups will appear here automatically.</p>
        </div>
      ) : (
        <div className="followup-list">
          {followups.map((item, index) => (
            <div
              key={item.id || `${item.mobile}-${index}`}
              className="followup-card"
              onClick={() => navigate("/leads")}
              style={{ cursor: "pointer" }}
              title="Click to view lead details"
            >
              <div className="followup-left">
                <div className="followup-avatar">
                  {item.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h4>{item.full_name}</h4>
                  <p>{item.mobile}</p>
                  <span>{item.course || item.interested_course || "-"}</span>
                </div>
              </div>

              <div className="followup-center">
                <div className="followup-time">
                  <Clock3 size={15} />
                  {item.followup_time || "Today"}
                </div>
                <span className={`priority-badge ${priorityClasses[item.priority] || "priority-low"}`}>
                  {item.priority || "MEDIUM"}
                </span>
              </div>

              <div className="followup-actions">
                <button
                  type="button"
                  title="Direct Phone Call"
                  onClick={(e) => handleCall(e, item.mobile)}
                >
                  <Phone size={16} />
                </button>
                <button
                  type="button"
                  title="Direct WhatsApp Chat"
                  onClick={(e) => handleWhatsApp(e, item)}
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TodayFollowups;
