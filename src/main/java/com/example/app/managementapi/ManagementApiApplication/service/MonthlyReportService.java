package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.ai.scoring.ScoringService;
import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.entity.Assignment;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.MonthlyReport;
import com.example.app.managementapi.ManagementApiApplication.enums.UserRole;
import com.example.app.managementapi.ManagementApiApplication.repository.AssignmentRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.MonthlyReportRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonthlyReportService {

    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final MonthlyReportRepository reportRepository;
    private final ScoringService scoringService;


    @Transactional
    public MonthlyReport generateMonthlyReport(Long employeeId, int year, int month) {

        // 1. Găsește employee
        User employee = userRepository.findByIdAndRole(employeeId, UserRole.EMPLOYEE)
                .orElseThrow(() -> new RuntimeException("Employee not found or user is not an employee"));

        // 2. Găsește assignment-urile finalizate în luna dată
        List<Assignment> assignments = assignmentRepository.findAssignmentsForMonthlyReport(
                employeeId, month, year
        );

        int totalTasks = assignments.size();

        double avgGrade = assignments.stream()
                .filter(a -> a.getAdminGrade() != null)
                .mapToInt(Assignment::getAdminGrade)
                .average()
                .orElse(0.0);

        double totalRevenue = assignments.stream()
                .mapToDouble(a -> a.getTask().getRevenue() != null ?
                        a.getTask().getRevenue().doubleValue() : 0)
                .sum();

        // 3. Folosește hourlyRate real
        double hourlyRate = employee.getHourlyRate() != null ? employee.getHourlyRate() : 20;

        double totalCosts = assignments.stream().mapToDouble(a ->
                (a.getActualDurationMin() / 60.0) * hourlyRate +
                        (a.getTask().getOtherCosts() != null ?
                                a.getTask().getOtherCosts().doubleValue() : 0)
        ).sum();

        // 4. Productivity calculată corect
        double productivityScore = assignments.stream()
                .mapToDouble(a -> scoringService.productivityScore(
                        a.getTask().getPlannedDurationMin(),
                        a.getTask().getPredictedDurationMin(),
                        a.getActualDurationMin(),
                        a.getAdminGrade(),
                        a.getTask().getDifficulty()
                ))
                .average()
                .orElse(0.0);

        // 5. Construiește raportul
        MonthlyReport report = new MonthlyReport();
        report.setEmployee(employee);
        report.setYear(year);
        report.setMonth(month);
        report.setTotalTasks(totalTasks);
        report.setAvgGrade(avgGrade);
        report.setTotalRevenue(totalRevenue);
        report.setTotalCosts(totalCosts);
        report.setProductivityScore(productivityScore);

        return reportRepository.save(report);
    }


}