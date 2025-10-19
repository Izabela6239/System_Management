package com.example.app.managementapi.ManagementApiApplication.dto;

import com.example.app.managementapi.ManagementApiApplication.entity.LeaveStatus;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class LeaveRequestDTO {
    private Long employeeId;
    private Long adminId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String reason;
    private LeaveStatus status;
    private String adminComment;
}
