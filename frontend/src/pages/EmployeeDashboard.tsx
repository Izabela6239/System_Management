// frontend/src/pages/EmployeeDashboard.tsx
import React, {
    useEffect,
    useMemo,
    useState,
    FormEvent,
    ChangeEvent,
} from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";

import "../assets/css/app-calendar.css"; // ajustează path-ul dacă e nevoie
import "../assets/css/core.scss";
import "../assets/css/demo.css";
import "../assets/css/app-logistics-dashboard.css";

import {
    getTasks,
    getLeaveRequests,
    createLeaveRequest,
    updateTask,
    acceptTask,
    rejectTask,
    cancelTask,
    hideTask,
    proposeTaskChange,
    EmployeeTask,
    LeaveRequest,
} from "../services/EmployeeService";


type View = "TASKS" | "LEAVE" | "CALENDAR";

type ModalType = "NONE" | "NEW_LEAVE" | "PROPOSE_CHANGE";

const EmployeeDashboard: React.FC = () => {
    const [view, setView] = useState<View>("TASKS");
    const [tasks, setTasks] = useState<EmployeeTask[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [leaveStart, setLeaveStart] = useState("");
    const [leaveEnd, setLeaveEnd] = useState("");
    const [leaveReason, setLeaveReason] = useState("");
    const [modalType, setModalType] = useState<ModalType>("NONE");
    const [proposalTask, setProposalTask] = useState<EmployeeTask | null>(null);
    const [proposalDate, setProposalDate] = useState("");
    const [proposalTime, setProposalTime] = useState("");

    const loadAll = async () => {
        try {
            setLoading(true);
            setErrorMsg(null);
            const [tasksData, leaveData] = await Promise.all([
                getTasks(),
                getLeaveRequests(),
            ]);
            setTasks(tasksData || []);
            setLeaveRequests(leaveData || []);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const stats = useMemo(() => {
        const byStatus: Record<string, number> = {
            IN_PROGRESS: 0,
            DONE: 0,
            REJECTED: 0,
            ACCEPTED: 0,
            ASSIGNED: 0,
        };

        for (const t of tasks) {
            if (t.status && byStatus[t.status] !== undefined) {
                byStatus[t.status]++;
            }
        }

        return byStatus;
    }, [tasks]);

    const calendarEvents: EventInput[] = useMemo(
        () =>
            tasks
                .filter((t) => t.deadline)
                .map((t) => ({
                    id: String(t.id),
                    title: t.title,
                    start: t.deadline,
                    allDay: true,
                    extendedProps: { status: t.status },
                })),
        [tasks]
    );

    const reloadTasksOnly = async () => {
        try {
            console.log("🔄 Reloading tasks...");
            const data = await getTasks();
            console.log("📥 Tasks reloaded. Total tasks:", data.length);

            // Log detaliat pentru fiecare task
            data.forEach((task, index) => {
                console.log(`📋 Task ${index + 1}:`, {
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    hasStatusChanged: task.status === "DONE" ? "✅ CHANGED TO DONE" : "❌ NOT CHANGED"
                });
            });

            setTasks(data || []);
        } catch (err) {
            console.error("❌ Error reloading tasks:", err);
        }
    };

    const handleAccept = async (taskId: number) => {
        if (!window.confirm("Accepți acest task?")) return;
        try {
            await acceptTask(taskId);
            await reloadTasksOnly();
        } catch (err: any) {
            alert(err.message || "Eroare la acceptare task.");
        }
    };

    const handleReject = async (taskId: number) => {
        if (!window.confirm("Respingi acest task?")) return;
        try {
            await rejectTask(taskId);
            await reloadTasksOnly();
        } catch (err: any) {
            alert(err.message || "Eroare la respingere task.");
        }
    };

    const handleCancel = async (taskId: number) => {
        if (!window.confirm("Ești sigur că vrei să anulezi acest task?")) return;
        try {
            await cancelTask(taskId);
            await reloadTasksOnly();
        } catch (err: any) {
            alert(err.message || "Eroare la anulare task.");
        }
    };


    const handleMarkCompleted = async (taskId: number) => {
        if (!window.confirm("Ești sigur că vrei să marchezi acest task ca finalizat?")) return;

        try {
            console.log("🔄 STEP 1: Starting mark as completed for task:", taskId);
            console.log("🔄 Current tasks before update:", tasks);

            console.log("🔄 STEP 2: Calling updateTask API...");
            await updateTask(taskId, { status: "DONE" });
            console.log("✅ STEP 2: Backend update successful");

            console.log("🔄 STEP 3: Reloading tasks...");
            await reloadTasksOnly();
            console.log("✅ STEP 3: Tasks reloaded");

            console.log("🔄 STEP 4: Current tasks after reload:", tasks);

            alert("Task-ul a fost marcat ca finalizat!");
        } catch (err: any) {
            console.error("❌ ERROR in handleMarkCompleted:", err);
            alert(err.message || "Eroare la marcarea ca finalizat.");
        }
    };

    const handleStartTask = async (taskId: number) => {
        try {
            await updateTask(taskId, { status: "IN_PROGRESS" });
            await reloadTasksOnly();
        } catch (err: any) {
            alert(err.message || "Eroare la pornirea task-ului.");
        }
    };

    const openProposalModal = (task: EmployeeTask) => {
        setProposalTask(task);
        if (task.deadline) {
            const [d, t] = task.deadline.split("T");
            setProposalDate(d);
            setProposalTime(t?.slice(0, 5) || "09:00");
        } else {
            setProposalDate("");
            setProposalTime("09:00");
        }
        setModalType("PROPOSE_CHANGE");
    };

    const closeModal = () => {
        setModalType("NONE");
        setProposalTask(null);
        setProposalDate("");
        setProposalTime("");
    };

    const handleSendProposal = async () => {
        if (!proposalTask) return;
        if (!proposalDate) {
            alert("Te rog alege data propusă.");
            return;
        }

        try {
            console.log("📤 Sending proposal:", {
                taskId: proposalTask.id,
                newDate: proposalDate  // Doar data
            });

            await proposeTaskChange(proposalTask.id, proposalDate);
            alert("Propunerea a fost trimisă.");
            closeModal();

            // Reîncarcă task-urile
            await reloadTasksOnly();
        } catch (err: any) {
            console.error("❌ Error sending proposal:", err);
            alert(err.message || "Eroare la trimiterea propunerii.");
        }
    };

    const handleLeaveSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!leaveStart || !leaveEnd) {
            alert("Te rog alege perioada de concediu.");
            return;
        }
        try {
            await createLeaveRequest({
                fromDate: leaveStart,
                toDate: leaveEnd,
                reason: leaveReason,
            });

            setLeaveStart("");
            setLeaveEnd("");
            setLeaveReason("");
            await loadAll();
            alert("Cererea de concediu a fost trimisă.");
        } catch (err: any) {
            alert(err.message || "Eroare la trimiterea cererii.");
        }
    };

    const statusBadge = (status: string) => {
        let cls = "badge bg-secondary";
        let label = status;

        if (status === "DONE") {
            cls = "badge bg-warning text-dark";
            label = "DONE";
        } else if (status === "IN_PROGRESS") {
            cls = "badge bg-primary";
            label = "IN PROGRESS";
        } else if (status === "ASSIGNED") {
            cls = "badge bg-success";
            label = "ASSIGNED";
        } else if (status === "ACCEPTED") {
            cls = "badge bg-success";
            label = "ACCEPTED";
        } else if (status === "REJECTED") {
            cls = "badge bg-danger";
            label = "REJECTED";
        }

        return <span className={cls}>{label}</span>;
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Employee Dashboard</h4>

                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className={
                            "btn btn-sm " +
                            (view === "TASKS" ? "btn-primary" : "btn-outline-primary")
                        }
                        onClick={() => setView("TASKS")}
                    >
                        Tasks
                    </button>
                    <button
                        type="button"
                        className={
                            "btn btn-sm " +
                            (view === "LEAVE" ? "btn-primary" : "btn-outline-primary")
                        }
                        onClick={() => setView("LEAVE")}
                    >
                        Leave
                    </button>
                    <button
                        type="button"
                        className={
                            "btn btn-sm " +
                            (view === "CALENDAR" ? "btn-primary" : "btn-outline-primary")
                        }
                        onClick={() => setView("CALENDAR")}
                    >
                        Calendar
                    </button>
                </div>
            </div>

            {loading && <div>Loading...</div>}
            {errorMsg && (
                <div className="alert alert-danger" role="alert">
                    {errorMsg}
                </div>
            )}
            {/* KPI cards */}
            <div className="row mb-4">
                <div className="col-auto mb-3 flex-fill">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <p className="text-muted mb-1">Finalizat</p>
                            <h4 className="mb-0">{stats.DONE}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-auto mb-3 flex-fill">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <p className="text-muted mb-1">În lucru</p>
                            <h4 className="mb-0">{stats.IN_PROGRESS}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-auto mb-3 flex-fill">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <p className="text-muted mb-1">Acceptate</p>
                            <h4 className="mb-0">{stats.ACCEPTED}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-auto mb-3 flex-fill">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <p className="text-muted mb-1">Respins</p>
                            <h4 className="mb-0">{stats.REJECTED}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-auto mb-3 flex-fill">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <p className="text-muted mb-1">Asignat</p>
                            <h4 className="mb-0">{stats.ASSIGNED || 0}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {view === "TASKS" && (
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Task-uri</h5>
                    </div>
                    <div className="card-body">
                        {tasks.length === 0 ? (
                            <div className="text-muted">Nu există task-uri.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Titlu</th>
                                        <th>Deadline</th>
                                        <th>Prioritate</th>
                                        <th>Status</th>
                                        <th>Acțiuni</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {tasks.map((t) => {
                                        const deadlineText = t.deadline
                                            ? new Date(t.deadline).toLocaleString("ro-RO", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "—";
                                        return (
                                            <tr key={t.id}>
                                                <td>{t.id}</td>
                                                <td>{t.title}</td>
                                                <td>{deadlineText}</td>
                                                <td>{t.priority ?? "—"}</td>
                                                <td>{statusBadge(t.status)}</td>
                                                <td>

                                                    {t.status === "ASSIGNED" && (
                                                        <>
                                                            <button
                                                                className="btn btn-success btn-sm me-2"
                                                                onClick={() => handleAccept(t.id)}
                                                            >
                                                                Acceptă
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm me-2"
                                                                onClick={() => handleReject(t.id)}
                                                            >
                                                                Respinge
                                                            </button>

                                                        </>
                                                    )}

                                                    {t.status === "IN_PROGRESS" && (
                                                        <>
                                                            <button
                                                                className="btn btn-warning btn-sm me-2"
                                                                onClick={() => openProposalModal(t)}
                                                            >
                                                                Propune modificare
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm me-2"
                                                                onClick={() => handleCancel(t.id)}
                                                            >
                                                                Anulează
                                                            </button>
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleMarkCompleted(t.id)}
                                                            >
                                                                Marchează finalizat
                                                            </button>
                                                        </>
                                                    )}
                                                    {t.status === "ACCEPTED" && (
                                                        <>
                                                            <button
                                                                className="btn btn-primary btn-sm me-2"
                                                                onClick={() => handleStartTask(t.id)}
                                                            >
                                                                Pornește
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm me-2"
                                                                onClick={() => handleCancel(t.id)}
                                                            >
                                                                Anulează
                                                            </button>
                                                        </>
                                                    )}

                                                    {( t.status === "DONE") && (
                                                        <span className="text-muted">—</span>
                                                    )}

                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {view === "LEAVE" && (
                <div className="row">
                    <div className="col-lg-5 mb-4">
                        <div className="card h-100">
                            <div className="card-header">
                                <h5 className="mb-0">Cerere nouă de concediu</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleLeaveSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">De la</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={leaveStart}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setLeaveStart(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Până la</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={leaveEnd}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setLeaveEnd(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Motiv (opțional)</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={leaveReason}
                                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                                setLeaveReason(e.target.value)
                                            }
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary">
                                        Trimite cererea
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-7 mb-4">
                        <div className="card h-100">
                            <div className="card-header">
                                <h5 className="mb-0">Istoric concedii</h5>
                            </div>
                            <div className="card-body">
                                {leaveRequests.length === 0 ? (
                                    <div className="text-muted">Nu există cereri.</div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table align-middle">
                                            <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Perioadă</th>
                                                <th>Status</th>
                                                <th>Motiv</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {leaveRequests.map((lr) => (
                                                <tr key={lr.id}>
                                                    <td>{lr.id}</td>
                                                    <td>
                                                        {lr.fromDate} – {lr.toDate}
                                                    </td>
                                                    <td>{statusBadge(lr.status || "")}</td>
                                                    <td>{lr.reason || "—"}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === "CALENDAR" && (
                <div className="card app-calendar-wrapper">
                    <div className="card-body">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            height="auto"
                            events={calendarEvents}
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,dayGridWeek,dayGridDay",
                            }}
                        />
                    </div>
                </div>
            )}

            {modalType === "PROPOSE_CHANGE" && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.35)",
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div
                        className="card"
                        style={{
                            width: 420,
                            background: "white",
                            zIndex: 2100,
                            position: "relative",
                        }}
                    >
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Propune modificare</h5>
                            <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={closeModal}
                            >
                                ×
                            </button>
                        </div>
                        <div className="card-body">
                            
                            <div className="mb-3">
                                <label className="form-label">Data nouă</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={proposalDate}
                                    onChange={(e) => setProposalDate(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Ora nouă</label>
                                <input
                                    type="time"
                                    className="form-control"
                                    value={proposalTime}
                                    step={900}
                                    onChange={(e) => setProposalTime(e.target.value)}
                                />
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={closeModal}
                                >
                                    Renunță
                                </button>
                                <button className="btn btn-primary" onClick={handleSendProposal}>
                                    Trimite propunerea
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
