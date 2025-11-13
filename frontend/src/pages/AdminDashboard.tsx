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
            <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-64 p-4 bg-gray-100 space-y-2">
                    <h2 className="font-semibold mb-2">Admin Actions</h2>

                    <div className="text-xs uppercase text-gray-500">Tasks</div>
                    <button className="btn w-full" onClick={() => setView("TASKS_UNASSIGNED")}>Unassigned</button>
                    <button className="btn w-full" onClick={() => setView("MY_TASKS")}>My Tasks</button>
                    <button className="btn w-full" onClick={() => open("ASSIGN_TO_ME")}>Assign task to me…</button>

                    <div className="text-xs uppercase text-gray-500 mt-4">Employees</div>
                    <button className="btn w-full" onClick={() => setView("EMPLOYEES")}>List</button>
                    <button className="btn w-full" onClick={() => open("ADD_EMP")}>Add…</button>
                    <button className="btn w-full" onClick={() => open("EDIT_EMP")}>Edit…</button>
                    <button className="btn w-full" onClick={() => open("DEL_EMP")}>Delete…</button>

                    <div className="text-xs uppercase text-gray-500 mt-4">Import</div>
                    <button className="btn w-full" onClick={() => open("IMPORT_XML")}>Import XML…</button>

                    <div className="text-xs uppercase text-gray-500 mt-4">Assignments</div>
                    <button className="btn w-full" onClick={() => open("ASSIGN")}>Assign to employee…</button>
                    <button className="btn w-full" onClick={() => open("UNASSIGN")}>Unassign…</button>
                    <button className="btn w-full" onClick={() => open("VIEW_ASSIGNMENTS")}>View for employee…</button>

                    <div className="text-xs uppercase text-gray-500 mt-4">Reports</div>
                    <button className="btn w-full" onClick={() => open("GENERATE_REPORT")}>Generate monthly…</button>
                </div>

                {/* Main */}
                <div className="flex-1 p-6 space-y-6 overflow-auto">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard title="Unassigned" value={taskStats.unassigned} />
                        <StatCard title="My Tasks" value={taskStats.myTasks} />
                        <StatCard title="High Priority" value={taskStats.highPriority} />
                        <StatCard title="Due ≤ 7 days" value={taskStats.dueThisWeek} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <LineBarCombo data={lineBarData} />
                        </div>
                        <Donut data={donutData} />
                    </div>

                    {/* Table */}
                    <ProgressTable rows={rows} />
                </div>
            </div>

            {/* ===== Modals ===== */}

            {/* ADD EMPLOYEE */}
            <Modal open={modal === "ADD_EMP"} title="Adaugă angajat" onClose={close} onSubmit={submitAddEmployee} submitLabel="Adaugă">
                <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Nume" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/>
                    <input className="input" placeholder="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/>
                    <input className="input" placeholder="Username" value={form.username||""} onChange={e=>setForm({...form,username:e.target.value})}/>
                    <input className="input" placeholder="Parolă" type="password" value={form.password||""} onChange={e=>setForm({...form,password:e.target.value})}/>
                </div>
            </Modal>

            {/* EDIT EMPLOYEE */}
            <Modal open={modal === "EDIT_EMP"} title="Editează angajat" onClose={close} onSubmit={submitEditEmployee} submitLabel="Salvează">
                <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="ID" value={form.id||""} onChange={e=>setForm({...form,id:e.target.value})}/>
                    <select className="input" value={form.active ?? ""} onChange={e=>setForm({...form,active:e.target.value})}>
                        <option value="">Active? (opțional)</option>
                        <option value="true">Da</option>
                        <option value="false">Nu</option>
                    </select>
                    <input className="input" placeholder="Nume (opţional)" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/>
                    <input className="input" placeholder="Email (opţional)" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/>
                    <input className="input col-span-2" placeholder="Username (opţional)" value={form.username||""} onChange={e=>setForm({...form,username:e.target.value})}/>
                </div>
            </Modal>

            {/* DELETE EMPLOYEE */}
            <Modal open={modal === "DEL_EMP"} title="Șterge angajat" onClose={close} onSubmit={submitDeleteEmployee} submitLabel="Șterge">
                <input className="input" placeholder="ID angajat" value={form.id||""} onChange={e=>setForm({...form,id:e.target.value})}/>
                <p className="text-sm text-red-600">Atenție: acțiune ireversibilă.</p>
            </Modal>

            {/* ASSIGN TASK */}
            <Modal open={modal === "ASSIGN"} title="Asignează task la angajat" onClose={close} onSubmit={submitAssign} submitLabel="Asignează">
                <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Task ID" value={form.taskId||""} onChange={e=>setForm({...form,taskId:e.target.value})}/>
                    <input className="input" placeholder="Employee ID" value={form.employeeId||""} onChange={e=>setForm({...form,employeeId:e.target.value})}/>
                </div>
            </Modal>

            {/* UNASSIGN */}
            <Modal open={modal === "UNASSIGN"} title="Dezasignează task" onClose={close} onSubmit={submitUnassign} submitLabel="Dezasignează">
                <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Task ID" value={form.taskId||""} onChange={e=>setForm({...form,taskId:e.target.value})}/>
                    <input className="input" placeholder="Employee ID" value={form.employeeId||""} onChange={e=>setForm({...form,employeeId:e.target.value})}/>
                </div>
            </Modal>

            {/* ASSIGN TO ME */}
            <Modal open={modal === "ASSIGN_TO_ME"} title="Asignează task către mine" onClose={close} onSubmit={submitAssignToMe} submitLabel="Asignează mie">
                <input className="input" placeholder="Task ID" value={form.taskId||""} onChange={e=>setForm({...form,taskId:e.target.value})}/>
            </Modal>

            {/* VIEW ASSIGNMENTS FOR EMPLOYEE */}
            <Modal open={modal === "VIEW_ASSIGNMENTS"} title="Vezi asignările unui angajat" onClose={close} onSubmit={submitViewAssignments} submitLabel="Afișează">
                <input className="input" placeholder="Employee ID" value={form.employeeId||""} onChange={e=>setForm({...form,employeeId:e.target.value})}/>
            </Modal>

            {/* GENERATE REPORT */}
            <Modal open={modal === "GENERATE_REPORT"} title="Generează raport lunar" onClose={close} onSubmit={submitGenerateReport} submitLabel="Generează">
                <div className="grid grid-cols-3 gap-3">
                    <input className="input" placeholder="Employee ID" value={form.employeeId||""} onChange={e=>setForm({...form,employeeId:e.target.value})}/>
                    <input className="input" placeholder="An" value={form.year||""} onChange={e=>setForm({...form,year:e.target.value})}/>
                    <input className="input" placeholder="Lună (1-12)" value={form.month||""} onChange={e=>setForm({...form,month:e.target.value})}/>
                </div>
            </Modal>

            {/* IMPORT XML */}
            <Modal open={modal === "IMPORT_XML"} title="Importă utilizatori din XML" onClose={close} onSubmit={submitImportXml} submitLabel="Importă">
                <input
                    className="input"
                    type="file"
                    accept=".xml"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, file: e.target.files?.[0] })}
                />
                {form.file && <p className="text-sm text-gray-500">Fișier selectat: {form.file.name}</p>}
            </Modal>

            {/* Tiny Tailwind-y inputs */}
            <style>{`
        .btn{ @apply inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 shadow-sm hover:bg-gray-50 border border-gray-200; }
        .input{ @apply w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200; }
      `}</style>
        </AdminLayout>
    );
}
