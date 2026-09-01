import { useCallback, useEffect, useState } from "react";

import "./LeadManagement.css";

import LeadHeader from "../../components/LeadManagement/LeadHeader";
import LeadStats from "../../components/LeadManagement/LeadStats";
import LeadFilters from "../../components/LeadManagement/LeadFilters";
import BulkActionBar from "../../components/LeadManagement/BulkActionBar";
import LeadTable from "../../components/LeadManagement/LeadTable";
import LeadPagination from "../../components/LeadManagement/LeadPagination";
import LeadAssignmentModal
from "../../components/LeadManagement/LeadAssignmentModal";
import { getEmployees } from "../../services/employeeService";
import {
  getLeads,
  getLeadStats,
  deleteLead,
} from "../../services/leadService";

import {
  assignLead,
  assignBulkLeads,
} from "../../services/leadAssignmentService";
import LeadDetailsDrawer from "../../components/common/LeadDetailsDrawer/LeadDetailsDrawer";
import DeleteLeadModal from "../../components/LeadManagement/DeleteLeadModal";
import { exportToCSV } from "../../utils/exportCsv";
const LeadManagement = () => {

  /*
  =====================================
  State
  =====================================
  */

const [employees,setEmployees]=useState([]);

const [assignModal,setAssignModal]=useState(false);

  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState([]);

  const [selectedLeads, setSelectedLeads] = useState([]);

  const [stats, setStats] = useState({

    total_leads: 0,

    today_leads: 0,

    assigned_leads: 0,

    unassigned_leads: 0,

    duplicate_leads: 0,

  });

  const [pagination, setPagination] = useState({

    page: 1,

    limit: 10,

    totalPages: 1,

    totalRecords: 0,

  });

  const [filters, setFilters] = useState({

    search: "",

    status: "",

    source: "",

    assigned_to: "",

  });

  const [drawerOpen, setDrawerOpen] = useState(false);

const [selectedLead, setSelectedLead] = useState(null)

const [assignMode, setAssignMode] = useState("bulk");



/*
=====================================
Delete Lead
=====================================
*/

const [deleteModalOpen, setDeleteModalOpen] = useState(false);

const [selectedDeleteLead, setSelectedDeleteLead] = useState(null);

const [deleteLoading, setDeleteLoading] = useState(false);

  /*
  =====================================
  Load Leads
  =====================================
  */
const closeAssignModal=()=>{

setAssignModal(false);

};


  const loadLeads = useCallback(async () => {

    try {

      setLoading(true);

     const [

    leadResponse,

    statsResponse,

    employeeResponse,

] = await Promise.all([

    getLeads({

        page: pagination.page,

        limit: pagination.limit,

        ...filters,

    }),

    getLeadStats(),

    getEmployees(),

]);

      const leadsData = leadResponse?.data?.leads || leadResponse?.data?.data?.leads || leadResponse?.data?.data || [];
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setPagination(leadResponse?.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalRecords: 0 });

      const statsData = statsResponse?.data?.data || statsResponse?.data || {};
      setStats(statsData);

      const rawEmp = employeeResponse?.data?.employees || employeeResponse?.data?.data?.employees || employeeResponse?.data?.data || employeeResponse?.data || [];
      setEmployees(Array.isArray(rawEmp) ? rawEmp : []);
    } catch (error) {
      console.error(error);

      console.error(error);

    } finally {

      setLoading(false);

    }

  }, [

    pagination.page,

    pagination.limit,

    filters,

  ]);

  useEffect(() => {

    loadLeads();

  }, [loadLeads]);

  /*
  =====================================
  Filters
  =====================================
  */

  const handleFilterChange = (

    field,

    value

  ) => {

    setPagination((prev) => ({

      ...prev,

      page: 1,

    }));

    setFilters((prev) => ({

      ...prev,

      [field]: value,

    }));

  };

  /*
  =====================================
  Reset
  =====================================
  */

  const handleCardFilterClick = (cardFilter) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({
      ...prev,
      ...cardFilter,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      source: "",
      assigned_to: "",
      course: "",
      centre: "",
      priority: "",
      date_range: "",
    });
  };

  /*
  =====================================
  Pagination
  =====================================
  */

  const handlePageChange = (

    page

  ) => {

    setPagination((prev)=>({

      ...prev,

      page,

    }));

  };

 /*
  =====================================
  hnandle aggsise
  =====================================
  */
const handleAssign = async (payload) => {

  try {

    setLoading(true);

    if (assignMode === "single") {

      await assignLead(

        selectedLead.id,

        payload.employee_id

      );

    } else {

      await assignBulkLeads({

        lead_ids: selectedLeads,

        employee_id: payload.employee_id,

      });

    }

    setAssignModal(false);

    setSelectedLead(null);

    setSelectedLeads([]);

    await loadLeads();

    alert("Lead Assigned Successfully");

  } catch (error) {

    console.error(error);

    alert(

      error?.response?.data?.message ||

      "Assignment Failed"

    );

  } finally {

    setLoading(false);

  }

};


/*
=====================================
View Lead
=====================================
*/

const handleViewLead = (lead) => {

  setSelectedLead(lead);

  setDrawerOpen(true);

};

/*
=====================================
Create Lead (Open Drawer / Form)
=====================================
*/
const handleCreateLead = () => {

  setSelectedLead(null);

  setDrawerOpen(true);

};

/*
=====================================
Close Drawer
=====================================
*/

const handleCloseDrawer = () => {

  setDrawerOpen(false);

  setSelectedLead(null);

};

;

/*
=====================================
Delete Lead
=====================================
*/

/*
=====================================
Delete Lead
=====================================
*/

const handleDeleteClick = (lead) => {

  setSelectedDeleteLead(lead);

  setDeleteModalOpen(true);

};

const handleCloseDeleteModal = () => {

  setDeleteModalOpen(false);

  setSelectedDeleteLead(null);

};

const handleDeleteLead = async () => {

  if (!selectedDeleteLead) return;

  try {

    setDeleteLoading(true);

    await deleteLead(selectedDeleteLead.id);

    alert("Lead deleted successfully.");

    handleCloseDeleteModal();

    await loadLeads();

  } catch (error) {

    console.error(error);

    alert("Failed to delete lead.");

  } finally {

    setDeleteLoading(false);

  }

};

const handleSingleAssign = (lead) => {

  setAssignMode("single");

  setSelectedLead(lead);

  setAssignModal(true);

};

const openAssignModal = () => {

  if (selectedLeads.length === 0) return;

  setAssignMode("bulk");

  setSelectedLead(null);

  setAssignModal(true);

};

  // Export Leads to CSV
  const handleExportLeads = (exportSelectedOnly = false) => {
    let dataToExport = leads;
    if (exportSelectedOnly && selectedLeads.length > 0) {
      dataToExport = leads.filter((l) => selectedLeads.includes(l.id));
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert("No leads found to export.");
      return;
    }

    const columns = [
      { label: "Lead Code", key: (r) => r.lead_code || `#${r.id}` },
      { label: "Student Full Name", key: "full_name" },
      { label: "Primary Mobile", key: "mobile" },
      { label: "Alternate Mobile", key: "alternate_mobile" },
      { label: "Email", key: "email" },
      { label: "Interested Course", key: "interested_course" },
      { label: "Preferred Centre", key: "preferred_centre" },
      { label: "Lead Source", key: "source" },
      { label: "Platform", key: "platform" },
      { label: "Disposition / Status", key: "status" },
      { label: "Priority", key: "priority" },
      { label: "Assigned Counsellor", key: (r) => r.assigned_employee_name || r.assigned_to_name || "Unassigned" },
      { label: "City", key: "city" },
      { label: "State", key: "state" },
      { label: "Captured Date", key: (r) => r.created_at ? new Date(r.created_at).toLocaleString("en-IN") : "" },
      { label: "Remarks / Notes", key: "remarks" },
    ];

    exportToCSV(dataToExport, columns, exportSelectedOnly ? "selected_leads" : "crm_leads");
  };

  return (

    <div className="lead-management-page">

      <LeadHeader

        loading={loading}

        onRefresh={loadLeads}

        onExport={() => handleExportLeads(false)}

        onCreateLead={handleCreateLead}

      />

      <LeadStats
        loading={loading}
        stats={stats}
        activeFilter={filters}
        onCardClick={handleCardFilterClick}
      />

      <LeadFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        employees={employees}
      />

      {

        selectedLeads.length > 0 && (

          <BulkActionBar

            selectedLeads={selectedLeads}

            onAssign={openAssignModal}

            onExport={() => handleExportLeads(true)}

            onDelete={() => handleDeleteClick(leads.find(l => selectedLeads.includes(l.id)))}

            onClear={() => setSelectedLeads([])}

          />
        )

      }

  <LeadTable
  loading={loading}
  leads={leads}
  selectedLeads={selectedLeads}
  setSelectedLeads={setSelectedLeads}
  onView={handleViewLead}
  onAssign={handleSingleAssign}
  onFollowUp={(lead) => console.log("Follow Up", lead)}
  onDelete={handleDeleteClick}
/>

   <LeadPagination

        page={pagination.page}

        totalPages={pagination.totalPages}

        totalRecords={pagination.totalRecords}

        limit={pagination.limit}

        onPageChange={handlePageChange}

      />

<LeadAssignmentModal
  open={assignModal}
  mode={assignMode}
  lead={selectedLead}
  selectedLeads={selectedLeads}
  employees={employees}
  onClose={closeAssignModal}
  onAssign={handleAssign}
/>


<LeadDetailsDrawer
  open={drawerOpen}
  lead={selectedLead}
  leadId={selectedLead?.id}
  mode="readOnly"
  onClose={handleCloseDrawer}
  onUpdated={loadLeads}
/>

<DeleteLeadModal
  open={deleteModalOpen}
  lead={selectedDeleteLead}
  loading={deleteLoading}
  onClose={handleCloseDeleteModal}
  onConfirm={handleDeleteLead}
/>

    </div>

  );

};

export default LeadManagement;