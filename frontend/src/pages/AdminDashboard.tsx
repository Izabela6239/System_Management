// frontend/src/pages/admin/AdminDashboard.tsx
import { useEffect, useMemo, useState, ChangeEvent } from "react";
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

export default function AdminDashboard() {
    const [view, setView] = useState<View>("TASKS_UNASSIGNED");

    // ===== State init =====
    const [employees, setEmployees] = useState<AdminUser[]>([]);
    const [unassignedTasks, setUnassignedTasks] = useState<AdminTask[]>([]);
    const [myTasks, setMyTasks] = useState<AdminTask[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [report, setReport] = useState<MonthlyReport | null>(null);

    // ===== Bootstrap =====
    useEffect(() => {
        refreshEmployees();
        refreshUnassigned();
        refreshMyTasks();
    }, []);

    const refreshEmployees = async () => {
        try {
            const data = await getEmployees();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading employees:", err);
            setEmployees([]);
        }
    };

    const refreshUnassigned = async () => {
        try {
            const data = await getUnassignedTasks();
            setUnassignedTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading unassigned tasks:", err);
            setUnassignedTasks([]);
        }
    };

    const refreshMyTasks = async () => {
        try {
            const data = await getMyTasks();
            setMyTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading my tasks:", err);
            setMyTasks([]);
        }
    };

    // ===== Employees CRUD =====
    const onAddEmployee = async () => {
        const name = prompt("name?");
        const email = prompt("email?");
        const username = prompt("username?");
        const password = prompt("password?");
        if (!name || !email || !username || !password) return;

        await createEmployee({ name, email, username, password, active: true });
        await refreshEmployees();
        alert("Employee created");
    };

    const onEditEmployee = async () => {
        const id = Number(prompt("employee id?"));
        if (!id) return;

        const name = (prompt("new name? (leave empty to skip)") || undefined);
        const email = (prompt("new email? (leave empty to skip)") || undefined);
        const username = (prompt("new username? (leave empty to skip)") || undefined);
        const activeStr = prompt("active? (yes/no, leave empty to skip)");

        const active =
            activeStr?.toLowerCase() === "yes"
                ? true
                : activeStr?.toLowerCase() === "no"
                    ? false
                    : undefined;

        await updateEmployee(id, { name, email, username, active });
        await refreshEmployees();
        alert("Employee updated");
    };

    const onDeleteEmployee = async () => {
        const id = Number(prompt("employee id?"));
        if (!id) return;
        await deleteEmployee(id);
        await refreshEmployees();
        alert("Employee deleted");
    };

    // ===== Import XML =====
    const onImportXml = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await importEmployeesXml(file);
            await refreshEmployees();
            alert(`Import reușit (${Array.isArray(res) ? res.length : 0} utilizatori creați).`);
        } catch (err) {
            console.error(err);
            alert("Import eșuat. Verifică formatul XML.");
        } finally {
            e.target.value = "";
        }
    };

    // ===== Assignments =====
    const onAssign = async () => {
        const taskId = Number(prompt("taskId to assign?"));
        const employeeId = Number(prompt("employeeId?"));
        if (!taskId || !employeeId) return;
        await assignTask(taskId, employeeId);
        await refreshUnassigned();
        alert("Assigned");
    };

    const onUnassign = async () => {
        const taskId = Number(prompt("taskId to unassign?"));
        const employeeId = Number(prompt("employeeId?"));
        if (!taskId || !employeeId) return;
        await unassignTask(taskId, employeeId);
        alert("Unassigned");
    };

    const onAssignToMe = async (taskId?: number) => {
        const id = taskId ?? Number(prompt("taskId to assign to me?"));
        if (!id) return;
        await assignTaskToMe(id);
        await Promise.all([refreshUnassigned(), refreshMyTasks()]);
        alert("Assigned to you");
    };

    const onViewAssignmentsForEmployee = async () => {
        const employeeId = Number(prompt("employeeId to view assignments?"));
        if (!employeeId) return;
        const data = await getAssignmentsByEmployee(employeeId);
        setAssignments(Array.isArray(data) ? data : []);
        setView("ASSIGNMENTS");
    };

    // ===== Report =====
    const onGenerateReport = async () => {
        const employeeId = Number(prompt("employeeId?"));
        const year = Number(prompt("Year (e.g. 2025)?"));
        const month = Number(prompt("Month (1-12)?"));
        if (!employeeId || !year || !month) return;
        const data = await generateMonthlyReport(employeeId, year, month);
        setReport(data || null);
        setView("REPORTS");
    };

    // ===== Stats + Charts =====
    const taskStats = useMemo(() => ({
        unassigned: Array.isArray(unassignedTasks) ? unassignedTasks.length : 0,
        myTasks: Array.isArray(myTasks) ? myTasks.length : 0,
        highPriority: Array.isArray(unassignedTasks)
            ? unassignedTasks.filter(t => (t.priority ?? 0) >= 4).length
            : 0,
        dueThisWeek: Array.isArray(unassignedTasks)
            ? unassignedTasks.filter(t => {
                if (!t.deadline) return false;
                const d = new Date(t.deadline);
                const now = new Date();
                const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
                return diff >= 0 && diff <= 7;
            }).length
            : 0,
    }), [unassignedTasks, myTasks]);

    const donutData = [
        { name: "Unassigned", value: taskStats.unassigned },
        { name: "My Tasks", value: taskStats.myTasks },
        { name: "High Priority", value: taskStats.highPriority },
    ];

    const lineBarData = Array.isArray(unassignedTasks)
        ? unassignedTasks.slice(0, 10).map(t => ({
            name: t.title,
            progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20
        }))
        : [];

    // ===== Table rows by view =====
    const rows = useMemo(() => {
        if (view === "TASKS_UNASSIGNED") {
            return Array.isArray(unassignedTasks)
                ? unassignedTasks.map(t => ({
                    code: String(t.id),
                    start: t.title,
                    end: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                    warning: (t.priority ?? 0) >= 4 ? "High Priority" : "",
                    progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20,
                    onRowClick: () => onAssignToMe(t.id),
                }))
                : [];
        }
        if (view === "MY_TASKS") {
            return Array.isArray(myTasks)
                ? myTasks.map(t => ({
                    code: String(t.id),
                    start: t.title,
                    end: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                    warning: "",
                    progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20,
                }))
                : [];
        }
        if (view === "ASSIGNMENTS") {
            return Array.isArray(assignments)
                ? assignments.map(a => ({
                    code: String(a.id),
                    start: `Task #${a.taskId}`,
                    end: `Emp #${a.employeeId}`,
                    warning: `Admin #${a.adminId}`,
                    progress: 100,
                }))
                : [];
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
        return Array.isArray(employees)
            ? employees.map((e) => ({
                code: String(e.id),
                start: e.name || e.username,
                end: e.email || "",
                warning: e.active ? "active" : "inactive",
                progress: 100,
            }))
            : [];
    }, [view, unassignedTasks, myTasks, assignments, report, employees]);

    // ===== Render =====
    return (
        <AdminLayout>
            <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-64 p-4 bg-gray-100 space-y-2">
                    <h2 className="font-semibold mb-2">Admin Actions</h2>

                    <div className="text-xs uppercase text-gray-500">Tasks</div>
                    <button className="btn w-full" onClick={() => setView("TASKS_UNASSIGNED")}>Unassigned</button>
                    <button className="btn w-full" onClick={() => setView("MY_TASKS")}>My Tasks</button>
                    <button className="btn w-full" onClick={() => onAssignToMe()}>Assign task to me…</button>

                    <div className="text-xs uppercase text-gray-500 mt-4">Employees</div>
                    <button className="btn w-full" onClick={() => setView("EMPLOYEES")}>List</button>
                    <button className="btn w-full" onClick={onAddEmployee}>Add…</button>
                    <button className="btn w-full" onClick={onEditEmployee}>Edit…</button>
                    <button className="btn w-full" onClick={onDeleteEmployee}>Delete…</button>

                    <label className="btn w-full cursor-pointer">
                        Import XML
                        <input type="file" accept=".xml" hidden onChange={onImportXml} />
                    </label>

                    <div className="text-xs uppercase text-gray-500 mt-4">Assignments</div>
                    <button className="btn w-full" onClick={onAssign}>Assign to employee…</button>
                    <button className="btn w-full" onClick={onUnassign}>Unassign…</button>
                    <button className="btn w-full" onClick={onViewAssignmentsForEmployee}>View for employee…</button>

                    <div className="text-xs uppercase text-gray-500 mt-4">Reports</div>
                    <button className="btn w-full" onClick={onGenerateReport}>Generate monthly…</button>
                </div>

                {/* Main */}
                <div className="flex-1 p-6 space-y-6 overflow-auto">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

                    <div className="grid grid-cols-4 gap-4">
                        <StatCard title="Unassigned" value={taskStats.unassigned} />
                        <StatCard title="My Tasks" value={taskStats.myTasks} />
                        <StatCard title="High Priority" value={taskStats.highPriority} />
                        <StatCard title="Due ≤ 7 days" value={taskStats.dueThisWeek} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <LineBarCombo data={lineBarData} />
                        </div>
                        <Donut data={donutData} />
                    </div>

                    <ProgressTable rows={rows} />
                </div>
            </div>
        </AdminLayout>
    );
}
