// frontend/src/pages/EmployeeDashboard.tsx
import React, {
    useEffect,
    useMemo,
    useState,
    FormEvent,
    ChangeEvent,
} from "react";

import {
    getTasks,
    getTasksInProgress,
    getCompletedTasks,
    getLeaveRequests,
    createLeaveRequest,
    updateTask,
    Task,
    LeaveRequest,
} from "../services/EmployeeService";

// FullCalendar
import FullCalendar from "@fullcalendar/react";
import { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// CSS Vuexy (ajustează path-urile dacă este nevoie)
import "../assets/css/core.scss";
import "../assets/css/demo.css";
// dacă ai app-calendar.css, import-o aici (poate fi în alt folder în proiectul tău)
import "../assets/css/app-calendar.css";

type View = "TASKS" | "LEAVE" | "CALENDAR";

type ModalType =
    | "NONE"
    | "NEW_LEAVE"
    | "UPDATE_TASK"
    | "ADD_EVENT";

type TableRow = {
    id: number;
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    actions?: React.ReactNode;
};

type CalendarCategory =
    | "task"
    | "leave"
    | "personal"
    | "business"
    | "family"
    | "holiday"
    | "etc";

type CustomEvent = {
    id: number;
    title: string;
    start: string;
    end?: string;
    allDay: boolean;
    category: CalendarCategory;
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
            <div
                className="position-absolute top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-50"
                onClick={onClose}
            />
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
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onClose}
                        >
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

export default function EmployeeDashboard() {
    const [view, setView] = useState<View>("TASKS");

    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksInProgress, setTasksInProgress] = useState<Task[]>([]);
    const [tasksCompleted, setTasksCompleted] = useState<Task[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

    const [modal, setModal] = useState<ModalType>("NONE");
    const [form, setForm] = useState<any>({});

    // evenimente custom doar pe frontend (ca în Vuexy demo – Personal/Business etc)
    const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
    const [nextEventId, setNextEventId] = useState<number>(1);

    // filtre calendar
    const [calendarFilters, setCalendarFilters] = useState<Record<CalendarCategory, boolean>>({
        task: true,
        leave: true,
        personal: true,
        business: true,
        family: true,
        holiday: true,
        etc: true,
    });

    const open = (m: ModalType, initial?: any) => {
        setForm(initial || {});
        setModal(m);
    };
    const close = () => {
        setModal("NONE");
        setForm({});
    };

    /* ===== Load data ===== */

    const refreshTasks = async () => {
        try {
            const [all, inProg, done] = await Promise.all([
                getTasks(),
                getTasksInProgress(),
                getCompletedTasks(),
            ]);
            setTasks(Array.isArray(all) ? all : []);
            setTasksInProgress(Array.isArray(inProg) ? inProg : []);
            setTasksCompleted(Array.isArray(done) ? done : []);
        } catch (err) {
            console.error("Error loading tasks:", err);
            setTasks([]);
            setTasksInProgress([]);
            setTasksCompleted([]);
        }
    };

    const refreshLeave = async () => {
        try {
            const data = await getLeaveRequests();
            setLeaveRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading leave requests:", err);
            setLeaveRequests([]);
        }
    };

    useEffect(() => {
        // la mount, încarcă tot
        refreshTasks();
        refreshLeave();
    }, []);

    /* ===== Stats ===== */

    const stats = useMemo(
        () => ({
            totalTasks: tasks.length,
            inProgress: tasksInProgress.length,
            completed: tasksCompleted.length,
            openLeave: leaveRequests.filter((l) => l.status === "PENDING").length,
        }),
        [tasks, tasksInProgress, tasksCompleted, leaveRequests]
    );

    /* ===== Tab content -> table rows ===== */

    const tableRows: TableRow[] = useMemo(() => {
        if (view === "TASKS") {
            return tasks.map<TableRow>((t) => ({
                id: t.id,
                col1: t.title,
                col2: t.deadline ? new Date(t.deadline).toLocaleDateString() : "",
                col3: t.status,
                col4: `Priority: ${t.priority ?? "-"}`,
                actions: (
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                            open("UPDATE_TASK", {
                                taskId: t.id,
                                status: t.status,
                                plannedDurationMin: t.plannedDurationMin ?? "",
                            })
                        }
                    >
                        Actualizează
                    </button>
                ),
            }));
        }

        if (view === "LEAVE") {
            return leaveRequests.map<TableRow>((lr) => ({
                id: lr.id,
                col1: `${new Date(lr.fromDate).toLocaleDateString()} - ${new Date(
                    lr.toDate
                ).toLocaleDateString()}`,
                col2: lr.reason || "",
                col3: lr.status,
                col4: lr.admin_comment ? `Comentariu admin: ${lr.admin_comment}` : "",
                actions: undefined,
            }));
        }

        // în view CALENDAR nu afișăm tabel, doar calendar
        return [];
    }, [view, tasks, leaveRequests]);

    /* ===== Actions ===== */

    const submitNewLeave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { fromDate, toDate, reason } = form;

        if (!fromDate || !toDate) {
            alert("Te rog să completezi data de început și data de sfârșit.");
            return;
        }

        try {
            await createLeaveRequest({
                fromDate,
                toDate,
                reason,
            });
            await refreshLeave();
            close();
        } catch (err: any) {
            console.error("Error creating leave request:", err);
            alert("Eroare la creare cerere de concediu.");
        }
    };

    const submitUpdateTask = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, status, plannedDurationMin } = form;

        if (!taskId) {
            alert("Lipsește ID-ul task-ului.");
            return;
        }

        try {
            await updateTask(
                Number(taskId),
                status || undefined,
                plannedDurationMin ? Number(plannedDurationMin) : undefined
            );
            await refreshTasks();
            close();
        } catch (err: any) {
            console.error("Error updating task:", err);
            alert("Eroare la actualizarea task-ului.");
        }
    };

    const submitAddEvent = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { title, category, start, end, allDay } = form;

        if (!title || !start) {
            alert("Titlu și data de început sunt obligatorii.");
            return;
        }

        const newEvent: CustomEvent = {
            id: nextEventId,
            title,
            start,
            end: end || undefined,
            allDay: allDay ?? true,
            category: (category as CalendarCategory) || "personal",
        };

        setCustomEvents((prev) => [...prev, newEvent]);
        setNextEventId((id) => id + 1);
        close();
    };

    /* ===== Calendar data ===== */

    const calendarEvents: EventInput[] = useMemo(() => {
        const events: EventInput[] = [];

        // Task-uri ca evenimente (category: "task" / business-like)
        if (calendarFilters.task) {
            tasks.forEach((t) => {
                if (!t.deadline) return;
                events.push({
                    id: `task-${t.id}`,
                    title: `Task: ${t.title}`,
                    start: t.deadline,
                    allDay: true,
                    classNames: ["fc-event-business"],
                });
            });
        }

        // Concedii ca evenimente (category: "leave" / holiday-like)
        if (calendarFilters.leave) {
            leaveRequests.forEach((lr) => {
                events.push({
                    id: `leave-${lr.id}`,
                    title: `Concediu (${lr.status})`,
                    start: lr.fromDate,
                    end: lr.toDate,
                    allDay: true,
                    classNames: ["fc-event-holiday"],
                });
            });
        }

        // Evenimente custom (Personal/Business/Family/Holiday/ETC)
        customEvents.forEach((ev) => {
            if (!calendarFilters[ev.category]) return;
            events.push({
                id: `custom-${ev.id}`,
                title: ev.title,
                start: ev.start,
                end: ev.end,
                allDay: ev.allDay,
                classNames: [`fc-event-${ev.category}`],
            });
        });

        return events;
    }, [tasks, leaveRequests, customEvents, calendarFilters]);

    const allFiltersChecked = useMemo(
        () => Object.values(calendarFilters).every((v) => v),
        [calendarFilters]
    );

    const toggleAllFilters = (checked: boolean) => {
        const updated: Record<CalendarCategory, boolean> = { ...calendarFilters };
        (Object.keys(updated) as CalendarCategory[]).forEach((k) => {
            updated[k] = checked;
        });
        setCalendarFilters(updated);
    };

    /* ===== Render ===== */

    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-page">
                {/* Navbar */}
                <nav className="layout-navbar navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <span className="navbar-brand">Employee Portal</span>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted small">Employee Panel</span>
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

                <div
                    className="d-flex"
                    style={{ background: "#fafafa", minHeight: "calc(100vh - 64px)" }}
                >
                    {/* Sidebar */}
                    <aside
                        className="bg-white border-end"
                        style={{ width: 260, padding: 16 }}
                    >
                        <h5 className="mb-3">Employee</h5>

                        <div className="mb-2 text-muted small text-uppercase">Overview</div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "TASKS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("TASKS")}
                            >
                                My Tasks
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "LEAVE" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("LEAVE")}
                            >
                                Leave Requests
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "CALENDAR" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("CALENDAR")}
                            >
                                Calendar
                            </button>
                        </div>

                        {view === "LEAVE" && (
                            <div className="nav flex-column mb-3">
                                <button
                                    className="btn w-100 text-start mb-1 btn-light"
                                    onClick={() => open("NEW_LEAVE")}
                                >
                                    New leave request…
                                </button>
                            </div>
                        )}

                        {view === "CALENDAR" && (
                            <>
                                <div className="mb-2 text-muted small text-uppercase">
                                    Calendar filters
                                </div>
                                <div className="px-1">
                                    <div className="form-check form-check-secondary mb-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="selectAll"
                                            checked={allFiltersChecked}
                                            onChange={(e) => toggleAllFilters(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="selectAll">
                                            View all
                                        </label>
                                    </div>

                                    <div className="form-check form-check-secondary mb-1 ms-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="filterTasks"
                                            checked={calendarFilters.task}
                                            onChange={(e) =>
                                                setCalendarFilters((prev) => ({
                                                    ...prev,
                                                    task: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="filterTasks">
                                            Tasks
                                        </label>
                                    </div>
                                    <div className="form-check form-check-secondary mb-1 ms-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="filterLeave"
                                            checked={calendarFilters.leave}
                                            onChange={(e) =>
                                                setCalendarFilters((prev) => ({
                                                    ...prev,
                                                    leave: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="filterLeave">
                                            Leave
                                        </label>
                                    </div>
                                    <hr />
                                    <div className="form-check form-check-danger mb-1 ms-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="filterPersonal"
                                            checked={calendarFilters.personal}
                                            onChange={(e) =>
                                                setCalendarFilters((prev) => ({
                                                    ...prev,
                                                    personal: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="filterPersonal"
                                        >
                                            Personal
                                        </label>
                                    </div>
                                    <div className="form-check mb-1 ms-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="filterBusiness"
                                            checked={calendarFilters.business}
                                            onChange={(e) =>
                                                setCalendarFilters((prev) => ({
                                                    ...prev,
                                                    business: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="filterBusiness"
                                        >
                                            Business
                                        </label>
                                    </div>
                                    <div className="form-check form-check-warning mb-1 ms-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="filterFamily"
                                            checked={calendarFilters.family}
                                            onChange={(e) =>
                                                setCalendarFilters((prev) => ({
                                                    ...prev,
                                                    family: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="filterFamily">
                                            Family
                                        </label>
                                    </div>
                                    <div className="form-check form-check-success mb-1 ms-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="filterHoliday"
                                            checked={calendarFilters.holiday}
                                            onChange={(e) =>
                                                setCalendarFilters((prev) => ({
                                                    ...prev,
                                                    holiday: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="filterHoliday">
                                            Holiday
                                        </label>
                                    </div>
                                    <div className="form-check form-check-info mb-1 ms-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="filterEtc"
                                            checked={calendarFilters.etc}
                                            onChange={(e) =>
                                                setCalendarFilters((prev) => ({
                                                    ...prev,
                                                    etc: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="filterEtc">
                                            ETC
                                        </label>
                                    </div>

                                    <button
                                        className="btn btn-primary btn-sm w-100 mt-3"
                                        onClick={() =>
                                            open("ADD_EVENT", {
                                                title: "",
                                                category: "personal",
                                                start: "",
                                                end: "",
                                                allDay: true,
                                            })
                                        }
                                    >
                                        + Add event
                                    </button>
                                </div>
                            </>
                        )}
                    </aside>

                    {/* Content */}
                    <main className="flex-grow-1 p-4">
                        {/* KPI cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">Total tasks</small>
                                        <h3 className="mb-0">{stats.totalTasks}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">In progress</small>
                                        <h3 className="mb-0">{stats.inProgress}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">Completed</small>
                                        <h3 className="mb-0">{stats.completed}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">Pending leave</small>
                                        <h3 className="mb-0">{stats.openLeave}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content card */}
                        <div className="card app-calendar-wrapper">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    {view === "TASKS" && "My tasks"}
                                    {view === "LEAVE" && "Leave requests"}
                                    {view === "CALENDAR" && "Calendar"}
                                </h5>
                            </div>
                            <div className="card-body">
                                {view === "CALENDAR" ? (
                                    <div className="app-calendar-content">
                                        <FullCalendar
                                            plugins={[dayGridPlugin, interactionPlugin]}
                                            initialView="dayGridMonth"
                                            events={calendarEvents}
                                            height="auto"
                                        />
                                    </div>
                                ) : tableRows.length === 0 ? (
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
                                                    <td>
                                                        {row.actions ?? (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>
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

            {/* NEW LEAVE REQUEST */}
            <Modal
                open={modal === "NEW_LEAVE"}
                title="New leave request"
                onClose={close}
                onSubmit={submitNewLeave}
                submitLabel="Trimite"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label">From date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.fromDate || ""}
                            onChange={(e) =>
                                setForm({ ...form, fromDate: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">To date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.toDate || ""}
                            onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-12 mt-2">
                        <label className="form-label">Reason (optional)</label>
                        <textarea
                            className="form-control"
                            value={form.reason || ""}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* UPDATE TASK */}
            <Modal
                open={modal === "UPDATE_TASK"}
                title="Update task"
                onClose={close}
                onSubmit={submitUpdateTask}
                submitLabel="Salvează"
            >
                <div className="row g-2">
                    <div className="col-md-4">
                        <label className="form-label">Task ID</label>
                        <input
                            className="form-control"
                            value={form.taskId || ""}
                            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                            disabled // ID-ul doar îl afișăm
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={form.status || ""}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="">(nemodificat)</option>
                            <option value="NEW">NEW</option>
                            <option value="PENDING">PENDING</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="COMPLETED">COMPLETED</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Planned duration (min)</label>
                        <input
                            type="number"
                            min={0}
                            className="form-control"
                            value={form.plannedDurationMin || ""}
                            onChange={(e) =>
                                setForm({ ...form, plannedDurationMin: e.target.value })
                            }
                        />
                    </div>
                </div>
            </Modal>

            {/* ADD CUSTOM CALENDAR EVENT */}
            <Modal
                open={modal === "ADD_EVENT"}
                title="Add calendar event"
                onClose={close}
                onSubmit={submitAddEvent}
                submitLabel="Add"
            >
                <div className="row g-2">
                    <div className="col-12">
                        <label className="form-label">Title</label>
                        <input
                            className="form-control"
                            value={form.title || ""}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={form.category || "personal"}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                        >
                            <option value="personal">Personal</option>
                            <option value="business">Business</option>
                            <option value="family">Family</option>
                            <option value="holiday">Holiday</option>
                            <option value="etc">ETC</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">All day</label>
                        <select
                            className="form-select"
                            value={form.allDay ? "true" : "false"}
                            onChange={(e) =>
                                setForm({ ...form, allDay: e.target.value === "true" })
                            }
                        >
                            <option value="true">Da</option>
                            <option value="false">Nu</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Start date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.start || ""}
                            onChange={(e) => setForm({ ...form, start: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">End date (optional)</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.end || ""}
                            onChange={(e) => setForm({ ...form, end: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
