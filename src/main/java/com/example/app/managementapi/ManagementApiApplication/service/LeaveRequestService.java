package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.enums.LeaveStatus;
import com.example.app.managementapi.ManagementApiApplication.mapper.LeaveRequestMapper;
import com.example.app.managementapi.ManagementApiApplication.repository.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaveRequestService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    //avem autowired pentru ca springboot face injectarea dependentei direct
    //altfekl foloseam private final + constructor
    private LeaveRequestMapper leaveRequestMapper;


    public LeaveRequest createLeaveRequest(LeaveRequestDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Admin admin = adminRepository.findById(dto.getAdminId())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        LeaveRequest leaveRequest = leaveRequestMapper.toEntity(dto, employee, admin);

        return leaveRequestRepository.save(leaveRequest);
    }


    // Creează cerere nouă
    public LeaveRequest createLeaveRequest(LeaveRequest leaveRequest) {
        leaveRequest.setStatus(leaveRequest.getStatus() != null ? leaveRequest.getStatus() : LeaveStatus.PENDING);
        return leaveRequestRepository.save(leaveRequest);
    }

    // Obține cererile unui angajat
    public List<LeaveRequest> getLeaveRequestsForEmployee(Employee employee) {
        return leaveRequestRepository.findByEmployee(employee);
    }

    // Obține toate cererile (pentru admin)
    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAll();
    }

    // Actualizează cererea (admin aprobare/respingere)
    public LeaveRequest updateLeaveRequest(LeaveRequest leaveRequest) {
        return leaveRequestRepository.save(leaveRequest);
    }
}
