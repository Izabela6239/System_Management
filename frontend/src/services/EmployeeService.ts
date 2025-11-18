// frontend/src/services/EmployeeService.ts
import axios from "../utils/axios";

/* ============================================================
   ===============      TYPES (ca la Admin)     =============== 
   ============================================================ */

export type TaskStatus =
    | "NEW"
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | string;

export interface EmployeeTask {
    id: number;
    title: string;
    type?: string;
    difficulty?: number;
    requiredSkillsJson?: string;
    adminId?: number;
    plannedDurationMin?: number;
    predictedDurationMin?: number;
    deadline?: string;
    priority?: number;
    revenue?: number;
    otherCosts?: number;
    status: TaskStatus;
}

export interface LeaveRequest {
    id: number;
    employee_id: number;
    fromDate: string;
    toDate: string;
    reason?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    admin_comment?: string;
    admin_id?: number;
}

const base = "/employee";


// GET /employee/tasks
export const getTasks = async (): Promise<EmployeeTask[]> => {
    const { data } = await axios.get(`${base}/tasks`);
    return Array.isArray(data) ? data : [];
};

// GET /employee/tasks/in-progress
export const getTasksInProgress = async (): Promise<EmployeeTask[]> => {
    const { data } = await axios.get(`${base}/tasks/in-progress`);
    return Array.isArray(data) ? data : [];
};

// GET /employee/tasks/completed
export const getCompletedTasks = async (): Promise<EmployeeTask[]> => {
    const { data } = await axios.get(`${base}/tasks/completed`);
    return Array.isArray(data) ? data : [];
};

// PUT /employee/tasks/{taskId}?status=...&plannedDurationMin=...
export const updateTask = async (
    taskId: number,
    data: { status?: string }
) => {
    const response = await fetch(`http://localhost:8080/employee/tasks/${taskId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to update task");
    }

    return response.json();
};


/* ============================================================
   ===============        LEAVE REQUESTS         =============== 
   ============================================================ */

// GET /employee/leave
export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave`);
    return Array.isArray(data) ? data : [];
};

// GET /employee/leave/pending
export const getPendingLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave/pending`);
    return Array.isArray(data) ? data : [];
};

// GET /employee/leave/approved
export const getApprovedLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave/approved`);
    return Array.isArray(data) ? data : [];
};

// GET /employee/leave/rejected
export const getRejectedLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave/rejected`);
    return Array.isArray(data) ? data : [];
};

// POST /employee/leave
export const createLeaveRequest = async (data: {
    fromDate: string;
    toDate: string;
    reason?: string;
}): Promise<LeaveRequest> => {
    const response = await fetch("http://localhost:8080/employee/leave", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to create leave request");
    }

    return response.json();
};


/* ───────────────────────────────────────────────
   1) ACCEPT TASK
─────────────────────────────────────────────── */
export const acceptTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/accept`, null, {
        params: { taskId }
    });

    return response.data;
};

/* ───────────────────────────────────────────────
   2) REJECT TASK
─────────────────────────────────────────────── */
export const rejectTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/reject`, null, {
        params: { taskId }
    });

    return response.data;
};

/* ───────────────────────────────────────────────
   3) CANCEL TASK
─────────────────────────────────────────────── */
export const cancelTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/cancel`, null, {
        params: { taskId }
    });

    return response.data;
};

/* ───────────────────────────────────────────────
   4) HIDE TASK
─────────────────────────────────────────────── */
export const hideTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/hide`, null, {
        params: { taskId }
    });

    return response.data;
};

/* ───────────────────────────────────────────────
   5) PROPOSE NEW DATE/TIME
─────────────────────────────────────────────── */
export const proposeTaskChange = async (
    taskId: number,
    newDate: string,
    newTime: string
) => {
    const response = await axios.post(`/employee/task/propose-change`, null, {
        params: { taskId, newDate, newTime }
    });

    return response.data;
};
