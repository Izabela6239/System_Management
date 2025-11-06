package com.example.app.managementapi.ManagementApiApplication.controller;

import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {


    private final LeaveRequestService leaveRequestService;

    @PostMapping
    public LeaveRequest createLeaveRequest(@RequestBody LeaveRequestDTO dto) {
        return leaveRequestService.createLeaveRequest(dto);
    }


    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsForEmployee(@PathVariable Long employeeId) {
        Employee employee = new Employee();
        employee.setId(employeeId); // presupunem că doar ID-ul e necesar
        List<LeaveRequest> requests = leaveRequestService.getLeaveRequestsForEmployee(employee);
        return ResponseEntity.ok(requests);
    }


    @GetMapping("/all")
    public ResponseEntity<List<LeaveRequest>> getAllLeaveRequests() {
        return ResponseEntity.ok(leaveRequestService.getAllLeaveRequests());
    }


    @PatchMapping("/{id}")
    public ResponseEntity<LeaveRequest> updateLeaveRequest(@PathVariable Long id, @RequestBody LeaveRequest leaveRequest) {
        leaveRequest.setId(id);
        LeaveRequest updated = leaveRequestService.updateLeaveRequest(leaveRequest);
        return ResponseEntity.ok(updated);
    }
}
