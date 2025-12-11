package com.example.app.managementapi.ManagementApiApplication.payroll;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.task.Assignment;
import com.example.app.managementapi.ManagementApiApplication.task.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final AssignmentRepository assignmentRepository;

    public Payroll generatePayroll(Long employeeId, int year, int month,
                                   Double bonuses, Double deductions) {

        List<Assignment> assignments =
                assignmentRepository.findByEmployeeIdAndFinishedAtYearMonth(employeeId, month, year);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Calculează salariul de bază doar pentru assignment-urile valide
        double baseSalary = assignments.stream()
                .filter(a -> a.getActualDurationMin() != null && a.getTask() != null)
                .mapToDouble(a -> {
                    double hours = a.getActualDurationMin() / 60.0;
                    int difficulty = a.getTask().getDifficulty();
                    double coef = 20.0; // coeficient standard
                    return hours * difficulty * coef;
                })
                .sum();

        if (baseSalary == 0) {
            baseSalary = 4000.0;
        }

        if (bonuses == null) bonuses = 0.0;
        if (deductions == null) deductions = 0.0;

        Double netSalary = baseSalary + bonuses - deductions;

        Payroll p = new Payroll();
        p.setEmployee(employee);
        p.setYear(year);
        p.setMonth(month);
        p.setBaseSalary(baseSalary);
        p.setBonuses(bonuses);
        p.setDeductions(deductions);
        p.setNetSalary(netSalary);
        p.setCreatedAt(LocalDateTime.now());

        return payrollRepository.save(p);
    }


    public List<Payroll> getPayrollHistory() {
        return payrollRepository.findAllByOrderByCreatedAtDesc();
    }

}