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

    // ───────────────────── Leave form state
    const [leaveStart, setLeaveStart] = useState("");
    const [leaveEnd, setLeaveEnd] = useState("");
    const [leaveReason, setLeaveReason] = useState("");

    // ───────────────────── Proposal modal state
    const [modalType, setModalType] = useState<ModalType>("NONE");
    const [proposalTask, setProposalTask] = useState<EmployeeTask | null>(null);
    const [proposalDate, setProposalDate] = useState("");
    const [proposalTime, setProposalTime] = useState("");

    // ========================= DATA LOADING =========================
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

    // ========================= DERIVED STATS =========================
    const stats = useMemo(() => {
        const byStatus: Record<string, number> = {
            NEW: 0,
            PENDING: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
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

    // ========================= TASK ACTIONS =========================
    const reloadTasksOnly = async () => {
        try {
            const data = await getTasks();
            setTasks(data || []);
        } catch (err) {
            console.error(err);
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

    const handleHide = async (taskId: number) => {
        try {
            await hideTask(taskId);
            await reloadTasksOnly();
        } catch (err: any) {
            alert(err.message || "Eroare la ascundere task.");
        }
    };

    const handleMarkCompleted = async (taskId: number) => {
        try {
            await updateTask(taskId, { status: "COMPLETED" });
            await reloadTasksOnly();
        } catch (err: any) {
            alert(err.message || "Eroare la marcarea ca finalizat.");
        }
    };

    // ========================= PROPOSAL MODAL =========================
    const openProposalModal = (task: EmployeeTask) => {
        setProposalTask(task);
        // dacă există deadline în format ISO, luăm doar data
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
        if (!proposalDate || !proposalTime) {
            alert("Te rog alege data și ora propuse.");
            return;
        }

        try {
            await proposeTaskChange(proposalTask.id, proposalDate, proposalTime);
            alert("Propunerea a fost trimisă.");
            closeModal();
        } catch (err: any) {
            alert(err.message || "Eroare la trimiterea propunerii.");
        }
    };

    // ========================= LEAVE HANDLERS =========================
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

    // ========================= HELPERS =========================
    const statusBadge = (status: string) => {
        let cls = "badge bg-secondary";
        let label = status;

        if (status === "NEW") {
            cls = "badge bg-warning text-dark";
            label = "Nou";
        } else if (status === "PENDING") {
            cls = "badge bg-info text-dark";
            label = "În așteptare";
        } else if (status === "IN_PROGRESS") {
            cls = "badge bg-primary";
            label = "În lucru";
        } else if (status === "COMPLETED") {
            cls = "badge bg-success";
            label = "Finalizat";
        }

        return <span className={cls}>{label}</span>;
    };

    // ========================= RENDER =========================
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
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <p className="text-muted mb-1">Noi</p>
                            <h4 className="mb-0">{stats.NEW}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <p className="text-muted mb-1">În așteptare</p>
                            <h4 className="mb-0">{stats.PENDING}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <p className="text-muted mb-1">În lucru</p>
                            <h4 className="mb-0">{stats.IN_PROGRESS}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-sm-6 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <p className="text-muted mb-1">Finalizate</p>
                            <h4 className="mb-0">{stats.COMPLETED}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== VIEW: TASKS ==================== */}
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
                                                    {/* similar cu logica PHP-ului tău */}
                                                    {t.status === "NEW" && (
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
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm"
                                                                onClick={() => handleHide(t.id)}
                                                            >
                                                                Ascunde
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

                                                    {t.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                className="btn btn-primary btn-sm me-2"
                                                                onClick={() =>
                                                                    updateTask(t.id, {
                                                                        status: "IN_PROGRESS",
                                                                    }).then(reloadTasksOnly)
                                                                }
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

                                                    {t.status === "COMPLETED" && (
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

            {/* ==================== VIEW: LEAVE ==================== */}
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

            {/* ==================== VIEW: CALENDAR ==================== */}
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

            {/* ==================== PROPOSAL MODAL ==================== */}
            {modalType === "PROPOSE_CHANGE" && (
                <div
                    className="modal-backdrop show"
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1050,
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="card" style={{ width: 420 }}>
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
