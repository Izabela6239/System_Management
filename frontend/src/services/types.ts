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
