import { Plus, RefreshCw, Download } from "lucide-react";

const CampaignHeader = ({
  loading = false,
  onRefresh,
  onExport,
  onAdd,
}) => {
  return (
    <div className="campaign-header">

      <div className="campaign-title">

        <h1>Campaign Management</h1>

        <p>
          Manage all marketing campaigns across Meta, Google,
          Website and other lead sources.
        </p>

      </div>

      <div className="flex items-center gap-3">

        <button
          className="add-campaign-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Campaigns"
        >
          <RefreshCw
            size={18}
            className={loading ? "animate-spin" : ""}
          />

          Refresh
        </button>

        {onExport && (
          <button
            className="add-campaign-btn"
            onClick={onExport}
            title="Export Campaigns to CSV"
            style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#1E293B" }}
          >
            <Download size={18} />
            Export CSV
          </button>
        )}

        <button
          className="add-campaign-btn"
          onClick={onAdd}
        >
          <Plus size={18} />

          Add Campaign
        </button>

      </div>

    </div>
  );
};

export default CampaignHeader;