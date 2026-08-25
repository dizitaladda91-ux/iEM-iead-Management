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

  const handleResetFilters = () => {

    setFilters({

      search: "",

      status: "",

      source: "",

      assigned_to: "",

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
  return (

    <div className="lead-management-page">

      <LeadHeader

        loading={loading}

        onRefresh={loadLeads}

      />

      <LeadStats

        loading={loading}

        stats={stats}

      />

      <LeadFilters

        filters={filters}

        onChange={handleFilterChange}

        onReset={handleResetFilters}

      />

      {

        selectedLeads.length > 0 && (

          <BulkActionBar

    selectedLeads={selectedLeads}

    onAssign={openAssignModal}

    onExport={() => console.log("Export")}

    onDelete={() => console.log("Delete")}

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