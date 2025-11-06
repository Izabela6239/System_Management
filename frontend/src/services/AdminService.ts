// frontend/src/services/AdminService.ts
import axios from "../utils/axios";

/* ========== TYPES ========== */

export type TaskStatus =
    | "NEW"
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | string;

export interface AdminTask {
    id: number;
    title: string;
    status: TaskStatus;
    priority?: number;
    deadline?: string;
    // opțional: difficulty/grade/profit dacă există în modelul tău
    difficulty?: number;
    grade?: number;
    profit?: number;
}

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    username: string;
    active: boolean;
}

// folosit la crearea unui angajat (parola doar aici)
export interface AdminUserCreate {
    name: string;
    email: string;
    username: string;
    password: string;
    active?: boolean;
}

// folosit la update (toate câmpurile opționale)
export type AdminUserUpdate = Partial<AdminUserCreate>;

export interface Assignment {
    id: number;
    taskId: number;
    employeeId: number;
    adminId: number;
    assignedAt: string;
}

export interface MonthlyReport {
    id: number;
    employeeId: number;
    year: number;
    month: number;
    totalTasks: number;
    completedTasks: number;
    hoursWorked?: number;
    generatedAt: string;
}

/* ========== BASE ========== */

const base = "/admin";

/* ========== EMPLOYEES ========== */

export const getEmployees = async (): Promise<AdminUser[]> => {
    const { data } = await axios.get(`${base}/employee`);
    return data ?? [];
};

export const createEmployee = async (
    payload: AdminUserCreate
): Promise<AdminUser> => {
    const { data } = await axios.post(`${base}/employee`, payload);
    return data;
};

export const updateEmployee = async (
    id: number,
    payload: AdminUserUpdate
): Promise<AdminUser> => {
    const { data } = await axios.put(`${base}/employee/${id}`, payload);
    return data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
    await axios.delete(`${base}/employee/${id}`);
};

/* ========== ASSIGNMENTS ========== */

export const assignTask = async (
    taskId: number,
    employeeId: number
): Promise<Assignment> => {
    const { data } = await axios.post(`${base}/assign`, null, {
        params: { taskId, employeeId },
    });
    return data as Assignment;
};

export const unassignTask = async (
    taskId: number,
    employeeId: number
): Promise<void> => {
    await axios.delete(`${base}/unassign`, { params: { taskId, employeeId } });
};

export const getAssignmentsByEmployee = async (
    employeeId: number
): Promise<Assignment[]> => {
    const { data } = await axios.get(`${base}/employee/${employeeId}`);
    return data ?? [];
};

export const getAssignmentsByTask = async (
    taskId: number
): Promise<Assignment[]> => {
    const { data } = await axios.get(`${base}/task/${taskId}`);
    return data ?? [];
};

/* ========== ADMIN SELF-ASSIGN + QUERIES ========== */

export const assignTaskToMe = async (taskId: number): Promise<AdminTask> => {
    const { data } = await axios.post(`${base}/assign-task-to-me`, null, {
        params: { taskId },
    });
    return data as AdminTask;
};

export const getUnassignedTasks = async (): Promise<AdminTask[]> => {
    const { data } = await axios.get(`${base}/unassigned-tasks`);
    return data ?? [];
};

export const getMyTasks = async (): Promise<AdminTask[]> => {
    const { data } = await axios.get(`${base}/my-tasks`);
    return data ?? [];
};

/* ========== REPORTS ========== */

export const generateMonthlyReport = async (
    employeeId: number,
    year: number,
    month: number
): Promise<MonthlyReport> => {
    const { data } = await axios.post(`${base}/reports/generate`, null, {
        params: { employeeId, year, month },
    });
    return data as MonthlyReport;
};

/* ========== TASK MANAGEMENT (preset/difficulty/finalize) ========== */

export const setTaskPresetDuration = async (
    id: number,
    minutes: number
): Promise<AdminTask> => {
    const { data } = await axios.put(
        `${base}/tasks/${id}/preset-duration`,
        null,
        { params: { minutes } }
    );
    return data;
};

export const setTaskDifficulty = async (
    id: number,
    level: number
): Promise<AdminTask> => {
    const { data } = await axios.put(`${base}/tasks/${id}/difficulty`, null, {
        params: { level },
    });
    return data;
};

export const finalizeTask = async (
    id: number,
    actualMinutes: number,
    grade?: number,
    profit?: number
): Promise<AdminTask> => {
    const { data } = await axios.put(`${base}/tasks/${id}/finalize`, null, {
        params: { actualMinutes, grade, profit },
    });
    return data;
};

/* ========== LEAVES (approve/reject) ========== */

export const approveLeave = async (
    leaveId: number,
    comment?: string
): Promise<void> => {
    await axios.post(`${base}/leaves/${leaveId}/approve`, null, {
        params: { comment },
    });
};

export const rejectLeave = async (
    leaveId: number,
    comment?: string
): Promise<void> => {
    await axios.post(`${base}/leaves/${leaveId}/reject`, null, {
        params: { comment },
    });
};

/* ========== SALARY ========== */

export const computeSalary = async (
    employeeId: number,
    year: number,
    month: number
): Promise<number> => {
    const { data } = await axios.get(`${base}/salary/${employeeId}`, {
        params: { year, month },
    });
    return data ?? 0;
};

/* ========== EMPLOYEE XML IMPORT ========== */

export const importEmployeesXml = async (file: File): Promise<AdminUser[]> => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axios.post(`${base}/employee/import-xml`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data ?? [];
};

/* ========== KPI (productivity/profit monthly) ========== */

export const getMonthlyKpi = async (
    employeeId: number,
    year: number,
    month: number
): Promise<MonthlyReport> => {
    const { data } = await axios.get(`${base}/kpi/monthly`, {
        params: { employeeId, year, month },
    });
    return data;
};
