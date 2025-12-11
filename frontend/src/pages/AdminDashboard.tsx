
import "../assets/css/core.scss";
import "../assets/css/demo.css";
import "../assets/css/app-logistics-dashboard.css";
import React, {
    useEffect,
    useMemo,
    useState,
    FormEvent,
    ChangeEvent,
} from "react";

import {
    getAdminNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    AdminNotification, LeaveRequest,
    TaskCreateData, updateLeaveRequestStatus, LeaveStatus, createNewTask, getAllLeaveRequests
} from "../services/AdminService";

import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getUnassignedTasks,
    getMyTasks,
    assignTaskToMe,
    assignTask,
    unassignTask,
    generateMonthlyReport,
    importEmployeesXml,
    AdminTask,
    AdminUser,
    Assignment,
    MonthlyReport, getAssignmentsByTask, getAllMonthlyReports, updateTask,
    calculatePayroll,
    getPayrollHistory,
    Payroll,
    TaskPayload,
} from "../services/AdminService";

import "../assets/css/core.scss";
import "../assets/css/demo.css";
import "../assets/css/app-logistics-dashboard.css";
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip, XAxis,
    YAxis
} from "recharts";

type View =
    | "TASKS_UNASSIGNED"
    | "MY_TASKS"
    | "EMPLOYEES"
    | "ASSIGNMENTS"
    | "REPORTS"
    | "PAYROLL"
    | "ANALYTICS"
    | "LEAVE_REQUESTS";

type ModalType =
    | "NONE"
    | "ADD_EMP"
    | "EDIT_EMP"
    | "DEL_EMP"
    | "ASSIGN"
    | "UNASSIGN"
    | "ASSIGN_TO_ME"
    | "VIEW_ASSIGNMENTS"
    | "GENERATE_REPORT"
    | "IMPORT_XML"
    |"EDIT_TASK"
    |"CALCULATE_PAYROLL"
    | "VIEW_PAYROLL_HISTORY"
    | "CREATE_TASK"
    | "VIEW_LEAVE_DETAILS";

type TableRow = {
    id: number;
    Title: string;
    Type: string;
    Difficulty: number;
    RequiredSkills: string;
    PlannedDuration: number;
    PredictedDuration: number;
    Deadline: string;
    Priority: number;
    Revenue: number;
    OtherCosts: number;
    Status: string;
}

type TableRow1= {
    id: number;
    Username: string;
    Email: string;
    Status: string;
    Role: string;
    actions?: React.ReactNode;
};

function Modal({
                   open,
                   title,
                   onClose,
                   children,
                   onSubmit,
                   submitLabel = "Salvează",
               }: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
    submitLabel?: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 d-flex align-items-center justify-content-center">
            <div className="position-absolute top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-50" onClick={onClose} />
            <form
                onSubmit={onSubmit}
                className="position-relative bg-white rounded-3 shadow p-4"
                style={{ width: "min(680px, 96vw)", maxHeight: "90vh", overflow: "auto" }}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">{title}</h5>
                    <button
                        type="button"
                        className="btn btn-sm btn-light rounded-circle"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                <div className="mb-3">{children}</div>
                {onSubmit && (
                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                            Anulează
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {submitLabel}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default function AdminDashboard() {
    const [view, setView] = useState<View>("TASKS_UNASSIGNED");
    const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
    const [currentPayroll, setCurrentPayroll] = useState<Payroll | null>(null);
    const [employees, setEmployees] = useState<AdminUser[]>([]);
    const [unassignedTasks, setUnassignedTasks] = useState<AdminTask[]>([]);
    const [myTasks, setMyTasks] = useState<AdminTask[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [allReports, setAllReports] = useState<MonthlyReport[]>([]);
    const [viewMode, setViewMode] = useState<'view' | 'generate'>('view');
    const [modal, setModal] = useState<ModalType>("NONE");
    const [form, setForm] = useState<any>({});
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState<boolean>(false);
    const [taskDistributionData, setTaskDistributionData] = useState<{name: string, value: number}[]>([]);
    const [revenueTrendData, setRevenueTrendData] = useState<any[]>([]);
    const [employeePerformanceData, setEmployeePerformanceData] = useState<any[]>([]);
    const [taskProgressRows, setTaskProgressRows] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [taskCreateForm, setTaskCreateForm] = useState<TaskCreateData>({
        title: '',
        type: 'DEVELOPMENT',
        difficulty: 1,
        requiredSkills: [],
        plannedDuration: 1,
        predictedDuration: 1,
        deadline: new Date().toISOString().split('T')[0],
        priority: 1,
        revenue: 0,
        otherCosts: 0,
        status: 'NEW'
    });

    useEffect(() => {
        if (view === "LEAVE_REQUESTS") {
            loadLeaveRequests();
        }
    }, [view]);

    const loadLeaveRequests = async () => {
        try {
            const data = await getAllLeaveRequests();
            setLeaveRequests(data);
            console.log("📋 Leave requests loaded:", data);
        } catch (error) {
            console.error("❌ Error loading leave requests:", error);
            setLeaveRequests([]);
        }
    };
    const submitCreateTask = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log("📝 Creating new task with data:", taskCreateForm);
        if (!taskCreateForm.title || !taskCreateForm.type) {
            alert("Title and type are required!");
            return;
        }

        try {
            console.log("🔄 Submitting task creation...");
            const formattedData: TaskCreateData = {
                ...taskCreateForm,
                requiredSkills: typeof taskCreateForm.requiredSkills === 'string'
                    ? taskCreateForm.requiredSkills.split(',').map(skill => skill.trim())
                    : taskCreateForm.requiredSkills
            };

            const newTask = await createNewTask(formattedData);

            console.log("✅ Task created successfully:", newTask);

            await Promise.all([refreshUnassigned(), refreshMyTasks()]);

            setTaskCreateForm({
                title: '',
                type: 'DEVELOPMENT',
                difficulty: 1,
                requiredSkills: [],
                plannedDuration: 1,
                predictedDuration: 1,
                deadline: new Date().toISOString().split('T')[0],
                priority: 1,
                revenue: 0,
                otherCosts: 0,
                status: 'NEW'
            });

            close();
            alert('Task created successfully!');

        } catch (error) {
            console.error("❌ Error creating task:", error);
           // alert("Error creating task: " + error.message);
        }
    };

    const handleUpdateLeaveStatus = async (leaveId: number, status: LeaveStatus, comment?: string) => {
        try {
            console.log(`🔄 Updating leave request ${leaveId} to ${status}...`);

            await updateLeaveRequestStatus(leaveId, status, comment);

            // Reîncarcă lista de cereri
            await loadLeaveRequests();

            alert(`Leave request ${status.toLowerCase()} successfully!`);

        } catch (error) {
            console.error("❌ Error updating leave status:", error);
            // @ts-ignore
            alert("Error updating leave status: " + error.message);
        }
    };

    const loadNotifications = async () => {
        try {
            const data = await getAdminNotifications();
            setNotifications(data);
        } catch (err) {
            console.error("❌ Error loading notifications:", err);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch (err) {
            console.error("❌ Error loading unread count:", err);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await markNotificationAsRead(id);
            loadNotifications();
            loadUnreadCount();
        } catch (err) {
            console.error("❌ Error marking notification as read:", err);
        }
    };

    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(() => {
            loadUnreadCount();
        }, 5000); // refresh la 5 secunde

        return () => clearInterval(interval);
    }, []);

    const prepareTaskDistributionData = () => {
        const allTasks = [...unassignedTasks, ...myTasks];
        const statusCounts: Record<string, number> = {};

        allTasks.forEach(task => {
            const status = task.status || 'NEW';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return Object.entries(statusCounts).map(([name, value]) => ({
            name: name.replace('_', ' '),
            value
        }));
    };

    const prepareRevenueTrendData = () => {
        if (allReports.length === 0) return [];

        const sortedReports = [...allReports].sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1);
            const dateB = new Date(b.year, b.month - 1);
            return dateA.getTime() - dateB.getTime();
        });

        return sortedReports.slice(-10).map(report => ({
            period: `${report.month}/${report.year}`,
            revenue: report.totalRevenue || 0,
            costs: report.totalCosts || 0,
            profit: (report.totalRevenue || 0) - (report.totalCosts || 0)
        }));
    };

    const prepareEmployeePerformanceData = () => {
        const employeesWithPerformance = employees.filter(emp => emp.role === "EMPLOYEE");

        return employeesWithPerformance.slice(0, 10).map((emp, index) => ({
            name: emp.name || emp.username,
            tasksCompleted: Math.floor(Math.random() * 50) + 10, // Date de exemplu
            productivity: Math.floor(Math.random() * 100),
            rating: (Math.random() * 5).toFixed(1)
        }));
    };

    const prepareTaskProgressRows = () => {
        return myTasks.filter(task => task.status === "IN_PROGRESS" || task.status === "ASSIGNED")
            .slice(0, 8)
            .map(task => ({
                code: `TASK-${task.id}`,
                //start: new Date(task.createdAt || Date.now()).toLocaleDateString(),
                end: task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A",
                warning: task.priority === 5 ? "High Priority" : task.priority === 4 ? "Medium" : "Normal",
                progress: Math.floor(Math.random() * 100) // În aplicația reală, ar trebui să fie calculat
            }));
    };

    useEffect(() => {
        setTaskDistributionData(prepareTaskDistributionData());
        setRevenueTrendData(prepareRevenueTrendData());
        setEmployeePerformanceData(prepareEmployeePerformanceData());
        setTaskProgressRows(prepareTaskProgressRows());
    }, [unassignedTasks, myTasks, allReports, employees]);


    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const fetchAllReports = async () => {
        try {
            const reports = await getAllMonthlyReports();
            setAllReports(reports);
            console.log("📊 All reports loaded:", reports);
        } catch (error) {
            console.error("❌ Error loading all reports:", error);
            setAllReports([]);
        } finally {
        }
    };
    const submitCalculatePayroll = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { employeeId, month, year, bonuses, deductions } = form;

        console.log("📝 Calculate payroll form submitted:", { employeeId, month, year, bonuses, deductions });

        if (!employeeId || !month || !year) {
            alert("ID-ul angajatului, luna și anul sunt obligatorii!");
            return;
        }

        try {
            console.log("🔄 Calculating payroll...");

            const payrollData = {
                employeeId: Number(employeeId),
                month: Number(month),
                year: Number(year),
                bonuses: bonuses ? Number(bonuses) : 0,
                deductions: deductions ? Number(deductions) : 0
            };

            console.log("📤 Sending payroll data:", payrollData);

            const result = await calculatePayroll(payrollData);

            console.log("✅ Payroll calculated successfully:", result);
            setCurrentPayroll(result);

            alert(`Salariu calculat cu succes!\nSalariu net: $${result.netSalary.toFixed(2)}`);
            await fetchPayrollHistory();

            close();

        } catch (error) {
            console.error("❌ Error calculating payroll:", error);
           // alert("Eroare la calculul salariului: " + error.message);
        }
    };

    const fetchPayrollHistory = async () => {
        try {
            const history = await getPayrollHistory();
            setPayrollHistory(Array.isArray(history) ? history : []);
            console.log("📊 Payroll history loaded:", history);
        } catch (error) {
            console.error("❌ Error loading payroll history:", error);
            setPayrollHistory([]);
        }
    };

    const open = (m: ModalType, initial?: any) => {
        setForm(initial || {});
        setModal(m);
    };
    const close = () => {
        setModal("NONE");
        setForm({});
    };

    useEffect(() => {
        if (view === "PAYROLL") {
            fetchPayrollHistory();
        }
    }, [view]);

    useEffect(() => {
        if (view === "EMPLOYEES") {
            console.log("👀 View changed to EMPLOYEES, loading employees...");
            const loadEmployees = async () => {
                try {
                    const data = await getEmployees();
                    console.log("📥 Employees loaded on view change:", data);
                    setEmployees(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Error loading employees:", error);
                }
            };
            loadEmployees();
        }
    }, [view]);

    useEffect(() => {
        if (form.executeEditTask && form.taskId) {
            const editTask = async () => {
                try {
                    console.log("🔄 Editing task...");
                    console.log("Task ID:", form.taskId);
                    console.log("Edit data:", form);

                    const updateData: any = {};

                    if (form.title !== undefined) updateData.title = form.title;
                    if (form.type !== undefined) updateData.type = form.type;
                    if (form.difficulty !== undefined) updateData.difficulty = Number(form.difficulty);
                    if (form.requiredSkills !== undefined) updateData.requiredSkills = form.requiredSkills;
                    if (form.plannedDuration !== undefined) updateData.plannedDuration = Number(form.plannedDuration);
                    if (form.predictedDuration !== undefined) updateData.predictedDuration = Number(form.predictedDuration);
                    if (form.deadline !== undefined) updateData.deadline = form.deadline;
                    if (form.priority !== undefined) updateData.priority = Number(form.priority);
                    if (form.revenue !== undefined) updateData.revenue = Number(form.revenue);
                    if (form.otherCosts !== undefined) updateData.otherCosts = Number(form.otherCosts);
                    if (form.status !== undefined) updateData.status = form.status;

                    console.log("📤 Sending task update data:", updateData);
                    await updateTask(Number(form.taskId), updateData);

                    console.log("✅ Task updated successfully!");
                    await Promise.all([refreshUnassigned(), refreshMyTasks()]);

                    setForm({});

                } catch (error) {
                    console.error("❌ Error editing task:", error);
                    setForm((prev: any) => ({ ...prev, executeEditTask: false }));
                }
            };

            editTask();
        }
    }, [form.executeEditTask, form.taskId, form.title, form.type, form.difficulty, form.requiredSkills, form.plannedDuration, form.predictedDuration, form.deadline, form.priority, form.revenue, form.otherCosts, form.status]);

    useEffect(() => {
        if (form.executeEditEmployee && form.id) {
            const editEmployee = async () => {
                try {
                    console.log("🔄 Editing employee...");
                    console.log("Employee ID:", form.id);
                    console.log("Edit data:", {
                        name: form.name,
                        email: form.email,
                        username: form.username,
                        active: form.active
                    });

                    const updateData: any = {};

                    if (form.name !== undefined) updateData.name = form.name;
                    if (form.email !== undefined) updateData.email = form.email;
                    if (form.username !== undefined) updateData.username = form.username;
                    if (form.active !== undefined) updateData.active = form.active;
                    if (form.role !== undefined) updateData.role = form.role;
                    if (form.hourlyRate !== undefined) updateData.hourlyRate = Number(form.hourlyRate);
                    if (form.seniority !== undefined) updateData.seniority = form.seniority;

                    console.log("📤 Sending update data:", updateData);

                    await updateEmployee(Number(form.id), updateData);

                    console.log("✅ Employee updated successfully!");

                    await refreshEmployees();

                    setForm({});

                } catch (error) {
                    console.error("❌ Error editing employee:", error);
                    setForm((prev: any) => ({ ...prev, executeEditEmployee: false }));
                }
            };

            editEmployee();
        }
    }, [form.executeEditEmployee, form.id, form.name, form.email, form.username, form.active, form.role, form.hourlyRate, form.seniority]);

    useEffect(() => {
        if (view === "TASKS_UNASSIGNED") {
            const loadUnassignedTasks = async () => {
                try {
                    const data = await getUnassignedTasks();

                    console.log("=== DEBUG UNASSIGNED TASKS ===");
                    console.log("Full data:", data);

                    if (Array.isArray(data)) {
                        data.forEach((task, index) => {
                            console.log(`Task ${index}:`, {
                                id: task.id,
                                status: task.status,
                                allProperties: Object.keys(task)
                            });
                        });

                        const filteredTasks = data.filter(task => {
                            const hasStatus = task.status !== undefined && task.status !== null;
                            const isNotAssigned = task.status !== "ASSIGNED";
                            return hasStatus && isNotAssigned;
                        });

                        console.log("Final filtered tasks:", filteredTasks);
                        setUnassignedTasks(filteredTasks);
                    } else {
                        console.log("Data is not an array");
                        setUnassignedTasks([]);
                    }

                } catch (error) {
                    console.error("Error loading unassigned tasks:", error);
                    setUnassignedTasks([]);
                }
            };
            loadUnassignedTasks();
        }
    }, [view]);

    useEffect(() => {
        if (view === "MY_TASKS") {
            const loadMyTasks = async () => {
                try {
                    const data = await getMyTasks();
                    console.log("My tasks loaded:", data);
                    setMyTasks(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Error loading my tasks:", error);
                } finally {
                }
            };
            loadMyTasks();
        }
    }, [view]);

    useEffect(() => {
        if (view === "ASSIGNMENTS" && form.taskId) {
            const loadAssignments = async () => {
                try {
                    console.log("🔄 Loading assignments for task ID:", form.taskId);
                    const data = await getAssignmentsByTask(Number(form.taskId));
                    console.log("✅ Task assignments loaded:", data);
                    setAssignments(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("❌ Error loading task assignments:", error);
                    setAssignments([]);
                }
            };
            loadAssignments();
        }
    }, [view, form.taskId]);

    useEffect(() => {

        if (form.taskId && form.employeeId && form.autoAssign) {
            const assignTaskToEmployee = async () => {
                try {
                    console.log("🔄 Auto-assigning task to employee...");
                    console.log("Task ID:", form.taskId);
                    console.log("Employee ID:", form.employeeId);

                    await assignTask(Number(form.taskId), Number(form.employeeId));

                    console.log("✅ Task assigned successfully!");

                    await Promise.all([refreshUnassigned(), refreshMyTasks()]);

                    setForm({});

                } catch (error) {
                    console.error("❌ Error auto-assigning task:", error);
                }
            };

            assignTaskToEmployee();
        }
    }, [form.taskId, form.employeeId, form.autoAssign]);

    useEffect(() => {

        if (form.taskId && form.autoAssign) {
            const assignTaskToMe = async () => {
                try {
                    console.log("🔄 Auto-assigning task to admin...");
                    console.log("Task ID:", form.taskId);
                    console.log("Admin ID:", form.employeeId);

                    await assignTaskToMe();

                    console.log("✅ Task assigned successfully!");

                    await Promise.all([refreshMyTasks(), refreshMyTasks()]);

                    setForm({});

                } catch (error) {
                    console.error("❌ Error auto-assigning task:", error);
                }
            };

            assignTaskToMe();
        }
    }, [form.taskId, form.employeeId, form.autoAssign]);

    useEffect(() => {
        if (form.executeUnassign && form.unassignTaskId && form.unassignEmployeeId) {
            const performUnassign = async () => {
                try {
                    console.log("🔄 Executing unassign...");
                    console.log("Task ID:", form.unassignTaskId);
                    console.log("Employee ID:", form.unassignEmployeeId);
                    await unassignTask(
                        Number(form.unassignTaskId),
                        Number(form.unassignEmployeeId)
                    );

                    console.log("✅ Task unassigned successfully!");
                    await refreshUnassigned();
                    await refreshMyTasks();

                    setForm({});

                } catch (error) {
                    console.error("❌ Error unassigning task:", error);
                    setForm((prev: any) => ({ ...prev, executeUnassign: false }));
                }
            };

            performUnassign();
        }
    }, [form.executeUnassign, form.unassignTaskId, form.unassignEmployeeId]);

    useEffect(() => {
        if (form.executeGenerateReport && form.employeeId && form.year && form.month) {
            const generateReport = async () => {
                try {
                    console.log("🔄 Generating monthly report...");
                    console.log("Employee ID:", form.employeeId);
                    console.log("Year:", form.year);
                    console.log("Month:", form.month);

                    const data = await generateMonthlyReport(
                        Number(form.employeeId),
                        Number(form.year),
                        Number(form.month)
                    );

                    console.log("✅ Monthly report generated:", data);
                    setReport(data);
                    setView("REPORTS");
                    setForm({});

                } catch (error) {
                    console.error("❌ Error generating monthly report:", error);
                    setForm((prev: any) => ({ ...prev, executeGenerateReport: false }));
                }
            };

            generateReport();
        }
    }, [form.executeGenerateReport, form.employeeId, form.year, form.month]);

    useEffect(() => {
        if (view === "REPORTS") {
            fetchAllReports();
        }
    }, [view]);

    const refreshEmployees = async () => {
        try {
            console.log("🔄 Refreshing employees list...");
            const data = await getEmployees();
            console.log("📋 Employees data received:", data);
            console.log("📊 Is array?", Array.isArray(data));
            console.log("🔢 Number of employees:", data.length);

            setEmployees(Array.isArray(data) ? data : []);

            console.log("✅ Employees state updated");
        } catch (error) {
            console.error("❌ Error refreshing employees:", error);
            setEmployees([]);
        }
    };
    const refreshUnassigned = async () => setUnassignedTasks(await getUnassignedTasks());
    const refreshMyTasks = async () => setMyTasks(await getMyTasks());

    const submitAddEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { username, password, role, active, name, email, hourlyRate, seniority } = form;

        console.log("📝 Add employee form submitted:", { username, password, role });

        if (!username || !password) {
            console.error("❌ Username and password are required");
            alert("Username și parola sunt obligatorii!");
            return;
        }

        try {
            console.log("🔄 Calling createEmployee API...");

            const employeeData = {
                username: username,
                password: password,
                role: role || "EMPLOYEE",
                active: active !== undefined ? active : true,
                name: name || username,
                email: email || `${username}@company.com`,
                hourlyRate: hourlyRate ? Number(hourlyRate) : 0,
                seniority: seniority || "JUNIOR"
            };

            console.log("📤 Sending to backend:", employeeData);

            const newEmployee = await createEmployee(employeeData);

            console.log("✅ Employee created successfully:", newEmployee);

            await refreshEmployees();

            console.log("🔄 Employees list refreshed");

            close();

        } catch (error) {
            console.error("❌ Error creating employee:", error);
            // @ts-ignore
            alert("Eroare la crearea angajatului: " + error.message);
        }
    };

    const submitEditEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { id, name, email, username, active, role, hourlyRate, seniority } = form;

        console.log("📝 Edit employee form submitted:", { id, name, email, username, active });

        if (!id) {
            console.error("❌ Employee ID is required");
            alert("ID-ul angajatului este obligatoriu!");
            return;
        }

        try {
            console.log("🔄 Step 1: Calling updateEmployee API...");

            const updateData: any = {
                name: name,
                email: email,
                username: username,
                active: active,
                role: role,
                hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
                seniority: seniority
            };

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === "") {
                    delete updateData[key];
                }
            });

            console.log("📤 Step 2: Sending update data:", updateData);

            await updateEmployee(Number(id), updateData);

            console.log("✅ Step 3: Employee updated successfully in database!");

            console.log("⏳ Step 4: Waiting for server processing...");
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log("🔄 Step 5: Refreshing employees list...");
            await refreshEmployees();
            console.log("🔍 Step 6: Current employees state:", employees);

            console.log("✅ Step 7: Closing modal");
            close();

        } catch (error) {
            console.error("❌ Error editing employee:", error);
            // @ts-ignore
            alert("Eroare la editarea angajatului: " + error.message);
        }
    };


    const submitDeleteEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { id } = form;

        console.log("📝 Delete employee form submitted:", { id });

        if (!id) {
            console.error("❌ Employee ID is required for deletion");
            alert("ID-ul angajatului este obligatoriu pentru ștergere!");
            return;
        }

        const employeeId = Number(id);

        const confirmed = window.confirm(`Ești sigur că vrei să ștergi angajatul cu ID-ul ${employeeId}? Această acțiune este ireversibilă.`);

        if (!confirmed) {
            console.log("❌ Deletion cancelled by user");
            close();
            return;
        }

        try {
            console.log("🔄 Calling deleteEmployee API...");

            await deleteEmployee(employeeId);

            console.log("✅ Employee deleted successfully!");

            await refreshEmployees();

            console.log("🔄 Employees list refreshed after deletion");

            close();

        } catch (error) {
            console.error("❌ Error deleting employee:", error);
            // @ts-ignore
            alert("Eroare la ștergerea angajatului: " + error.message);
        }
    };

    const submitEditTask = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, title, type, difficulty, requiredSkills, plannedDuration, predictedDuration, deadline, priority, revenue, otherCosts, status } = form;

        console.log("🔍 DEBUG - Original requiredSkills:", requiredSkills);
        console.log("🔍 DEBUG - Type of requiredSkills:", typeof requiredSkills);

        if (!taskId) {
            console.error("❌ Task ID is required");
            alert("ID-ul task-ului este obligatoriu!");
            return;
        }

        try {
            console.log("🔄 Step 1: Preparing update data...");

            let formattedDeadline = undefined;
            if (deadline) {
                if (deadline.includes('/')) {
                    const [month, day, year] = deadline.split('/');
                    formattedDeadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                } else {
                    formattedDeadline = deadline;
                }
                console.log("🔧 Formatted deadline:", formattedDeadline);
            }

            let formattedSkills = undefined;
            if (requiredSkills) {
                if (Array.isArray(requiredSkills)) {
                    formattedSkills = requiredSkills.join(', ');
                    console.log("🔧 Converted array to string:", formattedSkills);
                } else if (typeof requiredSkills === 'string') {

                    try {
                        const parsed = JSON.parse(requiredSkills);
                        if (Array.isArray(parsed)) {
                            formattedSkills = parsed.join(', ');
                            console.log("🔧 Parsed JSON array to string:", formattedSkills);
                        } else {
                            formattedSkills = requiredSkills;
                        }
                    } catch {

                        formattedSkills = requiredSkills;
                    }
                }
            }

            const updateData: any = {
                title: title,
                type: type,
                difficulty: difficulty ? Number(difficulty) : undefined,
                plannedDuration: plannedDuration ? Number(plannedDuration) : undefined,
                predictedDuration: predictedDuration ? Number(predictedDuration) : undefined,
                deadline: formattedDeadline,
                priority: priority ? Number(priority) : undefined,
                revenue: revenue ? Number(revenue) : undefined,
                otherCosts: otherCosts ? Number(otherCosts) : undefined,
                status: status,
                requiredSkills: formattedSkills
            };

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === "" ||
                    (Array.isArray(updateData[key]) && updateData[key].length === 0)) {
                    delete updateData[key];
                }
            });

            console.log("📤 Step 2: Sending update data:", updateData);

            await updateTask(Number(taskId), updateData);

            console.log("✅ Step 3: Task updated successfully in database!");

            console.log("🔄 Step 4: Refreshing task lists...");
            await Promise.all([refreshUnassigned(), refreshMyTasks()]);

            console.log("✅ Step 5: Closing modal");
            close();

        } catch (error) {
            console.error("❌ Error editing task:", error);
            // @ts-ignore
            alert("Eroare la editarea task-ului: " + error.message);
        }
    };

    const submitAssign = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, employeeId } = form;
        if (!taskId || !employeeId) return;
        try {
            await assignTask(Number(taskId), Number(employeeId));
            await refreshUnassigned(); // ✅ Refresh după asignare
        } catch (error) {
            console.error("Error assigning task:", error);
        } finally {
            close();
        }
    };


    const submitUnassign = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, employeeId } = form;
        if (!taskId || !employeeId) return;
        await unassignTask(Number(taskId), Number(employeeId));
        close();
    };


    const submitAssignToMe = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId } = form;
        if (!taskId) return;
        try {
            await assignTaskToMe(Number(taskId));
            await Promise.all([refreshUnassigned(), refreshMyTasks()]);
        } catch (error) {
            console.error("Error assigning task to me:", error);
        } finally {
            close();
        }
    };

    const submitViewAssignments = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId } = form;

        console.log("=== DEBUG TASK ASSIGNMENTS ===");
        console.log("Task ID from form:", taskId);

        if (!taskId) {
            console.error("❌ No task ID provided");
            return;
        }

        try {
            console.log("🔄 Calling getAssignmentsByTask with ID:", taskId);
            const data = await getAssignmentsByTask(Number(taskId));
            console.log("✅ Task assignments loaded:", data);

            const allEmployees = await getEmployees();

            const assignmentsWithEmployeeNames = data.map((assignment: any) => {
                const employee = allEmployees.find((emp: any) => emp.id === assignment.employeeId);
                return {
                    ...assignment,
                    employeeName: employee ? employee.name : `Employee #${assignment.employeeId}`
                };
            });

            console.log("✅ Assignments with employee names:", assignmentsWithEmployeeNames);
            setAssignments(Array.isArray(assignmentsWithEmployeeNames) ? assignmentsWithEmployeeNames : []);
            setView("ASSIGNMENTS");
        } catch (error) {
            console.error("❌ Error loading task assignments:", error);
        } finally {
            close();
        }
    };

    const submitGenerateReport = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { employeeId, year, month } = form;

        if (!employeeId || !year || !month) {
            alert("Toate câmpurile sunt obligatorii!");
            return;
        }

        console.log("📝 Generate report form submitted:", { employeeId, year, month });

        try {
            const newReport = await generateMonthlyReport(
                Number(employeeId),
                Number(year),
                Number(month)
            );

            console.log("✅ Monthly report generated:", newReport);

            await fetchAllReports();

            setViewMode('view');

            alert('Report generated successfully!');
            close();
        } catch (error) {
            console.error("❌ Error generating monthly report:", error);
            alert('Error generating report. Please try again.');
        } finally {
        }
    };

    const submitImportXml = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const file: File | undefined = form.file;
        if (!file) return;
        await importEmployeesXml(file);
        await refreshEmployees();
        close();
    };

    const taskStats = useMemo(
        () => ({
            unassigned: unassignedTasks.length,
            myTasks: myTasks.length,
            highPriority: myTasks.filter((t) => (t.priority ?? 0) === 5).length, // ✅ Schimbat aici
            totalEmployees: employees.length,
        }),
        [unassignedTasks, myTasks, employees]
    );

    const tableRows: TableRow[] = useMemo(() => {
        if (view === "TASKS_UNASSIGNED") {
            return unassignedTasks.map<TableRow>(t => ({
                id: t.id,
                Title: t.title,
                Type: t.type || "-",
                Difficulty: t.difficulty || 0,
                RequiredSkills: t.requiredSkills ? JSON.stringify(t.requiredSkills) : "-",
                PlannedDuration: t.plannedDuration || 0,
                PredictedDuration: t.predictedDuration || 0,
                Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : "-",
                Priority: t.priority || 0,
                Revenue: t.revenue || 0,
                OtherCosts: t.otherCosts || 0,
                Status: t.status || "NEW"
            }));
        }

        if (view === "MY_TASKS") {
            return myTasks.map<TableRow>(t => ({
                id: t.id,
                Title: t.title,
                Type: t.type || "-",
                Difficulty: t.difficulty || 0,
                RequiredSkills: t.requiredSkills ? JSON.stringify(t.requiredSkills) : "-",
                PlannedDuration: t.plannedDuration || 0,
                PredictedDuration: t.predictedDuration || 0,
                Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : "-",
                Priority: t.priority || 0,
                Revenue: t.revenue || 0,
                OtherCosts: t.otherCosts || 0,
                Status: t.status || "NEW"
            }));
        }


        return [];
    }, [unassignedTasks, myTasks, view]);
    const tableRows1: TableRow1[] = useMemo(() => {
        if (view === "EMPLOYEES") {
            const employeesOnly = employees.filter(user => user.role === "EMPLOYEE");
            return employeesOnly.map<TableRow1>(user => ({
                id: user.id,
                Username: user.username,
                Email: user.username.includes('@') ? user.username : `${user.username}@company.com`,
                Status: user.active ? "✅ Active" : "❌ Inactive",
                Role: `Role: ${user.role}`,
                actions: undefined,
            }));
        }

        return [];

    }, [employees, view]);


    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-page">
                {/* Navbar Vuexy-like */}
                <nav className="layout-navbar navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <a className="navbar-brand" href="#">
                            Platforma Admin
                        </a>
                        <div className="d-flex align-items-center gap-2 position-relative">
                            <span className="text-muted small me-3">Admin Panel</span>

                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.href = "/login";
                                }}
                            >
                                Logout
                            </button>

                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    loadNotifications();
                                }}
                                style={{
                                    position: "relative",
                                    padding: "10px",
                                    fontSize: "18px",
                                    cursor: "pointer"
                                }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "-5px",
                                            right: "-5px",
                                            background: "red",
                                            color: "white",
                                            borderRadius: "50%",
                                            padding: "2px 7px",
                                            fontSize: "12px"
                                        }}
                                    >
                {unreadCount}
              </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "60px",
                                        right: "0",
                                        width: "350px",
                                        background: "#fff",
                                        border: "1px solid #ccc",
                                        borderRadius: "8px",
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                                        zIndex: 999
                                    }}
                                >
                                    <h4 className="p-2 m-0 border-bottom">Notificări</h4>

                                    {notifications.length === 0 ? (
                                        <p className="p-2">Nu există notificări.</p>
                                    ) : (
                                        notifications.map((n) => {
                                            let taskDetails: TaskPayload | null = null;
                                            let detailMessage = "";

                                            if (n.payload) {
                                                try {
                                                    taskDetails = JSON.parse(n.payload) as TaskPayload;
                                                    detailMessage = `Task ID: ${taskDetails.taskId}, Status: ${taskDetails.status}`;
                                                } catch (e) {
                                                    console.error("Failed to parse notification payload:", e);
                                                }
                                            }

                                            return (
                                                <div
                                                    key={n.id}
                                                    className="p-2 border-bottom"
                                                    style={{
                                                        background: n.read ? "#f9f9f9" : "#e6f0ff"
                                                    }}
                                                >
                                                    <p
                                                        className="m-0"
                                                        style={{ fontWeight: n.read ? "normal" : "bold" }}
                                                    >
                                                        {n.message}
                                                    </p>
                                                    {taskDetails && (
                                                        <small className="d-block text-secondary">
                                                            {detailMessage}
                                                        </small>
                                                    )}
                                                    <small className="d-block text-muted">
                                                        {new Date(n.createdAt).toLocaleString()}
                                                    </small>

                                                    {!n.read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(n.id)}
                                                            className="btn btn-sm btn-light mt-1"
                                                        >
                                                            Marchează ca citit
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                <div className="d-flex" style={{ background: "#fafafa", minHeight: "calc(100vh - 64px)" }}>
                    <aside
                        className="bg-white border-end"
                        style={{ width: 260, padding: 16 }}
                    >
                        <h5 className="mb-3">Admin</h5>

                        <div className="mb-2 text-muted small text-uppercase">
                            Task management
                        </div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "TASKS_UNASSIGNED" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("TASKS_UNASSIGNED")}
                            >
                                Unassigned tasks
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "MY_TASKS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("MY_TASKS")}
                            >
                                My tasks
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("CREATE_TASK")}
                            >
                                ➕ Create New Task
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("ASSIGN")}
                            >
                                Assign task to employee…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("UNASSIGN")}
                            >
                                Unassign task…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("ASSIGN_TO_ME")}
                            >
                                Assign task to me…
                            </button>
                        </div>

                        <div className="mb-2 text-muted small text-uppercase">
                            Employees
                        </div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "EMPLOYEES" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("EMPLOYEES")}
                            >
                                List employees
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "PAYROLL" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("PAYROLL")}
                            >
                                Payroll Management
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("ADD_EMP")}
                            >
                                Add employee…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("EDIT_EMP")}
                            >
                                Edit employee…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("DEL_EMP")}
                            >
                                Delete employee…
                            </button>
                        </div>

                        <div className="mb-2 text-muted small text-uppercase">
                            Assignments & Reports
                        </div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "REPORTS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("REPORTS")}
                            >
                                View Reports
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("VIEW_ASSIGNMENTS")}
                            >
                                Assignments for employee…
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "LEAVE_REQUESTS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("LEAVE_REQUESTS")}
                            >
                                📋 Leave Requests
                            </button>
                        </div>

                        {/* ADAUGĂ SECȚIUNEA DE ANALYTICS */}
                        {/*<div className="mb-2 text-muted small text-uppercase">
                            Analytics & Charts
                        </div>*/}
                        <div className="nav flex-column mb-3">
                           {/* <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "ANALYTICS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("ANALYTICS")}
                            >
                                📊 Advanced Analytics
                            </button>*/}
                        </div>
                    </aside>

                    <main className="flex-grow-1 p-4">
                        <div className="row g-3 mb-4">
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">
                                            Unassigned tasks
                                        </small>
                                        <h3 className="mb-0">{taskStats.unassigned}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">My tasks</small>
                                        <h3 className="mb-0">{taskStats.myTasks}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">
                                            High priority
                                        </small>
                                        <h3 className="mb-0">{taskStats.highPriority}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">
                                            Employees
                                        </small>
                                        <h3 className="mb-0">{taskStats.totalEmployees}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    {view === "TASKS_UNASSIGNED" && "Unassigned tasks"}
                                    {view === "MY_TASKS" && "My tasks"}
                                    {view === "EMPLOYEES" && "Employees"}
                                    {view === "ASSIGNMENTS" && "Assignments"}
                                    {view === "REPORTS" && "Reports"}
                                    {view === "PAYROLL" && "Payroll Management"}
                                    {view === "ANALYTICS" && "Advanced Analytics"}
                                </h5>
                            </div>
                            <div className="card-body">

                                {/* SECȚIUNEA ANALYTICS CU CHART-URI AVANSATE
                                {view === "ANALYTICS" && (
                                    <div className="analytics-section">
                                        <AIChartsPanel />
                                    </div>
                                )}*/}

                                {(view === "TASKS_UNASSIGNED" || view === "MY_TASKS") && (
                                    <>
                                        {tableRows.length === 0 ? (
                                            <div className="text-muted">Nu există task-uri.</div>
                                        ) : (
                                            <div className="row mb-4">

                                                {view === "MY_TASKS" && taskProgressRows.length > 0 && (
                                                    <div className="col-12 mb-4">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Task Progress Overview</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="overflow-x-auto">
                                                                    <table className="min-w-full text-sm">
                                                                        <thead className="text-gray-500">
                                                                        <tr className="[&>th]:text-left [&>th]:py-3">
                                                                            <th>Task Code</th>
                                                                            <th>Created Date</th>
                                                                            <th>Deadline</th>
                                                                            <th>Priority</th>
                                                                            <th>Progress</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y">
                                                                        {taskProgressRows.map((row, i) => (
                                                                            <tr key={i} className="[&>td]:py-3">
                                                                                <td className="font-medium">{row.code}</td>
                                                                                <td>{row.start}</td>
                                                                                <td>{row.end}</td>
                                                                                <td>
                                                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                                                        row.warning === "High Priority"
                                                                                            ? "bg-red-100 text-red-800"
                                                                                            : row.warning === "Medium"
                                                                                                ? "bg-yellow-100 text-yellow-800"
                                                                                                : "bg-gray-100 text-gray-800"
                                                                                    }`}>
                                                                                        {row.warning}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="h-2 w-40 bg-gray-200 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full ${
                                                                                                row.progress > 70
                                                                                                    ? "bg-green-500"
                                                                                                    : row.progress > 30
                                                                                                        ? "bg-blue-500"
                                                                                                        : "bg-yellow-500"
                                                                                            }`}
                                                                                            style={{ width: `${row.progress}%` }}
                                                                                        />
                                                                                    </div>
                                                                                    <span className="text-xs text-gray-500 mt-1 block">{row.progress}%</span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {taskDistributionData.length > 0 && (
                                                    <div className="col-md-6 mb-4">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Task Status Distribution</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="bg-white rounded-lg shadow p-4">
                                                                    <div className="h-80 flex items-center justify-center relative">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <PieChart>
                                                                                <Tooltip
                                                                                    formatter={(value: number) => {
                                                                                        const total = taskDistributionData.reduce((s, d) => s + d.value, 0);
                                                                                        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                                                                                        return [`${value} (${percent}%)`, 'Count'];
                                                                                    }}
                                                                                />
                                                                                <Pie
                                                                                    data={taskDistributionData}
                                                                                    dataKey="value"
                                                                                    nameKey="name"
                                                                                    innerRadius={60}
                                                                                    outerRadius={80}
                                                                                    paddingAngle={2}
                                                                                >
                                                                                    {taskDistributionData.map((_, i) => (
                                                                                        <Cell
                                                                                            key={`cell-${i}`}
                                                                                            fill={['#22c55e', '#38bdf8', '#f59e0b', '#ef4444', '#a78bfa'][i % 5]}
                                                                                        />
                                                                                    ))}
                                                                                </Pie>
                                                                            </PieChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                    <div className="mt-4 space-y-2">
                                                                    {taskDistributionData.map((item, index) => (
                                                                            <div key={index} className="flex items-center">
                                                                                <div
                                                                                    className="w-3 h-3 rounded-full mr-2"
                                                                                    style={{
                                                                                        backgroundColor: ['#22c55e', '#38bdf8', '#f59e0b', '#ef4444', '#a78bfa'][index % 5]
                                                                                    }}
                                                                                />
                                                                                <span className="text-sm">{item.name}</span>
                                                                                <span className="ml-auto font-medium">{item.value}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="col-12">
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                            <tr>
                                                                <th style={{width: '50px'}}></th>
                                                                <th>ID</th>
                                                                <th>Title</th>
                                                                <th>Type</th>
                                                                <th>Difficulty</th>
                                                                <th>Required Skills</th>
                                                                <th>Planned Duration</th>
                                                                <th>Predicted Duration</th>
                                                                <th>Deadline</th>
                                                                <th>Priority</th>
                                                                <th>Revenue</th>
                                                                <th>Other Costs</th>
                                                                <th>Status</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {tableRows.map((row) => (
                                                                <React.Fragment key={row.id}>
                                                                    <tr>
                                                                        <td>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-secondary py-0 px-1"
                                                                                onClick={() => toggleRow(row.id)}
                                                                                title={expandedRows.has(row.id) ? "Hide details" : "Show details"}
                                                                            >
                                                                                {expandedRows.has(row.id) ? '▲' : '▼'}
                                                                            </button>
                                                                        </td>
                                                                        <td>{row.id}</td>
                                                                        <td>{row.Title}</td>
                                                                        <td>{row.Type}</td>
                                                                        <td>{row.Difficulty}/5</td>
                                                                        <td>
                                                                            <div className="d-flex align-items-center">
                                                                            <span className="d-inline-block text-truncate me-2" style={{maxWidth: '120px'}}>
                                                                                {row.RequiredSkills}
                                                                            </span>
                                                                            </div>
                                                                        </td>
                                                                        <td>{row.PlannedDuration}min</td>
                                                                        <td>{row.PredictedDuration}min</td>
                                                                        <td>{row.Deadline}</td>
                                                                        <td>{row.Priority}/5</td>
                                                                        <td>${row.Revenue}</td>
                                                                        <td>${row.OtherCosts}</td>
                                                                        <td>
                                                                        <span className={`badge ${
                                                                            row.Status === 'DONE' ? 'bg-success' :
                                                                                row.Status === 'IN_PROGRESS' ? 'bg-primary' :
                                                                                    row.Status === 'ASSIGNED' ? 'bg-warning' :
                                                                                        'bg-secondary'
                                                                        }`}>
                                                                            {row.Status}
                                                                        </span>
                                                                        </td>
                                                                    </tr>
                                                                    {expandedRows.has(row.id) && (
                                                                        <tr className="bg-light">
                                                                            <td colSpan={13}>
                                                                                <div className="p-3">
                                                                                    <div className="d-flex align-items-center mb-2">
                                                                                        <span className="me-2 fw-bold">{row.Title}</span>
                                                                                        <button
                                                                                            className="btn btn-sm btn-outline-primary py-0 px-1"
                                                                                            onClick={() => open("EDIT_TASK", {
                                                                                                taskId: row.id,
                                                                                                title: row.Title,
                                                                                                type: row.Type,
                                                                                                difficulty: row.Difficulty,
                                                                                                requiredSkills: (() => {
                                                                                                    try {
                                                                                                        if (typeof row.RequiredSkills === 'string' &&
                                                                                                            row.RequiredSkills.startsWith('[') &&
                                                                                                            row.RequiredSkills.endsWith(']')) {
                                                                                                            const parsed = JSON.parse(row.RequiredSkills);
                                                                                                            if (Array.isArray(parsed)) {
                                                                                                                return parsed.join(', ');
                                                                                                            }
                                                                                                        }
                                                                                                        return row.RequiredSkills || '';
                                                                                                    } catch (e) {
                                                                                                        return row.RequiredSkills || '';
                                                                                                    }
                                                                                                })(),
                                                                                                plannedDuration: row.PlannedDuration,
                                                                                                predictedDuration: row.PredictedDuration,
                                                                                                deadline: row.Deadline,
                                                                                                priority: row.Priority,
                                                                                                revenue: row.Revenue,
                                                                                                otherCosts: row.OtherCosts,
                                                                                                status: row.Status
                                                                                            })}
                                                                                            title="Edit task"
                                                                                        >
                                                                                            ✏️
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="row">
                                                                                        <div className="col-md-6">
                                                                                            <strong>Required Skills:</strong>
                                                                                            <div className="mt-1">
                                                                                                {(() => {
                                                                                                    try {
                                                                                                        const skills = JSON.parse(row.RequiredSkills);
                                                                                                        if (Array.isArray(skills)) {
                                                                                                            return skills.map((skill, index) => (
                                                                                                                <span key={index} className="badge bg-primary me-1 mb-1">
                                                                                                                {skill}
                                                                                                            </span>
                                                                                                            ));
                                                                                                        }
                                                                                                    } catch (e) {
                                                                                                    }
                                                                                                    return (
                                                                                                        <span className="text-muted">{row.RequiredSkills}</span>
                                                                                                    );
                                                                                                })()}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="col-md-6">
                                                                                            <strong>Additional Info:</strong>
                                                                                            <div className="mt-1">
                                                                                                <div><small><strong>Type:</strong> {row.Type}</small></div>
                                                                                                <div><small><strong>Difficulty:</strong> {row.Difficulty}/5</small></div>
                                                                                                <div><small><strong>Planned Duration:</strong> {row.PlannedDuration} minutes</small></div>
                                                                                                <div><small><strong>Predicted Duration:</strong> {row.PredictedDuration} minutes</small></div>
                                                                                                <div><small><strong>Revenue:</strong> ${row.Revenue}</small></div>
                                                                                                <div><small><strong>Other Costs:</strong> ${row.OtherCosts}</small></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {view === "TASKS_UNASSIGNED" && (
                                                                                        <div className="mt-3">
                                                                                            <button
                                                                                                className="btn btn-sm btn-outline-primary"
                                                                                                onClick={() => open("ASSIGN_TO_ME", { taskId: row.id })}
                                                                                            >
                                                                                                Assign to me
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {view === "EMPLOYEES" && (
                                    <>
                                        {tableRows1.length === 0 ? (
                                            <div className="text-muted">Nu există angajați.</div>
                                        ) : (
                                            <div className="row mb-4">
                                                <div className="col-md-6 mb-4">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Employee Distribution by Role</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <div className="bg-white rounded-lg shadow p-4">
                                                                <div className="h-64 flex items-center justify-center relative">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <PieChart>
                                                                            <Tooltip
                                                                                formatter={(value: number) => {
                                                                                    const total = employees.length;
                                                                                    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                                                                                    return [`${value} (${percent}%)`, 'Count'];
                                                                                }}
                                                                            />
                                                                            <Pie
                                                                                data={[
                                                                                    { name: "Employees", value: employees.filter(e => e.role === "EMPLOYEE").length },
                                                                                    { name: "Admins", value: employees.filter(e => e.role === "ADMIN").length },
                                                                                    { name: "Active", value: employees.filter(e => e.active).length },
                                                                                    { name: "Inactive", value: employees.filter(e => !e.active).length }
                                                                                ]}
                                                                                dataKey="value"
                                                                                nameKey="name"
                                                                                innerRadius={60}
                                                                                outerRadius={90}
                                                                                paddingAngle={2}
                                                                            >
                                                                                {[0, 1, 2, 3].map((_, i) => (
                                                                                    <Cell
                                                                                        key={`cell-${i}`}
                                                                                        fill={['#22c55e', '#38bdf8', '#f59e0b', '#ef4444'][i % 4]}
                                                                                    />
                                                                                ))}
                                                                            </Pie>
                                                                        </PieChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-6 mb-4">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Employee Performance Overview</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <div className="bg-white rounded-lg shadow p-4">
                                                                <div className="h-64">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <ComposedChart data={employeePerformanceData}>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                                            <XAxis
                                                                                dataKey="name"
                                                                                angle={-45}
                                                                                textAnchor="end"
                                                                                height={60}
                                                                                fontSize={12}
                                                                            />
                                                                            <YAxis fontSize={12} />
                                                                            <Tooltip
                                                                                formatter={(value: number) => [value, '']}
                                                                                labelFormatter={(label) => `Employee: ${label}`}
                                                                            />
                                                                            <Bar
                                                                                dataKey="tasksCompleted"
                                                                                name="Tasks Completed"
                                                                                fill="#8884d8"
                                                                                radius={[4, 4, 0, 0]}
                                                                            />
                                                                            <Line
                                                                                type="monotone"
                                                                                dataKey="productivity"
                                                                                name="Productivity %"
                                                                                stroke="#82ca9d"
                                                                                strokeWidth={2}
                                                                                dot={{ r: 4 }}
                                                                                activeDot={{ r: 6 }}
                                                                            />
                                                                        </ComposedChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-12">
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                            <tr>
                                                                <th>ID</th>
                                                                <th>Username</th>
                                                                <th>Email</th>
                                                                <th>Status</th>
                                                                <th>Role</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {tableRows1.map((row) => (
                                                                <tr key={row.id}>
                                                                    <td>{row.id}</td>
                                                                    <td>{row.Username}</td>
                                                                    <td>{row.Email}</td>
                                                                    <td>{row.Status}</td>
                                                                    <td>{row.Role}</td>
                                                                    <td>{row.actions ?? <span className="text-muted">—</span>}</td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {view === "ASSIGNMENTS" && (
                                    <div className="assignments-section">
                                        <h5>Assignments for Task {form.task?.id}</h5>

                                        {assignments.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-muted">No assignments found for this task.</p>
                                                <button
                                                    className="btn btn-primary mt-2"
                                                    onClick={() => open("VIEW_ASSIGNMENTS")}
                                                >
                                                    Search Another Task
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="table-responsive" style={{ minHeight: '200px' }}>
                                                <table className="table table-hover">
                                                    <thead>
                                                    <tr>
                                                        <th>Assignment ID</th>
                                                        <th>Employee ID and Name</th>
                                                        <th>Status</th>
                                                        <th>Finished_at</th>
                                                        <th>Assigned_at</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {assignments.map((assignment: any) => (
                                                        <tr key={assignment.id}>
                                                            <td>#{assignment.id}</td>
                                                            <td>
                                                                <strong>{assignment.employee?.name}</strong>
                                                                <br />
                                                                <small className="text-muted">ID: {assignment.task?.id}</small>
                                                            </td>
                                                            <td>
                                                        <span className={`badge ${
                                                            assignment.finishedAt ? 'bg-success' :
                                                                assignment.startedAt ? 'bg-primary' :
                                                                    assignment.acceptedAt ? 'bg-warning' : 'bg-secondary'
                                                        }`}>
                                                            {assignment.finishedAt ? 'Completed' :
                                                                assignment.startedAt ? 'In Progress' :
                                                                    assignment.acceptedAt ? 'Accepted' : 'Assigned'}
                                                        </span>
                                                            </td>
                                                            <td>{ assignment.finishedAt}</td>
                                                            <td>{ assignment.assignedAt}</td>

                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>

                                                <div className="mt-3">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => open("VIEW_ASSIGNMENTS")}
                                                    >
                                                        🔍 Search Another Task
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {view === "REPORTS" && (
                                    <div className="reports-section">

                                        <div className="button-group mb-4">
                                            <button
                                                className={`btn ${viewMode === 'view' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => {
                                                    setViewMode('view');
                                                    fetchAllReports();
                                                }}
                                            >
                                                📊 View All Reports
                                            </button>
                                            <button
                                                className={`btn ${viewMode === 'generate' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => {
                                                    setViewMode('generate');
                                                    open("GENERATE_REPORT");
                                                }}
                                            >
                                                ➕ Generate New Report
                                            </button>
                                        </div>

                                        {viewMode === 'view' ? (

                                            <div>

                                                {allReports.length > 0 && (
                                                    <div className="row mb-4">

                                                        <div className="col-md-12 mb-4">
                                                            <div className="card">
                                                                <div className="card-header">
                                                                    <h6 className="mb-0">Revenue vs Costs Trend</h6>
                                                                </div>
                                                                <div className="card-body">
                                                                    <div className="bg-white rounded-lg shadow p-4">
                                                                        <div className="h-64">
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <ComposedChart data={revenueTrendData}>
                                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                                                    <XAxis
                                                                                        dataKey="period"
                                                                                        angle={-45}
                                                                                        textAnchor="end"
                                                                                        height={60}
                                                                                        fontSize={12}
                                                                                    />
                                                                                    <YAxis fontSize={12} />
                                                                                    <Tooltip
                                                                                        formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                                                                                        labelFormatter={(label) => `Period: ${label}`}
                                                                                    />
                                                                                    <Bar
                                                                                        dataKey="revenue"
                                                                                        name="Revenue"
                                                                                        fill="#22c55e"
                                                                                        radius={[4, 4, 0, 0]}
                                                                                    />
                                                                                    <Bar
                                                                                        dataKey="costs"
                                                                                        name="Costs"
                                                                                        fill="#ef4444"
                                                                                        radius={[4, 4, 0, 0]}
                                                                                    />
                                                                                    <Line
                                                                                        type="monotone"
                                                                                        dataKey="profit"
                                                                                        name="Profit"
                                                                                        stroke="#3b82f6"
                                                                                        strokeWidth={2}
                                                                                        dot={{ r: 4 }}
                                                                                        activeDot={{ r: 6 }}
                                                                                    />
                                                                                </ComposedChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <h5 className="mb-3">All Generated Reports</h5>
                                                {loading ? (
                                                    <div className="text-center py-4">
                                                        <div className="spinner-border" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                        <p className="mt-2">Loading reports...</p>
                                                    </div>
                                                ) : allReports.length === 0 ? (
                                                    <div className="text-center py-4">
                                                        <p className="text-muted">No reports available. Generate your first report!</p>
                                                        <button
                                                            className="btn btn-primary mt-2"
                                                            onClick={() => {
                                                                setViewMode('generate');
                                                                open("GENERATE_REPORT");
                                                            }}
                                                        >
                                                            Generate First Report
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                            <tr>
                                                                <th>Employee</th>
                                                                <th>Period</th>
                                                                <th>Total Tasks</th>
                                                                <th>Total Revenue</th>
                                                                <th>Total Costs</th>
                                                                <th>Productivity Score</th>
                                                                <th>Created At</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {allReports.map((report) => (
                                                                <tr key={report.id}>
                                                                    <td>
                                                                        {report.employee ?
                                                                            `${report.employee.name} (ID: ${report.employee.id})` :
                                                                            `Employee #${report.employeeId || 'N/A'}`
                                                                        }
                                                                    </td>
                                                                    <td>{report.year}-{String(report.month).padStart(2, "0")}</td>
                                                                    <td>
                                                                        <span className="badge bg-primary">{report.totalTasks || 0}</span>
                                                                    </td>
                                                                    <td>${report.totalRevenue?.toFixed(2) || "0.00"}</td>
                                                                    <td>${report.totalCosts?.toFixed(2) || "0.00"}</td>
                                                                    <td>
                                                                    <span className={`badge ${
                                                                        (report.productivityScore ?? 0) > 3 ? 'bg-success' :
                                                                            (report.productivityScore ?? 0) > 1 ? 'bg-warning' : 'bg-secondary'
                                                                    }`}>
                                                                        {report.productivityScore?.toFixed(2) || "0.00"}
                                                                    </span>
                                                                    </td>
                                                                    <td>
                                                                        {report.createdAt ?
                                                                            new Date(report.createdAt).toLocaleDateString() :
                                                                            new Date().toLocaleDateString()
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (

                                            <div>
                                                <h5>Generate New Monthly Report</h5>
                                                {report ? (
                                                    <div className="alert alert-success">
                                                        <h6>Last Generated Report</h6>
                                                        <div className="row">
                                                            <div className="col-md-3"><strong>Employee:</strong> {report.employeeId}</div>
                                                            <div className="col-md-3"><strong>Period:</strong> {report.year}-{String(report.month).padStart(2, "0")}</div>
                                                            <div className="col-md-3"><strong>Tasks:</strong> {report.totalTasks}</div>
                                                            <div className="col-md-3"><strong>Productivity:</strong> {report.productivityScore?.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-info">
                                                        Complete the form below to generate a new monthly report.
                                                    </div>
                                                )}
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => open("GENERATE_REPORT")}
                                                >
                                                    Open Generate Report Form
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {view === "PAYROLL" && (
                                    <div className="payroll-section">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => open("CALCULATE_PAYROLL")}
                                            >
                                                Calculate Payroll
                                            </button>
                                        </div>

                                        {currentPayroll && (
                                            <div className="alert alert-success mb-3">
                                                <h6>Last Calculated Payroll</h6>
                                                <div className="row">
                                                    <div className="col-md-3"><strong>Employee:</strong> {currentPayroll.employee?.name || currentPayroll.employeeId}</div>
                                                    <div className="col-md-3">
                                                        <strong>Period:</strong> {currentPayroll.year}-{String(currentPayroll.month).padStart(2, "0")}
                                                    </div>
                                                    <div className="col-md-2"><strong>Base Salary:</strong> ${currentPayroll.baseSalary?.toFixed(2)}</div>
                                                    <div className="col-md-2"><strong>Bonuses:</strong> ${currentPayroll.bonuses?.toFixed(2)}</div>
                                                    <div className="col-md-2"><strong>Net Salary:</strong> <strong>${currentPayroll.netSalary?.toFixed(2)}</strong></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Payroll History</h6>
                                            </div>
                                            <div className="card-body">
                                                {payrollHistory.length === 0 ? (
                                                    <div className="text-center py-4">
                                                        <p className="text-muted">No payroll records found.</p>
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => open("CALCULATE_PAYROLL")}
                                                        >
                                                            Calculate First Payroll
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                            <tr>
                                                                <th>Employee</th>
                                                                <th>Period</th>
                                                                <th>Base Salary</th>
                                                                <th>Bonuses</th>
                                                                <th>Deductions</th>
                                                                <th>Net Salary</th>
                                                                <th>Calculated At</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {payrollHistory.map((payroll) => (
                                                                <tr key={payroll.id}>
                                                                    <td>
                                                                        {payroll.employee?.name || `Employee #${payroll.employeeId}`}
                                                                    </td>
                                                                    <td>{payroll.year && payroll.month ? `${payroll.year}-${String(payroll.month).padStart(2, "0")}` : 'N/A'}</td>

                                                                    <td>${payroll.baseSalary?.toFixed(2) || "0.00"}</td>
                                                                    <td>${payroll.bonuses?.toFixed(2) || "0.00"}</td>
                                                                    <td>${payroll.deductions?.toFixed(2) || "0.00"}</td>
                                                                    <td>
                                                                        <strong>${payroll.netSalary?.toFixed(2) || "0.00"}</strong>
                                                                    </td>

                                                                    <td>
                                                                        {new Date().toLocaleDateString()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {view === "LEAVE_REQUESTS" && (
                                    <div className="leave-requests-section">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h5 className="mb-0">Leave Requests Management</h5>
                                        </div>

                                        {loading ? (
                                            <div className="text-center py-4">
                                                <div className="spinner-border" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="mt-2">Loading leave requests...</p>
                                            </div>
                                        ) : leaveRequests.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-muted">No leave requests found.</p>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Period</th>
                                                        <th>Duration</th>
                                                        <th>Reason</th>
                                                        <th>Status</th>
                                                        <th>Admin Comment</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {leaveRequests.map((leave) => (
                                                        <tr key={leave.id}>
                                                            <td>
                                                                <strong>{`#${leave.id}`}</strong>
                                                                <br />
                                                            </td>
                                                            <td>
                                                                {new Date(leave.fromDate).toLocaleDateString()}
                                                                <br />
                                                                <small>to</small>
                                                                <br />
                                                                {new Date(leave.toDate).toLocaleDateString()}
                                                            </td>
                                                            <td>
                                                                {(() => {
                                                                    const from = new Date(leave.fromDate);
                                                                    const to = new Date(leave.toDate);
                                                                    const diffTime = Math.abs(to.getTime() - from.getTime());
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                                    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                                                                })()}
                                                            </td>
                                                            <td>
                                                                <div className="max-width-200 text-truncate" title={leave.reason}>
                                                                    {leave.reason}
                                                                </div>
                                                            </td>
                                                            <td>
                                    <span className={`badge ${
                                        leave.status === 'APPROVED' ? 'bg-success' :
                                            leave.status === 'REJECTED' ? 'bg-danger' :
                                                leave.status === 'CANCELLED' ? 'bg-secondary' :
                                                    'bg-warning'
                                    }`}>
                                        {leave.status}
                                    </span>
                                                            </td>
                                                            <td>
                                                                {leave.adminComment ||
                                                                    <span className="text-muted">No comment</span>
                                                                }
                                                            </td>
                                                            <td>
                                                                <div className="btn-group btn-group-sm">
                                                                    <button
                                                                        className="btn btn-outline-info"
                                                                        onClick={() => {
                                                                            setSelectedLeave(leave);
                                                                            open("VIEW_LEAVE_DETAILS");
                                                                        }}
                                                                        title="View details"
                                                                    >
                                                                        👁️
                                                                    </button>
                                                                    {leave.status === 'PENDING' && (
                                                                        <>
                                                                            <button
                                                                                className="btn btn-outline-success"
                                                                                onClick={() => handleUpdateLeaveStatus(leave.id, 'APPROVED', 'Leave approved')}
                                                                                title="Approve"
                                                                            >
                                                                                ✓
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-outline-danger"
                                                                                onClick={() => {
                                                                                    const comment = prompt('Enter rejection reason:', '');
                                                                                    if (comment !== null) {
                                                                                        handleUpdateLeaveStatus(leave.id, 'REJECTED', comment);
                                                                                    }
                                                                                }}
                                                                                title="Reject"
                                                                            >
                                                                                ✗
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <Modal
                open={modal === "ADD_EMP"}
                title="Adaugă Angajat"
                onClose={close}
                onSubmit={submitAddEmployee}
                submitLabel="Adaugă"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Username*"
                            value={form.username || ""}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Parolă*"
                            value={form.password || ""}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.role || "EMPLOYEE"}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.active !== undefined ? form.active.toString() : "true"}
                            onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
                        >
                            <option value="true">Activ</option>
                            <option value="false">Inactiv</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Nume (opțional)"
                            value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="email"
                            placeholder="Email (opțional)"
                            value={form.email || ""}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Rată orară (opțional)"
                            value={form.hourlyRate || ""}
                            onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.seniority || "JUNIOR"}
                            onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                        >
                            <option value="JUNIOR">Junior</option>
                            <option value="MID">Mid</option>
                            <option value="SENIOR">Senior</option>
                        </select>
                    </div>
                </div>
                <small className="text-muted mt-2">* Username și parolă sunt obligatorii pentru autentificare</small>
            </Modal>

            <Modal
                open={modal === "EDIT_EMP"}
                title="Editează Angajat"
                onClose={close}
                onSubmit={submitEditEmployee}
                submitLabel="Salvează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="ID Angajat*"
                            value={form.id || ""}
                            onChange={(e) => setForm({ ...form, id: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.active !== undefined ? form.active.toString() : ""}
                            onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
                        >
                            <option value="">Status (opțional)</option>
                            <option value="true">Activ</option>
                            <option value="false">Inactiv</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Username (opțional)"
                            value={form.username || ""}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Nume (opțional)"
                            value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="email"
                            placeholder="Email (opțional)"
                            value={form.email || ""}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.role || ""}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="">Rol (opțional)</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Rată orară (opțional)"
                            value={form.hourlyRate || ""}
                            onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.seniority || ""}
                            onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                        >
                            <option value="">Senioritate (opțional)</option>
                            <option value="JUNIOR">Junior</option>
                            <option value="MID">Mid</option>
                            <option value="SENIOR">Senior</option>
                        </select>
                    </div>
                </div>
                <small className="text-muted mt-2">* Completează doar câmpurile pe care vrei să le modifici</small>
            </Modal>

            <Modal
                open={modal === "DEL_EMP"}
                title="Șterge Angajat"
                onClose={close}
                onSubmit={submitDeleteEmployee}
                submitLabel="Șterge"
            >
                <div className="alert alert-warning">
                    <strong>Atenție!</strong> Această acțiune este ireversibilă.
                </div>
                <input
                    className="form-control"
                    placeholder="ID Angajat*"
                    value={form.id || ""}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    required
                />
                <small className="text-muted mt-2">
                    Introdu ID-ul angajatului pe care vrei să îl ștergi.
                </small>
            </Modal>

            <Modal
                open={modal === "ASSIGN"}
                title="Asignează task la angajat"
                onClose={close}
                onSubmit={submitAssign}
                submitLabel="Asignează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Task ID"
                            value={form.taskId || ""}
                            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Employee ID"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                open={modal === "UNASSIGN"}
                title="Dezasignează task"
                onClose={close}
                onSubmit={submitUnassign}
                submitLabel="Dezasignează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Task ID"
                            value={form.taskId || ""}
                            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Employee ID"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                open={modal === "ASSIGN_TO_ME"}
                title="Asignează task către mine"
                onClose={close}
                onSubmit={submitAssignToMe}
                submitLabel="Asignează mie"
            >
                <input
                    className="form-control"
                    placeholder="Task ID"
                    value={form.taskId || ""}
                    onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                />
            </Modal>

            <Modal
                open={modal === "VIEW_ASSIGNMENTS"}
                title="Vezi asignările unui task"
                onClose={close}
                onSubmit={submitViewAssignments}
                submitLabel="Afișează"
            >
                <input
                    className="form-control"
                    placeholder="Task ID"
                    value={form.taskId || ""}
                    onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                />
            </Modal>

            <Modal
                open={modal === "GENERATE_REPORT"}
                title="Generează raport lunar"
                onClose={close}
                onSubmit={submitGenerateReport}
                submitLabel="Generează"
            >
                <div className="row g-2">
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="Employee ID*"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="An (ex: 2024)*"
                            value={form.year || ""}
                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="Lună (1-12)*"
                            value={form.month || ""}
                            onChange={(e) => setForm({ ...form, month: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <small className="text-muted mt-2">
                    * Toate câmpurile sunt obligatorii. Raportul va fi generat pentru angajatul specificat și perioada selectată.
                </small>
            </Modal>

            <Modal
                open={modal === "IMPORT_XML"}
                title="Importă utilizatori din XML"
                onClose={close}
                onSubmit={submitImportXml}
                submitLabel="Importă"
            >
                <input
                    className="form-control"
                    type="file"
                    accept=".xml"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setForm({ ...form, file: e.target.files?.[0] })
                    }
                />
                {form.file && (
                    <p className="small text-muted mt-1">
                        Fișier selectat: {form.file.name}
                    </p>
                )}
            </Modal>

            <Modal
                open={modal === "EDIT_TASK"}
                title="Editează Task"
                onClose={close}
                onSubmit={submitEditTask}
                submitLabel="Salvează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label">Task ID*</label>
                        <input
                            className="form-control"
                            placeholder="Task ID"
                            value={form.taskId || ""}
                            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                            required
                            disabled
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Titlu</label>
                        <input
                            className="form-control"
                            placeholder="Titlu task"
                            value={form.title || ""}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Tip</label>
                        <select
                            className="form-select"
                            value={form.type || ""}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="">Selectează tipul</option>
                            <option value="REPORT">REPORT</option>
                            <option value="DEVELOPMENT">DEVELOPMENT</option>
                            <option value="TESTING">TESTING</option>
                            <option value="DATABASE">DATABASE</option>
                            <option value="DOCUMENTATION">DOCUMENTATION</option>
                            <option value="ANALYSIS">ANALYSIS</option>
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Dificultate (1-5)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Dificultate"
                            value={form.difficulty || ""}
                            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                        />
                    </div>

                    <div className="col-12">
                        <label className="form-label">Skills necesare</label>
                        <input
                            className="form-control"
                            placeholder="Java, Spring Boot, React (separate prin virgulă)"
                            value={form.requiredSkills || ""}
                            onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                        />
                        <small className="text-muted">Separați skill-urile prin virgulă</small>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Durată planificată (min)</label>
                        <input
                            className="form-control"
                            type="number"
                            placeholder="Durată planificată"
                            value={form.plannedDuration || ""}
                            onChange={(e) => setForm({ ...form, plannedDuration: e.target.value })}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Durată estimată (min)</label>
                        <input
                            className="form-control"
                            type="number"
                            placeholder="Durată estimată"
                            value={form.predictedDuration || ""}
                            onChange={(e) => setForm({ ...form, predictedDuration: e.target.value })}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Deadline</label>
                        <input
                            className="form-control"
                            type="date"
                            placeholder="YYYY-MM-DD"
                            value={form.deadline || ""}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Prioritate (1-5)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Prioritate"
                            value={form.priority || ""}
                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Venit ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            placeholder="Venit"
                            value={form.revenue || ""}
                            onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Alte costuri ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            placeholder="Alte costuri"
                            value={form.otherCosts || ""}
                            onChange={(e) => setForm({ ...form, otherCosts: e.target.value })}
                        />
                    </div>

                    <div className="col-12">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={form.status || ""}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="">Selectează statusul</option>
                            <option value="NEW">NEW</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="DONE">DONE</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </div>
                </div>
                <small className="text-muted mt-2">* Completează doar câmpurile pe care vrei să le modifici</small>
            </Modal>

            <Modal
                open={modal === "CREATE_TASK"}
                title="Create New Task"
                onClose={close}
                onSubmit={submitCreateTask}
                submitLabel="Create Task"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label">Title*</label>
                        <input
                            className="form-control"
                            placeholder="Task title"
                            value={taskCreateForm.title}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Type*</label>
                        <select
                            className="form-select"
                            value={taskCreateForm.type}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, type: e.target.value})}
                            required
                        >
                            <option value="DEVELOPMENT">Development</option>
                            <option value="TESTING">Testing</option>
                            <option value="DESIGN">Design</option>
                            <option value="DOCUMENTATION">Documentation</option>
                            <option value="ANALYSIS">Analysis</option>
                            <option value="MEETING">Meeting</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Difficulty (1-5)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            max="5"
                            value={taskCreateForm.difficulty}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, difficulty: parseInt(e.target.value)})}
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Priority (1-5)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            max="5"
                            value={taskCreateForm.priority}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, priority: parseInt(e.target.value)})}
                            required
                        />
                    </div>

                    <div className="col-12">
                        <label className="form-label">Required Skills</label>
                        <input
                            className="form-control"
                            placeholder="Java, React, Spring Boot (separate by comma)"
                            value={typeof taskCreateForm.requiredSkills === 'string'
                                ? taskCreateForm.requiredSkills
                                : taskCreateForm.requiredSkills.join(', ')}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, requiredSkills: e.target.value})}
                        />
                        <small className="text-muted">Separate skills by comma</small>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Planned Duration (minutes)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            value={taskCreateForm.plannedDuration}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, plannedDuration: parseInt(e.target.value)})}
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Predicted Duration (minutes)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            value={taskCreateForm.predictedDuration}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, predictedDuration: parseInt(e.target.value)})}
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Deadline</label>
                        <input
                            className="form-control"
                            type="date"
                            value={taskCreateForm.deadline}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, deadline: e.target.value})}
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={taskCreateForm.status}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, status: e.target.value})}
                        >
                            <option value="NEW">New</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Revenue ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            value={taskCreateForm.revenue}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, revenue: parseFloat(e.target.value)})}
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Other Costs ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            value={taskCreateForm.otherCosts}
                            onChange={(e) => setTaskCreateForm({...taskCreateForm, otherCosts: parseFloat(e.target.value)})}
                            required
                        />
                    </div>
                </div>
                <small className="text-muted mt-2">* Required fields</small>
            </Modal>

            <Modal
                open={modal === "VIEW_LEAVE_DETAILS"}
                title="Leave Request Details"
                onClose={() => {
                    setSelectedLeave(null);
                    close();
                }}
                onSubmit={selectedLeave?.status === 'PENDING' ? (e) => {
                    e.preventDefault();
                    const comment = (document.getElementById('adminComment') as HTMLInputElement)?.value || '';
                    handleUpdateLeaveStatus(selectedLeave.id, 'APPROVED', comment);
                    close();
                } : undefined}
                submitLabel={selectedLeave?.status === 'PENDING' ? "Approve Leave" : undefined}
            >
                {selectedLeave && (
                    <div className="leave-details">
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <strong>Employee:</strong>
                                <p>{selectedLeave.employee?.name || `Employee #${selectedLeave.employeeId}`}</p>
                            </div>
                            <div className="col-md-6">
                                <strong>Username:</strong>
                                <p>{selectedLeave.employee?.username || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <strong>From Date:</strong>
                                <p>{new Date(selectedLeave.fromDate).toLocaleDateString()}</p>
                            </div>
                            <div className="col-md-6">
                                <strong>To Date:</strong>
                                <p>{new Date(selectedLeave.toDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-12">
                                <strong>Duration:</strong>
                                <p>
                                    {(() => {
                                        const from = new Date(selectedLeave.fromDate);
                                        const to = new Date(selectedLeave.toDate);
                                        const diffTime = Math.abs(to.getTime() - from.getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                                    })()}
                                </p>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-12">
                                <strong>Reason:</strong>
                                <div className="border rounded p-2 bg-light">
                                    {selectedLeave.reason}
                                </div>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <strong>Status:</strong>
                                <p>
                        <span className={`badge ${
                            selectedLeave.status === 'APPROVED' ? 'bg-success' :
                                selectedLeave.status === 'REJECTED' ? 'bg-danger' :
                                    selectedLeave.status === 'CANCELLED' ? 'bg-secondary' :
                                        'bg-warning'
                        }`}>
                            {selectedLeave.status}
                        </span>
                                </p>
                            </div>
                            <div className="col-md-6">
                                <strong>Admin Comment:</strong>
                                <p>{selectedLeave.adminComment || <span className="text-muted">No comment</span>}</p>
                            </div>
                        </div>

                        {selectedLeave.status === 'PENDING' && (
                            <div className="row">
                                <div className="col-md-12">
                                    <label className="form-label">Admin Comment (optional):</label>
                                    <textarea
                                        id="adminComment"
                                        className="form-control"
                                        rows={3}
                                        placeholder="Enter comment for approval..."
                                        defaultValue={selectedLeave.adminComment || ''}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedLeave.status === 'PENDING' && (
                            <div className="row mt-3">
                                <div className="col-md-12 d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => {
                                            const comment = prompt('Enter rejection reason:', '');
                                            if (comment !== null) {
                                                handleUpdateLeaveStatus(selectedLeave.id, 'REJECTED', comment);
                                                close();
                                            }
                                        }}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            handleUpdateLeaveStatus(selectedLeave.id, 'CANCELLED', 'Cancelled by admin');
                                            close();
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
            <Modal
                open={modal === "CALCULATE_PAYROLL"}
                title="Calculate Employee Payroll"
                onClose={close}
                onSubmit={submitCalculatePayroll}
                submitLabel="Calculate"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label">Employee ID*</label>
                        <input
                            className="form-control"
                            placeholder="Employee ID"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Month*</label>
                        <select
                            className="form-select"
                            value={form.month || ""}
                            onChange={(e) => setForm({ ...form, month: e.target.value })}
                            required
                        >
                            <option value="">Select Month</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Year*</label>
                        <input
                            className="form-control"
                            placeholder="Year"
                            value={form.year || ""}
                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Bonuses ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Bonuses"
                            value={form.bonuses || ""}
                            onChange={(e) => setForm({ ...form, bonuses: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Deductions ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Deductions"
                            value={form.deductions || ""}
                            onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                        />
                    </div>
                </div>
                <small className="text-muted mt-2">
                    * Câmpurile obligatorii. Salariul de bază va fi calculat automat pe baza ratei orare și orelor lucrate.
                </small>
            </Modal>
        </div>
    );
}