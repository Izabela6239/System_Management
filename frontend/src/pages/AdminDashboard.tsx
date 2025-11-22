// frontend/src/pages/admin/AdminDashboard.tsx
import React, {
    useEffect,
    useMemo,
    useState,
    FormEvent,
    ChangeEvent,
} from "react";

import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getUnassignedTasks,
    getMyTasks,
    assignTaskToMe,
    assignTask,
    unassignTask,
    generateMonthlyReport,
    getAssignmentsByEmployee,
    importEmployeesXml,
    AdminTask,
    AdminUser,
    Assignment,
    MonthlyReport, getAssignmentsByTask, getAllMonthlyReports, updateTask,
    calculatePayroll,
    getPayrollHistory,
    Payroll
} from "../services/AdminService";

// !!! asigură-te că importurile către CSS sunt corecte:
import "../assets/css/core.scss";
import "../assets/css/demo.css";
import "../assets/css/app-logistics-dashboard.css";

type View =
    | "TASKS_UNASSIGNED"
    | "MY_TASKS"
    | "EMPLOYEES"
    | "ASSIGNMENTS"
    | "REPORTS"
    | "PAYROLL";

type ModalType =
    | "NONE"
    | "ADD_EMP"
    | "EDIT_EMP"
    | "DEL_EMP"
    | "ASSIGN"
    | "UNASSIGN"
    | "ASSIGN_TO_ME"
    | "VIEW_ASSIGNMENTS"
    | "GENERATE_REPORT"
    | "IMPORT_XML"
    |"EDIT_TASK"
    |"CALCULATE_PAYROLL"  // ← ADAUGĂ ACESTA
    | "VIEW_PAYROLL_HISTORY"; // ← ȘI ACESTA

type TableRow = {
    id: number;
    Title: string;
    Type: string;
    Difficulty: number;
    RequiredSkills: string;
    PlannedDuration: number;
    PredictedDuration: number;
    Deadline: string;
    Priority: number;
    Revenue: number;
    OtherCosts: number;
    Status: string;
}

type TableRow1= {
    id: number;
    Username: string;
    Email: string;
    Status: string;
    Role: string;
    actions?: React.ReactNode;
};

/*****************
 * Generic Modal *
 *****************/
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
            <div className="position-absolute top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-50" onClick={onClose} />
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
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
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

export default function AdminDashboard() {
    const [view, setView] = useState<View>("TASKS_UNASSIGNED");
    const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
    const [currentPayroll, setCurrentPayroll] = useState<Payroll | null>(null);

    const [employees, setEmployees] = useState<AdminUser[]>([]);
    const [unassignedTasks, setUnassignedTasks] = useState<AdminTask[]>([]);
    const [myTasks, setMyTasks] = useState<AdminTask[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [report, setReport] = useState<MonthlyReport | null>(null);
    // În componenta AdminDashboard, adaugă aceste state-uri
    const [allReports, setAllReports] = useState<MonthlyReport[]>([]);
    const [viewMode, setViewMode] = useState<'view' | 'generate'>('view'); // 'view' sau 'generate'

    const [modal, setModal] = useState<ModalType>("NONE");
    const [form, setForm] = useState<any>({});
    // Adaugă state pentru rândurile expandate
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState<boolean>(false);

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Funcție pentru a încărca toate rapoartele
    const fetchAllReports = async () => {
        try {
            const reports = await getAllMonthlyReports();
            setAllReports(reports);
            console.log("📊 All reports loaded:", reports);
        } catch (error) {
            console.error("❌ Error loading all reports:", error);
            setAllReports([]);
        } finally {
        }
    };
    const submitCalculatePayroll = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { employeeId, month, year, bonuses, deductions } = form;

        console.log("📝 Calculate payroll form submitted:", { employeeId, month, year, bonuses, deductions });

        if (!employeeId || !month || !year) {
            alert("ID-ul angajatului, luna și anul sunt obligatorii!");
            return;
        }

        try {
            console.log("🔄 Calculating payroll...");

            const payrollData = {
                employeeId: Number(employeeId),
                month: Number(month),
                year: Number(year),
                bonuses: bonuses ? Number(bonuses) : 0,
                deductions: deductions ? Number(deductions) : 0
            };

            console.log("📤 Sending payroll data:", payrollData);

            const result = await calculatePayroll(payrollData);

            console.log("✅ Payroll calculated successfully:", result);
            setCurrentPayroll(result);

            alert(`Salariu calculat cu succes!\nSalariu net: $${result.netSalary.toFixed(2)}`);

            // Reîncarcă istoricul
            await fetchPayrollHistory();

            close();

        } catch (error) {
            console.error("❌ Error calculating payroll:", error);
            // @ts-ignore
            alert("Eroare la calculul salariului: " + error.message);
        }
    };

// Funcție pentru încărcarea istoricului salariilor
    const fetchPayrollHistory = async () => {
        try {
            const history = await getPayrollHistory();
            setPayrollHistory(Array.isArray(history) ? history : []);
            console.log("📊 Payroll history loaded:", history);
        } catch (error) {
            console.error("❌ Error loading payroll history:", error);
            setPayrollHistory([]);
        }
    };

    const open = (m: ModalType, initial?: any) => {
        setForm(initial || {});
        setModal(m);
    };
    const close = () => {
        setModal("NONE");
        setForm({});
    };

    useEffect(() => {
        if (view === "PAYROLL") {
            fetchPayrollHistory();
        }
    }, [view]);

    // bootstrap data
    // useEffect pentru a încărca employees când view-ul se schimbă
    useEffect(() => {
        if (view === "EMPLOYEES") {
            console.log("👀 View changed to EMPLOYEES, loading employees...");
            const loadEmployees = async () => {
                try {
                    const data = await getEmployees();
                    console.log("📥 Employees loaded on view change:", data);
                    setEmployees(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Error loading employees:", error);
                }
            };
            loadEmployees();
        }
    }, [view]);

    // Adaugă acest useEffect după useEffect-ul pentru edit employee
    useEffect(() => {
        if (form.executeEditTask && form.taskId) {
            const editTask = async () => {
                try {
                    console.log("🔄 Editing task...");
                    console.log("Task ID:", form.taskId);
                    console.log("Edit data:", form);

                    // Pregătește datele pentru backend
                    const updateData: any = {};

                    if (form.title !== undefined) updateData.title = form.title;
                    if (form.type !== undefined) updateData.type = form.type;
                    if (form.difficulty !== undefined) updateData.difficulty = Number(form.difficulty);
                    if (form.requiredSkills !== undefined) updateData.requiredSkills = form.requiredSkills;
                    if (form.plannedDuration !== undefined) updateData.plannedDuration = Number(form.plannedDuration);
                    if (form.predictedDuration !== undefined) updateData.predictedDuration = Number(form.predictedDuration);
                    if (form.deadline !== undefined) updateData.deadline = form.deadline;
                    if (form.priority !== undefined) updateData.priority = Number(form.priority);
                    if (form.revenue !== undefined) updateData.revenue = Number(form.revenue);
                    if (form.otherCosts !== undefined) updateData.otherCosts = Number(form.otherCosts);
                    if (form.status !== undefined) updateData.status = form.status;

                    console.log("📤 Sending task update data:", updateData);

                    // Apel către backend
                    await updateTask(Number(form.taskId), updateData);

                    console.log("✅ Task updated successfully!");

                    // Refresh listele de task-uri
                    await Promise.all([refreshUnassigned(), refreshMyTasks()]);

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error editing task:", error);
                    // Resetează doar flag-ul de execuție
                    setForm((prev: any) => ({ ...prev, executeEditTask: false }));
                }
            };

            editTask();
        }
    }, [form.executeEditTask, form.taskId, form.title, form.type, form.difficulty, form.requiredSkills, form.plannedDuration, form.predictedDuration, form.deadline, form.priority, form.revenue, form.otherCosts, form.status]);

    // useEffect pentru edit employee
    useEffect(() => {
        if (form.executeEditEmployee && form.id) {
            const editEmployee = async () => {
                try {
                    console.log("🔄 Editing employee...");
                    console.log("Employee ID:", form.id);
                    console.log("Edit data:", {
                        name: form.name,
                        email: form.email,
                        username: form.username,
                        active: form.active
                    });

                    // Pregătește datele pentru backend
                    const updateData: any = {};

                    if (form.name !== undefined) updateData.name = form.name;
                    if (form.email !== undefined) updateData.email = form.email;
                    if (form.username !== undefined) updateData.username = form.username;
                    if (form.active !== undefined) updateData.active = form.active;
                    if (form.role !== undefined) updateData.role = form.role;
                    if (form.hourlyRate !== undefined) updateData.hourlyRate = Number(form.hourlyRate);
                    if (form.seniority !== undefined) updateData.seniority = form.seniority;

                    console.log("📤 Sending update data:", updateData);

                    // Apel către backend
                    await updateEmployee(Number(form.id), updateData);

                    console.log("✅ Employee updated successfully!");

                    // Refresh lista de employees
                    await refreshEmployees();

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error editing employee:", error);
                    // Resetează doar flag-ul de execuție
                    setForm((prev: any) => ({ ...prev, executeEditEmployee: false }));
                }
            };

            editEmployee();
        }
    }, [form.executeEditEmployee, form.id, form.name, form.email, form.username, form.active, form.role, form.hourlyRate, form.seniority]);

    useEffect(() => {
        if (view === "TASKS_UNASSIGNED") {
            const loadUnassignedTasks = async () => {
                try {
                    const data = await getUnassignedTasks();

                    console.log("=== DEBUG UNASSIGNED TASKS ===");
                    console.log("Full data:", data);

                    if (Array.isArray(data)) {
                        data.forEach((task, index) => {
                            console.log(`Task ${index}:`, {
                                id: task.id,
                                status: task.status,
                                allProperties: Object.keys(task)
                            });
                        });

                        const filteredTasks = data.filter(task => {
                            const hasStatus = task.status !== undefined && task.status !== null;
                            const isNotAssigned = task.status !== "ASSIGNED";
                            return hasStatus && isNotAssigned;
                        });

                        console.log("Final filtered tasks:", filteredTasks);
                        setUnassignedTasks(filteredTasks);
                    } else {
                        console.log("Data is not an array");
                        setUnassignedTasks([]);
                    }

                } catch (error) {
                    console.error("Error loading unassigned tasks:", error);
                    setUnassignedTasks([]);
                }
            };
            loadUnassignedTasks();
        }
    }, [view]);

    useEffect(() => {
        if (view === "MY_TASKS") {
            const loadMyTasks = async () => {
                try {
                    const data = await getMyTasks();
                    console.log("My tasks loaded:", data);
                    setMyTasks(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Error loading my tasks:", error);
                } finally {
                }
            };
            loadMyTasks();
        }
    }, [view]);

// 4. Get assignments by employee
    // 4. Get assignments by employee
    // 4. Get assignments by task (când view este ASSIGNMENTS și avem taskId)
    useEffect(() => {
        if (view === "ASSIGNMENTS" && form.taskId) {
            const loadAssignments = async () => {
                try {
                    console.log("🔄 Loading assignments for task ID:", form.taskId);
                    const data = await getAssignmentsByTask(Number(form.taskId));
                    console.log("✅ Task assignments loaded:", data);
                    setAssignments(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("❌ Error loading task assignments:", error);
                    setAssignments([]);
                }
            };
            loadAssignments();
        }
    }, [view, form.taskId]);

    useEffect(() => {
        // Ascultă pentru schimbări în form pentru a trigger-ui asignarea
        if (form.taskId && form.employeeId && form.autoAssign) {
            const assignTaskToEmployee = async () => {
                try {
                    console.log("🔄 Auto-assigning task to employee...");
                    console.log("Task ID:", form.taskId);
                    console.log("Employee ID:", form.employeeId);

                    await assignTask(Number(form.taskId), Number(form.employeeId));

                    console.log("✅ Task assigned successfully!");

                    // Refresh listele de task-uri
                    await Promise.all([refreshUnassigned(), refreshMyTasks()]);

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error auto-assigning task:", error);
                }
            };

            assignTaskToEmployee();
        }
    }, [form.taskId, form.employeeId, form.autoAssign]); // Se execută când aceste valori se schimbă

    useEffect(() => {
        // Ascultă pentru schimbări în form pentru a trigger-ui asignarea
        if (form.taskId && form.autoAssign) {
            const assignTaskToMe = async () => {
                try {
                    console.log("🔄 Auto-assigning task to admin...");
                    console.log("Task ID:", form.taskId);
                    console.log("Admin ID:", form.employeeId);

                    await assignTaskToMe();

                    console.log("✅ Task assigned successfully!");

                    // Refresh listele de task-uri
                    await Promise.all([refreshMyTasks(), refreshMyTasks()]);

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error auto-assigning task:", error);
                }
            };

            assignTaskToMe();
        }
    }, [form.taskId, form.employeeId, form.autoAssign]); // Se execută când aceste valori se schimbă

    // useEffect pentru unassign task cu ID-urile introduse manual
    useEffect(() => {
        if (form.executeUnassign && form.unassignTaskId && form.unassignEmployeeId) {
            const performUnassign = async () => {
                try {
                    console.log("🔄 Executing unassign...");
                    console.log("Task ID:", form.unassignTaskId);
                    console.log("Employee ID:", form.unassignEmployeeId);

                    // Execută unassign-ul
                    await unassignTask(
                        Number(form.unassignTaskId),
                        Number(form.unassignEmployeeId)
                    );

                    console.log("✅ Task unassigned successfully!");

                    // Refresh listele de task-uri
                    await refreshUnassigned();
                    await refreshMyTasks();

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error unassigning task:", error);
                    // Resetează doar flag-ul de execuție, păstrează ID-urile pentru reîncercare
                    setForm((prev: any) => ({ ...prev, executeUnassign: false }));
                }
            };

            performUnassign();
        }
    }, [form.executeUnassign, form.unassignTaskId, form.unassignEmployeeId]);

    // useEffect pentru generarea raportului lunar
    useEffect(() => {
        if (form.executeGenerateReport && form.employeeId && form.year && form.month) {
            const generateReport = async () => {
                try {
                    console.log("🔄 Generating monthly report...");
                    console.log("Employee ID:", form.employeeId);
                    console.log("Year:", form.year);
                    console.log("Month:", form.month);

                    const data = await generateMonthlyReport(
                        Number(form.employeeId),
                        Number(form.year),
                        Number(form.month)
                    );

                    console.log("✅ Monthly report generated:", data);

                    // Setează raportul și schimbă view-ul
                    setReport(data);
                    setView("REPORTS");

                    // Resetează form-ul
                    setForm({});

                } catch (error) {
                    console.error("❌ Error generating monthly report:", error);
                    // Resetează doar flag-ul de execuție
                    setForm((prev: any) => ({ ...prev, executeGenerateReport: false }));
                }
            };

            generateReport();
        }
    }, [form.executeGenerateReport, form.employeeId, form.year, form.month]);

    // Înlocuiește useEffect-ul existent pentru rapoarte cu:
    useEffect(() => {
        if (view === "REPORTS") {
            fetchAllReports();
        }
    }, [view]);

    // useEffect pentru adăugarea unui employee în baza de date
    // useEffect pentru adăugarea unui employee - cu debugging

    const refreshEmployees = async () => {
        try {
            console.log("🔄 Refreshing employees list...");
            const data = await getEmployees();
            console.log("📋 Employees data received:", data);
            console.log("📊 Is array?", Array.isArray(data));
            console.log("🔢 Number of employees:", data.length);

            setEmployees(Array.isArray(data) ? data : []);

            console.log("✅ Employees state updated");
        } catch (error) {
            console.error("❌ Error refreshing employees:", error);
            setEmployees([]);
        }
    };
    const refreshUnassigned = async () => setUnassignedTasks(await getUnassignedTasks());
    const refreshMyTasks = async () => setMyTasks(await getMyTasks());

    /* ===== Actions ===== */

    const submitAddEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { username, password, role, active, name, email, hourlyRate, seniority } = form;

        console.log("📝 Add employee form submitted:", { username, password, role });

        // Validare - doar username și password sunt obligatorii
        if (!username || !password) {
            console.error("❌ Username and password are required");
            alert("Username și parola sunt obligatorii!");
            return;
        }

        try {
            console.log("🔄 Calling createEmployee API...");

            // Pregătește datele pentru backend
            const employeeData = {
                username: username,
                password: password,
                role: role || "EMPLOYEE",
                active: active !== undefined ? active : true,
                name: name || username, // folosește username ca name dacă nu e specificat
                email: email || `${username}@company.com`, // email default
                hourlyRate: hourlyRate ? Number(hourlyRate) : 0,
                seniority: seniority || "JUNIOR"
            };

            console.log("📤 Sending to backend:", employeeData);

            // Execută direct apelul API
            const newEmployee = await createEmployee(employeeData);

            console.log("✅ Employee created successfully:", newEmployee);

            // Refresh lista de employees
            await refreshEmployees();

            console.log("🔄 Employees list refreshed");

            // Închide modal-ul
            close();

        } catch (error) {
            console.error("❌ Error creating employee:", error);
            // @ts-ignore
            alert("Eroare la crearea angajatului: " + error.message);
        }
    };

    const submitEditEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { id, name, email, username, active, role, hourlyRate, seniority } = form;

        console.log("📝 Edit employee form submitted:", { id, name, email, username, active });

        if (!id) {
            console.error("❌ Employee ID is required");
            alert("ID-ul angajatului este obligatoriu!");
            return;
        }

        try {
            console.log("🔄 Step 1: Calling updateEmployee API...");

            // Pregătește datele pentru backend - trimite chiar și valorile undefined
            const updateData: any = {
                // Include toate câmpurile chiar dacă sunt undefined
                name: name,
                email: email,
                username: username,
                active: active, // acesta este cel important!
                role: role,
                hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
                seniority: seniority
            };

            // Curăță obiectul de valori complet goale, dar păstrează active: false
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === "") {
                    delete updateData[key];
                }
            });

            console.log("📤 Step 2: Sending update data:", updateData);

            // Execută apelul API
            await updateEmployee(Number(id), updateData);

            console.log("✅ Step 3: Employee updated successfully in database!");

            // Step 4: Așteaptă puțin pentru a se procesa pe server
            console.log("⏳ Step 4: Waiting for server processing...");
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 5: Reîncarcă lista
            console.log("🔄 Step 5: Refreshing employees list...");
            await refreshEmployees();

            // Step 6: Verifică starea actuală
            console.log("🔍 Step 6: Current employees state:", employees);

            // Step 7: Închide modal-ul
            console.log("✅ Step 7: Closing modal");
            close();

        } catch (error) {
            console.error("❌ Error editing employee:", error);
            // @ts-ignore
            alert("Eroare la editarea angajatului: " + error.message);
        }
    };


    const submitDeleteEmployee = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { id } = form;

        console.log("📝 Delete employee form submitted:", { id });

        if (!id) {
            console.error("❌ Employee ID is required for deletion");
            alert("ID-ul angajatului este obligatoriu pentru ștergere!");
            return;
        }

        const employeeId = Number(id);

        // Confirmare
        const confirmed = window.confirm(`Ești sigur că vrei să ștergi angajatul cu ID-ul ${employeeId}? Această acțiune este ireversibilă.`);

        if (!confirmed) {
            console.log("❌ Deletion cancelled by user");
            close();
            return;
        }

        try {
            console.log("🔄 Calling deleteEmployee API...");

            // Folosește funcția importată din AdminService
            await deleteEmployee(employeeId);

            console.log("✅ Employee deleted successfully!");

            // Refresh lista de employees
            await refreshEmployees();

            console.log("🔄 Employees list refreshed after deletion");

            // Închide modal-ul
            close();

        } catch (error) {
            console.error("❌ Error deleting employee:", error);
            // @ts-ignore
            alert("Eroare la ștergerea angajatului: " + error.message);
        }
    };

    const submitEditTask = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, title, type, difficulty, requiredSkills, plannedDuration, predictedDuration, deadline, priority, revenue, otherCosts, status } = form;

        console.log("🔍 DEBUG - Task ID being sent:", taskId);
        console.log("🔍 DEBUG - Full form data:", form);
        console.log("📝 Edit task form submitted:", { taskId, title, type, difficulty });

        if (!taskId) {
            console.error("❌ Task ID is required");
            alert("ID-ul task-ului este obligatoriu!");
            return;
        }

        try {
            console.log("🔄 Step 1: Calling updateTask API...");

            // Pregătește datele pentru backend
            const updateData: any = {
                title: title,
                type: type,
                difficulty: difficulty ? Number(difficulty) : undefined,
                plannedDuration: plannedDuration ? Number(plannedDuration) : undefined,
                predictedDuration: predictedDuration ? Number(predictedDuration) : undefined,
                deadline: deadline,
                priority: priority ? Number(priority) : undefined,
                revenue: revenue ? Number(revenue) : undefined,
                otherCosts: otherCosts ? Number(otherCosts) : undefined,
                status: status
            };

            // Procesează requiredSkills separat - SOLUȚIE CORECTĂ
            if (requiredSkills) {
                console.log("🔍 DEBUG - Original requiredSkills:", requiredSkills);

                if (Array.isArray(requiredSkills)) {
                    updateData.requiredSkills = requiredSkills;
                } else if (typeof requiredSkills === 'string') {
                    try {
                        // SOLUȚIE SIMPLĂ: elimină doar backslash-urile din fața ghilimelelor
                        const cleanedString = requiredSkills.replace(/\\"/g, '"');
                        console.log("🔍 DEBUG - After cleaning backslashes:", cleanedString);

                        // Elimină ghilimelele exterioare dacă există
                        let finalString = cleanedString;
                        if (finalString.startsWith('"') && finalString.endsWith('"')) {
                            finalString = finalString.slice(1, -1);
                            console.log("🔍 DEBUG - After removing outer quotes:", finalString);
                        }

                        console.log("🔍 DEBUG - Final string for parsing:", finalString);
                        updateData.requiredSkills = JSON.parse(finalString);
                        console.log("✅ DEBUG - Successfully parsed requiredSkills:", updateData.requiredSkills);

                    } catch (error) {
                        console.error("❌ Error parsing requiredSkills:", error);
                        // Fallback: folosește o metodă manuală
                        try {
                            // Extrage manual conținutul din array
                            const match = requiredSkills.match(/\[(.*)\]/);
                            if (match && match[1]) {
                                const skillsArray = match[1].split(',').map(s =>
                                    s.trim().replace(/"/g, '').replace(/\\/g, '')
                                );
                                updateData.requiredSkills = skillsArray;
                                console.log("✅ DEBUG - Manual extraction successful:", skillsArray);
                            } else {
                                updateData.requiredSkills = [];
                            }
                        } catch (fallbackError) {
                            console.error("❌ Fallback also failed:", fallbackError);
                            updateData.requiredSkills = [];
                        }
                    }
                }
            }

            // Curăță obiectul de valori goale
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === "" ||
                    (Array.isArray(updateData[key]) && updateData[key].length === 0)) {
                    delete updateData[key];
                }
            });

            console.log("📤 Step 2: Sending update data:", updateData);
            console.log("🔍 DEBUG - requiredSkills final:", updateData.requiredSkills);

            // Execută apelul API
            await updateTask(Number(taskId), updateData);

            console.log("✅ Step 3: Task updated successfully in database!");

            // Reîncarcă listele
            console.log("🔄 Step 4: Refreshing task lists...");
            await Promise.all([refreshUnassigned(), refreshMyTasks()]);

            // Închide modal-ul
            console.log("✅ Step 5: Closing modal");
            close();

        } catch (error) {
            console.error("❌ Error editing task:", error);
            // @ts-ignore
            alert("Eroare la editarea task-ului: " + error.message);
        }
    };
    const submitAssign = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, employeeId } = form;
        if (!taskId || !employeeId) return;
        try {
            await assignTask(Number(taskId), Number(employeeId));
            await refreshUnassigned(); // ✅ Refresh după asignare
        } catch (error) {
            console.error("Error assigning task:", error);
        } finally {
            close();
        }
    };



    const submitUnassign = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId, employeeId } = form;
        if (!taskId || !employeeId) return;
        await unassignTask(Number(taskId), Number(employeeId));
        close();
    };



    const submitAssignToMe = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId } = form;
        if (!taskId) return;
        try {
            await assignTaskToMe(Number(taskId));
            await Promise.all([refreshUnassigned(), refreshMyTasks()]); // ✅ Refresh ambele view-uri
        } catch (error) {
            console.error("Error assigning task to me:", error);
        } finally {
            close();
        }
    };

    const submitViewAssignments = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { taskId } = form;

        console.log("=== DEBUG TASK ASSIGNMENTS ===");
        console.log("Task ID from form:", taskId);
        console.log("All unassigned tasks:", unassignedTasks);
        console.log("All my tasks:", myTasks);

        if (!taskId) {
            console.error("❌ No task ID provided");
            return;
        }

        try {
            console.log("🔄 Calling getAssignmentsByTask with ID:", taskId);
            const data = await getAssignmentsByTask(Number(taskId));
            console.log("✅ Task assignments loaded:", data);

            setAssignments(Array.isArray(data) ? data : []);
            setView("ASSIGNMENTS");
        } catch (error) {
            console.error("❌ Error loading task assignments:", error);
        } finally {
            close();
        }
    };

    const submitGenerateReport = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { employeeId, year, month } = form;

        if (!employeeId || !year || !month) {
            alert("Toate câmpurile sunt obligatorii!");
            return;
        }

        console.log("📝 Generate report form submitted:", { employeeId, year, month });

        try {
            const newReport = await generateMonthlyReport(
                Number(employeeId),
                Number(year),
                Number(month)
            );

            console.log("✅ Monthly report generated:", newReport);

            // Reîncarcă toate rapoartele după generare
            await fetchAllReports();

            // Revine la modul de vizualizare
            setViewMode('view');

            alert('Report generated successfully!');
            close();
        } catch (error) {
            console.error("❌ Error generating monthly report:", error);
            alert('Error generating report. Please try again.');
        } finally {
        }
    };

    const submitImportXml = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const file: File | undefined = form.file;
        if (!file) return;
        await importEmployeesXml(file);
        await refreshEmployees();
        close();
    };

    /* ===== Stats (pentru carduri) ===== */

    const taskStats = useMemo(
        () => ({
            unassigned: unassignedTasks.length,
            myTasks: myTasks.length,
            highPriority: myTasks.filter((t) => (t.priority ?? 0) === 5).length, // ✅ Schimbat aici
            totalEmployees: employees.length,
        }),
        [unassignedTasks, myTasks, employees]
    );

    /* ===== Tabel principal (în partea dreaptă) ===== */

    const tableRows: TableRow[] = useMemo(() => {
        if (view === "TASKS_UNASSIGNED") {
            return unassignedTasks.map<TableRow>(t => ({
                id: t.id,
                Title: t.title,
                Type: t.type || "-",
                Difficulty: t.difficulty || 0,
                RequiredSkills: t.requiredSkills ? JSON.stringify(t.requiredSkills) : "-",
                PlannedDuration: t.plannedDuration || 0,
                PredictedDuration: t.predictedDuration || 0,
                Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : "-",
                Priority: t.priority || 0,
                Revenue: t.revenue || 0,
                OtherCosts: t.otherCosts || 0,
                Status: t.status || "NEW"
            }));
        }

        if (view === "MY_TASKS") {
            return myTasks.map<TableRow>(t => ({
                id: t.id,
                Title: t.title,
                Type: t.type || "-",
                Difficulty: t.difficulty || 0,
                RequiredSkills: t.requiredSkills ? JSON.stringify(t.requiredSkills) : "-",
                PlannedDuration: t.plannedDuration || 0,
                PredictedDuration: t.predictedDuration || 0,
                Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : "-",
                Priority: t.priority || 0,
                Revenue: t.revenue || 0,
                OtherCosts: t.otherCosts || 0,
                Status: t.status || "NEW"
            }));
        }
        return [];
    }, [unassignedTasks, myTasks, view]);
    const tableRows1: TableRow1[] = useMemo(() => {
        if (view === "EMPLOYEES") {
            const employeesOnly = employees.filter(user => user.role === "EMPLOYEE");
            return employeesOnly.map<TableRow1>(user => ({
                id: user.id,
                Username: user.username,
                Email: user.username.includes('@') ? user.username : `${user.username}@company.com`,
                Status: user.active ? "✅ Active" : "❌ Inactive",
                Role: `Role: ${user.role}`,
                actions: undefined,
            }));
        }

        /*  if (view === "ASSIGNMENTS") {
         return assignments.map<TableRow>(a => ({
             id: a.id,
             col1: `Task #${a.taskId}`,
             col2: `Emp #${a.employeeId}`,
             col3: `Admin #${a.adminId}`,
             col4: "",
             actions: undefined,
         }));
     }*/

        /* if (view === "REPORTS" && report) {
             return [{
                 id: report.id,
                 col1: `Emp #${report.employeeId}`,
                 col2: `${report.year}-${String(report.month).padStart(2, "0")}`,
                 col3: `Completed: ${report.completedTasks}/${report.totalTasks}`,
                 col4: "",
                 actions: undefined,
             }];
         }
     */
        return []; // ⚠️ return default

    }, [employees, view]);


    /* ===== Render ===== */


    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-page">
                {/* Navbar Vuexy-like */}
                <nav className="layout-navbar navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <a className="navbar-brand" href="#">
                            Platforma Admin
                        </a>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted small me-3">Admin Panel</span>
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

                <div className="d-flex" style={{ background: "#fafafa", minHeight: "calc(100vh - 64px)" }}>
                    {/* Sidebar */}
                    <aside
                        className="bg-white border-end"
                        style={{ width: 260, padding: 16 }}
                    >
                        <h5 className="mb-3">Admin</h5>

                        <div className="mb-2 text-muted small text-uppercase">
                            Task management
                        </div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "TASKS_UNASSIGNED" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("TASKS_UNASSIGNED")}
                            >
                                Unassigned tasks
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "MY_TASKS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("MY_TASKS")}
                            >
                                My tasks
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("ASSIGN")}
                            >
                                Assign task to employee…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("UNASSIGN")}
                            >
                                Unassign task…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("ASSIGN_TO_ME")}
                            >
                                Assign task to me…
                            </button>
                        </div>

                        <div className="mb-2 text-muted small text-uppercase">
                            Employees
                        </div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "EMPLOYEES" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("EMPLOYEES")}
                            >
                                List employees
                            </button>
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "PAYROLL" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("PAYROLL")}
                            >
                                Payroll Management
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("ADD_EMP")}
                            >
                                Add employee…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("EDIT_EMP")}
                            >
                                Edit employee…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("DEL_EMP")}
                            >
                                Delete employee…
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("IMPORT_XML")}
                            >
                                Import XML…
                            </button>
                        </div>

                        <div className="mb-2 text-muted small text-uppercase">
                            Assignments & Reports
                        </div>
                        <div className="nav flex-column mb-3">
                            <button
                                className={
                                    "btn w-100 text-start mb-1 " +
                                    (view === "REPORTS" ? "btn-primary" : "btn-light")
                                }
                                onClick={() => setView("REPORTS")}
                            >
                                View Reports
                            </button>
                            <button
                                className="btn w-100 text-start mb-1 btn-light"
                                onClick={() => open("VIEW_ASSIGNMENTS")}
                            >
                                Assignments for employee…
                            </button>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-grow-1 p-4">
                        {/* KPI cards – ca în screenshot */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">
                                            Unassigned tasks
                                        </small>
                                        <h3 className="mb-0">{taskStats.unassigned}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">My tasks</small>
                                        <h3 className="mb-0">{taskStats.myTasks}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">
                                            High priority
                                        </small>
                                        <h3 className="mb-0">{taskStats.highPriority}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <small className="text-muted d-block">
                                            Employees
                                        </small>
                                        <h3 className="mb-0">{taskStats.totalEmployees}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card cu tabel – ca în screenshot */}
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    {view === "TASKS_UNASSIGNED" && "Unassigned tasks"}
                                    {view === "MY_TASKS" && "My tasks"}
                                    {view === "EMPLOYEES" && "Employees"}
                                    {view === "ASSIGNMENTS" && "Assignments"}
                                    {view === "REPORTS" && "Reports"}
                                    {view === "PAYROLL" && "Payroll Management"}
                                </h5>
                            </div>
                            <div className="card-body">
                                {/* Tabel pentru Task-uri (TASKS_UNASSIGNED și MY_TASKS) */}
                                {(view === "TASKS_UNASSIGNED" || view === "MY_TASKS") && (
                                    tableRows.length === 0 ? (
                                        <div className="text-muted">Nu există task-uri.</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                <tr>
                                                    <th style={{width: '50px'}}></th>
                                                    <th>ID</th>
                                                    <th>Title</th>
                                                    <th>Type</th>
                                                    <th>Difficulty</th>
                                                    <th>Required Skills</th>
                                                    <th>Planned Duration</th>
                                                    <th>Predicted Duration</th>
                                                    <th>Deadline</th>
                                                    <th>Priority</th>
                                                    <th>Revenue</th>
                                                    <th>Other Costs</th>
                                                    <th>Status</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {tableRows.map((row) => (
                                                    <React.Fragment key={row.id}>
                                                        <tr>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary py-0 px-1"
                                                                    onClick={() => toggleRow(row.id)}
                                                                    title={expandedRows.has(row.id) ? "Hide details" : "Show details"}
                                                                >
                                                                    {expandedRows.has(row.id) ? '▲' : '▼'}
                                                                </button>
                                                            </td>
                                                            <td>{row.id}</td>
                                                            <td>{row.Title}</td>
                                                            <td>{row.Type}</td>
                                                            <td>{row.Difficulty}/5</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                <span className="d-inline-block text-truncate me-2" style={{maxWidth: '120px'}}>
                                                                    {row.RequiredSkills}
                                                                </span>
                                                                </div>
                                                            </td>
                                                            <td>{row.PlannedDuration}min</td>
                                                            <td>{row.PredictedDuration}min</td>
                                                            <td>{row.Deadline}</td>
                                                            <td>{row.Priority}/5</td>
                                                            <td>${row.Revenue}</td>
                                                            <td>${row.OtherCosts}</td>
                                                            <td>
                                                            <span className={`badge ${
                                                                row.Status === 'DONE' ? 'bg-success' :
                                                                    row.Status === 'IN_PROGRESS' ? 'bg-primary' :
                                                                        row.Status === 'ASSIGNED' ? 'bg-warning' :
                                                                            'bg-secondary'
                                                            }`}>
                                                                {row.Status}
                                                            </span>
                                                            </td>
                                                        </tr>
                                                        {expandedRows.has(row.id) && (
                                                            <tr className="bg-light">
                                                                <td colSpan={13}>
                                                                    <div className="p-3">
                                                                        <div className="d-flex align-items-center mb-2">
                                                                            <span className="me-2 fw-bold">{row.Title}</span>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-primary py-0 px-1"
                                                                                onClick={() => open("EDIT_TASK", {
                                                                                    taskId: row.id,
                                                                                    title: row.Title,
                                                                                    type: row.Type,
                                                                                    difficulty: row.Difficulty,
                                                                                    requiredSkills: row.RequiredSkills,
                                                                                    plannedDuration: row.PlannedDuration,
                                                                                    predictedDuration: row.PredictedDuration,
                                                                                    deadline: row.Deadline,
                                                                                    priority: row.Priority,
                                                                                    revenue: row.Revenue,
                                                                                    otherCosts: row.OtherCosts,
                                                                                    status: row.Status
                                                                                })}
                                                                                title="Edit task"
                                                                            >
                                                                                ✏️
                                                                            </button>
                                                                        </div>
                                                                        <div className="row">
                                                                            <div className="col-md-6">
                                                                                <strong>Required Skills:</strong>
                                                                                <div className="mt-1">
                                                                                    {(() => {
                                                                                        try {
                                                                                            const skills = JSON.parse(row.RequiredSkills);
                                                                                            if (Array.isArray(skills)) {
                                                                                                return skills.map((skill, index) => (
                                                                                                    <span key={index} className="badge bg-primary me-1 mb-1">
                                                                                                    {skill}
                                                                                                </span>
                                                                                                ));
                                                                                            }
                                                                                        } catch (e) {
                                                                                            // Dacă nu e JSON valid, afișează ca text simplu
                                                                                        }
                                                                                        return (
                                                                                            <span className="text-muted">{row.RequiredSkills}</span>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-md-6">
                                                                                <strong>Additional Info:</strong>
                                                                                <div className="mt-1">
                                                                                    <div><small><strong>Type:</strong> {row.Type}</small></div>
                                                                                    <div><small><strong>Difficulty:</strong> {row.Difficulty}/5</small></div>
                                                                                    <div><small><strong>Planned Duration:</strong> {row.PlannedDuration} minutes</small></div>
                                                                                    <div><small><strong>Predicted Duration:</strong> {row.PredictedDuration} minutes</small></div>
                                                                                    <div><small><strong>Revenue:</strong> ${row.Revenue}</small></div>
                                                                                    <div><small><strong>Other Costs:</strong> ${row.OtherCosts}</small></div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {view === "TASKS_UNASSIGNED" && (
                                                                            <div className="mt-3">
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-primary"
                                                                                    onClick={() => open("ASSIGN_TO_ME", { taskId: row.id })}
                                                                                >
                                                                                    Assign to me
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                )}

                                {/* Tabel pentru Employees */}
                                {view === "EMPLOYEES" && (
                                    tableRows1.length === 0 ? (
                                        <div className="text-muted">Nu există angajați.</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Status</th>
                                                    <th>Role</th>
                                                    <th>Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {tableRows1.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>{row.id}</td>
                                                        <td>{row.Username}</td>
                                                        <td>{row.Email}</td>
                                                        <td>{row.Status}</td>
                                                        <td>{row.Role}</td>
                                                        <td>{row.actions ?? <span className="text-muted">—</span>}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                )}

                                {/* Tabel pentru Reports */}
                                {view === "REPORTS" && (
                                    <div className="reports-section">
                                        {/* Butoane pentru switching între view și generate */}
                                        <div className="button-group mb-4">
                                            <button
                                                className={`btn ${viewMode === 'view' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => {
                                                    setViewMode('view');
                                                    fetchAllReports();
                                                }}
                                            >
                                                📊 View All Reports
                                            </button>
                                            <button
                                                className={`btn ${viewMode === 'generate' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => {
                                                    setViewMode('generate');
                                                    open("GENERATE_REPORT");
                                                }}
                                            >
                                                ➕ Generate New Report
                                            </button>
                                        </div>

                                        {viewMode === 'view' ? (
                                            /* MODUL DE VIZUALIZARE - TOATE RAPOARTELE */
                                            <div>
                                                <h5>All Generated Reports</h5>
                                                {loading ? (
                                                    <div className="text-center py-4">
                                                        <div className="spinner-border" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                        <p className="mt-2">Loading reports...</p>
                                                    </div>
                                                ) : allReports.length === 0 ? (
                                                    <div className="text-center py-4">
                                                        <p className="text-muted">No reports available. Generate your first report!</p>
                                                        <button
                                                            className="btn btn-primary mt-2"
                                                            onClick={() => {
                                                                setViewMode('generate');
                                                                open("GENERATE_REPORT");
                                                            }}
                                                        >
                                                            Generate First Report
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                            <tr>
                                                                <th>Employee ID</th>
                                                                <th>Period</th>
                                                                <th>Total Tasks</th>
                                                                <th>Average Grade</th>
                                                                <th>Total Revenue</th>
                                                                <th>Total Costs</th>
                                                                <th>Productivity Score</th>
                                                                <th>Generated At</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {allReports.map((report) => (
                                                                <tr key={report.id}>
                                                                    <td>{report.employeeId || 'N/A'}</td>
                                                                    <td>{report.year}-{String(report.month).padStart(2, "0")}</td>
                                                                    <td>{report.totalTasks || 0}</td>
                                                                    <td>{report.avgGrade?.toFixed(2) || "0.00"}</td>
                                                                    <td>${report.totalRevenue?.toFixed(2) || "0.00"}</td>
                                                                    <td>${report.totalCosts?.toFixed(2) || "0.00"}</td>
                                                                    <td>
                                                                    <span className={`badge ${
                                                                        (report.productivityScore ?? 0) > 0 ? 'bg-success' :
                                                                            (report.productivityScore ?? 0) < 0 ? 'bg-danger' : 'bg-secondary'
                                                                    }`}>
                                                                        {report.productivityScore?.toFixed(2) || "0.00"}
                                                                    </span>
                                                                    </td>
                                                                    <td>
                                                                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* MODUL DE GENERARE - FORMULAR PENTRU RAPORT NOU */
                                            <div>
                                                <h5>Generate New Monthly Report</h5>
                                                {report ? (
                                                    <div className="alert alert-success">
                                                        <h6>Last Generated Report</h6>
                                                        <div className="row">
                                                            <div className="col-md-3"><strong>Employee:</strong> {report.employeeId}</div>
                                                            <div className="col-md-3"><strong>Period:</strong> {report.year}-{String(report.month).padStart(2, "0")}</div>
                                                            <div className="col-md-3"><strong>Tasks:</strong> {report.totalTasks}</div>
                                                            <div className="col-md-3"><strong>Productivity:</strong> {report.productivityScore?.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-info">
                                                        Complete the form below to generate a new monthly report.
                                                    </div>
                                                )}
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => open("GENERATE_REPORT")}
                                                >
                                                    Open Generate Report Form
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tabel pentru Payroll */}
                                {view === "PAYROLL" && (
                                    <div className="payroll-section">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h5>Payroll Management</h5>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => open("CALCULATE_PAYROLL")}
                                            >
                                                Calculate Payroll
                                            </button>
                                        </div>

                                        {currentPayroll && (
                                            <div className="alert alert-success mb-3">
                                                <h6>Last Calculated Payroll</h6>
                                                <div className="row">
                                                    <div className="col-md-3"><strong>Employee:</strong> {currentPayroll.employee?.name || currentPayroll.employeeId}</div>
                                                    <div className="col-md-3"><strong>Period:</strong> {currentPayroll.month}</div>
                                                    <div className="col-md-2"><strong>Base Salary:</strong> ${currentPayroll.baseSalary?.toFixed(2)}</div>
                                                    <div className="col-md-2"><strong>Bonuses:</strong> ${currentPayroll.bonuses?.toFixed(2)}</div>
                                                    <div className="col-md-2"><strong>Net Salary:</strong> <strong>${currentPayroll.netSalary?.toFixed(2)}</strong></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Payroll History</h6>
                                            </div>
                                            <div className="card-body">
                                                {payrollHistory.length === 0 ? (
                                                    <div className="text-center py-4">
                                                        <p className="text-muted">No payroll records found.</p>
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => open("CALCULATE_PAYROLL")}
                                                        >
                                                            Calculate First Payroll
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                            <tr>
                                                                <th>Employee</th>
                                                                <th>Period</th>
                                                                <th>Base Salary</th>
                                                                <th>Bonuses</th>
                                                                <th>Deductions</th>
                                                                <th>Net Salary</th>
                                                                <th>Admin</th>
                                                                <th>Calculated At</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {payrollHistory.map((payroll) => (
                                                                <tr key={payroll.id}>
                                                                    <td>
                                                                        {payroll.employee?.name || `Employee #${payroll.employeeId}`}
                                                                    </td>
                                                                    <td>{payroll.month?.toString() || 'N/A'}</td>
                                                                    <td>${payroll.baseSalary?.toFixed(2) || "0.00"}</td>
                                                                    <td>${payroll.bonuses?.toFixed(2) || "0.00"}</td>
                                                                    <td>${payroll.deductions?.toFixed(2) || "0.00"}</td>
                                                                    <td>
                                                                        <strong>${payroll.netSalary?.toFixed(2) || "0.00"}</strong>
                                                                    </td>
                                                                    <td>
                                                                        {payroll.admin?.name || `Admin #${payroll.adminId}`}
                                                                    </td>
                                                                    <td>
                                                                        {new Date().toLocaleDateString()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>


            {/* === Modals === */}
            {/* ADD EMPLOYEE */}
            <Modal
                open={modal === "ADD_EMP"}
                title="Adaugă Angajat"
                onClose={close}
                onSubmit={submitAddEmployee}
                submitLabel="Adaugă"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Username*"
                            value={form.username || ""}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Parolă*"
                            value={form.password || ""}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.role || "EMPLOYEE"}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.active !== undefined ? form.active.toString() : "true"}
                            onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
                        >
                            <option value="true">Activ</option>
                            <option value="false">Inactiv</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Nume (opțional)"
                            value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="email"
                            placeholder="Email (opțional)"
                            value={form.email || ""}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Rată orară (opțional)"
                            value={form.hourlyRate || ""}
                            onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.seniority || "JUNIOR"}
                            onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                        >
                            <option value="JUNIOR">Junior</option>
                            <option value="MID">Mid</option>
                            <option value="SENIOR">Senior</option>
                        </select>
                    </div>
                </div>
                <small className="text-muted mt-2">* Username și parolă sunt obligatorii pentru autentificare</small>
            </Modal>
            {/* EDIT EMPLOYEE */}
            {/* EDIT EMPLOYEE */}
            <Modal
                open={modal === "EDIT_EMP"}
                title="Editează Angajat"
                onClose={close}
                onSubmit={submitEditEmployee}
                submitLabel="Salvează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="ID Angajat*"
                            value={form.id || ""}
                            onChange={(e) => setForm({ ...form, id: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.active !== undefined ? form.active.toString() : ""}
                            onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
                        >
                            <option value="">Status (opțional)</option>
                            <option value="true">Activ</option>
                            <option value="false">Inactiv</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Username (opțional)"
                            value={form.username || ""}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Nume (opțional)"
                            value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="email"
                            placeholder="Email (opțional)"
                            value={form.email || ""}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.role || ""}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="">Rol (opțional)</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Rată orară (opțional)"
                            value={form.hourlyRate || ""}
                            onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-select"
                            value={form.seniority || ""}
                            onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                        >
                            <option value="">Senioritate (opțional)</option>
                            <option value="JUNIOR">Junior</option>
                            <option value="MID">Mid</option>
                            <option value="SENIOR">Senior</option>
                        </select>
                    </div>
                </div>
                <small className="text-muted mt-2">* Completează doar câmpurile pe care vrei să le modifici</small>
            </Modal>
            {/* DELETE EMPLOYEE */}
            {/* DELETE EMPLOYEE */}
            <Modal
                open={modal === "DEL_EMP"}
                title="Șterge Angajat"
                onClose={close}
                onSubmit={submitDeleteEmployee}
                submitLabel="Șterge"
            >
                <div className="alert alert-warning">
                    <strong>Atenție!</strong> Această acțiune este ireversibilă.
                </div>
                <input
                    className="form-control"
                    placeholder="ID Angajat*"
                    value={form.id || ""}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    required
                />
                <small className="text-muted mt-2">
                    Introdu ID-ul angajatului pe care vrei să îl ștergi.
                </small>
            </Modal>

            {/* ASSIGN TASK */}
            <Modal
                open={modal === "ASSIGN"}
                title="Asignează task la angajat"
                onClose={close}
                onSubmit={submitAssign}
                submitLabel="Asignează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Task ID"
                            value={form.taskId || ""}
                            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Employee ID"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* UNASSIGN */}
            <Modal
                open={modal === "UNASSIGN"}
                title="Dezasignează task"
                onClose={close}
                onSubmit={submitUnassign}
                submitLabel="Dezasignează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Task ID"
                            value={form.taskId || ""}
                            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <input
                            className="form-control"
                            placeholder="Employee ID"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* ASSIGN TO ME */}
            <Modal
                open={modal === "ASSIGN_TO_ME"}
                title="Asignează task către mine"
                onClose={close}
                onSubmit={submitAssignToMe}
                submitLabel="Asignează mie"
            >
                <input
                    className="form-control"
                    placeholder="Task ID"
                    value={form.taskId || ""}
                    onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                />
            </Modal>
            {/* VIEW ASSIGNMENTS FOR TASK */}
            <Modal
                open={modal === "VIEW_ASSIGNMENTS"}
                title="Vezi asignările unui task"
                onClose={close}
                onSubmit={submitViewAssignments}
                submitLabel="Afișează"
            >
                <input
                    className="form-control"
                    placeholder="Task ID"
                    value={form.taskId || ""}
                    onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                />
            </Modal>

            {/* GENERATE REPORT */}
            {/* GENERATE REPORT */}
            <Modal
                open={modal === "GENERATE_REPORT"}
                title="Generează raport lunar"
                onClose={close}
                onSubmit={submitGenerateReport}
                submitLabel="Generează"
            >
                <div className="row g-2">
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="Employee ID*"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="An (ex: 2024)*"
                            value={form.year || ""}
                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="Lună (1-12)*"
                            value={form.month || ""}
                            onChange={(e) => setForm({ ...form, month: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <small className="text-muted mt-2">
                    * Toate câmpurile sunt obligatorii. Raportul va fi generat pentru angajatul specificat și perioada selectată.
                </small>
            </Modal>

            {/* IMPORT XML */}
            <Modal
                open={modal === "IMPORT_XML"}
                title="Importă utilizatori din XML"
                onClose={close}
                onSubmit={submitImportXml}
                submitLabel="Importă"
            >
                <input
                    className="form-control"
                    type="file"
                    accept=".xml"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setForm({ ...form, file: e.target.files?.[0] })
                    }
                />
                {form.file && (
                    <p className="small text-muted mt-1">
                        Fișier selectat: {form.file.name}
                    </p>
                )}
            </Modal>
            {/* EDIT TASK */}
            <Modal
                open={modal === "EDIT_TASK"}
                title="Editează Task"
                onClose={close}
                onSubmit={submitEditTask}
                submitLabel="Salvează"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label">Task ID*</label>
                        <input
                            className="form-control"
                            placeholder="Task ID"
                            value={form.taskId || ""}
                            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                            required
                            disabled
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Titlu</label>
                        <input
                            className="form-control"
                            placeholder="Titlu task"
                            value={form.title || ""}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Tip</label>
                        <select
                            className="form-select"
                            value={form.type || ""}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="">Selectează tipul</option>
                            <option value="REPORT">REPORT</option>
                            <option value="DEVELOPMENT">DEVELOPMENT</option>
                            <option value="TESTING">TESTING</option>
                            <option value="DATABASE">DATABASE</option>
                            <option value="DOCUMENTATION">DOCUMENTATION</option>
                            <option value="ANALYSIS">ANALYSIS</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Dificultate (1-5)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Dificultate"
                            value={form.difficulty || ""}
                            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Skills necesare</label>
                        <input
                            className="form-control"
                            placeholder="Skills (separate prin virgulă)"
                            value={form.requiredSkills || ""}
                            onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Durată planificată (min)</label>
                        <input
                            className="form-control"
                            type="number"
                            placeholder="Durată planificată"
                            value={form.plannedDuration || ""}
                            onChange={(e) => setForm({ ...form, plannedDuration: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Durată estimată (min)</label>
                        <input
                            className="form-control"
                            type="number"
                            placeholder="Durată estimată"
                            value={form.predictedDuration || ""}
                            onChange={(e) => setForm({ ...form, predictedDuration: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Deadline</label>
                        <input
                            className="form-control"
                            type="date"
                            placeholder="Deadline"
                            value={form.deadline || ""}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Prioritate (1-5)</label>
                        <input
                            className="form-control"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Prioritate"
                            value={form.priority || ""}
                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Venit ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            placeholder="Venit"
                            value={form.revenue || ""}
                            onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Alte costuri ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            placeholder="Alte costuri"
                            value={form.otherCosts || ""}
                            onChange={(e) => setForm({ ...form, otherCosts: e.target.value })}
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={form.status || ""}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="">Selectează statusul</option>
                            <option value="NEW">NEW</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="DONE">DONE</option>
                        </select>
                    </div>
                </div>
                <small className="text-muted mt-2">* Completează doar câmpurile pe care vrei să le modifici</small>
            </Modal>
            <Modal
                open={modal === "CALCULATE_PAYROLL"}
                title="Calculate Employee Payroll"
                onClose={close}
                onSubmit={submitCalculatePayroll}
                submitLabel="Calculate"
            >
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label">Employee ID*</label>
                        <input
                            className="form-control"
                            placeholder="Employee ID"
                            value={form.employeeId || ""}
                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Month*</label>
                        <select
                            className="form-select"
                            value={form.month || ""}
                            onChange={(e) => setForm({ ...form, month: e.target.value })}
                            required
                        >
                            <option value="">Select Month</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Year*</label>
                        <input
                            className="form-control"
                            placeholder="Year"
                            value={form.year || ""}
                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Bonuses ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Bonuses"
                            value={form.bonuses || ""}
                            onChange={(e) => setForm({ ...form, bonuses: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Deductions ($)</label>
                        <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Deductions"
                            value={form.deductions || ""}
                            onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                        />
                    </div>
                </div>
                <small className="text-muted mt-2">
                    * Câmpurile obligatorii. Salariul de bază va fi calculat automat pe baza ratei orare și orelor lucrate.
                </small>
            </Modal>
        </div>
    );
}