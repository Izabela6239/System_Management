package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.Assignment;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.repository.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.AssignmentRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceForAdmin {

    private final AssignmentRepository assignmentRepository;
    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final AdminRepository adminRepository;

    public Assignment assignTaskToEmployee(Long taskId, Long employeeId, Long adminId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (task.getAdmin() == null) {
            throw new RuntimeException("Task is not assigned to any admin. Please assign task to an admin first.");
        }
        if (!task.getAdmin().getId().equals(adminId)) {
            throw new RuntimeException("You can only assign tasks that you created");
        }
        if (assignmentRepository.existsByTaskIdAndEmployeeId(taskId, employeeId)) {
            throw new RuntimeException("Task is already assigned to this employee");
        }
        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new RuntimeException("Cannot assign task to inactive employee");
        }

        Assignment assignment = new Assignment();
        assignment.setTask(task);
        assignment.setEmployee(employee);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setValid(true);

        task.setStatus(TaskStatus.ASSIGNED);
        taskRepository.save(task);
        return assignmentRepository.save(assignment);
    }

    public void unassignTask(Long taskId, Long employeeId, Long adminId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (task.getAdmin() == null) {
            throw new RuntimeException("Task is not assigned to any admin");
        }
        if (!task.getAdmin().getId().equals(adminId)) {
            throw new RuntimeException("You can only unassign tasks that you created");
        }

        Assignment assignment = assignmentRepository.findByTaskIdAndEmployeeId(taskId, employeeId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        assignmentRepository.delete(assignment);

        if (!assignmentRepository.existsByTaskId(taskId)) {
            task.setStatus(TaskStatus.NEW);
            taskRepository.save(task);
        }
    }

    public List<Assignment> getAssignmentsByEmployee(Long employeeId) {
        return assignmentRepository.findByEmployeeId(employeeId);
    }

    public List<Assignment> getAssignmentsByTask(Long taskId) {
        return assignmentRepository.findByTaskId(taskId);
    }

    public List<Assignment> getAssignmentsByAdmin(Long adminId) {
        if (!adminRepository.existsById(adminId)) {
            throw new RuntimeException("Admin not found");
        }
        return assignmentRepository.findByAdminId(adminId);
    }

    public Task assignTaskToAdmin(Long taskId, Long adminId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + taskId));
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));
        task.setAdmin(admin);
        task.setStatus(TaskStatus.ASSIGNED);
        return taskRepository.save(task);
    }

    public List<Task> getTasksByAdmin(Long adminId) {
        return taskRepository.findByAdminId(adminId);
    }

    public List<Task> getUnassignedTasks(Long adminId) {
        return taskRepository.findByAdminIdAndStatus(adminId, TaskStatus.NEW);
    }


    /* =======================
       NOU: management task
       ======================= */

    public Task setPresetDuration(Long taskId, int minutes) {
        if (minutes < 0) throw new IllegalArgumentException("minutes must be >= 0");
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        // === VARIANTA A (câmp în Task) ===
        try {
            t.getClass().getMethod("setPlannedDurationMin", Integer.class); // sanity check reflectiv
            t.getClass().getMethod("getPlannedDurationMin");                // (nu aruncă)
            // @ts-ignore în Java 😀 – doar setăm
            t.setPlannedDurationMin(minutes);
            return taskRepository.save(t);
        } catch (NoSuchMethodException ignore) {
            // === VARIANTA B (nu ai câmp în Task) ===
            // Nu salvăm durata planificată pe Task; doar întoarcem obiectul pentru compatibilitate
            return t;
        }
    }

    /** Setează dificultatea task-ului (1..5). */
    public Task setDifficulty(Long taskId, int level) {
        if (level < 1 || level > 5) throw new IllegalArgumentException("difficulty must be 1..5");
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        // ai deja findByDifficulty în repo → câmpul există în Task
        t.setDifficulty(level);
        return taskRepository.save(t);
    }

    /**
     * Marchează task-ul ca finalizat.
     * A. Dacă ai câmpuri pe Task: setează actualMinutes/grade/profit + COMPLETED + completedAt.
     * B. Dacă NU ai câmpurile, marchează Assignment-urile ca finisate (finishedAt) și setează doar status pe Task.
     */
    public Task finalizeTask(Long taskId, int actualMinutes, Integer grade, Double profit) {
        if (actualMinutes < 0)
            throw new IllegalArgumentException("actualMinutes must be >= 0");

        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        // actualMinutes -> îl poți salva în predicted_duration_min (sau poți adăuga un câmp nou dacă vrei separat)
        t.setPredictedDurationMin(actualMinutes);

        // profit -> îl poți considera echivalent cu revenue - other_costs
        if (profit != null) {
            t.setRevenue(profit); // poți interpreta revenue ca profit total
        }

        // grade -> momentan nu ai un câmp, dar poți să o ignori sau să o loghezi
        if (grade != null) {
            System.out.println("Grade for task " + taskId + ": " + grade);
        }

        // marchează toate Assignment-urile ca finalizate (finishedAt)
        var assignments = assignmentRepository.findByTaskId(taskId);
        var now = java.time.LocalDateTime.now();
        for (var a : assignments) {
            if (a.getFinishedAt() == null) {
                a.setFinishedAt(now);
            }
        }
        assignmentRepository.saveAll(assignments);

        // actualizează statusul task-ului
        t.setStatus(TaskStatus.DONE);
        return taskRepository.save(t);
    }
}
