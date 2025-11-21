package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.entity.*;
import com.example.app.managementapi.ManagementApiApplication.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final AdminRepository adminRepository;
    private final AssignmentRepository assignmentRepository;

    public Payroll generatePayroll(Long employeeId, Long adminId, int year, int month,
                                   Double bonuses, Double deductions) {

        List<Assignment> assignments =
                assignmentRepository.findByEmployeeIdAndFinishedAtYearMonth(employeeId, month, year);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // MODEL 2: Calcul salariu de bază simplu
        double baseSalary = assignments.stream()
                .mapToDouble(a -> {
                    double hours = a.getActualDurationMin() / 60.0;
                    int difficulty = a.getTask().getDifficulty();
                    double coef = 20.0; // coeficientul standard
                    return hours * difficulty * coef;
                })
                .sum();

        if (bonuses == null) bonuses = 0.0;
        if (deductions == null) deductions = 0.0;

        Double netSalary = baseSalary + bonuses - deductions;

        Payroll p = new Payroll();
        p.setEmployee(employee);
        p.setAdmin(admin);
        p.setYear(year);
        p.setMonth(month);
        p.setBaseSalary(baseSalary);
        p.setBonuses(bonuses);
        p.setDeductions(deductions);
        p.setNetSalary(netSalary);
        p.setCreatedAt(LocalDateTime.now());

        return payrollRepository.save(p);
    }

}
