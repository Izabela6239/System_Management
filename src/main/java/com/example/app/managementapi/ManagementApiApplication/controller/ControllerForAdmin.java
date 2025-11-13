package com.example.app.managementapi.ManagementApiApplication.controller;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.dto.TaskDto;
import com.example.app.managementapi.ManagementApiApplication.mapper.TaskMapper;
import com.example.app.managementapi.ManagementApiApplication.entity.Assignment;
import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.MonthlyReport;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.repository.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.UserRepository;
import com.example.app.managementapi.ManagementApiApplication.service.EmployeeService;
import com.example.app.managementapi.ManagementApiApplication.service.MonthlyReportService;
import com.example.app.managementapi.ManagementApiApplication.service.ServiceForAdmin;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Year;
import java.time.YearMonth;
import java.util.List;

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

    @PostMapping("/reports/generate")
    public MonthlyReport generateReport(@RequestParam Long employeeId,
                                        @RequestParam int year,
                                        @RequestParam int month) {
        return reportService.generateMonthlyReport(employeeId, YearMonth.of(year, month));
    }

    @GetMapping("/employee")
    public List<User> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @PostMapping("/employee")
    public User createEmployee(@RequestBody User employee) {
        return employeeService.createEmployee(employee);
    }

    //nu poti pune id la employee user decat daca l faci in employee prima data, rezolvam dupa
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
    public List<TaskDto> getUnassignedTasks() {
        return assignmentService.getUnassignedTasks()
                .stream().map(TaskMapper::toDto).toList();
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

    // ===== TASK MGMT =====
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
    }

    @PostMapping(value = "/employee/import-xml", consumes = {"multipart/form-data"})
    public List<User> importEmployeesXml(@RequestPart("file") MultipartFile file) {
        return employeeService.importEmployeesXml(file);
    }
}