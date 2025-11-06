import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
//mai trebuie facuta pagina cu butoane in sidebar pentru admin si facuta legatura la pagina cu baza de date sa poata
//prelua ce i in baza de date
//trebuie populata baza de date cu valori ca sa avem cu ce lucra in interfata
import {
    getTasks,
    getTasksInProgress,
    getCompletedTasks,
    getLeaveRequests,
    getPendingLeaveRequests,
    getApprovedLeaveRequests,
    getRejectedLeaveRequests,
    createLeaveRequest,
    Task,
    LeaveRequest,
} from "../services/EmployeeService";
import { updateTask } from "../services/EmployeeService";


import StatCard from "../components/ui/StatCard";
import LineBarCombo from "../components/charts/LineBarCombo";
import Donut from "../components/charts/Donut";
import ProgressTable from "../components/tables/ProgressTable";

type View = "TASKS" | "LEAVES";

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [view, setView] = useState<View>("TASKS");

    // Load all tasks
    const loadTasks = async () => {
        try {
            const data = await getTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading tasks:", error);
            setTasks([]);
        }
    };

    // Load all leave requests
    const loadLeaveRequests = async () => {
        try {
            const data = await getLeaveRequests();
            setLeaveRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading leave requests:", error);
            setLeaveRequests([]);
        }
    };

    // Sidebar button actions
    const actions = {
        tasks: {
            all: loadTasks,
            inProgress: async () => {
                const data = await getTasksInProgress();
                setTasks(Array.isArray(data) ? data : []);
            },
            completed: async () => {
                const data = await getCompletedTasks();
                setTasks(Array.isArray(data) ? data : []);
            },
        },
        leaves: {
            all: loadLeaveRequests,
            pending: async () => {
                const data = await getPendingLeaveRequests();
                setLeaveRequests(Array.isArray(data) ? data : []);
            },
            approved: async () => {
                const data = await getApprovedLeaveRequests();
                setLeaveRequests(Array.isArray(data) ? data : []);
            },
            rejected: async () => {
                const data = await getRejectedLeaveRequests();
                setLeaveRequests(Array.isArray(data) ? data : []);
            },
            create: async () => {
                const reason = prompt("Enter leave reason:");
                if (!reason) return;
                try {
                    await createLeaveRequest({ reason, fromDate: new Date().toISOString(), toDate: new Date().toISOString() });
                    alert("Leave request created!");
                    loadLeaveRequests();
                } catch (error) {
                    console.error("Error creating leave request:", error);
                    alert("Failed to create leave request");
                }
            }
        },
        update: async () => {
            const idStr = prompt("Enter Task ID to update:");
            if (!idStr) return;

            const taskId = parseInt(idStr);
            if (isNaN(taskId)) {
                alert("Invalid ID");
                return;
            }

            // Alegi ce vrei să modifici:
            const newStatus = prompt("Enter new status (e.g. TODO, IN_PROGRESS, DONE) or leave empty:");
            const newDurationStr = prompt("Enter new planned duration (minutes) or leave empty:");

            let plannedDurationMin: number | undefined = undefined;
            if (newDurationStr && !isNaN(parseInt(newDurationStr))) {
                plannedDurationMin = parseInt(newDurationStr);
            }

            try {
                await updateTask(taskId, newStatus || undefined, plannedDurationMin);
                alert("Task updated successfully!");
                loadTasks();
            } catch (error) {
                console.error("Error updating task:", error);
                alert("Failed to update task.");
            }
        }
    };

    // Stats
    const taskStats = {
        total: Array.isArray(tasks) ? tasks.length : 0,
        completed: Array.isArray(tasks) ? tasks.filter((t) => t.status === "COMPLETED").length : 0,
        inProgress: Array.isArray(tasks) ? tasks.filter((t) => t.status === "IN_PROGRESS").length : 0,
        pending: Array.isArray(tasks) ? tasks.filter((t) => t.status === "NEW" || t.status === "PENDING").length : 0,
    };

    const leaveStats = {
        total: Array.isArray(leaveRequests) ? leaveRequests.length : 0,
        pending: Array.isArray(leaveRequests) ? leaveRequests.filter((l) => l.status === "PENDING").length : 0,
        approved: Array.isArray(leaveRequests) ? leaveRequests.filter((l) => l.status === "APPROVED").length : 0,
        rejected: Array.isArray(leaveRequests) ? leaveRequests.filter((l) => l.status === "REJECTED").length : 0,
    };

    // Charts
    const taskStatusDistribution = [
        { name: "Completed", value: taskStats.completed },
        { name: "In Progress", value: taskStats.inProgress },
        { name: "Pending", value: taskStats.pending },
    ];

    const leaveStatusDistribution = [
        { name: "Approved", value: leaveStats.approved },
        { name: "Pending", value: leaveStats.pending },
        { name: "Rejected", value: leaveStats.rejected },
    ];

    // Load tasks and leaves on mount
    useEffect(() => {
        loadTasks();
        loadLeaveRequests();
    }, []);

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-15 p-4 bg-gray-100 flex flex-col gap-2">
                <h2 className="font-semibold mb-2">Actions</h2>

                {/* Tasks */}
                <button onClick={() => { setView("TASKS"); actions.tasks.all(); }} className="btn">All Tasks</button>
                <button onClick={() => { setView("TASKS"); actions.tasks.inProgress(); }} className="btn">In Progress</button>
                <button onClick={() => { setView("TASKS"); actions.tasks.completed(); }} className="btn">Completed</button>
                <button onClick={() => { setView("LEAVES"); actions.update(); }} className="btn">Update task</button>

                <hr className="my-2"/>

                {/* Leave Requests */}
                <button onClick={() => { setView("LEAVES"); actions.leaves.all(); }} className="btn">All Leaves</button>
                <button onClick={() => { setView("LEAVES"); actions.leaves.pending(); }} className="btn">Pending</button>
                <button onClick={() => { setView("LEAVES"); actions.leaves.approved(); }} className="btn">Approved</button>
                <button onClick={() => { setView("LEAVES"); actions.leaves.rejected(); }} className="btn">Rejected</button>
                <button onClick={() => { setView("LEAVES"); actions.leaves.create(); }} className="btn">Create Leave</button>

            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto space-y-6">
                <h1 className="text-2xl font-semibold">Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {view === "TASKS" ? (
                        <>
                            <StatCard title="Total Tasks" value={taskStats.total} />
                            <StatCard title="Completed" value={taskStats.completed} />
                            <StatCard title="In Progress" value={taskStats.inProgress} />
                            <StatCard title="Pending" value={taskStats.pending} />
                        </>
                    ) : (
                        <>
                            <StatCard title="Total Leaves" value={leaveStats.total} />
                            <StatCard title="Pending" value={leaveStats.pending} />
                            <StatCard title="Approved" value={leaveStats.approved} />
                            <StatCard title="Rejected" value={leaveStats.rejected} />
                        </>
                    )}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="lg:col-span-2">
                        <LineBarCombo
                            data={
                                view === "TASKS"
                                    ? tasks.map((t) => ({
                                        name: t.title,
                                        progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20
                                    }))
                                    : leaveRequests.map((l) => ({
                                        name: `${l.fromDate} - ${l.toDate}`,
                                        progress: l.status === "APPROVED" ? 100 : l.status === "PENDING" ? 50 : 0
                                    }))
                            }
                        />
                    </div>
                    <Donut data={view === "TASKS" ? taskStatusDistribution : leaveStatusDistribution} />
                </div>

                {/* Progress Table */}
                <ProgressTable
                    rows={
                        view === "TASKS"
                            ? tasks.map((t) => ({
                                code: t.id.toString(),
                                start: t.title,
                                end: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                                warning: t.priority && t.priority >= 4 ? "High Priority" : "",
                                progress: t.status === "COMPLETED" ? 100 : t.status === "IN_PROGRESS" ? 60 : 20,
                            }))
                            : leaveRequests.map((l) => ({
                                code: l.id.toString(),
                                start: l.fromDate,
                                end: l.toDate,
                                warning: l.reason || "",
                                progress: l.status === "APPROVED" ? 100 : l.status === "PENDING" ? 50 : 0,
                            }))
                    }
                />
            </div>
        </div>
    );
}
