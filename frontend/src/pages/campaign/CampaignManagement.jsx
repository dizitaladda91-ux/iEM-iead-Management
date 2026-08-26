import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./CampaignManagement.css";

import CampaignHeader from "../../components/Campaign/CampaignHeader";
import CampaignStats from "../../components/Campaign/CampaignStats";
import CampaignFilters from "../../components/Campaign/CampaignFilters";
import CampaignTable from "../../components/Campaign/CampaignTable";
import CampaignPagination from "../../components/Campaign/CampaignPagination";

import {
  getCampaigns,
  getCampaignStats,
  deleteCampaign,
} from "../../services/campaignService";

import { exportToCSV } from "../../utils/exportCsv";

import CampaignAnalyticsDrawer from "../../components/Campaign/CampaignAnalyticsDrawer/CampaignAnalyticsDrawer";

const CampaignManagement = () => {
  /*
  =====================================
  State
  =====================================
  */
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [campaigns, setCampaigns] = useState([]);

  const [selectedCampaigns, setSelectedCampaigns] = useState([]);

  const [stats, setStats] = useState({});

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRecords: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    platform: "",
    status: "",
  });

const [drawerOpen, setDrawerOpen] = useState(false);

const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Export Campaigns to CSV
  const handleExportCampaigns = () => {
    if (!campaigns.length) {
      alert("No campaigns available to export.");
      return;
    }

    const columns = [
      { label: "Campaign Code", key: (r) => r.campaign_code || `#${r.id}` },
      { label: "Campaign Name", key: "campaign_name" },
      { label: "Marketing Platform", key: "platform" },
      { label: "Lead Source", key: "source" },
      { label: "Budget (INR)", key: (r) => Number(r.budget || 0) },
      { label: "Total Leads Generated", key: (r) => Number(r.total_leads || r.leads_count || 0) },
      { label: "Status", key: "status" },
      { label: "Start Date", key: (r) => r.start_date ? String(r.start_date).slice(0, 10) : "" },
      { label: "End Date", key: (r) => r.end_date ? String(r.end_date).slice(0, 10) : "" },
      { label: "Landing Page URL", key: "landing_page_url" },
    ];

    exportToCSV(campaigns, columns, "iem_marketing_campaigns");
  };

  /*
  =====================================
  Load Campaigns
  =====================================
  */

const loadCampaigns = useCallback(async () => {

  try {

    setLoading(true);

    // Campaign List
    const campaignResponse = await getCampaigns({
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    });

    setCampaigns(
      campaignResponse.data?.campaigns || []
    );

    setPagination(
      campaignResponse.data?.pagination || {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalRecords: 0,
      }
    );

    // Campaign Statistics
    try {

      const statsResponse = await getCampaignStats();

      setStats(
        statsResponse?.data?.data || statsResponse?.data || {}
      );

    } catch (statsError) {

      console.error(
        "Campaign Statistics Error:",
        statsError
      );

      setStats({});

    }

  } catch (error) {

    console.error(
      "Campaign Load Error:",
      error
    );

  } finally {

    setLoading(false);

  }

}, [
  pagination.page,
  pagination.limit,
  filters,
]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

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
  Reset Filters
  =====================================
  */

  const handleResetFilters = () => {
    setFilters({
      search: "",
      platform: "",
      status: "",
    });

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  /*
  =====================================
  Pagination
  =====================================
  */

  const handlePageChange = (page) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  /*
  =====================================
  View Campaign
  =====================================
  */
const handleView = (campaign) => {

    setSelectedCampaign(campaign);

    setDrawerOpen(true);

};
 
  /*
  =====================================
  Edit Campaign
  =====================================
  */

 const handleEdit = (campaign) => {
  navigate(`/campaigns/edit/${campaign.id}`);
};

  /*
  =====================================
  Delete Campaign
  =====================================
  */

  const handleDelete = async (
    campaign
  ) => {
    try {
      await deleteCampaign(campaign.id);

      await loadCampaigns();

      alert(
        "Campaign deleted successfully."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete campaign."
      );
    }
  };

  const handleCloseDrawer = () => {

    setDrawerOpen(false);

    setSelectedCampaign(null);

};

  return (
    <div className="campaign-page">

      <CampaignHeader
        loading={loading}
        onRefresh={loadCampaigns}
        onExport={handleExportCampaigns}
        onAdd={() => navigate("/campaigns/new")}
      />

      <CampaignStats
        loading={loading}
        stats={stats}
      />

      <CampaignFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <CampaignTable
        loading={loading}
        campaigns={campaigns}
        selectedCampaigns={
          selectedCampaigns
        }
        setSelectedCampaigns={
          setSelectedCampaigns
        }
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CampaignPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalRecords={
          pagination.totalRecords
        }
        limit={pagination.limit}
        onPageChange={handlePageChange}
      />


      <CampaignAnalyticsDrawer
         open={drawerOpen}
         campaign={selectedCampaign}
         onClose={handleCloseDrawer}
        />

    </div>
  );
};

export default CampaignManagement;