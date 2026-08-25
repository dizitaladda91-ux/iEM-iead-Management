import { useState, useEffect } from "react";
import {
  GraduationCap,
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  MessageCircle,
  Receipt,
  PlusCircle,
  X,
  ArrowRight,
  TrendingUp,
  FileText,
  PhoneCall,
  RefreshCw,
  Edit3,
  CreditCard,
  Building,
  User,
  Sparkles
} from "lucide-react";
import {
  getMyAdmissions,
  getAdmissionStats,
  addAdmissionPayment,
  getAdmissionDetails,
} from "../../services/admissionService";
import "./MyAdmissions.css";

const MyAdmissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [stats, setStats] = useState({
    total_admissions: 0,
    total_revenue: 0,
    total_collected: 0,
    total_pending: 0,
    overdue_count: 0,
    due_today_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerDrawerOpen, setIsLedgerDrawerOpen] = useState(false);
  const [ledgerDetails, setLedgerDetails] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_mode: "UPI",
    receipt_number: "",
    payment_date: new Date().toISOString().slice(0, 10),
    next_due_date: "",
    remarks: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [admRes, statRes] = await Promise.all([
        getMyAdmissions(search),
        getAdmissionStats(),
      ]);

      const raw = admRes?.data?.admissions || admRes?.data?.data?.admissions || admRes?.data?.data || admRes?.data || [];
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.admissions) ? raw.admissions : []);
      setAdmissions(list);
      setStats(statRes?.data || {});
    } catch (err) {
      console.error("Error loading admissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // Open Payment Modal
  const handleOpenPayment = (admission) => {
    setSelectedAdmission(admission);
    const pendingAmount = Math.max(0, Number(admission.total_fee || 0) - Number(admission.paid_fee || 0));
    setPaymentForm({
      amount: pendingAmount > 0 ? String(pendingAmount) : "",
      payment_mode: "UPI",
      receipt_number: `REC-${Date.now().toString().slice(-6)}`,
      payment_date: new Date().toISOString().slice(0, 10),
      next_due_date: admission.next_due_date ? String(admission.next_due_date).slice(0, 10) : "",
      remarks: "",
    });
    setIsPaymentModalOpen(true);
  };

  // Quick Amount preset helper
  const handleSetQuickAmount = (val) => {
    setPaymentForm((prev) => ({ ...prev, amount: String(val) }));
  };

  // Submit Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    try {
      setPaymentSubmitting(true);
      await addAdmissionPayment(selectedAdmission.id, {
        amount: Number(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        receipt_number: paymentForm.receipt_number,
        payment_date: paymentForm.payment_date,
        next_due_date: paymentForm.next_due_date || null,
        remarks: paymentForm.remarks || "Installment fee recorded by counsellor",
      });

      alert("Fee payment recorded successfully! Ledger and pending balance updated.");
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Payment error:", err);
      alert(err?.response?.data?.message || "Failed to record payment.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Open Ledger History
  const handleOpenLedger = async (admission) => {
    setSelectedAdmission(admission);
    setIsLedgerDrawerOpen(true);
    setLedgerLoading(true);
    setLedgerDetails(null);
    try {
      const res = await getAdmissionDetails(admission.id);
      setLedgerDetails(res?.data || null);
    } catch (err) {
      console.error("Ledger load error:", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Send WhatsApp Fee Reminder / Receipt Confirmation
  const handleSendWhatsAppReminder = (admission) => {
    const cleanMobile = String(admission.mobile || "").replace(/[^0-9]/g, "");
    const phone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    const dueDateStr = admission.next_due_date
      ? new Date(admission.next_due_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "as soon as possible";

    const msg = `Dear *${admission.student_name}*,\n\nThis is a gentle fee reminder from *Institute of Event Management (IEM)* regarding your admission in *${admission.course_name}*.\n\n?? *Total Course Fee:* ?${Number(admission.total_fee || 0).toLocaleString("en-IN")}\n? *Paid Amount:* ?${Number(admission.paid_fee || 0).toLocaleString("en-IN")}\n? *Pending Balance:* ?${Number(admission.pending_fee || 0).toLocaleString("en-IN")}\n?? *Due Date:* ${dueDateStr}\n\nKindly clear your pending installment to keep your academic enrollment active.\n\nThank you,\n*IEM Admissions Desk*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Filter Admissions
  const safeAdmissions = Array.isArray(admissions) ? admissions : [];
  const filteredAdmissions = safeAdmissions.filter((item) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "OVERDUE") {
      return (
        item.fee_status === "OVERDUE" ||
        (Number(item.pending_fee) > 0 &&
          item.next_due_date &&
          new Date(item.next_due_date) < new Date())
      );
    }
    return item.fee_status === statusFilter;
  });

  return (
    <div className="my-admissions-container">
      {/* Header */}
      <div className="my-adm-header">
        <div>
          <h1 className="header-title">
            <GraduationCap className="header-icon" /> My Student Admissions & Fee Collection
          </h1>
          <p className="header-subtitle">
            Manage your enrolled students, collect fee installments, view transaction ledgers, and track pending dues in real time.
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchData} title="Refresh Admissions">
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Financial Analytics Summary Grid */}
      <div className="adm-stats-grid">
        <div
          className={`adm-stat-card ${statusFilter === "ALL" ? "active-filter" : ""}`}
          onClick={() => setStatusFilter("ALL")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap blue">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="stat-label">My Total Admissions</div>
            <div className="stat-val">{stats.total_admissions || safeAdmissions.length}</div>
          </div>
        </div>

        <div className="adm-stat-card">
          <div className="stat-icon-wrap purple">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-label">Total Course Value</div>
            <div className="stat-val">
              ?{Number(stats.total_revenue || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          className={`adm-stat-card ${statusFilter === "FULLY_PAID" ? "active-filter" : ""}`}
          onClick={() => setStatusFilter("FULLY_PAID")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap green">
            <IndianRupee size={22} />
          </div>
          <div>
            <div className="stat-label">Fees Collected</div>
            <div className="stat-val green-text">
              ?{Number(stats.total_collected || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          className={`adm-stat-card ${statusFilter === "PARTIAL" ? "active-filter" : ""}`}
          onClick={() => setStatusFilter("PARTIAL")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-label">Pending Dues</div>
            <div className="stat-val amber-text">
              ?{Number(stats.total_pending || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          className={`adm-stat-card ${statusFilter === "OVERDUE" ? "active-filter" : ""}`}
          onClick={() => setStatusFilter("OVERDUE")}
          role="button"
          tabIndex={0}
        >
          <div className="stat-icon-wrap red">
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="stat-label">Overdue Installments</div>
            <div className="stat-val red-text">
              {stats.overdue_count || safeAdmissions.filter((a) => a.fee_status === "OVERDUE").length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name, phone, course or campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={`filter-pill ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All ({safeAdmissions.length})
          </button>
          <button
            className={`filter-pill partial ${statusFilter === "PARTIAL" ? "active" : ""}`}
            onClick={() => setStatusFilter("PARTIAL")}
          >
            Pending Dues
          </button>
          <button
            className={`filter-pill paid ${statusFilter === "FULLY_PAID" ? "active" : ""}`}
            onClick={() => setStatusFilter("FULLY_PAID")}
          >
            Fully Paid
          </button>
          <button
            className={`filter-pill overdue ${statusFilter === "OVERDUE" ? "active" : ""}`}
            onClick={() => setStatusFilter("OVERDUE")}
          >
            Overdue Dues
          </button>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Student Details</th>
              <th>Course & Campus</th>
              <th>Total Fee</th>
              <th>Paid Amount</th>
              <th>Balance Due</th>
              <th>Fee Status</th>
              <th>Next Due Date</th>
              <th className="text-right">Actions / Fee Collection</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="table-loading">
                  <RefreshCw size={24} className="spin text-blue-600" />
                  <span>Loading student admissions from database...</span>
                </td>
              </tr>
            ) : filteredAdmissions.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">
                  <GraduationCap size={44} className="text-slate-300" />
                  <h3>No Student Admissions Found</h3>
                  <p>When leads are marked as 'Enrolled' in the counselling drawer, their admission record appears here automatically.</p>
                </td>
              </tr>
            ) : (
              filteredAdmissions.map((adm) => {
                const total = Number(adm.total_fee || 0);
                const paid = Number(adm.paid_fee || 0);
                const pending = Math.max(0, total - paid);
                const isOverdue =
                  adm.fee_status === "OVERDUE" ||
                  (pending > 0 && adm.next_due_date && new Date(adm.next_due_date) < new Date());

                return (
                  <tr key={adm.id} className={isOverdue ? "row-overdue" : ""}>
                    {/* Student Info */}
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">
                          {adm.student_name ? adm.student_name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <div className="student-name">{adm.student_name}</div>
                          <div className="student-phone">
                            <PhoneCall size={12} /> {adm.mobile}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Course & Campus */}
                    <td>
                      <div className="course-cell">
                        <span className="course-name">{adm.course_name || "Event Management"}</span>
                        <span className="campus-badge">{adm.centre || "Main Campus"}</span>
                      </div>
                    </td>

                    {/* Total Fee */}
                    <td>
                      <div className="fee-total-cell">
                        <strong>?{total.toLocaleString("en-IN")}</strong>
                      </div>
                    </td>

                    {/* Paid Fee */}
                    <td>
                      <div className="fee-paid-cell">
                        <span className="paid-amount">?{paid.toLocaleString("en-IN")}</span>
                        {total > 0 && (
                          <div className="fee-progress-bar">
                            <div
                              className="fee-progress-fill"
                              style={{ width: `${Math.min(100, (paid / total) * 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Pending Fee */}
                    <td>
                      <div className="fee-pending-cell">
                        {pending > 0 ? (
                          <span className={`pending-amount ${isOverdue ? "text-red" : "text-amber"}`}>
                            ?{pending.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="paid-full-badge">? Cleared</span>
                        )}
                      </div>
                    </td>

                    {/* Fee Status Pill */}
                    <td>
                      {isOverdue ? (
                        <span className="adm-badge badge-overdue">?? Overdue</span>
                      ) : adm.fee_status === "FULLY_PAID" ? (
                        <span className="adm-badge badge-paid">
                          <CheckCircle2 size={13} /> Fully Paid
                        </span>
                      ) : (
                        <span className="adm-badge badge-partial">
                          <Clock size={13} /> Partial
                        </span>
                      )}
                    </td>

                    {/* Next Due Date */}
                    <td>
                      {pending > 0 && adm.next_due_date ? (
                        <div className={`due-date-wrapper ${isOverdue ? "overdue-date" : ""}`}>
                          <Calendar size={14} />
                          <span>
                            {new Date(adm.next_due_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="no-due">�</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td>
                      <div className="adm-actions">
                        {/* 1. Update / Record Fee Payment */}
                        <button
                          className="btn-adm-pay"
                          title="Record Fee Payment / Add Installment"
                          onClick={() => handleOpenPayment(adm)}
                        >
                          <PlusCircle size={15} />
                          <span>{pending > 0 ? "Update / Pay Fee" : "Add Payment"}</span>
                        </button>

                        {/* 2. WhatsApp Reminder / Receipt */}
                        {pending > 0 && (
                          <button
                            className="btn-adm-wa"
                            title="Send WhatsApp Fee Reminder"
                            onClick={() => handleSendWhatsAppReminder(adm)}
                          >
                            <MessageCircle size={15} />
                            <span>WhatsApp</span>
                          </button>
                        )}

                        {/* 3. View Ledger History */}
                        <button
                          className="btn-adm-ledger"
                          title="View Payment Ledger & Installment History"
                          onClick={() => handleOpenLedger(adm)}
                        >
                          <Receipt size={15} />
                          <span>Ledger</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================
          FEE PAYMENT RECORDING MODAL
          ============================================================ */}
      {isPaymentModalOpen && selectedAdmission && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-card">
            <div className="adm-modal-header">
              <div>
                <h2>Record Fee Payment / Update Fees</h2>
                <p>Student: <strong>{selectedAdmission.student_name}</strong> ({selectedAdmission.course_name})</p>
              </div>
              <button className="btn-close" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Pending summary banner */}
            <div className="modal-fee-banner">
              <div>
                <span>Total Course Fee</span>
                <strong>?{Number(selectedAdmission.total_fee || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Already Paid</span>
                <strong className="green-text">?{Number(selectedAdmission.paid_fee || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Current Balance Due</span>
                <strong className="amber-text">?{Math.max(0, Number(selectedAdmission.total_fee || 0) - Number(selectedAdmission.paid_fee || 0)).toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="modal-form">
              {/* Quick Amount Suggestion Buttons */}
              <div className="quick-amounts-bar">
                <span className="quick-label">Quick Amount:</span>
                {Math.max(0, Number(selectedAdmission.total_fee || 0) - Number(selectedAdmission.paid_fee || 0)) > 0 && (
                  <button
                    type="button"
                    className="btn-quick-chip primary"
                    onClick={() => handleSetQuickAmount(Math.max(0, Number(selectedAdmission.total_fee || 0) - Number(selectedAdmission.paid_fee || 0)))}
                  >
                    Full Due (?{Math.max(0, Number(selectedAdmission.total_fee || 0) - Number(selectedAdmission.paid_fee || 0)).toLocaleString("en-IN")})
                  </button>
                )}
                <button type="button" className="btn-quick-chip" onClick={() => handleSetQuickAmount(5000)}>
                  ?5,000
                </button>
                <button type="button" className="btn-quick-chip" onClick={() => handleSetQuickAmount(10000)}>
                  ?10,000
                </button>
                <button type="button" className="btn-quick-chip" onClick={() => handleSetQuickAmount(25000)}>
                  ?25,000
                </button>
                <button type="button" className="btn-quick-chip" onClick={() => handleSetQuickAmount(50000)}>
                  ?50,000
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Installment / Payment Amount (?) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount to record (e.g. 15000)"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Payment Mode *</label>
                  <select
                    value={paymentForm.payment_mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  >
                    <option value="UPI">UPI / GPay / PhonePe / Paytm</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CARD">Debit / Credit Card (POS)</option>
                    <option value="ONLINE">Online Student Portal</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Receipt / Transaction Ref No.</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-2026-0042 or UPI Ref"
                    value={paymentForm.receipt_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receipt_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Next Due Date if not full amount */}
              {Number(paymentForm.amount || 0) < Math.max(0, Number(selectedAdmission.total_fee || 0) - Number(selectedAdmission.paid_fee || 0)) && (
                <div className="form-group">
                  <label>Next Installment Due Date (Optional)</label>
                  <input
                    type="date"
                    value={paymentForm.next_due_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, next_due_date: e.target.value })}
                  />
                  <small className="hint">Schedule when the student promises to pay the remaining balance.</small>
                </div>
              )}

              <div className="form-group">
                <label>Remarks / Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. 2nd Installment received via Google Pay, receipt issued to student"
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? "Recording in Ledger..." : "? Submit & Record Fee Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          TRANSACTION LEDGER DRAWER
          ============================================================ */}
      {isLedgerDrawerOpen && selectedAdmission && (
        <div className="adm-drawer-overlay">
          <div className="adm-drawer">
            <div className="adm-drawer-header">
              <div>
                <h2>Student Fee Ledger & Timeline</h2>
                <p>
                  <strong>{selectedAdmission.student_name}</strong> � {selectedAdmission.course_name}
                </p>
              </div>
              <button className="btn-close" onClick={() => setIsLedgerDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="adm-drawer-body">
              {/* Financial Snapshot Card */}
              <div className="ledger-summary-box">
                <div className="summary-item">
                  <span className="s-label">Total Course Fee</span>
                  <span className="s-val">?{Number(selectedAdmission.total_fee || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="summary-item">
                  <span className="s-label">Total Collected</span>
                  <span className="s-val green">?{Number(selectedAdmission.paid_fee || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="summary-item">
                  <span className="s-label">Pending Dues</span>
                  <span className="s-val amber">?{Math.max(0, Number(selectedAdmission.total_fee || 0) - Number(selectedAdmission.paid_fee || 0)).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Action trigger in drawer */}
              <div className="drawer-quick-actions">
                <button
                  className="btn-drawer-pay"
                  onClick={() => {
                    setIsLedgerDrawerOpen(false);
                    handleOpenPayment(selectedAdmission);
                  }}
                >
                  <PlusCircle size={16} /> Record New Fee Installment
                </button>

                <button
                  className="btn-drawer-wa"
                  onClick={() => handleSendWhatsAppReminder(selectedAdmission)}
                >
                  <MessageCircle size={16} /> WhatsApp Fee Reminder
                </button>
              </div>

              {/* Transactions History */}
              <div className="timeline-section">
                <h3 className="section-title">Payment Receipts & Installment History</h3>

                {ledgerLoading ? (
                  <div className="timeline-loading">
                    <RefreshCw size={24} className="spin text-blue-600" />
                    <span>Loading payment history...</span>
                  </div>
                ) : !ledgerDetails?.payments || ledgerDetails.payments.length === 0 ? (
                  <div className="timeline-empty">
                    <Receipt size={36} className="text-slate-300" />
                    <p>No payment transactions recorded yet.</p>
                  </div>
                ) : (
                  <div className="payment-timeline">
                    {ledgerDetails.payments.map((p, idx) => (
                      <div key={p.id || idx} className="timeline-item">
                        <div className="timeline-marker">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="timeline-content">
                          <div className="t-header">
                            <div>
                              <strong className="t-amount">?{Number(p.amount || 0).toLocaleString("en-IN")}</strong>
                              <span className={`t-mode-badge ${p.payment_mode === "INITIAL_PAYMENT" ? "initial-token" : ""}`}>
                                {p.payment_mode === "INITIAL_PAYMENT" ? "?? Initial Token Fee" : p.payment_mode || "UPI"}
                              </span>
                            </div>
                            <span className="t-date">
                              {new Date(p.payment_date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="t-meta">
                            <span>Receipt: <strong>{p.receipt_number || "N/A"}</strong></span>
                            {p.remarks && <span className="t-remark">� {p.remarks}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAdmissions;
