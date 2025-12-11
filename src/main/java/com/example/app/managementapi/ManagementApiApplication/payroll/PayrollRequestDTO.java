package com.example.app.managementapi.ManagementApiApplication.payroll;

import lombok.Data;

@Data
public class PayrollRequestDTO {
    private Long employeeId;
    //private Long adminId;
    private int year;
    private int month;
    private Double bonuses;
    private Double deductions;
}
