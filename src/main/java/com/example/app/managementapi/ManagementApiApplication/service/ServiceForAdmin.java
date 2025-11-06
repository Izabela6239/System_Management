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

        if (!employee.getActive()) {
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

        return taskRepository.save(task);
    }

    public List<Task> getTasksByAdmin(Long adminId) {
        return taskRepository.findByAdminId(adminId);
    }

    public List<Task> getUnassignedTasks() {
        return taskRepository.findByAdminIsNull();
    }
}