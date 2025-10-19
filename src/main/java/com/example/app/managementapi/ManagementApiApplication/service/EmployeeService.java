package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.entity.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.mapper.LeaveRequestMapper;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.LeaveRequestRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private LeaveRequestMapper leaveRequestMapper;

    // ------------------- CONCEDIU -------------------

    public LeaveRequest createLeaveRequest(LeaveRequestDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // La creare, adminul este nul
        LeaveRequest leaveRequest = leaveRequestMapper.toEntity(dto, employee, null);
        return leaveRequestRepository.save(leaveRequest);
    }

    public List<LeaveRequest> getLeaveRequests(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return leaveRequestRepository.findByEmployee(employee);
    }

    // ------------------- TASKS -------------------

    // Obține toate task-urile (fără legătură cu employee)
    public List<Task> getAllTasks(Long employeeId) {
        // optional, poți verifica dacă employee există
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return taskRepository.findAll(); // toate task-urile sunt vizibile
    }


    // Obține un task după ID
    public Task getTaskById(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task nu exista cu id-ul: " + taskId));
    }

    // Actualizare status și durata unui task (orice angajat poate face update)
    public Task updateTask(Long taskId, TaskStatus status, Integer plannedDurationMin) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task nu exista cu id-ul: " + taskId));

        if (status != null) task.setStatus(status);
        if (plannedDurationMin != null) task.setPlannedDurationMin(plannedDurationMin);

        return taskRepository.save(task);
    }
}
