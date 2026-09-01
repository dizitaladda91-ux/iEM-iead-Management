import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  GraduationCap,
  FileText,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Building,
  School,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Flame,
  ArrowRight,
  Save,
  MessageSquare,
  Sparkles,
  Lock,
  Unlock,
} from "lucide-react";
import "./LeadDetailsDrawer.css";
import {
  getLeadById,
  updateLead,
  getLeadTimeline,
  addLeadNote,
} from "../../../services/leadService";
import { createFollowup } from "../../../services/followupService";
import { createAdmission } from "../../../services/admissionService";
import {
  calculateLeadPriority,
  getPriorityBadgeClass,
  getStatusBadgeClass,
} from "../../../utils/priorityEngine";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

// Helper for date formatting: DD MMM YYYY • hh:mm A
const formatTimelineDate = (dateStr) => {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;

    return `${day} ${month} ${year} • ${strTime}`;
  } catch {
    return String(dateStr);
  }
};

const LeadDetailsDrawer = ({
  open = false,
  lead = null,
  leadId = null,
  mode = "edit", // "edit" (Counsellor guided 4-step) | "readOnly" (Admin audit 3-tab)
  onClose = () => {},
  onStatusUpdated = () => {},
  onUpdated = () => {},
}) => {
  const { user } = useAuth();
  const effectiveId = leadId || lead?.id;

  const [activeTab, setActiveTab] = useState("step1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeline, setTimeline] = useState([]);

  // STEP 1: Personal Information
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");

  // STEP 2: Academic Information (School vs College)
  const [academicType, setAcademicType] = useState("school"); // "school" | "college"
  const [interestedCourse, setInterestedCourse] = useState("");
  const [preferredCentre, setPreferredCentre] = useState("");
  
  // School fields
  const [schoolName, setSchoolName] = useState("");
  const [tenthBoard, setTenthBoard] = useState("");
  const [tenthMarks, setTenthMarks] = useState("");
  const [twelfthBoard, setTwelfthBoard] = useState("");
  const [twelfthMarks, setTwelfthMarks] = useState("");
  const [twelfthStream, setTwelfthStream] = useState("");

  // College fields
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [passingYear, setPassingYear] = useState("");
  const [collegeCgpa, setCollegeCgpa] = useState("");

  // STEP 3: Counsellor Notes & Dynamic Status
  const [status, setStatus] = useState("NEW");
  const [priority, setPriority] = useState("LOW");
  const [callNotes, setCallNotes] = useState("");
  
  // Dynamic status fields: REJECTED / NOT_CONTACTED
  const [rejectedReason, setRejectedReason] = useState("");
  const [competitorName, setCompetitorName] = useState("");

  // Dynamic status fields: FOLLOW_UP
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [followupMode, setFollowupMode] = useState("CALL");

  // Dynamic status fields: WALKED_IN / INTERESTED
  const [walkinDate, setWalkinDate] = useState("");
  const [walkinTime, setWalkinTime] = useState("");
  const [preferredCampus, setPreferredCampus] = useState("");

  // Dynamic status fields: ENROLLED
  const [courseEnrolled, setCourseEnrolled] = useState("");
  const [totalCourseFee, setTotalCourseFee] = useState("");
  const [feePaid, setFeePaid] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [admissionNextDueDate, setAdmissionNextDueDate] = useState("");

  const isReadOnly = mode === "readOnly" || (mode !== "edit" && user?.role === "ADMIN");
  const isEnrolled = status === "ENROLLED" || lead?.status === "ENROLLED" || lead?.status === "ADMISSION_DONE";

  // Load Lead details
  const loadLeadData = useCallback(async () => {
    if (!effectiveId) return;
    setLoading(true);
    try {
      const res = await getLeadById(effectiveId);
      const data = res?.data || res?.lead || res || {};

      setFullName(data.full_name || "");
      setMobile(data.mobile || "");
      setAlternateMobile(data.alternate_mobile || "");
      setEmail(data.email || "");
      setCity(data.city || "");
      setState(data.state || "");
      setCountry(data.country || "India");
      setInterestedCourse(data.interested_course || "");
      setPreferredCentre(data.preferred_centre || "");

      // Academic details
      const acad = typeof data.academic_info === "object" && data.academic_info ? data.academic_info : {};
      setAcademicType(acad.type || "school");
      setSchoolName(acad.school_name || "");
      setTenthBoard(acad.tenth_board || "");
      setTenthMarks(acad.tenth_marks || "");
      setTwelfthBoard(acad.twelfth_board || "");
      setTwelfthMarks(acad.twelfth_marks || "");
      setTwelfthStream(acad.twelfth_stream || "");
      setCollegeName(acad.college_name || "");
      setDegree(acad.degree || "");
      setBranch(acad.branch || "");
      setPassingYear(acad.passing_year || "");
      setCollegeCgpa(acad.college_cgpa || "");

      // Status & Priority
      const currentStatus = data.status || "NEW";
      setStatus(currentStatus);
      setPriority(calculateLeadPriority(currentStatus));
      setCallNotes(data.remarks || "");

      // Dynamic feedback parsing
      let fb = data.feedback;
      if (typeof fb === "string" && (fb.startsWith("{") || fb.startsWith("["))) {
        try {
          fb = JSON.parse(fb);
        } catch {
          // plain string
        }
      }
      if (typeof fb === "object" && fb) {
        setRejectedReason(fb.rejected_reason || "");
        setCompetitorName(fb.competitor_name || "");
        setFollowupMode(fb.followup_mode || "CALL");
        setWalkinDate(fb.walkin_date || "");
        setWalkinTime(fb.walkin_time || "");
        setPreferredCampus(fb.preferred_campus || "");
        setCourseEnrolled(fb.course_enrolled || "");
        setTotalCourseFee(fb.total_fee || "");
        setFeePaid(fb.fee_paid || "");
        setReceiptNumber(fb.receipt_number || "");
        setAdmissionNextDueDate(fb.next_due_date || "");
      }

      if (data.next_followup) {
        try {
          const iso = new Date(data.next_followup).toISOString().slice(0, 16);
          setNextFollowupDate(iso);
        } catch {
          setNextFollowupDate("");
        }
      }

      // Fetch Timeline
      try {
        const tlRes = await getLeadTimeline(effectiveId);
        const tlList = tlRes?.data?.timeline || tlRes?.data || (Array.isArray(tlRes) ? tlRes : []);
        setTimeline(tlList);
      } catch (err) {
        console.warn("Timeline fetch error:", err);
      }
    } catch (err) {
      console.error("Error loading lead details:", err);
      toast.error("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [effectiveId]);

  useEffect(() => {
    if (open && effectiveId) {
      loadLeadData();
      setActiveTab(isReadOnly ? "overview" : "step1");
    }
  }, [open, effectiveId, isReadOnly, loadLeadData]);

  // Handle status selection with automated priority recalculation
  const handleStatusSelect = (newStatus) => {
    setStatus(newStatus);
    const autoPriority = calculateLeadPriority(newStatus);
    setPriority(autoPriority);
  };

  // STEP 4: Unified Save Changes
  const handleUnifiedSave = async () => {
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      setActiveTab("step1");
      return;
    }
    if (!mobile.trim()) {
      toast.error("Mobile Number is required");
      setActiveTab("step1");
      return;
    }

    setSaving(true);
    try {
      const autoPriority = calculateLeadPriority(status);

      // Build structured feedback object
      const feedbackPayload = {
        status,
        updated_at: new Date().toISOString(),
        rejected_reason: rejectedReason || null,
        competitor_name: competitorName || null,
        followup_mode: followupMode || null,
        walkin_date: walkinDate || null,
        walkin_time: walkinTime || null,
        preferred_campus: preferredCampus || null,
        course_enrolled: courseEnrolled || null,
        total_fee: totalCourseFee || feePaid || null,
        fee_paid: feePaid || null,
        receipt_number: receiptNumber || null,
        next_due_date: admissionNextDueDate || null,
        notes: callNotes || null,
      };

      // Build academic info
      const academicPayload = {
        type: academicType,
        ...(academicType === "school"
          ? {
              school_name: schoolName,
              tenth_board: tenthBoard,
              tenth_marks: tenthMarks,
              twelfth_board: twelfthBoard,
              twelfth_marks: twelfthMarks,
              twelfth_stream: twelfthStream,
            }
          : {
              college_name: collegeName,
              degree,
              branch,
              passing_year: passingYear,
              college_cgpa: collegeCgpa,
            }),
      };

      const payload = {
        full_name: fullName,
        mobile,
        alternate_mobile: alternateMobile || null,
        email: email || null,
        city: city || null,
        state: state || null,
        country: country || "India",
        interested_course: interestedCourse || null,
        preferred_centre: preferredCentre || null,
        status,
        priority: autoPriority,
        remarks: callNotes || null,
        feedback: JSON.stringify(feedbackPayload),
        academic_info: academicPayload,
        next_followup: nextFollowupDate ? new Date(nextFollowupDate).toISOString() : null,
      };

      // 1. Update Lead Record
      await updateLead(effectiveId, payload);

      // 2. If Followup Scheduled, create Followup Record
      if ((status === "FOLLOW_UP" || status === "FOLLOW_UP_REQUIRED") && nextFollowupDate) {
        try {
          await createFollowup({
            lead_id: effectiveId,
            followup_type: followupMode || "CALL",
            priority: autoPriority,
            next_followup_at: new Date(nextFollowupDate).toISOString(),
            remarks: callNotes || "Scheduled from Counselling Drawer",
          });
        } catch (fErr) {
          console.warn("Followup record creation warning:", fErr);
        }
      }

      // 3. If Call notes provided, add Lead Note
      if (callNotes.trim()) {
        try {
          await addLeadNote(effectiveId, { note: callNotes });
        } catch (nErr) {
          console.warn("Note add warning:", nErr);
        }
      }

      // 4. If Enrolled / Admission Done, create Admission & Fee record in DB
      if ((status === "ENROLLED" || status === "ADMISSION_DONE") && (Number(totalCourseFee) > 0 || Number(feePaid) > 0)) {
        try {
          await createAdmission({
            lead_id: effectiveId,
            student_name: fullName,
            mobile,
            email: email || null,
            course_name: courseEnrolled || interestedCourse || "Course Enrollment",
            centre: preferredCampus || preferredCentre || "Main Campus",
            total_fee: Number(totalCourseFee || feePaid || 0),
            paid_fee: Number(feePaid || 0),
            receipt_number: receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
            next_due_date: admissionNextDueDate || null,
            remarks: callNotes || "Converted from Lead Counselling Drawer",
          });
        } catch (admErr) {
          console.warn("Admission record creation warning:", admErr);
        }
      }

      toast.success("Lead changes saved successfully! 🚀");
      onUpdated?.();
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err?.response?.data?.message || "Failed to save lead updates");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="lead-drawer-backdrop" onClick={onClose} />
      <aside className="lead-drawer-panel">
        {/* ================= Header ================= */}
        <div className="lead-drawer-header">
          <div className="lead-drawer-header-left">
            <div className="lead-drawer-avatar">
              {fullName?.charAt(0)?.toUpperCase() || "L"}
            </div>
            <div className="lead-drawer-title-group">
              <h2>
                {fullName || "Lead Profile"}
                <span className={getPriorityBadgeClass(priority)}>
                  <Flame size={12} /> {priority} PRIORITY
                </span>
              </h2>
              <div className="lead-drawer-meta-tags">
                <span className="lead-code-pill">
                  {lead?.lead_code || `LEAD #${effectiveId}`}
                </span>
                <span className={getStatusBadgeClass(status)}>
                  {status}
                </span>
                {isEnrolled && (
                  <span className="enrolled-badge-pill" title="Student is officially enrolled. Core details are locked.">
                    <Lock size={12} /> Enrolled & Locked
                  </span>
                )}
                {lead?.source && (
                  <span className="lead-code-pill">
                    Source: {lead.source}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="lead-drawer-close-btn"
            onClick={onClose}
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= Step Indicator / Tabs ================= */}
        <div className="lead-drawer-tabs-nav">
          {!isReadOnly ? (
            <>
              <button
                className={`lead-tab-btn ${activeTab === "step1" ? "active" : ""}`}
                onClick={() => setActiveTab("step1")}
              >
                <span className="tab-step-badge">1</span>
                <span>Personal Information</span>
              </button>
              <button
                className={`lead-tab-btn ${activeTab === "step2" ? "active" : ""}`}
                onClick={() => setActiveTab("step2")}
              >
                <span className="tab-step-badge">2</span>
                <span>Academic Information</span>
              </button>
              <button
                className={`lead-tab-btn ${activeTab === "step3" ? "active" : ""}`}
                onClick={() => setActiveTab("step3")}
              >
                <span className="tab-step-badge">3</span>
                <span>Counsellor Notes & Feedback</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={`lead-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <User size={16} />
                <span>Personal Info</span>
              </button>
              <button
                className={`lead-tab-btn ${activeTab === "academic" ? "active" : ""}`}
                onClick={() => setActiveTab("academic")}
              >
                <GraduationCap size={16} />
                <span>Academic Profile</span>
              </button>
              <button
                className={`lead-tab-btn ${activeTab === "feedback_timeline" ? "active" : ""}`}
                onClick={() => setActiveTab("feedback_timeline")}
              >
                <Clock3 size={16} />
                <span>Notes & Timeline History</span>
              </button>
            </>
          )}
        </div>

        {/* ================= Body Scroll Area ================= */}
        <div className="lead-drawer-body">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Clock className="animate-spin mb-3 text-blue-600" size={32} />
              <p className="font-semibold">Loading Student & Lead Profile...</p>
            </div>
          ) : (
            <>
              {/* EDIT MODE: STEP 1 - PERSONAL INFORMATION */}
              {!isReadOnly && activeTab === "step1" && (
                <div className="drawer-card">
                  <div className="drawer-card-header">
                    <h3>
                      <User size={18} className="text-blue-600" />
                      STEP 1: Student Personal Details
                    </h3>
                  </div>

                  {isEnrolled && (
                    <div className="enrolled-lock-banner">
                      <Lock size={18} className="text-emerald-700 flex-shrink-0" />
                      <div>
                        <strong>Student Admission Confirmed:</strong> Personal details are locked to preserve academic records. To record or update fee installments, please go to <strong>STEP 3</strong> or the Admissions ledger.
                      </div>
                    </div>
                  )}

                  <div className="drawer-grid-2">
                    <div className="drawer-form-group">
                      <label className="drawer-label">
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="drawer-input"
                        placeholder="e.g. Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label">
                        Primary Mobile <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        className="drawer-input"
                        placeholder="10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label">Alternate Mobile / WhatsApp</label>
                      <input
                        type="tel"
                        className="drawer-input"
                        placeholder="Optional alternate contact"
                        value={alternateMobile}
                        onChange={(e) => setAlternateMobile(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label">Email Address</label>
                      <input
                        type="email"
                        className="drawer-input"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label">City</label>
                      <input
                        type="text"
                        className="drawer-input"
                        placeholder="e.g. Kolkata, Patna, Delhi"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label">State</label>
                      <input
                        type="text"
                        className="drawer-input"
                        placeholder="e.g. West Bengal, Bihar"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT MODE: STEP 2 - ACADEMIC INFORMATION */}
              {!isReadOnly && activeTab === "step2" && (
                <div className="drawer-card">
                  <div className="drawer-card-header">
                    <h3>
                      <GraduationCap size={18} className="text-blue-600" />
                      STEP 2: Academic Background & Interest
                    </h3>
                    <div className="academic-switcher">
                      <button
                        type="button"
                        className={`switcher-tab ${academicType === "school" ? "active" : ""}`}
                        onClick={() => setAcademicType("school")}
                        disabled={isEnrolled || isReadOnly}
                      >
                        <School size={14} className="inline mr-1" /> School (10th/12th)
                      </button>
                      <button
                        type="button"
                        className={`switcher-tab ${academicType === "college" ? "active" : ""}`}
                        onClick={() => setAcademicType("college")}
                        disabled={isEnrolled || isReadOnly}
                      >
                        <Building size={14} className="inline mr-1" /> College / Grad
                      </button>
                    </div>
                  </div>

                  {isEnrolled && (
                    <div className="enrolled-lock-banner">
                      <Lock size={18} className="text-emerald-700 flex-shrink-0" />
                      <div>
                        <strong>Academic Profile Locked:</strong> Academic and program preferences are frozen after enrollment.
                      </div>
                    </div>
                  )}

                  <div className="drawer-grid-2 mb-6">
                    <div className="drawer-form-group">
                      <label className="drawer-label">Interested Course / Program</label>
                      <input
                        type="text"
                        className="drawer-input"
                        placeholder="e.g. B.Tech CSE, MBA, BCA"
                        value={interestedCourse}
                        onChange={(e) => setInterestedCourse(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>
                    <div className="drawer-form-group">
                      <label className="drawer-label">Preferred Centre / Campus</label>
                      <input
                        type="text"
                        className="drawer-input"
                        placeholder="e.g. Kolkata Main Campus"
                        value={preferredCentre}
                        onChange={(e) => setPreferredCentre(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      />
                    </div>
                  </div>

                  {academicType === "school" ? (
                    <div className="drawer-grid-3">
                      <div className="drawer-form-group col-span-3">
                        <label className="drawer-label">School Name</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="Current or Last Attended School"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label">10th Board</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="CBSE / ICSE / State"
                          value={tenthBoard}
                          onChange={(e) => setTenthBoard(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>
                      <div className="drawer-form-group">
                        <label className="drawer-label">10th Score (%)</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="e.g. 85%"
                          value={tenthMarks}
                          onChange={(e) => setTenthMarks(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>
                      <div className="drawer-form-group">
                        <label className="drawer-label">12th Stream</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="PCM / PCB / Commerce / Arts"
                          value={twelfthStream}
                          onChange={(e) => setTwelfthStream(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label">12th Board</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="CBSE / ISC / State"
                          value={twelfthBoard}
                          onChange={(e) => setTwelfthBoard(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>
                      <div className="drawer-form-group col-span-2">
                        <label className="drawer-label">12th Score / Predicted (%)</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="e.g. 88% or Appearing"
                          value={twelfthMarks}
                          onChange={(e) => setTwelfthMarks(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="drawer-grid-2">
                      <div className="drawer-form-group col-span-2">
                        <label className="drawer-label">College / University Name</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="Name of Undergraduate Institution"
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label">Degree / Qualification</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="e.g. B.Sc, B.Com, B.Tech, BCA"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label">Specialization / Branch</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="e.g. Computer Science, Finance"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label">Passing / Graduation Year</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="e.g. 2024, 2025, 2026"
                          value={passingYear}
                          onChange={(e) => setPassingYear(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label">Graduation CGPA / Percentage</label>
                        <input
                          type="text"
                          className="drawer-input"
                          placeholder="e.g. 8.4 CGPA or 78%"
                          value={collegeCgpa}
                          onChange={(e) => setCollegeCgpa(e.target.value)}
                          disabled={isEnrolled || isReadOnly}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EDIT MODE: STEP 3 - COUNSELLOR NOTES & DYNAMIC STATUS */}
              {!isReadOnly && activeTab === "step3" && (
                <div className="drawer-card">
                  <div className="drawer-card-header">
                    <h3>
                      <FileText size={18} className="text-blue-600" />
                      STEP 3: Counselling Discussion & Next Action
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Auto-Derived:</span>
                      <span className={getPriorityBadgeClass(priority)}>
                        <Flame size={12} /> {priority}
                      </span>
                    </div>
                  </div>

                  {isEnrolled && (
                    <div className="enrolled-lock-banner">
                      <Lock size={18} className="text-emerald-700 flex-shrink-0" />
                      <div>
                        <strong>Admission Confirmed:</strong> Disposition is locked to <strong>ENROLLED</strong>. You can record further <strong>Fee Installments, Receipts, and Next Due Dates</strong> below.
                      </div>
                    </div>
                  )}

                  <div className="drawer-grid-2">
                    <div className="drawer-form-group">
                      <label className="drawer-label">
                        Lead Disposition / Status <span className="required">*</span>
                      </label>
                      <select
                        className="drawer-select font-semibold text-blue-700"
                        value={status}
                        onChange={(e) => handleStatusSelect(e.target.value)}
                        disabled={isEnrolled || isReadOnly}
                      >
                        <option value="INTERESTED">Interested</option>
                        <option value="FOLLOW_UP">Follow-up</option>
                        <option value="VISITED">Visited</option>
                        <option value="ENROLLED">Enrolled</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                        <option value="NEW">New Lead</option>
                      </select>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label">Calculated Lead Priority</label>
                      <div className="drawer-readonly-value font-bold text-slate-700">
                        <span className={getPriorityBadgeClass(priority)}>
                          {priority} Priority
                        </span>
                        <span className="text-xs text-slate-500 ml-2 font-normal">
                          (Derived automatically based on CRM rules)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Status Case 1: REJECTED / NOT_INTERESTED / LOST */}
                  {(status === "REJECTED" || status === "NOT_CONTACTED" || status === "LOST" || status === "NOT_INTERESTED") && (
                    <div className="dynamic-status-card rejected">
                      <div className="dynamic-status-title text-red-800">
                        <AlertCircle size={18} /> Rejection & Non-Contact Feedback
                      </div>
                      <div className="drawer-grid-2">
                        <div className="drawer-form-group">
                          <label className="drawer-label">Reason for Rejection / Drop</label>
                          <select
                            className="drawer-select"
                            value={rejectedReason}
                            onChange={(e) => setRejectedReason(e.target.value)}
                          >
                            <option value="">Select Reason...</option>
                            <option value="Invalid / Switch Off Number">Invalid / Switch Off Number</option>
                            <option value="Not Interested in Course">Not Interested in Course</option>
                            <option value="Location / Distance Issue">Location / Distance Issue</option>
                            <option value="Fee Budget High">Fee Budget High</option>
                            <option value="Joined Competitor Institution">Joined Competitor Institution</option>
                            <option value="Eligibility Criteria Not Met">Eligibility Criteria Not Met</option>
                            <option value="Other">Other Reason</option>
                          </select>
                        </div>

                        {rejectedReason === "Joined Competitor Institution" && (
                          <div className="drawer-form-group">
                            <label className="drawer-label">Competitor College / Institute Name</label>
                            <input
                              type="text"
                              className="drawer-input"
                              placeholder="e.g. XYZ Institute"
                              value={competitorName}
                              onChange={(e) => setCompetitorName(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Status Case 2: FOLLOW_UP */}
                  {(status === "FOLLOW_UP" || status === "FOLLOW_UP_REQUIRED") && (
                    <div className="dynamic-status-card followup">
                      <div className="dynamic-status-title text-amber-800">
                        <Clock size={18} /> Next Follow-Up Schedule
                      </div>
                      <div className="drawer-grid-2">
                        <div className="drawer-form-group">
                          <label className="drawer-label">
                            Next Follow-Up Date & Time <span className="required">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            className="drawer-input"
                            value={nextFollowupDate}
                            onChange={(e) => setNextFollowupDate(e.target.value)}
                          />
                        </div>

                        <div className="drawer-form-group">
                          <label className="drawer-label">Follow-Up Channel / Mode</label>
                          <select
                            className="drawer-select"
                            value={followupMode}
                            onChange={(e) => setFollowupMode(e.target.value)}
                          >
                            <option value="CALL">Phone Call</option>
                            <option value="WHATSAPP">WhatsApp Discussion</option>
                            <option value="EMAIL">Email Follow-Up</option>
                            <option value="MEETING">Campus Visit / In-Person Meeting</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Status Case 3: VISITED / WALKED_IN / INTERESTED */}
                  {(status === "VISITED" || status === "WALKED_IN" || status === "INTERESTED" || status === "WALK_IN_SCHEDULED") && (
                    <div className="dynamic-status-card walkin">
                      <div className="dynamic-status-title text-purple-800">
                        <Building size={18} /> Campus Walk-In & Visit Details
                      </div>
                      <div className="drawer-grid-3">
                        <div className="drawer-form-group">
                          <label className="drawer-label">Walk-In Date</label>
                          <input
                            type="date"
                            className="drawer-input"
                            value={walkinDate}
                            onChange={(e) => setWalkinDate(e.target.value)}
                          />
                        </div>

                        <div className="drawer-form-group">
                          <label className="drawer-label">Walk-In Time Slot</label>
                          <input
                            type="time"
                            className="drawer-input"
                            value={walkinTime}
                            onChange={(e) => setWalkinTime(e.target.value)}
                          />
                        </div>

                        <div className="drawer-form-group">
                          <label className="drawer-label">Campus Branch</label>
                          <input
                            type="text"
                            className="drawer-input"
                            placeholder="e.g. Sector V / Main Campus"
                            value={preferredCampus}
                            onChange={(e) => setPreferredCampus(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Status Case 4: ENROLLED / ADMISSION_DONE */}
                  {(status === "ENROLLED" || status === "ADMISSION_DONE") && (
                    <div className="dynamic-status-card enrolled">
                      <div className="dynamic-status-title text-emerald-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={18} /> Confirmed Enrollment & Course Fee Breakdown
                        </span>
                        <span className="fee-active-badge">
                          ✏️ Fee & Installments (Editable)
                        </span>
                      </div>
                      <div className="drawer-grid-3">
                        <div className="drawer-form-group">
                          <label className="drawer-label">Confirmed Course *</label>
                          <input
                            type="text"
                            className="drawer-input"
                            placeholder="e.g. Diploma in Event Management"
                            value={courseEnrolled || interestedCourse}
                            onChange={(e) => setCourseEnrolled(e.target.value)}
                          />
                        </div>

                        <div className="drawer-form-group">
                          <label className="drawer-label">Total Course Fee (₹) *</label>
                          <input
                            type="number"
                            className="drawer-input"
                            placeholder="e.g. 60000"
                            value={totalCourseFee}
                            onChange={(e) => setTotalCourseFee(e.target.value)}
                          />
                        </div>

                        <div className="drawer-form-group">
                          <label className="drawer-label">Initial Fee Paid (₹) *</label>
                          <input
                            type="number"
                            className="drawer-input"
                            placeholder="e.g. 20000"
                            value={feePaid}
                            onChange={(e) => setFeePaid(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="drawer-grid-2 mt-3">
                        <div className="drawer-form-group">
                          <label className="drawer-label">Receipt / Ref Number</label>
                          <input
                            type="text"
                            className="drawer-input"
                            placeholder="e.g. REC-2026-904"
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                          />
                        </div>

                        {Number(totalCourseFee || 0) > Number(feePaid || 0) && (
                          <div className="drawer-form-group">
                            <label className="drawer-label">Next Installment Due Date</label>
                            <input
                              type="date"
                              className="drawer-input"
                              value={admissionNextDueDate}
                              onChange={(e) => setAdmissionNextDueDate(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Discussion Notes */}
                  <div className="drawer-form-group mt-5">
                    <label className="drawer-label">
                      Counselling Discussion Notes <span className="text-slate-400 font-normal">(Recorded in Timeline)</span>
                    </label>
                    <textarea
                      className="drawer-textarea"
                      placeholder="Type details of the telephonic/in-person discussion..."
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                    />
                  </div>

                  {/* Interaction Timeline */}
                  {timeline.length > 0 && (
                    <div className="mt-8 border-t border-slate-200 pt-6">
                      <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Clock3 size={16} className="text-blue-600" />
                        Interaction History Timeline (Date-wise)
                      </h4>
                      <div className="interaction-timeline">
                        {timeline.slice(0, 5).map((item, idx) => (
                          <div key={item.id || idx} className="timeline-item">
                            <span className="timeline-bullet" />
                            <div className="timeline-date-time">
                              <Clock size={12} />
                              {formatTimelineDate(item.created_at)}
                            </div>
                            <div className="timeline-title">
                              {item.title || item.activity_type || item.action}
                            </div>
                            <div className="timeline-desc">
                              {item.description || item.remarks || "No details recorded"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* READ-ONLY AUDIT MODE: 3 TABS FOR ADMIN */}
              {isReadOnly && activeTab === "overview" && (
                <div className="drawer-card">
                  <div className="drawer-card-header">
                    <h3>
                      <User size={18} className="text-blue-600" />
                      Personal Information
                    </h3>
                  </div>
                  <div className="drawer-grid-2">
                    <div className="drawer-form-group">
                      <span className="drawer-label">Full Name</span>
                      <div className="drawer-readonly-value">{fullName || "-"}</div>
                    </div>
                    <div className="drawer-form-group">
                      <span className="drawer-label">Primary Mobile</span>
                      <div className="drawer-readonly-value font-semibold">{mobile || "-"}</div>
                    </div>
                    <div className="drawer-form-group">
                      <span className="drawer-label">Alternate Mobile</span>
                      <div className="drawer-readonly-value">{alternateMobile || "-"}</div>
                    </div>
                    <div className="drawer-form-group">
                      <span className="drawer-label">Email</span>
                      <div className="drawer-readonly-value">{email || "-"}</div>
                    </div>
                    <div className="drawer-form-group">
                      <span className="drawer-label">City</span>
                      <div className="drawer-readonly-value">{city || "-"}</div>
                    </div>
                    <div className="drawer-form-group">
                      <span className="drawer-label">State & Country</span>
                      <div className="drawer-readonly-value">{state ? `${state}, ${country}` : country}</div>
                    </div>
                  </div>
                </div>
              )}

              {isReadOnly && activeTab === "academic" && (
                <div className="drawer-card">
                  <div className="drawer-card-header">
                    <h3>
                      <GraduationCap size={18} className="text-blue-600" />
                      Academic Profile & Course Preference
                    </h3>
                    <span className="lead-code-pill font-bold uppercase">
                      {academicType} Details
                    </span>
                  </div>
                  <div className="drawer-grid-2">
                    <div className="drawer-form-group">
                      <span className="drawer-label">Interested Course</span>
                      <div className="drawer-readonly-value font-bold text-blue-700">
                        {interestedCourse || "-"}
                      </div>
                    </div>
                    <div className="drawer-form-group">
                      <span className="drawer-label">Preferred Centre</span>
                      <div className="drawer-readonly-value">{preferredCentre || "-"}</div>
                    </div>

                    {academicType === "school" ? (
                      <>
                        <div className="drawer-form-group col-span-2">
                          <span className="drawer-label">School Name</span>
                          <div className="drawer-readonly-value">{schoolName || "-"}</div>
                        </div>
                        <div className="drawer-form-group">
                          <span className="drawer-label">10th Board & Score</span>
                          <div className="drawer-readonly-value">{tenthBoard ? `${tenthBoard} (${tenthMarks || "-"})` : "-"}</div>
                        </div>
                        <div className="drawer-form-group">
                          <span className="drawer-label">12th Board & Stream</span>
                          <div className="drawer-readonly-value">{twelfthBoard ? `${twelfthBoard} - ${twelfthStream || ""}` : "-"}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="drawer-form-group col-span-2">
                          <span className="drawer-label">College Name</span>
                          <div className="drawer-readonly-value">{collegeName || "-"}</div>
                        </div>
                        <div className="drawer-form-group">
                          <span className="drawer-label">Degree & Branch</span>
                          <div className="drawer-readonly-value">{degree ? `${degree} - ${branch || ""}` : "-"}</div>
                        </div>
                        <div className="drawer-form-group">
                          <span className="drawer-label">Passing Year & CGPA</span>
                          <div className="drawer-readonly-value">{passingYear ? `${passingYear} (CGPA: ${collegeCgpa || "-"})` : "-"}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {isReadOnly && activeTab === "feedback_timeline" && (
                <div className="drawer-card">
                  <div className="drawer-card-header">
                    <h3>
                      <Clock3 size={18} className="text-blue-600" />
                      Counsellor Notes & Audit History
                    </h3>
                  </div>

                  <div className="drawer-grid-2 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">LEAD STATUS</span>
                      <div className="mt-1">
                        <span className={getStatusBadgeClass(status)}>{status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">PRIORITY LEVEL</span>
                      <div className="mt-1">
                        <span className={getPriorityBadgeClass(priority)}>{priority}</span>
                      </div>
                    </div>
                    {callNotes && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                        <span className="text-xs font-semibold text-slate-500">LATEST COUNSELLOR DISCUSSION NOTE</span>
                        <p className="text-sm text-slate-700 mt-1 font-medium">{callNotes}</p>
                      </div>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                    Interaction History (Date-wise)
                  </h4>
                  {timeline.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No interaction timeline events recorded yet.
                    </p>
                  ) : (
                    <div className="interaction-timeline">
                      {timeline.map((item, idx) => (
                        <div key={item.id || idx} className="timeline-item">
                          <span className="timeline-bullet" />
                          <div className="timeline-date-time">
                            <Clock size={12} />
                            {formatTimelineDate(item.created_at)}
                          </div>
                          <div className="timeline-title">
                            {item.title || item.activity_type || item.action}
                          </div>
                          <div className="timeline-desc">
                            {item.description || item.remarks || "No details recorded"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ================= Footer ================= */}
        <div className="lead-drawer-footer">
          <button
            type="button"
            className="drawer-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          {!isReadOnly ? (
            <div className="flex items-center gap-3">
              {activeTab === "step1" && (
                <button
                  type="button"
                  className="drawer-btn-primary"
                  onClick={() => setActiveTab("step2")}
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {activeTab === "step2" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="drawer-btn-secondary"
                    onClick={() => setActiveTab("step1")}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="drawer-btn-primary"
                    onClick={() => setActiveTab("step3")}
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {activeTab === "step3" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="drawer-btn-secondary"
                    onClick={() => setActiveTab("step2")}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="drawer-btn-primary"
                    disabled={saving}
                    onClick={handleUnifiedSave}
                  >
                    <Save size={16} />
                    <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              Read-Only CRM Audit Drawer
            </span>
          )}
        </div>
      </aside>
    </>
  );
};

export default LeadDetailsDrawer;
