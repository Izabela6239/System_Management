// frontend/src/services/EmployeeService.ts
import axios from "../utils/axios";

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

export const getTasks = async (): Promise<EmployeeTask[]> => {
    const { data } = await axios.get(`${base}/tasks`);
    return Array.isArray(data) ? data : [];
};

export const getTasksInProgress = async (): Promise<EmployeeTask[]> => {
    const { data } = await axios.get(`${base}/tasks/in-progress`);
    return Array.isArray(data) ? data : [];
};

export const getCompletedTasks = async (): Promise<EmployeeTask[]> => {
    const { data } = await axios.get(`${base}/tasks/completed`);
    return Array.isArray(data) ? data : [];
};

export const updateTask = async (
    taskId: number,
    data: { status?: string }
) => {
    console.log("🔄 updateTask called with:", { taskId, data });

    const response = await fetch(`http://localhost:8080/employee/tasks/${taskId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    console.log("📤 Response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ updateTask failed:", errorText);
        throw new Error("Failed to update task: " + errorText);
    }

    const result = await response.json();
    console.log("✅ updateTask success:", result);
    return result;
};


export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave`);
    return Array.isArray(data) ? data : [];
};

export const getPendingLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave/pending`);
    return Array.isArray(data) ? data : [];
};

export const getApprovedLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave/approved`);
    return Array.isArray(data) ? data : [];
};

export const getRejectedLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await axios.get(`${base}/leave/rejected`);
    return Array.isArray(data) ? data : [];
};

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


export const acceptTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/accept`, null, { params: { taskId } });
    const updatedTask = response.data; // presupunem că backend returnează task-ul
    return {
        task: updatedTask,
        message: `Task #${updatedTask.id} a fost ACCEPTAT`
    };
};

export const rejectTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/reject`, null, { params: { taskId } });
    const updatedTask = response.data;
    return {
        task: updatedTask,
        message: `Task #${updatedTask.id} a fost REJECTAT`
    };
};

export const cancelTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/cancel`, null, { params: { taskId } });
    const updatedTask = response.data;
    return {
        task: updatedTask,
        message: `Task #${updatedTask.id} a fost ANULAT`
    };
};

export const hideTask = async (taskId: number) => {
    const response = await axios.post(`/employee/task/hide`, null, { params: { taskId } });
    const updatedTask = response.data;
    return {
        task: updatedTask,
        message: `Task #${updatedTask.id} a fost ASCUNS`
    };
};

export const proposeTaskChange = async (taskId: number, newDate: string) => {
    try {
        console.log("📤 Calling proposeTaskChange API...", { taskId, newDate });
        const response = await axios.post(`/employee/task/propose-change`, null, {
            params: { taskId, newDate }
        });
        const updatedTask = response.data;
        return {
            task: updatedTask,
            message: `Task #${updatedTask.id} are un nou termen propus: ${newDate}`
        };
    } catch (error: any) {
        console.error("❌ API Error in proposeTaskChange:", error);
        if (error.response) console.error("Error response:", error.response.data);
        throw error;
    }
};
