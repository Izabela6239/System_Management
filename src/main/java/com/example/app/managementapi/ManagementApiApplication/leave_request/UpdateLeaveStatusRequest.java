package com.example.app.managementapi.ManagementApiApplication.leave_request;

import lombok.Data;

@Data
public class UpdateLeaveStatusRequest {
    private LeaveStatus status;
    private String adminComment;

}

