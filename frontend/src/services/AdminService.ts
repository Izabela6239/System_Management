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
    type?: string;
    difficulty?: number;
    requiredSkills?: any;
    plannedDuration?: number;
    predictedDuration?: number;
    deadline?: string;
    priority?: number;
    revenue?: number;
    otherCosts?: number;
    status?: string;
}

export interface TaskUpdateData {
    title?: string;
    type?: string;
    difficulty?: number;
    requiredSkills?: string;
    plannedDuration?: number;
    predictedDuration?: number;
    deadline?: string;
    priority?: number;
    revenue?: number;
    otherCosts?: number;
    status?: string;
}

export interface AdminUser {
    id: number;
    name?: string;
    username: string;
    email?: string;
    role: string;
    active: boolean;
    // Alte câmpuri care vin din User entity
    hourlyRate?: number;
    seniority?: string;
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
    employee?: {
        id: number;
        // other employee properties
    };
    year: number;
    month: number;
    totalTasks: number;
    avgGrade?: number;
    totalRevenue?: number;
    totalCosts?: number;
    productivityScore?: number;
    createdAt?: string; // or Date
}

export interface Payroll {
    id: number;
    employeeId: number;
    employee?: {
        name: string;
        hourlyRate: number;
    };
    adminId: number;
    admin?: {
        name: string;
    };
    month: string;
    baseSalary: number;
    bonuses: number;
    deductions: number;
    netSalary: number;
    createdAt?: string;
}

export interface PayrollCalculationRequest {
    employeeId: number;
    month: number;
    year: number;
    bonuses?: number;
    deductions?: number;
}

/* ========== BASE ========== */
const base = "http://localhost:8080/admin";

/* ========== EMPLOYEES ========== */
// În AdminService.ts
export const getEmployees = async (): Promise<AdminUser[]> => {
    console.log("🚀 Fetching employees from API...");

    const response = await fetch('http://localhost:8080/admin/employee', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    console.log("📨 Employees response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error fetching employees:", errorText);
        throw new Error(`Failed to fetch employees: ${response.status}`);
    }

    const result = await response.json();
    console.log("🔍 FULL Employees API response structure:", result);

    // Debug: afișează primul employee dacă există
    if (result.length > 0) {
        console.log("📊 First employee details:", result[0]);
        console.log("🔑 Keys of first employee:", Object.keys(result[0]));
    }

    return result;
};

export const createEmployee = async (employeeData: {
    username: string;
    password: string;
    role: string;
    active?: boolean;
    name?: string;
    email?: string;
    hourlyRate?: number;
    seniority?: string;
}): Promise<AdminUser> => {
    console.log("🚀 Sending POST request to /admin/employee", employeeData);

    const response = await fetch('http://localhost:8080/admin/employee', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
    });

    console.log("📨 Response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`Failed to create employee: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ API Response:", result);
    return result;
};

export const updateEmployee = async (id: number, updateData: any): Promise<AdminUser> => {
    console.log("🚀 Sending PUT request to update employee:", { id, updateData });

    const response = await fetch(`http://localhost:8080/admin/employee/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    console.log("📨 Update response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error updating employee:", errorText);
        throw new Error(`Failed to update employee: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Update API Response:", result);
    return result;
};

export const deleteEmployee = async (id: number): Promise<void> => {
    console.log("🚀 Sending DELETE request for employee ID:", id);

    const response = await fetch(`http://localhost:8080/admin/employee/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    console.log("📨 Delete response status:", response.status);
    console.log("📨 Delete response ok:", response.ok);
    console.log("📨 Delete response headers:", response.headers);

    // Verifică dacă response-ul este gol (204 No Content) sau conține date
    if (response.status === 204) {
        console.log("✅ DELETE successful - 204 No Content");
    } else {
        const responseText = await response.text();
        console.log("📨 Delete response body:", responseText);
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error deleting employee:", errorText);
        throw new Error(`Failed to delete employee: ${response.status} ${errorText}`);
    }

    console.log("✅ Employee deleted successfully from API");
};

/* ========== TASKS / ASSIGNMENTS ========== */
export const getUnassignedTasks = async (): Promise<AdminTask[]> => {
    const { data } = await axios.get(`${base}/unassigned-tasks`);
    // Asigurăm că data e array
    return Array.isArray(data) ? data : [];
};


export const getMyTasks = async (): Promise<AdminTask[]> => {
    const { data } = await axios.get(`${base}/my-tasks`);
    return Array.isArray(data) ? data : [];
};


export const assignTask = async (taskId: number, employeeId: number) => {
    const { data } = await axios.post(`${base}/assign`, null, { params: { taskId, employeeId } });
    return data;
};

export const unassignTask = async (taskId: number, employeeId: number) => {
    await axios.delete(`${base}/unassign`, { params: { taskId, employeeId } });
};

export const assignTaskToMe = async (taskId: number) => {
    const { data } = await axios.post(`${base}/assign-task-to-me`, null, { params: { taskId } });
    return data;
};

// Pentru asignările unui angajat
export const getAssignmentsByEmployee = async (employeeId: number): Promise<Assignment[]> => {
    const response = await fetch(`http://localhost:8080/admin/employee/${employeeId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to fetch employee assignments');
    return response.json();
};

// Pentru asignările unui task
export const getAssignmentsByTask = async (taskId: number): Promise<Assignment[]> => {
    const response = await fetch(`http://localhost:8080/admin/task/${taskId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to fetch task assignments');
    return response.json();
};

/* ========== REPORTS ========== */
// AdminService.ts
// AdminService.ts

// Funcție pentru a obține toate rapoartele
export const getAllMonthlyReports = async (): Promise<any[]> => {
    try {
        const response = await fetch(`http://localhost:8080/admin/reports/all`, {
            method: 'GET', // ✅ Schimbă din POST în GET
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // ✅ Adaugă asta pentru a extrage datele
        return data;

    } catch (error: any) {
        console.error('❌ Error fetching all reports:', error);
        throw error;
    }
};

// Funcția existentă pentru generare raport
export const generateMonthlyReport = async (
    employeeId: number,
    year: number,
    month: number
): Promise<any> => {
    try {
        const response = await fetch(`http://localhost:8080/admin/generate?employeeId=${employeeId}&year=${year}&month=${month}`, {
            // ✅ Corectează URL-ul: /admin/reports/generate în loc de /admin/generate
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // ✅ Adaugă asta pentru a extrage datele
        return data;

    } catch (error: any) {
        console.error('❌ Error generating monthly report:', error);
        throw error;
    }
};

/* ========== IMPORT XML ========== */
export const importEmployeesXml = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axios.post(`${base}/employee/import-xml`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data ?? [];
};

export const calculatePayroll = async (payrollData: PayrollCalculationRequest): Promise<Payroll> => {
    try {
        const response = await fetch(`${base}/admin/payroll/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payrollData),
        });

        if (!response.ok) {
            throw new Error(`Error calculating payroll: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in calculatePayroll:', error);
        throw error;
    }
};

export const getPayrollHistory = async (): Promise<Payroll[]> => {
    try {
        const response = await fetch(`${base}/admin/payroll/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching payroll history: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in getPayrollHistory:', error);
        throw error;
    }
};

export const updateTask = async (taskId: number, taskData: any) => {
    try {
        // Clean up the data before sending
        const cleanData = {
            ...taskData,
            requiredSkills: typeof taskData.requiredSkills === 'string'
                ? JSON.parse(taskData.requiredSkills.replace(/\\"/g, '"'))
                : taskData.requiredSkills
        };

        const response = await fetch(`${base}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cleanData),
        });

        if (!response.ok) {
            throw new Error(`Error updating task: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in updateTask:', error);
        throw error;
    }



// Funcție pentru obținerea istoricului salariilor
};
