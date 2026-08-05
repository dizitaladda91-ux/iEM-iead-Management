import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Mail,
  Phone,
  Shield,
  X,
  AlertCircle,
  UserCheck
} from "lucide-react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  restoreEmployee,
  getEmployeeStatistics,
} from "../../services/employeeService";
import axiosInstance from "../../api/axiosInstance";
import "./EmployeeManagement.css";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    counsellors: 0,
    managers: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile: "",
    designation: "",
    department_id: "",
    role: "COUNSELLOR",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
    joining_date: new Date().toISOString().split("T")[0],
    password: "", // Optional for new user account creation
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      if (deptFilter) params.department_id = deptFilter;

      const res = await getEmployees(params);
      const data = res.data || res.employees || (Array.isArray(res) ? res : []);
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter, deptFilter]);

  const fetchStats = async () => {
    try {
      const res = await getEmployeeStatistics();
      if (res.data) {
        setStats({
          totalEmployees: res.data.total_employees || res.data.totalEmployees || 0,
          activeEmployees: res.data.active_employees || res.data.activeEmployees || 0,
          counsellors: res.data.total_counsellors || res.data.counsellors || 0,
          managers: res.data.total_managers || res.data.managers || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching employee statistics:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get("/departments");
      const list = res.data?.data || res.data?.departments || (Array.isArray(res.data) ? res.data : []);
      setDepartments(list);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStats();
    fetchDepartments();
  }, [fetchEmployees]);

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      full_name: "",
      email: "",
      mobile: "",
      designation: "",
      department_id: "",
      role: "COUNSELLOR",
      employment_type: "FULL_TIME",
      status: "ACTIVE",
      joining_date: new Date().toISOString().split("T")[0],
      password: "",
    });
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      full_name: emp.full_name || "",
      email: emp.email || "",
      mobile: emp.mobile || "",
      designation: emp.designation || "",
      department_id: emp.department_id || "",
      role: emp.role || "COUNSELLOR",
      employment_type: emp.employment_type || "FULL_TIME",
      status: emp.status || "ACTIVE",
      joining_date: emp.joining_date ? emp.joining_date.split("T")[0] : "",
      password: "",
    });
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
        setFormSuccess("Employee updated successfully!");
      } else {
        await createEmployee(formData);
        setFormSuccess("Employee created successfully!");
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchEmployees();
        fetchStats();
      }, 1000);
    } catch (err) {
      console.error("Form submit error:", err);
      setFormError(err.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete employee ${name}?`)) return;
    try {
      await deleteEmployee(id);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete employee");
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreEmployee(id);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore employee");
    }
  };

  return (
    <div className="employee-mgmt-container">
      {/* Header */}
      <div className="employee-mgmt-header">
        <div>
          <h1 className="header-title">Employee Management</h1>
          <p className="header-subtitle">Manage system users, counselors, and staff members</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <UserPlus size={18} />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="emp-stats-grid">
        <div className="emp-stat-card">
          <div className="stat-icon-wrapper blue">
            <Users size={22} />
          </div>
          <div>
            <div className="stat-label">Total Staff</div>
            <div className="stat-value">{stats.totalEmployees || employees.length}</div>
          </div>
        </div>

        <div className="emp-stat-card">
          <div className="stat-icon-wrapper green">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="stat-label">Active Employees</div>
            <div className="stat-value">{stats.activeEmployees || employees.filter(e => e.status === "ACTIVE").length}</div>
          </div>
        </div>

        <div className="emp-stat-card">
          <div className="stat-icon-wrapper purple">
            <Shield size={22} />
          </div>
          <div>
            <div className="stat-label">Counsellors</div>
            <div className="stat-value">{stats.counsellors || employees.filter(e => e.role === "COUNSELLOR").length}</div>
          </div>
        </div>

        <div className="emp-stat-card">
          <div className="stat-icon-wrapper orange">
            <Briefcase size={22} />
          </div>
          <div>
            <div className="stat-label">Managers</div>
            <div className="stat-value">{stats.managers || employees.filter(e => e.role === "MANAGER").length}</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="emp-filters-card">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, code or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <Filter size={16} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="COUNSELLOR">Counsellor</option>
            </select>
          </div>

          {departments.length > 0 && (
            <div className="filter-item">
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="btn-secondary icon-btn" onClick={fetchEmployees} title="Refresh Table">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="emp-table-container">
        {loading ? (
          <div className="emp-loading-state">
            <RefreshCw size={28} className="spin text-blue-600" />
            <p>Loading employee records...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="emp-empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No Employees Found</h3>
            <p>Try adjusting your search filters or click "Add New Employee" to register staff.</p>
          </div>
        ) : (
          <table className="emp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className={emp.is_deleted ? "deleted-row" : ""}>
                  <td className="font-mono text-sm font-semibold">{emp.employee_code || `#${emp.id}`}</td>
                  <td>
                    <div className="emp-profile-cell">
                      <div className="avatar-circle">
                        {emp.full_name?.charAt(0).toUpperCase() || "E"}
                      </div>
                      <div>
                        <div className="emp-name">{emp.full_name}</div>
                        <div className="emp-desig">{emp.designation || "Staff"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <span><Mail size={14} /> {emp.email}</span>
                      <span><Phone size={14} /> {emp.mobile}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${emp.role?.toLowerCase()}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td>{emp.department_name || emp.Department?.department_name || "General"}</td>
                  <td>
                    <span className={`status-pill ${emp.status?.toLowerCase()}`}>
                      {emp.status === "ACTIVE" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-btn edit" onClick={() => handleOpenEditModal(emp)} title="Edit Employee">
                        <Edit2 size={16} />
                      </button>
                      {emp.is_deleted ? (
                        <button className="action-btn restore" onClick={() => handleRestore(emp.id)} title="Restore Employee">
                          <RefreshCw size={16} />
                        </button>
                      ) : (
                        <button className="action-btn delete" onClick={() => handleDelete(emp.id, emp.full_name)} title="Deactivate/Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="emp-modal">
            <div className="modal-header">
              <h2>{editingEmployee ? "Edit Employee Details" : "Create New Employee"}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="form-alert error">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="form-alert success">
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="emp-modal-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Anish Sharma"
                  />
                </div>

                <div className="form-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="anish@iemlms.com"
                  />
                </div>

                <div className="form-field">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="form-field">
                  <label>Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Admissions Counsellor"
                  />
                </div>

                <div className="form-field">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="COUNSELLOR">Counsellor</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                {departments.length > 0 && (
                  <div className="form-field">
                    <label>Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-field">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingEmployee ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
