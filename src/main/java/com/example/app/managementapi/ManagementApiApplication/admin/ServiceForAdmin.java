package com.example.app.managementapi.ManagementApiApplication.admin;

import com.example.app.managementapi.ManagementApiApplication.task.TaskDto;
import com.example.app.managementapi.ManagementApiApplication.task.Assignment;
import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import com.example.app.managementapi.ManagementApiApplication.task.Task;
import com.example.app.managementapi.ManagementApiApplication.task.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.task.AssignmentRepository;
import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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

    public Task setPresetDuration(Long taskId, int minutes) {
        if (minutes < 0) throw new IllegalArgumentException("minutes must be >= 0");
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        try {
            t.getClass().getMethod("setPlannedDurationMin", Integer.class);
            t.getClass().getMethod("getPlannedDurationMin");
            t.setPlannedDurationMin(minutes);
            return taskRepository.save(t);
        } catch (NoSuchMethodException ignore) {
            return t;
        }
    }
    public Task setDifficulty(Long taskId, int level) {
        if (level < 1 || level > 5) throw new IllegalArgumentException("difficulty must be 1..5");
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        t.setDifficulty(level);
        return taskRepository.save(t);
    }

    public Task finalizeTask(Long taskId, int actualMinutes, Integer grade, Double profit) {
        if (actualMinutes < 0)
            throw new IllegalArgumentException("actualMinutes must be >= 0");

        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        t.setPredictedDurationMin(actualMinutes);

        if (profit != null) {
            t.setRevenue(profit);
        }

        if (grade != null) {
            System.out.println("Grade for task " + taskId + ": " + grade);
        }

        var assignments = assignmentRepository.findByTaskId(taskId);
        var now = java.time.LocalDateTime.now();
        for (var a : assignments) {
            if (a.getFinishedAt() == null) {
                a.setFinishedAt(now);
            }
        }
        assignmentRepository.saveAll(assignments);
        t.setStatus(TaskStatus.DONE);
        return taskRepository.save(t);
    }
    public Task updateTask(Long taskId, TaskDto updateRequest) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (updateRequest.getTitle() != null) task.setTitle(updateRequest.getTitle());
        if (updateRequest.getType() != null) task.setType(updateRequest.getType());
        if (updateRequest.getDifficulty() != null) task.setDifficulty(updateRequest.getDifficulty());
        if (updateRequest.getRequiredSkills() != null) task.setRequiredSkills(updateRequest.getRequiredSkills());
        if (updateRequest.getPlannedDuration() != null) task.setPlannedDuration(updateRequest.getPlannedDuration());
        if (updateRequest.getPredictedDuration() != null) task.setPredictedDuration(updateRequest.getPredictedDuration());
        if (updateRequest.getDeadline() != null) task.setDeadline(LocalDate.from(updateRequest.getDeadline()));
        if (updateRequest.getPriority() != null) task.setPriority(updateRequest.getPriority());
        if (updateRequest.getRevenue() != null) task.setRevenue(updateRequest.getRevenue());
        if (updateRequest.getOtherCosts() != null) task.setOtherCosts(updateRequest.getOtherCosts());
        if (updateRequest.getStatus() != null) task.setStatus(updateRequest.getStatus());

        if (updateRequest.getStatus() == TaskStatus.DONE ) {
            List<Assignment> assignments = assignmentRepository.findByTaskId(taskId);

            if (assignments.isEmpty()) {
                throw new RuntimeException("Assignment not found for task");
            }

            Assignment assignment = assignments.get(0);
            assignment.setFinishedAt(LocalDateTime.now());
            assignmentRepository.save(assignment);
        }

        return taskRepository.save(task);
    }
}