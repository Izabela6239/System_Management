package com.example.app.managementapi.ManagementApiApplication.service;

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


    @Transactional
    public MonthlyReport generateMonthlyReport(Long employeeId, int year, int month) {
        try {
            // ✅ Caută user-ul cu rol de employee folosind UserRepository
            User employee = userRepository.findByIdAndRole(employeeId, UserRole.EMPLOYEE)
                    .orElseThrow(() -> new RuntimeException("Employee not found or user is not an employee"));

            List<Assignment> completedAssignments = assignmentRepository
                    .findByEmployeeIdAndFinishedAtYearMonth(employeeId, month, year);

            System.out.println("Found " + completedAssignments.size() + " completed assignments for employee " + employeeId + " in " + month + "/" + year);

            int totalTasks = completedAssignments.size();
            double avgGrade = completedAssignments.stream()
                    .filter(a -> a.getAdminGrade() != null)
                    .mapToInt(Assignment::getAdminGrade)
                    .average()
                    .orElse(0.0);

            double totalRevenue = completedAssignments.stream()
                    .mapToDouble(a -> a.getTask().getRevenue().doubleValue())
                    .sum();

            // ✅ Folosește hourlyRate din User (asigură-te că User entity are acest câmp)
            double totalCosts = completedAssignments.stream().mapToDouble(a ->
                    (a.getActualDurationMin() / 60.0) * 20 +
                            a.getTask().getOtherCosts().doubleValue()
            ).sum();

            double productivityScore = totalTasks == 0 ? 0 : (totalRevenue - totalCosts) / totalTasks;

            MonthlyReport report = new MonthlyReport();
            report.setEmployee(employee);  // ✅ Setează User (care este employee)
            report.setYear(year);
            report.setMonth(month);
            report.setTotalTasks(totalTasks);
            report.setAvgGrade(avgGrade);
            report.setTotalRevenue(totalRevenue);
            report.setTotalCosts(totalCosts);
            report.setProductivityScore(productivityScore);

            return reportRepository.save(report);

        } catch (Exception e) {
            System.err.println("Error generating monthly report: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate monthly report: " + e.getMessage());
        }
    }

}