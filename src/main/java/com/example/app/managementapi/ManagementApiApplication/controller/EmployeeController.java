package com.example.app.managementapi.ManagementApiApplication.controller;

import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.entity.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employee")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    // ------------------- CONCEDIU -------------------

    @PostMapping("/{employeeId}/leave")
    public LeaveRequest createLeaveRequest(@PathVariable Long employeeId,
                                           @RequestBody LeaveRequestDTO dto) {
        dto.setEmployeeId(employeeId); // siguranta ca e pentru acest angajat
        return employeeService.createLeaveRequest(dto);
    }

    @GetMapping("/{employeeId}/leave")
    public List<LeaveRequest> getLeaveRequests(@PathVariable Long employeeId) {
        return employeeService.getLeaveRequests(employeeId);
    }

    // ------------------- TASKS -------------------

    // Obține toate task-urile
    @GetMapping("/{employeeId}/tasks")
    public List<Task> getTasks(@PathVariable Long employeeId) {
        return employeeService.getAllTasks(employeeId);
    }

    // Actualizează un task după ID
    @PutMapping("/tasks/{taskId}")
    public Task updateTask(@PathVariable Long taskId,
                           @RequestParam(required = false) TaskStatus status,
                           @RequestParam(required = false) Integer plannedDurationMin) {
        return employeeService.updateTask(taskId, status, plannedDurationMin);
    }
}
