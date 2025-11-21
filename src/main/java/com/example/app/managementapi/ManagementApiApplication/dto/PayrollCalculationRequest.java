package com.example.app.managementapi.ManagementApiApplication.dto;

import lombok.Data;

@Data
public class PayrollCalculationRequest {
    private Long employeeId;
    private int month;
    private int year;
    private Double bonuses;
    private Double deductions;
}

