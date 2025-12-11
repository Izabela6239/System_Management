package com.example.app.managementapi.ManagementApiApplication.leave_request;

import com.example.app.managementapi.ManagementApiApplication.admin.Admin;
import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import com.example.app.managementapi.ManagementApiApplication.admin.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final AdminRepository adminRepository;
    private final LeaveRequestMapper leaveRequestMapper;


    public LeaveRequest createLeaveRequest(LeaveRequestDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Admin admin = adminRepository.findById(dto.getAdminId())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        LeaveRequest leaveRequest = leaveRequestMapper.toEntity(dto, employee, admin);

        return leaveRequestRepository.save(leaveRequest);
    }


    public List<LeaveRequest> getLeaveRequestsForEmployee(Employee employee) {
        return leaveRequestRepository.findByEmployee(employee);
    }

    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAll();
    }

    public LeaveRequest updateLeaveRequest(Long id, LeaveRequest newData) {
        LeaveRequest existing = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        existing.setStatus(newData.getStatus());
        existing.setAdminComment(newData.getAdminComment());

        return leaveRequestRepository.save(existing);
    }

    public LeaveRequest updateStatus(Long id, LeaveStatus status, String adminComment) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        leave.setStatus(status);
        leave.setAdminComment(adminComment);

        return leaveRequestRepository.save(leave);
    }


}
