package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.repository.UserRepository;
import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.LeaveStatus;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.repository.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.LeaveRequestRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    // ------------------- CONCEDIU -------------------

    public LeaveRequest createLeaveRequest(LeaveRequestDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setFromDate(dto.getFromDate());
        leaveRequest.setToDate(dto.getToDate());
        leaveRequest.setReason(dto.getReason());

        if (dto.getAdminId() != null) {
            Admin admin = adminRepository.findById(dto.getAdminId())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));
            leaveRequest.setAdmin(admin);
        }

        if (dto.getStatus() != null) {
            leaveRequest.setStatus(dto.getStatus());
        } else {
            leaveRequest.setStatus(LeaveStatus.PENDING);
        }

        if (dto.getAdminComment() != null) {
            leaveRequest.setAdminComment(dto.getAdminComment());
        }

        return leaveRequestRepository.save(leaveRequest);
    }

    public List<LeaveRequest> getLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    // ------------------- TASKS -------------------

    /**
     * Obține toate task-urile pentru un employee (prin assignments)
     */
    public List<Task> getAllTasks(Long employeeId) {
        return taskRepository.findTasksByEmployeeId(employeeId);
    }

    /**
     * Obține task-urile pentru un employee filtrate după status
     */
    public List<Task> getTasksByStatus(Long employeeId, TaskStatus status) {
        return taskRepository.findTasksByEmployeeIdAndStatus(employeeId, status);
    }

    /**
     * Actualizează un task
     */
    public Task updateTask(Long taskId, TaskStatus status, Integer plannedDurationMin) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (status != null) {
            task.setStatus(status);
        }
        if (plannedDurationMin != null) {
            task.setPlannedDurationMin(plannedDurationMin);
        }

        return taskRepository.save(task);
    }

    /**
     * Verifică dacă un task este asignat unui employee
     */
    public boolean isTaskAssignedToEmployee(Long taskId, Long employeeId) {
        return taskRepository.isTaskAssignedToEmployee(taskId, employeeId);
    }

    /**
     * Obține Employee ID din User ID
     */
    public Long getEmployeeIdFromUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not an employee");
        }

        return user.getEmployeeId();
    }

    public Employee getEmployeeByUserId(Long userId) {
        Long employeeId = getEmployeeIdFromUserId(userId);
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    // ------------------- METODE UTILE -------------------

    public List<Task> getTasksInProgress(Long employeeId) {
        return getTasksByStatus(employeeId, TaskStatus.IN_PROGRESS);
    }

    public List<Task> getCompletedTasks(Long employeeId) {
        return getTasksByStatus(employeeId, TaskStatus.DONE);
    }

    public List<LeaveRequest> getApprovedLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, LeaveStatus.APPROVED);
    }

    public List<LeaveRequest> getPendingLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, LeaveStatus.PENDING);
    }

    public List<LeaveRequest> getRejectedLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, LeaveStatus.REJECTED);
    }
}