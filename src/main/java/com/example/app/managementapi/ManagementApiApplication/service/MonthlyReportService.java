package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.entity.Assignment;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.MonthlyReport;
import com.example.app.managementapi.ManagementApiApplication.repository.AssignmentRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.MonthlyReportRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonthlyReportService {

    private final EmployeeRepository employeeRepository;
    private final AssignmentRepository assignmentRepository;
    private final MonthlyReportRepository reportRepository;

    @Transactional
    public MonthlyReport generateMonthlyReport(Long employeeId, YearMonth month) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<Assignment> completedAssignments = assignmentRepository
                .findByEmployeeIdAndFinishedAtYearMonth(employeeId, month.getMonthValue());

        int totalTasks = completedAssignments.size();
        double avgGrade = completedAssignments.stream()
                .filter(a -> a.getAdminGrade() != null)
                .mapToInt(Assignment::getAdminGrade)
                .average()
                .orElse(0.0);

        double totalRevenue = completedAssignments.stream()
                .mapToDouble(a -> a.getTask().getRevenue())
                .sum();

        double totalCosts = completedAssignments.stream().mapToDouble(a ->
                (a.getActualDurationMin() / 60.0) * employee.getHourlyRate() +
                        a.getTask().getOtherCosts()
        ).sum();

        double productivityScore = totalTasks == 0 ? 0 : (totalRevenue - totalCosts) / totalTasks;

        MonthlyReport report = new MonthlyReport();
        report.setEmployee(employee);
        report.setMonth(month);
        report.setTotalTasks(totalTasks);
        report.setAvgGrade(avgGrade);
        report.setTotalRevenue(totalRevenue);
        report.setTotalCosts(totalCosts);
        report.setProductivityScore(productivityScore);

        return reportRepository.save(report);
    }
}

