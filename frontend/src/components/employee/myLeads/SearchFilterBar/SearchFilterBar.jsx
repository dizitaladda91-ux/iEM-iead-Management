import "./SearchFilterBar.css";
import { Search, RotateCcw } from "lucide-react";

const SearchFilterBar = ({
  filters = {},
  onChange = () => {},
  onReset = () => {}
}) => {
  const courses = [
    "Diploma in Event Management",
    "Diploma in International Event Management",
    "Diploma in Hospitality & Event Management",
    "Post Graduate Diploma in Event Management",
    "BBA in Event Management",
    "MBA in Event Management",
  ];

  return (
    <div className="search-filter-bar">
      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by name, mobile, email, code..."
          value={filters.search || ""}
          onChange={(e) => onChange("search", e.target.value)}
        />
      </div>

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

      <select
        value={filters.course || ""}
        onChange={(e) => onChange("course", e.target.value)}
      >
        <option value="">All Courses</option>
        {courses.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={filters.priority || ""}
        onChange={(e) => onChange("priority", e.target.value)}
      >
        <option value="">All Priorities</option>
        <option value="HIGH">High Priority</option>
        <option value="MEDIUM">Medium Priority</option>
        <option value="LOW">Low Priority</option>
      </select>

      <button className="reset-filter-btn" onClick={onReset} title="Reset all filters">
        <RotateCcw size={16} />
        <span>Reset</span>
      </button>
    </div>
  );
};

export default SearchFilterBar;
