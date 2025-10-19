package com.example.app.managementapi.ManagementApiApplication.mapper;

import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import org.springframework.stereotype.Component;

@Component
public class LeaveRequestMapper {

    public LeaveRequest toEntity(LeaveRequestDTO dto, Employee employee, Admin admin) {
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setAdmin(admin);
        leaveRequest.setFromDate(dto.getFromDate());
        leaveRequest.setToDate(dto.getToDate());
        leaveRequest.setReason(dto.getReason());
        leaveRequest.setStatus(dto.getStatus());
        leaveRequest.setAdminComment(dto.getAdminComment());
        return leaveRequest;
    }
}
