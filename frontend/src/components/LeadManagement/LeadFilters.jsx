import "../../styles/LeadManagement/LeadFilters.css";
import {
  Search,
  RotateCcw,
  Filter,
  UserCheck,
  Calendar,
  Layers,
  GraduationCap
} from "lucide-react";

const LeadFilters = ({
  filters = {},
  onChange,
  onReset,
  employees = [],
}) => {
  const courses = [
    "Diploma in Event Management",
    "Diploma in International Event Management",
    "Diploma in Hospitality & Event Management",
    "Post Graduate Diploma in Event Management",
    "BBA in Event Management",
    "MBA in Event Management",
  ];

  const centres = [
    "Lucknow",
    "New Delhi",
    "Jaipur",
    "Gwalior",
    "Bareilly",
    "Dehradun",
    "Prayagraj",
    "Surat",
  ];

  return (
    <section className="lead-filters">
      <div className="lead-filter-header">
        <div>
          <h3>
            <Filter size={18} className="text-blue-600 inline mr-2" />
            Smart Filters & Search
          </h3>
          <p>
            Filter live database leads by status, counsellor, source, course, priority, and date.
          </p>
        </div>
      </div>

      <div className="lead-filter-grid">
        {/* Search */}
        <div className="filter-group filter-search">
          <label>Search Query</label>
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Name, Phone, Email, Lead Code..."
              value={filters.search || ""}
              onChange={(e) => onChange("search", e.target.value)}
            />
          </div>
        </div>

        {/* Status */}
        <div className="filter-group">
          <label>Lead Status</label>
          <select
            value={filters.status || ""}
            onChange={(e) => onChange("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="INTERESTED">Interested</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="VISITED">Visited</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="NEW">New Lead</option>
          </select>
        </div>

        {/* Priority */}
        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority || ""}
            onChange={(e) => onChange("priority", e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Source */}
        <div className="filter-group">
          <label>Lead Source</label>
          <select
            value={filters.source || ""}
            onChange={(e) => onChange("source", e.target.value)}
          >
            <option value="">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="META">Meta / Facebook Ads</option>
            <option value="GOOGLE">Google Ads</option>
            <option value="REFERRAL">Referral</option>
            <option value="WALK_IN">Walk In</option>
            <option value="DIRECT">Direct</option>
          </select>
        </div>

        {/* Counsellor Filter */}
        <div className="filter-group">
          <label>Assigned Counsellor</label>
          <select
            value={filters.assigned_to || ""}
            onChange={(e) => onChange("assigned_to", e.target.value)}
          >
            <option value="">All Counsellors</option>
            <option value="UNASSIGNED">Unassigned Leads</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_code || "EMP"})
              </option>
            ))}
          </select>
        </div>

        {/* Course Filter */}
        <div className="filter-group">
          <label>Interested Course</label>
          <select
            value={filters.course || ""}
            onChange={(e) => onChange("course", e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Centre Filter */}
        <div className="filter-group">
          <label>Centre / Campus</label>
          <select
            value={filters.centre || ""}
            onChange={(e) => onChange("centre", e.target.value)}
          >
            <option value="">All Centres</option>
            {centres.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <label>Creation Date</label>
          <select
            value={filters.date_range || ""}
            onChange={(e) => onChange("date_range", e.target.value)}
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      <div className="lead-filter-footer">
        <button
          className="reset-btn"
          onClick={onReset}
          title="Clear all active filters"
        >
          <RotateCcw size={16} />
          <span>Reset Filters</span>
        </button>
      </div>
    </section>
  );
};

export default LeadFilters;
