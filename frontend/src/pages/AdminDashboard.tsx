import React, { useEffect, useMemo, useState, ChangeEvent, FormEvent } from "react";
import AdminLayout from "../layouts/AdminLayout";
import StatCard from "../components/ui/StatCard";
import LineBarCombo from "../components/charts/LineBarCombo";
import Donut from "../components/charts/Donut";
import ProgressTable from "../components/tables/ProgressTable";

import {
    getEmployees, createEmployee, updateEmployee, deleteEmployee,
    getUnassignedTasks, getMyTasks, assignTaskToMe, assignTask, unassignTask,
    generateMonthlyReport, getAssignmentsByEmployee, importEmployeesXml,
    AdminTask, AdminUser, Assignment, MonthlyReport
} from "../services/AdminService";

type View = "EMPLOYEES" | "TASKS_UNASSIGNED" | "MY_TASKS" | "ASSIGNMENTS" | "REPORTS";

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

/*****************
 * Generic Modal *
 *****************/
function Modal({ open, title, onClose, children, onSubmit, submitLabel = "Salvează" }: {
    open: boolean; title: string; onClose: () => void; children: React.ReactNode;
    onSubmit?: (e: FormEvent<HTMLFormElement>) => void; submitLabel?: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* dialog */}
            <form
                onSubmit={onSubmit}
                className="relative w-[min(680px,96vw)] max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100">
                        <span className="text-2xl leading-none">×</span>
                    </button>
                </div>
                <div className="space-y-4">{children}</div>
                {onSubmit && (
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button type="button" className="rounded-xl bg-gray-100 px-4 py-2" onClick={onClose}>Anulează</button>
                        <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">{submitLabel}</button>
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

    // modal
    const [modal, setModal] = useState<ModalType>("NONE");

    // small form state (per modal)
    const [form, setForm] = useState<any>({});

    const open = (m: ModalType, initial?: any) => { setForm(initial || {}); setModal(m); };
    const close = () => { setModal("NONE"); setForm({}); };

    // bootstrap
    useEffect(() => {
        refreshEmployees();
        refreshUnassigned();
        refreshMyTasks();
    }, []);

    const refreshEmployees = async () => setEmployees(await getEmployees());
    const refreshUnassigned = async () => setUnassignedTasks(await getUnassignedTasks());
    const refreshMyTasks = async () => setMyTasks(await getMyTasks());

    // ===== Actions (using modal form state) =====
    const submitAddEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { name, email, username, password } = form;
        if (!name || !email || !username || !password) return;
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
        const { id } = form; if (!id) return;
        await deleteEmployee(Number(id));
        await refreshEmployees();
        close();
    };

    const submitAssign = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, employeeId } = form; if (!taskId || !employeeId) return;
        await assignTask(Number(taskId), Number(employeeId));
        await refreshUnassigned();
        close();
    };

    const submitUnassign = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, employeeId } = form; if (!taskId || !employeeId) return;
        await unassignTask(Number(taskId), Number(employeeId));
        close();
    };

    const submitAssignToMe = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId } = form; if (!taskId) return;
        await assignTaskToMe(Number(taskId));
        await Promise.all([refreshUnassigned(), refreshMyTasks()]);
        close();
    };

    const submitViewAssignments = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { employeeId } = form; if (!employeeId) return;
        const data = await getAssignmentsByEmployee(Number(employeeId));
        setAssignments(data);
        setView("ASSIGNMENTS");
        close();
    };

    const submitGenerateReport = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { employeeId, year, month } = form; if (!employeeId || !year || !month) return;
        const data = await generateMonthlyReport(Number(employeeId), Number(year), Number(month));
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

    // ===== Stats + Charts =====
    const taskStats = useMemo(() => ({
        unassigned: unassignedTasks.length,
        myTasks: myTasks.length,
        highPriority: unassignedTasks.filter(t => (t.priority ?? 0) >= 4).length,
        dueThisWeek: unassignedTasks.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            const now = new Date();
            const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
            return diff >= 0 && diff <= 7;
        }).length,
    }), [unassignedTasks, myTasks]);

    const donutData = [
        { name: "Unassigned", value: taskStats.unassigned },
        { name: "My Tasks", value: taskStats.myTasks },
        { name: "High Priority", value: taskStats.highPriority },
    ];

    const lineBarData = (unassignedTasks.slice(0, 10)).map(t => ({
        name: t.title,
        progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20
    }));

    // ===== Table rows by view =====
    const rows = useMemo(() => {
        if (view === "TASKS_UNASSIGNED") {
            return unassignedTasks.map(t => ({
                code: String(t.id),
                start: t.title,
                end: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                warning: (t.priority ?? 0) >= 4 ? "High Priority" : "",
                progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20,
                onRowClick: () => open("ASSIGN_TO_ME", { taskId: t.id }),
            }));
        }
        if (view === "MY_TASKS") {
            return myTasks.map(t => ({
                code: String(t.id),
                start: t.title,
                end: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                warning: "",
                progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20,
            }));
        }
        if (view === "ASSIGNMENTS") {
            return assignments.map(a => ({
                code: String(a.id),
                start: `Task #${a.taskId}`,
                end: `Emp #${a.employeeId}`,
                warning: `Admin #${a.adminId}`,
                progress: 100,
            }));
        }
        if (view === "REPORTS" && report) {
            return [{
                code: String(report.id),
                start: `Emp #${report.employeeId} • ${report.year}-${String(report.month).padStart(2, "0")}`,
                end: new Date(report.generatedAt).toLocaleString(),
                warning: `Completed: ${report.completedTasks}/${report.totalTasks}`,
                progress: report.totalTasks ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0,
            }];
        }
        // EMPLOYEES
        return employees.map((e) => ({
            code: String(e.id),
            start: e.name || e.username,
            end: e.email || "",
            warning: e.active ? "active" : "inactive",
            progress: 100,
        }));
    }, [view, unassignedTasks, myTasks, assignments, report, employees]);

    return (
        <AdminLayout>
            {/* Top toolbar tabs */}
            <div className="flex items-center gap-2 mb-4">
                <button className={`chip ${view==="TASKS_UNASSIGNED"?"chip--active":""}`} onClick={()=>setView("TASKS_UNASSIGNED")}>Tasks</button>
                <button className={`chip ${view==="EMPLOYEES"?"chip--active":""}`} onClick={()=>setView("EMPLOYEES")}>Employees</button>
                <button className={`chip ${view==="ASSIGNMENTS"?"chip--active":""}`} onClick={()=>setView("ASSIGNMENTS")}>Assignments</button>
                <button className={`chip ${view==="REPORTS"?"chip--active":""}`} onClick={()=>setView("REPORTS")}>Reports</button>
                <div className="ml-auto flex gap-2">
                    {view === "EMPLOYEES" && (
                        <>
                            <button className="btn" onClick={()=>open("ADD_EMP")}>Add employee</button>
                            <button className="btn" onClick={()=>open("IMPORT_XML")}>Import XML</button>
                        </>
                    )}
                    {view === "TASKS_UNASSIGNED" && (
                        <button className="btn" onClick={()=>open("ASSIGN_TO_ME")}>Assign to me…</button>
                    )}
                    {view === "ASSIGNMENTS" && (
                        <button className="btn" onClick={()=>open("VIEW_ASSIGNMENTS")}>View by employee…</button>
                    )}
                    {view === "REPORTS" && (
                        <button className="btn" onClick={()=>open("GENERATE_REPORT")}>Generate monthly…</button>
                    )}
                </div>
            </div>

            {/* Content switch */}
            {view === "EMPLOYEES" && (
                <div className="card">
                    <div className="card__header">Employees</div>
                    <div className="overflow-auto">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name / Username</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th style={{width:160}}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {employees.map(e => (
                                <tr key={e.id}>
                                    <td>{e.id}</td>
                                    <td>{e.name || e.username}</td>
                                    <td>{e.email}</td>
                                    <td>
                                        <span className={`badge ${e.active?"badge--ok":"badge--muted"}`}>{e.active?"active":"inactive"}</span>
                                    </td>
                                    <td className="flex gap-2">
                                        <button className="btn" onClick={()=>open("EDIT_EMP", { id: e.id, name: e.name, email: e.email, username: e.username, active: e.active })}>Edit</button>
                                        <button className="btn btn--danger" onClick={()=>open("DEL_EMP", { id: e.id })}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === "TASKS_UNASSIGNED" && (
                <div className="card">
                    <div className="card__header">Unassigned tasks</div>
                    <div className="overflow-auto">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Deadline</th>
                                <th>Priority</th>
                                <th style={{width:160}}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {unassignedTasks.map(t => (
                                <tr key={t.id}>
                                    <td>{t.id}</td>
                                    <td>{t.title}</td>
                                    <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : ""}</td>
                                    <td>{t.priority ?? 0}</td>
                                    <td className="flex gap-2">
                                        <button className="btn" onClick={()=>open("ASSIGN_TO_ME", { taskId: t.id })}>Assign to me</button>
                                        <button className="btn" onClick={()=>open("ASSIGN", { taskId: t.id })}>Assign to employee</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === "MY_TASKS" && (
                <div className="card">
                    <div className="card__header">My tasks</div>
                    <div className="overflow-auto">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Deadline</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {myTasks.map(t => (
                                <tr key={t.id}>
                                    <td>{t.id}</td>
                                    <td>{t.title}</td>
                                    <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : ""}</td>
                                    <td>{t.status}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === "ASSIGNMENTS" && (
                <div className="card">
                    <div className="card__header">Assignments</div>
                    <div className="overflow-auto">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Task</th>
                                <th>Employee</th>
                                <th>By Admin</th>
                            </tr>
                            </thead>
                            <tbody>
                            {assignments.map(a => (
                                <tr key={a.id}>
                                    <td>{a.id}</td>
                                    <td>#{a.taskId}</td>
                                    <td>#{a.employeeId}</td>
                                    <td>#{a.adminId}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === "REPORTS" && report && (
                <div className="card">
                    <div className="card__header">Monthly report</div>
                    <div className="p-4">
                        <p><strong>Employee:</strong> #{report.employeeId}</p>
                        <p><strong>Period:</strong> {report.year}-{String(report.month).padStart(2, "0")}</p>
                        <p><strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}</p>
                        <p><strong>Completed:</strong> {report.completedTasks}/{report.totalTasks}</p>
                    </div>
                </div>
            )}

            {/* existing charts + stats below (optional, you can keep) */}

            {/* Tiny Tailwind utility styles */}
            <style>{`
        .chip{ @apply inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm bg-white hover:bg-gray-50; }
        .chip--active{ @apply bg-indigo-50 border-indigo-200 text-indigo-700; }
        .card{ @apply rounded-2xl border border-gray-200 bg-white shadow-sm; }
        .card__header{ @apply px-4 py-3 border-b border-gray-200 font-medium; }
        .table{ @apply w-full text-sm; }
        .table th{ @apply text-left bg-gray-50 font-medium px-3 py-2; }
        .table td{ @apply px-3 py-2 border-t; }
        .badge{ @apply inline-flex items-center rounded-full px-2 py-0.5 text-xs; }
        .badge--ok{ @apply bg-green-100 text-green-700; }
        .badge--muted{ @apply bg-gray-100 text-gray-600; }
      `}</style>
        </AdminLayout>
    );
}