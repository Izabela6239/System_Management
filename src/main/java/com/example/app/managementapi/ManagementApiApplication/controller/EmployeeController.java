package com.example.app.managementapi.ManagementApiApplication.controller;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.repository.UserRepository;
import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.LeaveStatus;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import com.example.app.managementapi.ManagementApiApplication.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employee")
@PreAuthorize("hasRole('EMPLOYEE')")
//trebuie sa fac ca task urile sa fie asignate sa pot afisa task uri specifice
//fiecarui angajat in endpoint uri
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final UserRepository userRepository;

    // ------------------- CONCEDIU -------------------

    @PostMapping("/leave")
    public LeaveRequest createLeaveRequest(@RequestBody LeaveRequestDTO dto,
                                           Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        dto.setEmployeeId(employeeId);

        if (dto.getStatus() == null) {
            dto.setStatus(LeaveStatus.PENDING);
        }

        return employeeService.createLeaveRequest(dto);
    }

    @GetMapping("/leave")
    public List<LeaveRequest> getLeaveRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        return employeeService.getLeaveRequests(employeeId);
    }

    @GetMapping("/leave/pending")
    public List<LeaveRequest> getPendingLeaveRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        return employeeService.getPendingLeaveRequests(employeeId);
    }

    @GetMapping("/leave/approved")
    public List<LeaveRequest> getApprovedLeaveRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        return employeeService.getApprovedLeaveRequests(employeeId);
    }

    @GetMapping("/leave/rejected")
    public List<LeaveRequest> getRejectedLeaveRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        return employeeService.getRejectedLeaveRequests(employeeId);
    }

    // ------------------- TASKS -------------------

    @GetMapping("/tasks")
    public List<Task> getTasks(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        return employeeService.getAllTasks(employeeId);
    }

    @GetMapping("/tasks/in-progress")
    public List<Task> getTasksInProgress(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        return employeeService.getTasksInProgress(employeeId);
    }

    @GetMapping("/tasks/completed")
    public List<Task> getCompletedTasks(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());
        return employeeService.getCompletedTasks(employeeId);
    }

    @PutMapping("/tasks/{taskId}")
    public Task updateTask(@PathVariable Long taskId,
                           @RequestParam(required = false) TaskStatus status,
                           @RequestParam(required = false) Integer plannedDurationMin,
                           Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long employeeId = employeeService.getEmployeeIdFromUserId(user.getId());

        // Verifică dacă task-ul este asignat employee-ului
        if (!employeeService.isTaskAssignedToEmployee(taskId, employeeId)) {
            throw new RuntimeException("You can only update your own tasks");
        }

        return employeeService.updateTask(taskId, status, plannedDurationMin);
    }
}