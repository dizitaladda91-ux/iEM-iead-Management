import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import "./MyLeads.css";
import MyLeadsHeader from "../../components/employee/myLeads/MyLeadsHeader/MyLeadsHeader";
import SearchFilterBar from "../../components/employee/myLeads/SearchFilterBar/SearchFilterBar";
import LeadsTable from "../../components/employee/myLeads/LeadsTable/LeadsTable";
import { getMyLeads } from "../../services/employeeLeadService";
import { exportToCSV } from "../../utils/exportCsv";

const MyLeads = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: initialSearch,
    status: "",
    course: "",
    priority: "",
  });

  const fetchMyLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.course) params.course = filters.course;
      if (filters.priority) params.priority = filters.priority;

      const response = await getMyLeads(params);
      const rawLeads = response?.data?.leads || response?.leads || response?.data || [];
      setLeads(Array.isArray(rawLeads) ? rawLeads : []);
    } catch (error) {
      console.error("Error fetching my leads:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMyLeads();
  }, [fetchMyLeads]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      course: "",
      priority: "",
    });
  };

  // Export My Assigned Leads to CSV
  const handleExportMyLeads = () => {
    if (!leads.length) {
      alert("No leads found to export.");
      return;
    }

    const columns = [
      { label: "Lead Code", key: (r) => r.lead_code || `#${r.id}` },
      { label: "Student Name", key: "full_name" },
      { label: "Primary Mobile", key: "mobile" },
      { label: "Alternate Mobile", key: "alternate_mobile" },
      { label: "Email Address", key: "email" },
      { label: "Interested Course", key: "interested_course" },
      { label: "Preferred Centre", key: "preferred_centre" },
      { label: "Status", key: "status" },
      { label: "Priority", key: "priority" },
      { label: "City", key: "city" },
      { label: "Next Follow-up", key: (r) => r.next_followup ? new Date(r.next_followup).toLocaleString("en-IN") : "Not Scheduled" },
      { label: "Assigned Date", key: (r) => r.captured_at ? new Date(r.captured_at).toLocaleDateString("en-IN") : "" },
      { label: "Discussion Notes", key: "remarks" },
    ];

    exportToCSV(leads, columns, "my_assigned_leads");
  };

  return (
    <div className="my-leads-page">
      <MyLeadsHeader onExport={handleExportMyLeads} />

      <SearchFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <LeadsTable
        leads={leads}
        loading={loading}
        onRefresh={fetchMyLeads}
      />
    </div>
  );
};

export default MyLeads;
