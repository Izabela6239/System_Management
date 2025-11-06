import { authFetch } from "../utils/AuthFetch";
import axios from "axios";
// types.ts sau EmployeeService.ts
export type TaskStatus = "NEW" | "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Task {
    id: number;
    title: string;
    type: string;
    difficulty: number;
    requiredSkillsJson?: string;
    adminId?: number; // dacă vrei doar id-ul adminului
    plannedDurationMin?: number;
    predictedDurationMin?: number;
    deadline?: string; // backend trimite ISO string
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
    admin_comment : string;
    admin_id : number;
}

const API_BASE = "/employee";

// Tasks
export const getTasks = async (): Promise<Task[]> => (await axios.get(`${API_BASE}/tasks`)).data;
export const getTasksInProgress = async (): Promise<Task[]> => (await axios.get(`${API_BASE}/tasks/in-progress`)).data;
export const getCompletedTasks = async (): Promise<Task[]> => (await axios.get(`${API_BASE}/tasks/completed`)).data;

// Leave Requests
export const getLeaveRequests = async (): Promise<LeaveRequest[]> => (await axios.get(`${API_BASE}/leave`)).data;
export const getPendingLeaveRequests = async (): Promise<LeaveRequest[]> => (await axios.get(`${API_BASE}/leave/pending`)).data;
export const getApprovedLeaveRequests = async (): Promise<LeaveRequest[]> => (await axios.get(`${API_BASE}/leave/approved`)).data;
export const getRejectedLeaveRequests = async (): Promise<LeaveRequest[]> => (await axios.get(`${API_BASE}/leave/rejected`)).data;
export const createLeaveRequest = async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => (await axios.post(`${API_BASE}/leave`, data)).data;

// Update Task
export const updateTask = async (taskId: number, status?: string, plannedDurationMin?: number): Promise<Task> => {
    const params: any = {};
    if (status) params.status = status;
    if (plannedDurationMin) params.plannedDurationMin = plannedDurationMin;
    return (await axios.put(`${API_BASE}/tasks/${taskId}`, null, { params })).data;
};