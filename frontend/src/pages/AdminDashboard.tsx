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
    MonthlyReport,
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
    useEffect(() => {
        refreshEmployees();
        refreshUnassigned();
        refreshMyTasks();
    }, []);

    const refreshEmployees = async () => setEmployees(await getEmployees());
    const refreshUnassigned = async () => setUnassignedTasks(await getUnassignedTasks());
    const refreshMyTasks = async () => setMyTasks(await getMyTasks());

    /* ===== Actions ===== */

    const submitAddEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { name, email, username, password } = form;
        if (!username) return;
        await createEmployee({ name, email, username, password, active: true });
        await refreshEmployees();
        close();
    };

    const submitEditEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { id, name, email, username, active } = form;
        if (!id) return;
        await updateEmployee(Number(id), {
            name: name || undefined,
            email: email || undefined,
            username: username || undefined,
            active: typeof active === "string" ? active === "true" : active,
        });
        await refreshEmployees();
        close();
    };

    const submitDeleteEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { id } = form;
        if (!id) return;
        await deleteEmployee(Number(id));
        await refreshEmployees();
        close();
    };

    const submitAssign = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, employeeId } = form;
        if (!taskId || !employeeId) return;
        await assignTask(Number(taskId), Number(employeeId));
        await refreshUnassigned();
        close();
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
        await assignTaskToMe(Number(taskId));
        await Promise.all([refreshUnassigned(), refreshMyTasks()]);
        close();
    };

    const submitViewAssignments = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { employeeId } = form;
        if (!employeeId) return;
        const data = await getAssignmentsByEmployee(Number(employeeId));
        setAssignments(data);
        setView("ASSIGNMENTS");
        close();
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
            return employees.map<TableRow>(e => ({
                id: e.id,
                col1: e.name || e.username,
                col2: e.email || "",
                col3: e.active ? "Active" : "Inactive",
                col4: "",
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
            <Modal
                open={modal === "ADD_EMP"}
                title="Adaugă angajat"
                onClose={close}
                onSubmit={submitAddEmployee}
                submitLabel="Adaugă"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Nume"
                            value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Email"
                            value={form.email || ""}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Username"
                            value={form.username || ""}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Parolă"
                            value={form.password || ""}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* EDIT EMPLOYEE */}
            <Modal
                open={modal === "EDIT_EMP"}
                title="Editează angajat"
                onClose={close}
                onSubmit={submitEditEmployee}
                submitLabel="Salvează"
            >
                <div className="row g-2">
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="ID"
                            value={form.id || ""}
                            onChange={(e) => setForm({ ...form, id: e.target.value })}
                        />
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={form.active ?? ""}
                            onChange={(e) => setForm({ ...form, active: e.target.value })}
                        >
                            <option value="">Active? (opțional)</option>
                            <option value="true">Da</option>
                            <option value="false">Nu</option>
                        </select>
                    </div>
                    <div className="col-md-4">
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
                            placeholder="Email (opțional)"
                            value={form.email || ""}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* DELETE EMPLOYEE */}
            <Modal
                open={modal === "DEL_EMP"}
                title="Șterge angajat"
                onClose={close}
                onSubmit={submitDeleteEmployee}
                submitLabel="Șterge"
            >
                <input
                    className="form-control mb-2"
                    placeholder="ID angajat"
                    value={form.id || ""}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                />
                <p className="text-danger small mb-0">
                    Atenție: acțiune ireversibilă.
                </p>
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

            {/* VIEW ASSIGNMENTS FOR EMPLOYEE */}
            <Modal
                open={modal === "VIEW_ASSIGNMENTS"}
                title="Vezi asignările unui angajat"
                onClose={close}
                onSubmit={submitViewAssignments}
                submitLabel="Afișează"
            >
                <input
                    className="form-control"
                    placeholder="Employee ID"
                    value={form.employeeId || ""}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
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
