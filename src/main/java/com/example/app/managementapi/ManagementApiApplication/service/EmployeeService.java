package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.enums.UserRole;
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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;


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

    public List<Task> getAllTasks(Long employeeId) {
        return taskRepository.findTasksByEmployeeId(employeeId);
    }


    public List<Task> getTasksByStatus(Long employeeId, TaskStatus status) {
        return taskRepository.findTasksByEmployeeIdAndStatus(employeeId, status);
    }

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

    public boolean isTaskAssignedToEmployee(Long taskId, Long employeeId) {
        return taskRepository.isTaskAssignedToEmployee(taskId, employeeId);
    }

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

    public List<User> getAllEmployees() {
        return userRepository.findAll()
                .stream()
                .filter(User::isEmployee) // luam doar userii care sunt employee
                .toList();
    }

    public User createEmployee(User employee) {
        employee.setRole(UserRole.EMPLOYEE);
        employee.setActive(true);
        employee.setPassword(passwordEncoder.encode(employee.getPassword()));
        return userRepository.save(employee);
    }

    public User updateEmployee(Long id, User updated) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        existing.setUsername(updated.getUsername());
        existing.setActive(updated.getActive());

        if (updated.getPassword() != null && !updated.getPassword().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(updated.getPassword()));
        }

        return userRepository.save(existing);
    }

    public void deleteEmployee(Long id) {
        userRepository.deleteById(id);
    }
}