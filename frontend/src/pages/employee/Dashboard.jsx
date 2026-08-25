import { useNavigate } from "react-router-dom";
import { TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import DashboardHeader from "../../components/employee/dashboard/DashboardHeader";
import SummaryCards from "../../components/employee/dashboard/SummaryCards";
import RecentLeadsTable from "../../components/employee/dashboard/RecentLeadsTable";
import TodayFollowups from "../../components/employee/dashboard/TodayFollowups";
import LeadStatusChart from "../../components/employee/dashboard/LeadStatusChart";
import useEmployeeDashboard from "../../hooks/useEmployeeDashboard";
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        dashboard,
        loading,
        error,
        refreshDashboard,
    } = useEmployeeDashboard();

    return (
        <div className="employee-dashboard">
            <DashboardHeader />

            <SummaryCards
                summary={dashboard.summary}
            />

            {/* Performance & Scorecard Connected Quick Banner */}
            <div
                className="dashboard-perf-banner"
                onClick={() => navigate("/employee/performance")}
                role="button"
                tabIndex={0}
                title="Click to view full weekly performance scorecard"
            >
                <div className="perf-banner-left">
                    <div className="perf-banner-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h4>📈 My Performance & Weekly Scorecard</h4>
                        <p>Track your conversion rates, weekly completed vs pending tasks, confirmed enrollments, and fees collected.</p>
                    </div>
                </div>
                <button className="btn-perf-banner">
                    <span>View Scorecard</span>
                    <ArrowRight size={16} />
                </button>
            </div>

            <div className="dashboard-main-grid">

                <div className="dashboard-left">

                    <RecentLeadsTable
                        leads={dashboard.recentLeads}
                    />

                    <TodayFollowups
                        followUps={dashboard.todayFollowUps}
                    />

                </div>

                <div className="dashboard-right">

                    <LeadStatusChart
                        data={dashboard.leadStatus}
                    />

                </div>

            </div>

        </div>

    );
};

export default Dashboard;