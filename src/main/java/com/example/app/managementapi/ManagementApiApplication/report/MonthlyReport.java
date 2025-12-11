package com.example.app.managementapi.ManagementApiApplication.report;

import com.example.app.managementapi.ManagementApiApplication.admin.Admin;
import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.YearMonth;

@Entity
@Table(name = "monthly_report")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private Admin admin;

    @Column(name = "year")
    private Integer year;

    @Column(name = "month")
    private Integer month; // 1-12

    private Integer totalTasks = 0;
    private Double avgGrade;
    private Double totalRevenue;
    private Double totalCosts;
    private Double productivityScore;


    public YearMonth getYearMonth() {
        return YearMonth.of(year, month);
    }
}