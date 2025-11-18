// frontend/src/pages/admin/AdminDashboard.tsx
import React, {
    useEffect,
    useMemo,
    useState,
    FormEvent,
    ChangeEvent,
} from "react";

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
    getAssignmentsByEmployee,
    importEmployeesXml,
    AdminTask,
    AdminUser,
    Assignment,
    MonthlyReport, getAssignmentsByTask,
} from "../services/AdminService";

// !!! asigură-te că importurile către CSS sunt corecte:
import "../assets/css/core.scss";
import "../assets/css/demo.css";
import "../assets/css/app-logistics-dashboard.css";

type View =
    | "TASKS_UNASSIGNED"
    | "MY_TASKS"
    | "EMPLOYEES"
    | "ASSIGNMENTS"
    | "REPORTS";

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
    | "IMPORT_XML";

type TableRow = {
    id: number;
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    actions?: React.ReactNode;
};

/*****************
 * Generic Modal *
 *****************/
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

    const [employees, setEmployees] = useState<AdminUser[]>([]);
    const [unassignedTasks, setUnassignedTasks] = useState<AdminTask[]>([]);
    const [myTasks, setMyTasks] = useState<AdminTask[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [report, setReport] = useState<MonthlyReport | null>(null);

    const [modal, setModal] = useState<ModalType>("NONE");
    const [form, setForm] = useState<any>({});

    const open = (m: ModalType, initial?: any) => {
        setForm(initial || {});
        setModal(m);
    };
    const close = () => {
        setModal("NONE");
        setForm({});
    };

    // bootstrap data
    // useEffect pentru a încărca employees când view-ul se schimbă
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

    // useEffect pentru edit employee
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

                    // Pregătește datele pentru backend
                    const updateData: any = {};

                    if (form.name !== undefined) updateData.name = form.name;
                    if (form.email !== undefined) updateData.email = form.email;
                    if (form.username !== undefined) updateData.username = form.username;
                    if (form.active !== undefined) updateData.active = form.active;
                    if (form.role !== undefined) updateData.role = form.role;
                    if (form.hourlyRate !== undefined) updateData.hourlyRate = Number(form.hourlyRate);
                    if (form.seniority !== undefined) updateData.seniority = form.seniority;

                    console.log("📤 Sending update data:", updateData);

                    // Apel către backend
                    await updateEmployee(Number(form.id), updateData);

                    console.log("✅ Employee updated successfully!");

                    // Refresh lista de employees
                    await refreshEmployees();

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error editing employee:", error);
                    // Resetează doar flag-ul de execuție
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

// 4. Get assignments by employee
    // 4. Get assignments by employee
    // 4. Get assignments by task (când view este ASSIGNMENTS și avem taskId)
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
        // Ascultă pentru schimbări în form pentru a trigger-ui asignarea
        if (form.taskId && form.employeeId && form.autoAssign) {
            const assignTaskToEmployee = async () => {
                try {
                    console.log("🔄 Auto-assigning task to employee...");
                    console.log("Task ID:", form.taskId);
                    console.log("Employee ID:", form.employeeId);

                    await assignTask(Number(form.taskId), Number(form.employeeId));

                    console.log("✅ Task assigned successfully!");

                    // Refresh listele de task-uri
                    await Promise.all([refreshUnassigned(), refreshMyTasks()]);

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error auto-assigning task:", error);
                }
            };

            assignTaskToEmployee();
        }
    }, [form.taskId, form.employeeId, form.autoAssign]); // Se execută când aceste valori se schimbă

    // useEffect pentru unassign task cu ID-urile introduse manual
    useEffect(() => {
        if (form.executeUnassign && form.unassignTaskId && form.unassignEmployeeId) {
            const performUnassign = async () => {
                try {
                    console.log("🔄 Executing unassign...");
                    console.log("Task ID:", form.unassignTaskId);
                    console.log("Employee ID:", form.unassignEmployeeId);

                    // Execută unassign-ul
                    await unassignTask(
                        Number(form.unassignTaskId),
                        Number(form.unassignEmployeeId)
                    );

                    console.log("✅ Task unassigned successfully!");

                    // Refresh listele de task-uri
                    await refreshUnassigned();
                    await refreshMyTasks();

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error unassigning task:", error);
                    // Resetează doar flag-ul de execuție, păstrează ID-urile pentru reîncercare
                    setForm((prev: any) => ({ ...prev, executeUnassign: false }));
                }
            };

            performUnassign();
        }
    }, [form.executeUnassign, form.unassignTaskId, form.unassignEmployeeId]);


    // useEffect pentru adăugarea unui employee în baza de date
    // useEffect pentru adăugarea unui employee - cu debugging

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

    /* ===== Actions ===== */

    const submitAddEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { username, password, role, active, name, email, hourlyRate, seniority } = form;

        console.log("📝 Add employee form submitted:", { username, password, role });

        // Validare - doar username și password sunt obligatorii
        if (!username || !password) {
            console.error("❌ Username and password are required");
            alert("Username și parola sunt obligatorii!");
            return;
        }

        try {
            console.log("🔄 Calling createEmployee API...");

            // Pregătește datele pentru backend
            const employeeData = {
                username: username,
                password: password,
                role: role || "EMPLOYEE",
                active: active !== undefined ? active : true,
                name: name || username, // folosește username ca name dacă nu e specificat
                email: email || `${username}@company.com`, // email default
                hourlyRate: hourlyRate ? Number(hourlyRate) : 0,
                seniority: seniority || "JUNIOR"
            };

            console.log("📤 Sending to backend:", employeeData);

            // Execută direct apelul API
            const newEmployee = await createEmployee(employeeData);

            console.log("✅ Employee created successfully:", newEmployee);

            // Refresh lista de employees
            await refreshEmployees();

            console.log("🔄 Employees list refreshed");

            // Închide modal-ul
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

            // Pregătește datele pentru backend - trimite chiar și valorile undefined
            const updateData: any = {
                // Include toate câmpurile chiar dacă sunt undefined
                name: name,
                email: email,
                username: username,
                active: active, // acesta este cel important!
                role: role,
                hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
                seniority: seniority
            };

            // Curăță obiectul de valori complet goale, dar păstrează active: false
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === "") {
                    delete updateData[key];
                }
            });

            console.log("📤 Step 2: Sending update data:", updateData);

            // Execută apelul API
            await updateEmployee(Number(id), updateData);

            console.log("✅ Step 3: Employee updated successfully in database!");

            // Step 4: Așteaptă puțin pentru a se procesa pe server
            console.log("⏳ Step 4: Waiting for server processing...");
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 5: Reîncarcă lista
            console.log("🔄 Step 5: Refreshing employees list...");
            await refreshEmployees();

            // Step 6: Verifică starea actuală
            console.log("🔍 Step 6: Current employees state:", employees);

            // Step 7: Închide modal-ul
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

        // Confirmare
        const confirmed = window.confirm(`Ești sigur că vrei să ștergi angajatul cu ID-ul ${employeeId}? Această acțiune este ireversibilă.`);

        if (!confirmed) {
            console.log("❌ Deletion cancelled by user");
            close();
            return;
        }

        try {
            console.log("🔄 Calling deleteEmployee API...");

            // Folosește funcția importată din AdminService
            await deleteEmployee(employeeId);

            console.log("✅ Employee deleted successfully!");

            // Refresh lista de employees
            await refreshEmployees();

            console.log("🔄 Employees list refreshed after deletion");

            // Închide modal-ul
            close();

        } catch (error) {
            console.error("❌ Error deleting employee:", error);
            // @ts-ignore
            alert("Eroare la ștergerea angajatului: " + error.message);
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
            await Promise.all([refreshUnassigned(), refreshMyTasks()]); // ✅ Refresh ambele view-uri
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
        console.log("All unassigned tasks:", unassignedTasks);
        console.log("All my tasks:", myTasks);

        if (!taskId) {
            console.error("❌ No task ID provided");
            return;
        }

        try {
            console.log("🔄 Calling getAssignmentsByTask with ID:", taskId);
            const data = await getAssignmentsByTask(Number(taskId));
            console.log("✅ Task assignments loaded:", data);

            setAssignments(Array.isArray(data) ? data : []);
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
        if (!employeeId || !year || !month) return;
        const data = await generateMonthlyReport(
            Number(employeeId),
            Number(year),
            Number(month)
        );
        setReport(data);
        setView("REPORTS");
        close();
    };

    const submitImportXml = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const file: File | undefined = form.file;
        if (!file) return;
        await importEmployeesXml(file);
        await refreshEmployees();
        close();
    };

    /* ===== Stats (pentru carduri) ===== */

    const taskStats = useMemo(
        () => ({
            unassigned: unassignedTasks.length,
            myTasks: myTasks.length,
            highPriority: unassignedTasks.filter((t) => (t.priority ?? 0) >= 4).length,
            totalEmployees: employees.length,
        }),
        [unassignedTasks, myTasks, employees]
    );

    /* ===== Tabel principal (în partea dreaptă) ===== */

    const tableRows: TableRow[] = useMemo(() => {
        if (view === "TASKS_UNASSIGNED") {
            return unassignedTasks.map<TableRow>(t => ({
                id: t.id,
                col1: t.title,
                col2: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                col3: t.status,
                col4: `prio: ${t.priority ?? "-"}`,
                actions: (
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => open("ASSIGN_TO_ME", { taskId: t.id })}
                    >
                        Assign to me
                    </button>
                ),
            }));
        }

        if (view === "MY_TASKS") {
            return myTasks.map<TableRow>(t => ({
                id: t.id,
                col1: t.title,
                col2: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                col3: t.status,
                col4: "",
                actions: undefined,        // IMPORTANT: există, chiar dacă e undefined
            }));
        }

        if (view === "EMPLOYEES") {
            // Filtrează doar userii cu rolul EMPLOYEE
            const employeesOnly = employees.filter(user => user.role === "EMPLOYEE");

            console.log("👥 Employees after filtering:", employeesOnly);
            console.log("🔢 Total users:", employees.length, "Employees only:", employeesOnly.length);

            return employeesOnly.map<TableRow>(user => ({
                id: user.id,
                col1: user.username, // Username ca nume afișat
                col2: user.username.includes('@') ? user.username : `${user.username}@company.com`,
                col3: user.active ? "✅ Active" : "❌ Inactive",
                col4: `Role: ${user.role}`,
                actions: undefined,
            }));
        }

        if (view === "ASSIGNMENTS") {
            return assignments.map<TableRow>(a => ({
                id: a.id,
                col1: `Task #${a.taskId}`,
                col2: `Emp #${a.employeeId}`,
                col3: `Admin #${a.adminId}`,
                col4: "",
                actions: undefined,
            }));
        }

        if (view === "REPORTS" && report) {
            return [{
                id: report.id,
                col1: `Emp #${report.employeeId}`,
                col2: `${report.year}-${String(report.month).padStart(2, "0")}`,
                col3: `Completed: ${report.completedTasks}/${report.totalTasks}`,
                col4: "",
                actions: undefined,
            }];
        }

        return [];
    }, [view, unassignedTasks, myTasks, assignments, report, employees]);

    /* ===== Render ===== */

    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-page">
                {/* Navbar Vuexy-like */}
                <nav className="layout-navbar navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <a className="navbar-brand" href="#">
                            Platforma Admin
                        </a>
                        <div className="d-flex align-items-center gap-2">
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
                        </div>
                    </div>
                </nav>

                <div className="d-flex" style={{ background: "#fafafa", minHeight: "calc(100vh - 64px)" }}>
                    {/* Sidebar */}
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
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("IMPORT_XML")}
                            >
                                Import XML…
                            </button>
                        </div>

                        <div className="mb-2 text-muted small text-uppercase">
                            Assignments & Reports
                        </div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "ASSIGNMENTS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("ASSIGNMENTS")}
                            >
                                View assignments
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "REPORTS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => open("GENERATE_REPORT")}
                            >
                                Generate monthly report…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("VIEW_ASSIGNMENTS")}
                            >
                                Assignments for employee…
                            </button>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-grow-1 p-4">
                        {/* KPI cards – ca în screenshot */}
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

                        {/* Card cu tabel – ca în screenshot */}
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    {view === "TASKS_UNASSIGNED" && "Unassigned tasks"}
                                    {view === "MY_TASKS" && "My tasks"}
                                    {view === "EMPLOYEES" && "Employees"}
                                    {view === "ASSIGNMENTS" && "Assignments"}
                                    {view === "REPORTS" && "Reports"}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tableRows.length === 0 ? (
                                    <div className="text-muted">Nu există înregistrări.</div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Col 1</th>
                                                <th>Col 2</th>
                                                <th>Col 3</th>
                                                <th>Col 4</th>
                                                <th>Acțiuni</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {tableRows.map((row) => (
                                                <tr key={row.id}>
                                                    <td>{row.id}</td>
                                                    <td>{row.col1}</td>
                                                    <td>{row.col2}</td>
                                                    <td>{row.col3}</td>
                                                    <td>{row.col4}</td>
                                                    <td>{row.actions ?? <span className="text-muted">—</span>}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* === Modals === */}
            {/* ADD EMPLOYEE */}
            {/* ADD EMPLOYEE */}
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
            {/* EDIT EMPLOYEE */}
            {/* EDIT EMPLOYEE */}
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
            {/* DELETE EMPLOYEE */}
            {/* DELETE EMPLOYEE */}
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

            {/* ASSIGN TASK */}
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

            {/* UNASSIGN */}
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

            {/* ASSIGN TO ME */}
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
            {/* VIEW ASSIGNMENTS FOR TASK */}
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

            {/* GENERATE REPORT */}
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
                            placeholder="Employee ID"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="An"
                            value={form.year || ""}
                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="Lună (1-12)"
                            value={form.month || ""}
                            onChange={(e) => setForm({ ...form, month: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* IMPORT XML */}
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
        </div>
    );
}
