package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveStatus;
import com.example.app.managementapi.ManagementApiApplication.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;

    public LeaveRequestService(LeaveRequestRepository leaveRequestRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
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
