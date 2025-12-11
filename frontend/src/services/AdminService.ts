// frontend/src/services/AdminService.ts
import axios from "../utils/axios";

export type TaskStatus =
    | "NEW"
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | string;



export interface LeaveRequest {
    id: number;
    employeeId: number;
    adminId?: number;
    fromDate: string;
    toDate: string;
    reason: string;
    status: LeaveStatus;
    adminComment?: string;
    employee?: {
        name: string;
        username: string;
    };
}

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

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

export interface TaskCreateData {
    title: string;
    type: string;
    difficulty: number;
    requiredSkills: string | string[];
    plannedDuration: number;
    predictedDuration: number;
    deadline: string;
    priority: number;
    revenue: number;
    otherCosts: number;
    status?: string;
}

export interface AdminUser {
    id: number;
    name?: string;
    username: string;
    email?: string;
    role: string;
    active: boolean;
    hourlyRate?: number;
    seniority?: string;
}

export interface AdminUserCreate {
    name: string;
    email: string;
    username: string;
    password: string;
    active?: boolean;
}

export type AdminUserUpdate = Partial<AdminUserCreate>;

export interface Assignment {
    id: number;
    taskId: number;
    employeeId: number;
    adminId: number;
    assignedAt: string;
    finishedAt: string;
}

export interface MonthlyReport {
    id: number;
    employeeId: number;
    employee?: {
        name: string;
        id: number;
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
    year: string;
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

export interface AdminNotification {
    id: number;
    message: string;
    type?: string;
    read: boolean;
    createdAt: string;
}

const base = "http://localhost:8080/admin";

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

export const getUnassignedTasks = async (): Promise<AdminTask[]> => {
    const { data } = await axios.get(`${base}/unassigned-tasks`);
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

export const generateMonthlyReport = async (
    employeeId: number,
    year: number,
    month: number
): Promise<any> => {
    try {
        const response = await fetch(`http://localhost:8080/admin/generate?employeeId=${employeeId}&year=${year}&month=${month}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error: any) {
        console.error('❌ Error generating monthly report:', error);
        throw error;
    }
};

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
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${base}/payroll/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payrollData),
        });

        if (!response.ok) {
            throw new Error(`Error calculating payroll: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in calculatePayroll:', error);
        throw error;
    }
};


export const getPayrollHistory = async (): Promise<Payroll[]> => {
    try {
        const response = await fetch(`${base}/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // sau de unde stochezi tokenul
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


export const updateTask = async (taskId: number, updateData: any): Promise<any> => {
    try {
        console.log("🔄 updateTask called with:", { taskId, updateData });

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        let requiredSkillsArray;
        if (updateData.requiredSkills) {
            if (typeof updateData.requiredSkills === 'string') {
                requiredSkillsArray = updateData.requiredSkills.split(',').map((s: string) => s.trim());
            } else if (Array.isArray(updateData.requiredSkills)) {
                requiredSkillsArray = updateData.requiredSkills;
            }
        }

        const payload: any = {
            ...updateData,
            requiredSkills: requiredSkillsArray,
            difficulty: updateData.difficulty ? Number(updateData.difficulty) : undefined,
            plannedDuration: updateData.plannedDuration ? Number(updateData.plannedDuration) : undefined,
            predictedDuration: updateData.predictedDuration ? Number(updateData.predictedDuration) : undefined,
            priority: updateData.priority ? Number(updateData.priority) : undefined,
            revenue: updateData.revenue ? Number(updateData.revenue) : undefined,
            otherCosts: updateData.otherCosts ? Number(updateData.otherCosts) : undefined,
        };

        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === "") {
                delete payload[key];
            }
        });

        console.log("📤 Sending to backend:", payload);

        const response = await fetch(`http://localhost:8080/admin/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response headers:", response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Server response error:", errorText);

            if (response.status === 403) {
                throw new Error('Access forbidden. Check your permissions or token.');
            } else if (response.status === 400) {
                throw new Error(`Bad request: ${errorText}`);
            } else {
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
        }

        const result = await response.json();
        console.log("✅ Task updated successfully:", result);
        return result;

    } catch (error) {
        console.error("❌ Error in updateTask:", error);
        throw error;
    }
};


export const getAdminNotifications = async (): Promise<AdminNotification[]> => {
    const response = await fetch(`http://localhost:8080/admin/me`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch admin notifications");
    }

    return response.json();
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
    const response = await fetch(
        `http://localhost:8080/admin/${notificationId}/read`,
        {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error("Failed to mark notification as read");
    }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
    const response = await fetch(
        `http://localhost:8080/admin/unread/count`,
        {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch unread notification count");
    }

    const data = await response.json();
    return data.unread;
};

export const getAllLeaveRequests = async (): Promise<LeaveRequest[]> => {
    try {
        const response = await fetch('http://localhost:8080/admin/allLeaves', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching leave requests: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Leave requests loaded:', data);
        return data;
    } catch (error) {
        console.error('Error in getAllLeaveRequests:', error);
        throw error;
    }
};

export const createNewTask = async (taskData: TaskCreateData): Promise<AdminTask> => {
    try {
        console.log("=== 🚨 DEBUG START - createNewTask 🚨 ===");
        console.log("📋 Input taskData:", taskData);
        console.log("📋 Type of taskData:", typeof taskData);
        console.log("📋 Keys in taskData:", Object.keys(taskData));

        const token = localStorage.getItem('token');
        console.log("🔑 Token exists:", !!token);
        console.log("🔑 Token first 30 chars:", token ? token.substring(0, 30) + '...' : 'NO TOKEN');

        if (!token) {
            throw new Error('No authentication token found');
        }

        // Debug pentru requiredSkills
        console.log("🔍 RequiredSkills original:", taskData.requiredSkills);
        console.log("🔍 RequiredSkills type:", typeof taskData.requiredSkills);
        console.log("🔍 Is array?", Array.isArray(taskData.requiredSkills));

        let requiredSkillsArray;
        if (taskData.requiredSkills) {
            if (typeof taskData.requiredSkills === 'string') {
                requiredSkillsArray = taskData.requiredSkills.split(',').map((s: string) => s.trim());
            } else if (Array.isArray(taskData.requiredSkills)) {
                requiredSkillsArray = taskData.requiredSkills;
            }
        }

        console.log("🔍 Building payload...");
        const payload: any = {
            title: taskData.title,
            type: taskData.type,
            difficulty: taskData.difficulty ? Number(taskData.difficulty) : 1,
            requiredSkills: requiredSkillsArray,
            plannedDuration: taskData.plannedDuration ? Number(taskData.plannedDuration) : 1,
            predictedDuration: taskData.predictedDuration ? Number(taskData.predictedDuration) : 1,
            deadline: taskData.deadline,
            priority: taskData.priority ? Number(taskData.priority) : 1,
            revenue: taskData.revenue ? Number(taskData.revenue) : 0,
            otherCosts: taskData.otherCosts ? Number(taskData.otherCosts) : 0,
            status: taskData.status || 'NEW'
        };

        console.log("📤 Final payload object:", payload);
        console.log("📤 JSON.stringify(payload):", JSON.stringify(payload, null, 2));

        try {
            const testJson = JSON.stringify(payload);
            console.log("✅ JSON.stringify works, length:", testJson.length);
        } catch (jsonError) {
            console.error("❌ JSON.stringify error:", jsonError);
        }

        const url = `http://localhost:8080/admin/createTask`;
        console.log("🔗 Request URL:", url);
        console.log("🔗 Full endpoint:", `${window.location.origin}/admin/createTask`);

        console.log("🔄 Testing endpoint with OPTIONS request...");
        try {
            const optionsResponse = await fetch(url, {
                method: 'OPTIONS',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("🔍 OPTIONS response status:", optionsResponse.status);
            console.log("🔍 OPTIONS response headers:");
            optionsResponse.headers.forEach((value, key) => {
                console.log(`  ${key}: ${value}`);
            });
        } catch (optionsError) {
            console.error("❌ OPTIONS request failed:", optionsError);
        }

        console.log("🔄 Sending POST request...");
        console.time("fetch-request");

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        console.timeEnd("fetch-request");

        console.log("📡 Response status:", response.status);
        console.log("📡 Response status text:", response.statusText);
        console.log("📡 Response ok:", response.ok);

        console.log("📡 Response headers:");
        response.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });

        const responseText = await response.text();
        console.log("📡 Raw response text:", responseText);

        if (!response.ok) {
            console.error("❌ ERROR RESPONSE DETAILS:");
            console.error("  Status:", response.status);
            console.error("  Status Text:", response.statusText);
            console.error("  Response Body:", responseText);

            try {
                const errorJson = JSON.parse(responseText);
                console.error("  Parsed error JSON:", errorJson);
            } catch (parseError) {
                console.error("  Could not parse as JSON");
            }

            if (response.status === 415) {
                console.error("🔍 415 Unsupported Media Type - Possible causes:");
                console.error("  1. Missing Content-Type header");
                console.error("  2. Wrong Content-Type value");
                console.error("  3. Backend expects different content type");
                console.error("  4. Charset issue in header");
                throw new Error(`Unsupported Media Type (415). Server cannot process application/json. Response: ${responseText}`);
            } else if (response.status === 403) {
                throw new Error(`Access forbidden (403). Check your permissions. Response: ${responseText}`);
            } else if (response.status === 404) {
                throw new Error(`Endpoint not found (404): ${url}. Check backend controller.`);
            } else if (response.status === 400) {
                throw new Error(`Bad request (400): ${responseText}`);
            } else {
                throw new Error(`HTTP error ${response.status}: ${responseText}`);
            }
        }

        console.log("🔄 Parsing response as JSON...");
        let result;
        try {
            result = JSON.parse(responseText);
            console.log("✅ Parsed response JSON:", result);
            console.log("✅ Response type:", typeof result);
            console.log("✅ Response keys:", Object.keys(result));
        } catch (parseError) {
            console.error("❌ Failed to parse response as JSON:", parseError);
            console.error("❌ Response text that failed to parse:", responseText);
            throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
        }

        console.log("=== ✅ DEBUG END - createNewTask ✅ ===");
        return result;

    } catch (error) {
        console.error("=== ❌ DEBUG ERROR - createNewTask ❌ ===");
        console.error("Full error:", error);
        //console.error("Error name:", error.name);
        //console.error("Error message:", error.message);
        //console.error("Error stack:", error.stack);
        //console.error("=== ❌ DEBUG ERROR END ❌ ===");
        throw error;
    }
};

export const updateLeaveRequestStatus = async (
    leaveId: number,
    status: LeaveStatus,
    adminComment?: string
): Promise<LeaveRequest> => {
    try {
        const response = await fetch(`http://localhost:8080/admin/leave/${leaveId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, adminComment })
        });

        if (!response.ok) {
            throw new Error(`Error updating leave request: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in updateLeaveRequestStatus:', error);
        throw error;
    }
};