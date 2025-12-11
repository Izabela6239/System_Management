package com.example.app.managementapi.ManagementApiApplication.admin;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.auth.UserRepository;
import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveRequestService;
import com.example.app.managementapi.ManagementApiApplication.notification.NotificationService;
import com.example.app.managementapi.ManagementApiApplication.notification.NotificationDTO;
import com.example.app.managementapi.ManagementApiApplication.payroll.Payroll;
import com.example.app.managementapi.ManagementApiApplication.payroll.PayrollRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.payroll.PayrollService;
import com.example.app.managementapi.ManagementApiApplication.report.MonthlyReport;
import com.example.app.managementapi.ManagementApiApplication.report.MonthlyReportRepository;
import com.example.app.managementapi.ManagementApiApplication.report.MonthlyReportService;
import com.example.app.managementapi.ManagementApiApplication.task.*;
import com.example.app.managementapi.ManagementApiApplication.leave_request.UpdateLeaveStatusRequest;
import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeService;
import com.example.app.managementapi.ManagementApiApplication.auth.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class    ControllerForAdmin {

    private final ServiceForAdmin assignmentService;
    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final EmployeeService employeeService;
    private final MonthlyReportService reportService;
    private final MonthlyReportRepository monthlyReportRepository;
    private final PayrollService payrollService;
    private final NotificationService notificationService;
    private final TaskService taskService;
    private final LeaveRequestService leaveRequestService;

    @GetMapping("/history")
    public ResponseEntity<List<Payroll>> getPayrollHistory() {
        List<Payroll> history = payrollService.getPayrollHistory();
        return ResponseEntity.ok(history);
    }

    @PostMapping("/payroll/calculate")
    public ResponseEntity<Payroll> calculatePayroll(@RequestBody PayrollRequestDTO request) {
        Payroll payroll = payrollService.generatePayroll(
                request.getEmployeeId(),
               // request.getAdminId(),
                request.getYear(),
                request.getMonth(),
                request.getBonuses(),
                request.getDeductions()
        );

        return ResponseEntity.ok(payroll);
    }

    @PostMapping("/generate")
    public ResponseEntity<MonthlyReport> generateReport(
            @RequestParam Long employeeId,
            @RequestParam int year,
            @RequestParam int month) {

        if (month < 1 || month > 12) {
            return ResponseEntity.badRequest().build();
        }

        try {
            MonthlyReport report = reportService.generateMonthlyReport(employeeId, year, month);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/reports/all")
    public ResponseEntity<List<MonthlyReport>> getAllReports() {
        try {
            List<MonthlyReport> reports = monthlyReportRepository.findAll();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/employee")
    public List<User> getAllEmployees() {
        return userRepository.findByRole(UserRole.EMPLOYEE);
    }

    @PostMapping("/employee")
    public User createEmployee(@RequestBody User employee) {
        return employeeService.createEmployee(employee);
    }

    @PutMapping("/employee/{id}")
    public User updateEmployee(@PathVariable Long id, @RequestBody User employee) {
        return employeeService.updateEmployee(id, employee);
    }

    @DeleteMapping("/employee/{id}")
    public void deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
    }


    @PostMapping("/assign")
    public Assignment assignTask(@RequestParam Long taskId,
                                 @RequestParam Long employeeId,
                                 Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        Admin admin = adminRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Admin not found for user: " + username));

        return assignmentService.assignTaskToEmployee(taskId, employeeId, admin.getId());
    }

    @DeleteMapping("/unassign")
    public void unassignTask(@RequestParam Long taskId,
                             @RequestParam Long employeeId,
                             Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        Admin admin = adminRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Admin not found for user: " + username));

        assignmentService.unassignTask(taskId, employeeId, admin.getId());
    }

    @GetMapping("/employee/{employeeId}")
    public List<Assignment> getEmployeeAssignments(@PathVariable Long employeeId) {
        return assignmentService.getAssignmentsByEmployee(employeeId);
    }

    @GetMapping("/task/{taskId}")
    public List<Assignment> getTaskAssignments(@PathVariable Long taskId) {
        return assignmentService.getAssignmentsByTask(taskId);
    }


    @PostMapping("/assign-task-to-me")
    public TaskDto assignTaskToCurrentAdmin(@RequestParam Long taskId,
                                            Authentication authentication) {

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow();
        Admin admin = adminRepository.findByUserId(user.getId())
                .orElseThrow();

        return TaskMapper.toDto(assignmentService.assignTaskToAdmin(taskId, admin.getId()));
    }


    @GetMapping("/unassigned-tasks")
    public List<TaskDto> getUnassignedTasks(Authentication authentication) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Admin admin = adminRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        return assignmentService.getUnassignedTasks(admin.getId())
                .stream()
                .map(TaskMapper::toDto)
                .toList();
    }


    @GetMapping("/my-tasks")
    public List<TaskDto> getMyTasks(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        Admin admin = adminRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        return assignmentService.getTasksByAdmin(admin.getId())
                .stream().map(TaskMapper::toDto).toList();
    }

    /*// ===== TASK MGMT =====
    @PutMapping("/tasks/{id}/preset-duration")
    public Task setPresetDuration(@PathVariable Long id, @RequestParam int minutes) {
        return assignmentService.setPresetDuration(id, minutes);
    }

    @PutMapping("/tasks/{id}/difficulty")
    public Task setDifficulty(@PathVariable Long id, @RequestParam int level) {
        return assignmentService.setDifficulty(id, level);
    }

    @PutMapping("/tasks/{id}/finalize")
    public Task finalizeTask(@PathVariable Long id,
                             @RequestParam int actualMinutes,
                             @RequestParam(required = false) Integer grade,
                             @RequestParam(required = false) Double profit) {
        return assignmentService.finalizeTask(id, actualMinutes, grade, profit);
    }*/

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long taskId,
            @RequestBody TaskDto updateRequest) {

        try {
            Task updatedTask = assignmentService.updateTask(taskId, updateRequest);
            return ResponseEntity.ok(updatedTask);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping(value = "/employee/import-xml", consumes = {"multipart/form-data"})
    public List<User> importEmployeesXml(@RequestPart("file") MultipartFile file) {
        return employeeService.importEmployeesXml(file);
    }

    @GetMapping("/me")
    public List<NotificationDTO> getMyNotifications(Authentication auth) {
        return notificationService.getNotificationsFor("ADMIN");
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread/count")
    public Map<String, Long> unreadCount() {
        long count = notificationService.countUnread("ADMIN");
        return Map.of("unread", count);
    }

    @PostMapping("/createTask")
    public ResponseEntity<TaskDto> createTask(@RequestBody TaskDto taskDto,
                                              Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));

            Admin admin = adminRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Admin not found for user: " + username));

            System.out.println("📝 Creating task for admin ID: " + admin.getId());

            Task task = convertToEntity(taskDto);

            task.setAdmin(admin);

            if (task.getStatus() == null) {
                task.setStatus(TaskStatus.NEW);
            }

            Task savedTask = taskService.createTask(task);

            TaskDto dto = convertToDto(savedTask);

            return new ResponseEntity<>(dto, HttpStatus.CREATED);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }


    private Task convertToEntity(TaskDto dto) {
        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setType(dto.getType());
        task.setDifficulty(dto.getDifficulty());
        task.setRequiredSkills(dto.getRequiredSkills());
        task.setPlannedDuration(dto.getPlannedDuration());
        task.setPredictedDuration(dto.getPredictedDuration());
        task.setDeadline(dto.getDeadline());
        task.setPriority(dto.getPriority());
        task.setRevenue(dto.getRevenue());
        task.setOtherCosts(dto.getOtherCosts());
        return task;
    }

    private TaskDto convertToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setType(task.getType());
        dto.setDifficulty(task.getDifficulty());
        dto.setRequiredSkills(task.getRequiredSkills());
        dto.setPlannedDuration(task.getPlannedDurationMin());
        dto.setPredictedDuration(task.getPredictedDurationMin());
        dto.setDeadline(task.getDeadline());
        dto.setPriority(task.getPriority());
        dto.setRevenue(task.getRevenue());
        dto.setOtherCosts(task.getOtherCosts());
        dto.setStatus(task.getStatus());
        return dto;
    }
    @GetMapping("/allLeaves")
    public ResponseEntity<List<LeaveRequest>> getAllLeaveRequests() {
        return ResponseEntity.ok(leaveRequestService.getAllLeaveRequests());
    }

    @PatchMapping(value = "/leave/{id}", consumes = "application/json")
    public ResponseEntity<LeaveRequest> updateLeaveRequest(
            @PathVariable Long id,
            @RequestBody UpdateLeaveStatusRequest request) {

        LeaveRequest updated = leaveRequestService.updateStatus(
                id,
                request.getStatus(),
                request.getAdminComment()
        );

        return ResponseEntity.ok(updated);
    }

}