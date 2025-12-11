package com.example.app.managementapi.ManagementApiApplication.report;

import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.task.Assignment;
import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import com.example.app.managementapi.ManagementApiApplication.task.AssignmentRepository;
import com.example.app.managementapi.ManagementApiApplication.task.Task;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonthlyReportService {

    private final AssignmentRepository assignmentRepository;
    private final MonthlyReportRepository reportRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public MonthlyReport generateMonthlyReport(Long employeeId, int year, int month) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

            LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0, 0);
            LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);

            List<Assignment> completedAssignments = assignmentRepository
                    .findByEmployeeIdAndFinishedAtBetween(employeeId, startOfMonth, endOfMonth);

            System.out.println("🔍 Employee ID: " + employeeId);
            System.out.println("📅 Report period: " + year + "-" + month);
            System.out.println("✅ Found " + completedAssignments.size() + " completed assignments");

            MonthlyReport report = new MonthlyReport();
            report.setEmployee(employee);
            report.setYear(year);
            report.setMonth(month);

            if (!completedAssignments.isEmpty()) {
                List<Task> completedTasks = completedAssignments.stream()
                        .map(Assignment::getTask)
                        .toList();

                int totalTasks = completedTasks.size();
                double totalRevenue = completedTasks.stream()
                        .mapToDouble(task -> task.getRevenue() != null ? task.getRevenue().doubleValue() : 0.0)
                        .sum();
                double totalCosts = completedTasks.stream()
                        .mapToDouble(task -> task.getOtherCosts() != null ? task.getOtherCosts().doubleValue() : 0.0)
                        .sum();
                double avgGrade = completedAssignments.stream()
                        .filter(a -> a.getAdminGrade() != null)
                        .mapToInt(Assignment::getAdminGrade)
                        .average()
                        .orElse(0.0);
                double productivityScore = calculateProductivity(completedTasks);

                report.setTotalTasks(totalTasks);
                report.setAvgGrade(avgGrade);
                report.setTotalRevenue(totalRevenue);
                report.setTotalCosts(totalCosts);
                report.setProductivityScore(productivityScore);
            } else {

                report.setTotalTasks(0);
                report.setAvgGrade(0.0);
                report.setTotalRevenue(0.0);
                report.setTotalCosts(0.0);
                report.setProductivityScore(0.0);
            }

            MonthlyReport savedReport = reportRepository.save(report);

            System.out.println("📊 RAPORT GENERAT:");
            System.out.println("   - ID Employee: " + savedReport.getEmployee().getId());
            System.out.println("   - Nume Employee: " + savedReport.getEmployee().getName());
            System.out.println("   - Perioada raport: " + savedReport.getYear() + "-" + savedReport.getMonth());
            System.out.println("   - Total task-uri: " + savedReport.getTotalTasks());
            System.out.println("   - Data generare: " + LocalDateTime.now());

            return savedReport;

        } catch (Exception e) {
            System.err.println("❌ Error generating monthly report: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate monthly report: " + e.getMessage());
        }
    }



    private double calculateProductivity(List<Task> completedTasks) {
        if (completedTasks.isEmpty()) return 0.0;

        double difficultyFactor = completedTasks.stream()
                .mapToInt(task -> task.getDifficulty() != null ? task.getDifficulty() : 1)
                .average()
                .orElse(1.0);

        double priorityFactor = completedTasks.stream()
                .mapToInt(task -> task.getPriority() != null ? task.getPriority() : 1)
                .average()
                .orElse(1.0);

        double totalRevenue = completedTasks.stream()
                .mapToDouble(task -> task.getRevenue() != null ? task.getRevenue().doubleValue() : 0.0)
                .sum();

        double totalCosts = completedTasks.stream()
                .mapToDouble(task -> task.getOtherCosts() != null ? task.getOtherCosts().doubleValue() : 0.0)
                .sum();

        double netProfit = totalRevenue - totalCosts;
        double profitability = totalRevenue > 0 ? netProfit / totalRevenue : 0.0;

        double baseScore = completedTasks.size() * difficultyFactor * priorityFactor;
        double productivity = baseScore * (1 + profitability) / 10.0;

        return Math.round(productivity * 100.0) / 100.0;
    }
}