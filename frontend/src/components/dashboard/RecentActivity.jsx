import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard/RecentActivity.css";
import {
  PlusCircle,
  Pencil,
  UserCheck,
  PhoneCall,
  GraduationCap,
  XCircle,
  Clock3,
} from "lucide-react";

const activityIcons = {
  LEAD_CREATED: PlusCircle,
  LEAD_UPDATED: Pencil,
  LEAD_ASSIGNED: UserCheck,
  FOLLOW_UP: PhoneCall,
  ADMISSION: GraduationCap,
  ADMISSION_DONE: GraduationCap,
  LEAD_LOST: XCircle,
};

const activityColors = {
  LEAD_CREATED: "activity-green",
  LEAD_UPDATED: "activity-blue",
  LEAD_ASSIGNED: "activity-purple",
  FOLLOW_UP: "activity-orange",
  ADMISSION: "activity-success",
  ADMISSION_DONE: "activity-success",
  LEAD_LOST: "activity-red",
};

const RecentActivity = ({
  activities = [],
  loading = false,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h3>Recent Activity</h3>
            <p>Loading activity timeline...</p>
          </div>
        </div>
        <div className="loading-state">Loading...</div>
      </section>
    );
  }

  const handleActivityClick = (activity) => {
    if (activity.activity?.includes("ADMISSION")) {
      navigate("/admissions");
    } else {
      navigate("/leads");
    }
  };

  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h3>Recent Activity</h3>
          <p>Latest CRM activities</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="activity-empty">No Recent Activity</div>
      ) : (
        <div className="activity-list">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.activity] || Clock3;

            return (
              <div
                key={`${activity.activity}-${activity.created_at}-${index}`}
                className="activity-item"
                onClick={() => handleActivityClick(activity)}
                style={{ cursor: "pointer" }}
                title="Click to view related record"
              >
                <div className={`activity-icon ${activityColors[activity.activity] || ""}`}>
                  <Icon size={18} />
                </div>

                <div className="activity-content">
                  <h4>{activity.activity?.replaceAll("_", " ")}</h4>
                  <p>{activity.description}</p>
                  <span>{activity.performed_by || "System"}</span>
                </div>

                <div className="activity-time">
                  {new Date(activity.created_at).toLocaleString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentActivity;
