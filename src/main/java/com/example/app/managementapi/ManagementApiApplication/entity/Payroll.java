package com.example.app.managementapi.ManagementApiApplication.entity;

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

    // Relația corectă
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private Admin admin;

    private int month;
    private int year;

    @Column(name = "base_salary")
    private Double baseSalary;

    private Double bonuses = 0.0;
    private Double deductions = 0.0;

    @Column(nullable = false)
    private Double netSalary;

    private LocalDateTime createdAt;
}
