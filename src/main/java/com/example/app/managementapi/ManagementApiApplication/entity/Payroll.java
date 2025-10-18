package com.example.app.managementapi.ManagementApiApplication.entity;

import jakarta.persistence.*;
import lombok.*;


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
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private java.time.Year month;
    private Double baseSalary;
    private Double bonuses = 0.0;
    private Double deductions = 0.0;

    @Column(nullable = false)
    private Double netSalary; // calculat la service
}
