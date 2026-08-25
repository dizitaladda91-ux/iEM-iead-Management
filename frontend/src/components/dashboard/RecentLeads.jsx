import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard/RecentLeads.css";
import { Phone, ArrowRight, UserRound } from "lucide-react";

const statusClasses = {
  NEW: "status-new",
  INTERESTED: "status-qualified",
  CONTACTED: "status-contacted",
  QUALIFIED: "status-qualified",
  FOLLOW_UP: "status-followup",
  VISITED: "status-admission",
  ENROLLED: "status-admission",
  ADMISSION: "status-admission",
  NOT_INTERESTED: "status-lost",
  LOST: "status-lost",
};

const sourceClasses = {
  META: "source-meta",
  GOOGLE: "source-google",
  WEBSITE: "source-website",
  REFERRAL: "source-referral",
  WALK_IN: "source-walkin",
  DIRECT: "source-website",
};

const RecentLeads = ({ leads = [], loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h3>Recent Leads</h3>
            <p>Loading latest enquiries...</p>
          </div>
        </div>
        <div className="loading-state">Loading...</div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h3>Recent Leads</h3>
          <p>Latest enquiries received</p>
        </div>

        <button className="view-all-btn" onClick={() => navigate("/leads")}>
          <span>View All Leads</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Mobile</th>
              <th>Source</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  No Recent Leads
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.lead_code || lead.id}
                  onClick={() => navigate("/leads")}
                  style={{ cursor: "pointer" }}
                  title="Click to view lead in Lead Management"
                >
                  <td>
                    <div className="lead-user">
                      <div className="lead-avatar">
                        <UserRound size={18} />
                      </div>
                      <div>
                        <div className="lead-name">{lead.full_name}</div>
                        <div className="lead-code">{lead.lead_code}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="mobile-cell">
                      <Phone size={14} />
                      {lead.mobile}
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${sourceClasses[lead.source] || "source-website"}`}>
                      {lead.source || "WEBSITE"}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${statusClasses[lead.status] || "status-new"}`}>
                      {lead.status || "NEW"}
                    </span>
                  </td>

                  <td>
                    {new Date(lead.created_at || Date.now()).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RecentLeads;
