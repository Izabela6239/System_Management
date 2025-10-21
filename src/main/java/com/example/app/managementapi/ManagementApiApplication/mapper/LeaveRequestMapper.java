package com.example.app.managementapi.ManagementApiApplication.mapper;

import com.example.app.managementapi.ManagementApiApplication.dto.LeaveRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.entity.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class LeaveRequestMapper {

    public LeaveRequest toEntity(LeaveRequestDTO dto, Employee employee, Admin admin) {
        if (dto == null) throw new IllegalArgumentException("LeaveRequestDTO is null");
        if (employee == null) throw new IllegalArgumentException("Employee is required");

        LocalDate from = dto.getFromDate();
        LocalDate to   = dto.getToDate();
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("fromDate must be <= toDate");
        }

        LeaveRequest lr = new LeaveRequest();
        lr.setEmployee(employee);
        lr.setAdmin(admin); // poate fi null la creare
        lr.setFromDate(from);
        lr.setToDate(to);
        lr.setReason(clean(dto.getReason()));
        lr.setStatus(dto.getStatus() != null ? dto.getStatus() : LeaveStatus.PENDING);
        lr.setAdminComment(clean(dto.getAdminComment()));
        return lr;
    }

    public LeaveRequestDTO toDto(LeaveRequest lr) {
        if (lr == null) return null;
        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setEmployeeId(lr.getEmployee() != null ? lr.getEmployee().getId() : null);
        dto.setAdminId(lr.getAdmin() != null ? lr.getAdmin().getId() : null);
        dto.setFromDate(lr.getFromDate());
        dto.setToDate(lr.getToDate());
        dto.setReason(lr.getReason());
        dto.setStatus(lr.getStatus());
        dto.setAdminComment(lr.getAdminComment());
        return dto;
    }

    private String clean(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
        // (dacă vrei să păstrezi string gol în loc de null, întoarce "" în loc de null)
    }
}
