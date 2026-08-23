import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  GraduationCap,
  IndianRupee,
  Calendar,
  Layers,
  RefreshCw,
  Phone,
  Sparkles,
  Award,
  Target
} from "lucide-react";
import { getMyPerformance } from "../../services/employeeService";
import "./MyPerformance.css";

const MyPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [perfData, setPerfData] = useState(null);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await getMyPerformance();
      setPerfData(res?.data || res);
    } catch (err) {
      console.error("Error loading performance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const summary = perfData?.summary || {};
  const weekWise = perfData?.week_wise || [];
  const recentLeads = perfData?.recent_leads || [];
  const employee = perfData?.employee || {};

  return (
    <div className="my-perf-container">
      {/* Header */}
      <div className="my-perf-header">
        <div>
          <h1 className="header-title">
            <TrendingUp className="header-icon" /> My Performance & Weekly Scorecard
          </h1>
          <p className="header-subtitle">
            Track your lead conversions, weekly completion rates, admissions achieved, and overall productivity.
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchPerformance} title="Refresh Scorecard">
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="perf-loading-state">
          <RefreshCw size={32} className="spin text-blue-600" />
          <p>Calculating your real-time performance and weekly metrics...</p>
        </div>
      ) : (
        <>
          {/* Top Counsellor Welcome Banner */}
          <div className="perf-welcome-banner">
            <div className="banner-profile">
              <div className="banner-avatar">
                {employee.full_name?.charAt(0).toUpperCase() || "C"}
              </div>
              <div>
                <h2>{employee.full_name || "Counsellor"}</h2>
                <div className="banner-meta">
                  <span className="badge-code">{employee.employee_code || "EMP"}</span>
                  <span className="badge-role">{employee.role || "COUNSELLOR"}</span>
                  <span className="badge-desig">{employee.designation || "Admissions Counsellor"}</span>
                </div>
              </div>
            </div>

            <div className="banner-conversion">
              <div className="conversion-label">
                <Target size={18} /> Overall Conversion Rate
              </div>
              <div className="conversion-number">
                {summary.conversion_rate || "0.0"}%
              </div>
              <div className="conversion-sub">
                {summary.enrolled_count || 0} Admissions from {summary.total_assigned || 0} Total Leads
              </div>
            </div>
          </div>

          {/* Core Metric Cards */}
          <div className="my-perf-stats-grid">
            <div className="perf-card blue">
              <div className="card-top">
                <span>Total Leads Assigned</span>
                <div className="icon-wrap blue"><Users size={20} /></div>
              </div>
              <div className="card-value">{summary.total_assigned || 0}</div>
              <div className="card-sub">Assigned inquiries</div>
            </div>

            <div className="perf-card amber">
              <div className="card-top">
                <span>Pending Follow-ups</span>
                <div className="icon-wrap amber"><Clock size={20} /></div>
              </div>
              <div className="card-value">{summary.pending_leads || 0}</div>
              <div className="card-sub">In active pipeline</div>
            </div>

            <div className="perf-card green">
              <div className="card-top">
                <span>Leads Completed / Closed</span>
                <div className="icon-wrap green"><CheckCircle2 size={20} /></div>
              </div>
              <div className="card-value">{summary.completed_leads || 0}</div>
              <div className="card-sub">Completed counselling</div>
            </div>

            <div className="perf-card purple">
              <div className="card-top">
                <span>Admissions Enrolled</span>
                <div className="icon-wrap purple"><GraduationCap size={20} /></div>
              </div>
              <div className="card-value">{summary.enrolled_count || 0}</div>
              <div className="card-sub">Confirmed students</div>
            </div>

            <div className="perf-card orange">
              <div className="card-top">
                <span>Fee Revenue Collected</span>
                <div className="icon-wrap orange"><IndianRupee size={20} /></div>
              </div>
              <div className="card-value">
                ?{Number(summary.total_fees_collected || 0).toLocaleString("en-IN")}
              </div>
              <div className="card-sub">Directly generated revenue</div>
            </div>
          </div>

          {/* Week-Wise Performance Table */}
          <div className="my-perf-section">
            <div className="section-header-box">
              <Calendar size={20} className="text-blue-600" />
              <div>
                <h3>Week-Wise Performance Breakdown</h3>
                <p>Track your weekly productivity, completed follow-ups, and student enrollments</p>
              </div>
            </div>

            {weekWise.length === 0 ? (
              <p className="no-data">No weekly records available yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th>Week / Duration</th>
                      <th>Assigned</th>
                      <th>Completed</th>
                      <th>Pending</th>
                      <th>Admissions Done</th>
                      <th>Fees Collected (?)</th>
                      <th>Weekly Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekWise.map((w, idx) => {
                      const assigned = Number(w.assigned_count || 0);
                      const completed = Number(w.completed_count || 0);
                      const pending = Number(w.pending_count || 0);
                      const enrolled = Number(w.enrolled_count || 0);
                      const fees = Number(w.fees_collected || 0);
                      const rate = assigned > 0 ? Math.min(100, Math.round((completed / assigned) * 100)) : 0;

                      return (
                        <tr key={idx}>
                          <td>
                            <div className="week-title">{w.week_name}</div>
                            <div className="week-dates">{w.week_label}</div>
                          </td>
                          <td><span className="pill blue">{assigned}</span></td>
                          <td><span className="pill green">{completed}</span></td>
                          <td><span className="pill amber">{pending}</span></td>
                          <td><span className="pill purple">?? {enrolled}</span></td>
                          <td>
                            <strong className="text-green-700">
                              ?{fees.toLocaleString("en-IN")}
                            </strong>
                          </td>
                          <td>
                            <div className="progress-cell">
                              <div className="progress-track">
                                <div
                                  className={`progress-fill ${rate >= 70 ? "fill-green" : rate >= 40 ? "fill-blue" : "fill-amber"}`}
                                  style={{ width: `${rate}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">{rate}%</span>
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

          {/* Active Assigned Leads */}
          <div className="my-perf-section">
            <div className="section-header-box">
              <Layers size={20} className="text-purple-600" />
              <div>
                <h3>Recent Assigned Leads Pipeline</h3>
                <p>Latest leads under your active counselling portfolio</p>
              </div>
            </div>

            {recentLeads.length === 0 ? (
              <p className="no-data">No active leads assigned yet.</p>
            ) : (
              <div className="leads-mini-grid">
                {recentLeads.map((l) => (
                  <div key={l.id} className="lead-mini-card">
                    <div className="lead-mini-top">
                      <div className="l-name">{l.full_name}</div>
                      <span className={`l-status ${l.status?.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </div>
                    <div className="l-course">{l.interested_course || "Program Inquiry"}</div>
                    <div className="l-phone">
                      <Phone size={12} /> {l.mobile}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyPerformance;
