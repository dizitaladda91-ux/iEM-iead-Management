import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import "./MyLeads.css";
import MyLeadsHeader from "../../components/employee/myLeads/MyLeadsHeader/MyLeadsHeader";
import SearchFilterBar from "../../components/employee/myLeads/SearchFilterBar/SearchFilterBar";
import LeadsTable from "../../components/employee/myLeads/LeadsTable/LeadsTable";
import { getMyLeads } from "../../services/employeeLeadService";

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

  return (
    <div className="my-leads-page">
      <MyLeadsHeader />

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
