package com.example.app.managementapi.ManagementApiApplication.leave_request;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import lombok.RequiredArgsConstructor;
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
        employee.setId(employeeId);
        List<LeaveRequest> requests = leaveRequestService.getLeaveRequestsForEmployee(employee);
        return ResponseEntity.ok(requests);
    }


    @GetMapping("/all")
    public ResponseEntity<List<LeaveRequest>> getAllLeaveRequests() {
        return ResponseEntity.ok(leaveRequestService.getAllLeaveRequests());
    }


    @PatchMapping("/leave/{id}")
    public ResponseEntity<LeaveRequest> updateLeaveRequest(
            @PathVariable Long id,
            @RequestBody LeaveRequest leaveRequest) {

        LeaveRequest updated = leaveRequestService.updateLeaveRequest(id, leaveRequest);
        return ResponseEntity.ok(updated);
    }
}
