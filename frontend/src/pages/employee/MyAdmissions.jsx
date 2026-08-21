import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Award,
  IndianRupee,
  Search,
  Eye,
  Calendar,
  Phone,
  FileCheck,
} from "lucide-react";
import "./MyAdmissions.css";
import { getMyLeads } from "../../services/employeeLeadService";
import LeadDetailsDrawer from "../../components/common/LeadDetailsDrawer/LeadDetailsDrawer";

const MyAdmissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await getMyLeads();
      const allLeads = res?.data?.leads || res?.leads || (Array.isArray(res) ? res : []);
      
      // Filter leads with status ENROLLED or ADMISSION_DONE
      const filtered = allLeads.filter((l) => {
        const s = String(l.status || "").toUpperCase();
        return s === "ENROLLED" || s === "ADMISSION_DONE" || s === "COMPLETED";
      });
      setAdmissions(filtered);
    } catch (err) {
      console.error("Error loading admissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const totalFeeCollected = admissions.reduce((acc, curr) => {
    try {
      let fb = curr.feedback;
      if (typeof fb === "string" && fb.startsWith("{")) {
        fb = JSON.parse(fb);
      }
      const fee = Number(fb?.fee_paid || 0);
      return acc + (isNaN(fee) ? 0 : fee);
    } catch {
      return acc;
    }
  }, 0);

  const displayedList = admissions.filter((adm) => {
    const q = search.toLowerCase();
    return (
      (adm.full_name || "").toLowerCase().includes(q) ||
      (adm.mobile || "").includes(q) ||
      (adm.interested_course || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="my-admissions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Admissions & Enrollments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Confirmed student enrollments and fee collection history
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admissions-stats-grid">
        <div className="admissions-stat-card">
          <div className="admissions-stat-icon green">
            <GraduationCap size={24} />
          </div>
          <div className="admissions-stat-info">
            <h4>{admissions.length}</h4>
            <p>Total Admissions Converted</p>
          </div>
        </div>

        <div className="admissions-stat-card">
          <div className="admissions-stat-icon blue">
            <IndianRupee size={24} />
          </div>
          <div className="admissions-stat-info">
            <h4>?{totalFeeCollected.toLocaleString("en-IN")}</h4>
            <p>Token / Total Fees Logged</p>
          </div>
        </div>

        <div className="admissions-stat-card">
          <div className="admissions-stat-icon purple">
            <Award size={24} />
          </div>
          <div className="admissions-stat-info">
            <h4>100%</h4>
            <p>Verification Success Rate</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="leads-table-card">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            className="w-full bg-transparent outline-none text-sm text-slate-700"
            placeholder="Search by student name, mobile, course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading admissions...</div>
        ) : displayedList.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <GraduationCap size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No Admissions Found</p>
            <p className="text-xs text-slate-400 mt-1">
              When you set a lead disposition to ENROLLED, it will appear here.
            </p>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Mobile</th>
                <th>Course Enrolled</th>
                <th>Fee Paid (?)</th>
                <th>Receipt No.</th>
                <th>Enrolled Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.map((lead) => {
                let fb = lead.feedback;
                if (typeof fb === "string" && fb.startsWith("{")) {
                  try {
                    fb = JSON.parse(fb);
                  } catch {
                    fb = {};
                  }
                }

                return (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-info">
                        <div className="lead-avatar">
                          {lead.full_name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <h5>{lead.full_name}</h5>
                          <span>{lead.email || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td>{lead.mobile}</td>
                    <td className="font-semibold text-slate-800">
                      {fb?.course_enrolled || lead.interested_course || "-"}
                    </td>
                    <td>
                      <span className="font-bold text-emerald-700">
                        {fb?.fee_paid ? `?${Number(fb.fee_paid).toLocaleString("en-IN")}` : "-"}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                        {fb?.receipt_number || "-"}
                      </span>
                    </td>
                    <td>
                      {lead.updated_at
                        ? new Date(lead.updated_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td>
                      <button
                        className="action-btn view-btn"
                        title="View Complete Profile"
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <LeadDetailsDrawer
        open={isDrawerOpen}
        lead={selectedLead}
        leadId={selectedLead?.id}
        mode="edit"
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLead(null);
        }}
        onUpdated={fetchAdmissions}
      />
    </div>
  );
};

export default MyAdmissions;
