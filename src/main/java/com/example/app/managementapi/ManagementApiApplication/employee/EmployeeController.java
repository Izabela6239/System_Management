package com.example.app.managementapi.ManagementApiApplication.employee;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.auth.UserRepository;
import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.task.Task;
import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveStatus;
import com.example.app.managementapi.ManagementApiApplication.task.TaskStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employee")
@PreAuthorize("hasRole('EMPLOYEE')")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final UserRepository userRepository;


    @PostMapping("/leave")
    public LeaveRequest createLeaveRequest(@RequestBody LeaveRequestDTO dto,
                                           Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        dto.setEmployeeId(user.getEmployeeId());

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


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.getLeaveRequests(user.getEmployeeId());
    }

    @GetMapping("/leave/pending")
    public List<LeaveRequest> getPendingLeaveRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.getPendingLeaveRequests(user.getEmployeeId());
    }

    @GetMapping("/leave/approved")
    public List<LeaveRequest> getApprovedLeaveRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.getApprovedLeaveRequests(user.getEmployeeId());
    }

    @GetMapping("/leave/rejected")
    public List<LeaveRequest> getRejectedLeaveRequests(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.getRejectedLeaveRequests(user.getEmployeeId());
    }


    @GetMapping("/tasks")
    public List<Task> getTasks(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.getAllTasks(user.getEmployeeId());
    }

    @GetMapping("/tasks/in-progress")
    public List<Task> getTasksInProgress(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.getTasksInProgress(user.getEmployeeId());
    }

    @GetMapping("/tasks/completed")
    public List<Task> getCompletedTasks(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.getCompletedTasks(user.getEmployeeId());
    }

    @PutMapping("/tasks/{taskId}")
    public Task updateTask(@PathVariable Long taskId,
                           @RequestBody Map<String, Object> updates, // Schimbă aici
                           Authentication authentication) {

        System.out.println("=== DEBUG UPDATE TASK ===");
        System.out.println("Task ID: " + taskId);
        System.out.println("Request Body: " + updates);

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        Long employeeId = user.getEmployeeId();

        if (!employeeService.isTaskAssignedToEmployee(taskId, employeeId)) {
            throw new RuntimeException("You can only update your own tasks");
        }

        TaskStatus status = null;
        Integer plannedDurationMin = null;

        if (updates.containsKey("status")) {
            String statusStr = (String) updates.get("status");
            try {
                status = TaskStatus.valueOf(statusStr);
                System.out.println("Extracted status: " + status);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + statusStr);
            }
        }

        if (updates.containsKey("plannedDurationMin")) {
            plannedDurationMin = (Integer) updates.get("plannedDurationMin");
            System.out.println("Extracted plannedDurationMin: " + plannedDurationMin);
        }

        return employeeService.updateTask(taskId, status, plannedDurationMin);
    }

    @PostMapping("/task/accept")
    public Task acceptTask(@RequestParam Long taskId, Authentication authentication) throws JsonProcessingException {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.acceptTask(taskId, user.getEmployeeId());
    }

    @PostMapping("/task/reject")
    public Task rejectTask(@RequestParam Long taskId, Authentication authentication) throws JsonProcessingException {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.rejectTask(taskId, user.getEmployeeId());
    }

    @PostMapping("/task/cancel")
    public Task cancelTask(@RequestParam Long taskId, Authentication authentication) throws JsonProcessingException {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.cancelTask(taskId, user.getEmployeeId());
    }


    @PostMapping("/task/propose-change")
    public Task proposeTaskChange(@RequestParam Long taskId,
                                  @RequestParam String newDate,  // Doar data, fără oră
                                  Authentication authentication) {

        System.out.println("=== DEBUG PROPOSE CHANGE ===");
        System.out.println("Task ID: " + taskId);
        System.out.println("New Date: " + newDate);

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        try {
            LocalDate newDeadline = LocalDate.parse(newDate);

            System.out.println("Parsed deadline: " + newDeadline);

            return employeeService.proposeTaskChange(taskId, user.getEmployeeId(), newDeadline);
        } catch (Exception e) {
            System.out.println("❌ Error parsing date: " + e.getMessage());
            throw new RuntimeException("Invalid date format. Use YYYY-MM-DD: " + e.getMessage());
        }
    }

    @PostMapping("/task/mark-done")
    public Task markTaskAsDone(@RequestParam Long taskId, Authentication authentication) throws JsonProcessingException {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmployeeId() == null) {
            throw new RuntimeException("User is not associated with any employee");
        }

        return employeeService.markTaskAsDone(taskId, user.getEmployeeId());
    }


}