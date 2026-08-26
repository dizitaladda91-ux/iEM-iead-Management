import { useNavigate } from "react-router-dom";
import { TrendingUp, Calendar, Download } from "lucide-react";
import "./MyLeadsHeader.css";

const MyLeadsHeader = ({ onExport }) => {
    const navigate = useNavigate();

    return (
        <div className="my-leads-header">
            <div className="header-left">
                <h2>My Leads</h2>
                <p>
                    Manage and track all your assigned leads and active counseling conversations.
                </p>
            </div>

            <div className="header-right">
                {onExport && (
                    <button
                        className="export-btn"
                        onClick={onExport}
                        title="Export My Assigned Leads to CSV/Excel"
                    >
                        <Download size={16} />
                        <span>Export Leads</span>
                    </button>
                )}

                <button
                    className="export-btn"
                    onClick={() => navigate("/employee/performance")}
                    title="View My Conversion Performance Scorecard"
                >
                    <TrendingUp size={16} />
                    <span>My Performance</span>
                </button>

                <button
                    className="followup-btn"
                    onClick={() => navigate("/employee/followups")}
                    title="Open Follow-up Task Planner"
                >
                    <Calendar size={16} />
                    <span>Follow-up Planner</span>
                </button>
            </div>
        </div>
    );
};

export default MyLeadsHeader;