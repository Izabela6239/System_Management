package com.example.app.managementapi.ManagementApiApplication.controller;

import com.example.app.managementapi.ManagementApiApplication.entity.Payroll;
import com.example.app.managementapi.ManagementApiApplication.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @PostMapping("/generate")
    public Payroll generatePayroll(
            @RequestParam Long employeeId,
            @RequestParam Long adminId,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Double bonuses,
            @RequestParam(required = false) Double deductions
    ) {
        return payrollService.generatePayroll(
                employeeId, adminId, year, month, bonuses, deductions
        );
    }
}
