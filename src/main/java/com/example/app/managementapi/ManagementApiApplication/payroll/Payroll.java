package com.example.app.managementapi.ManagementApiApplication.payroll;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private int month;
    @Column(name = "pay_year")
    private int year;

    @Column(name = "base_salary")
    private Double baseSalary;

    private Double bonuses = 0.0;
    private Double deductions = 0.0;

    @Column(nullable = false)
    private Double netSalary;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}