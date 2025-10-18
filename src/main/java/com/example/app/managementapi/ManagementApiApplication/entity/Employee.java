package com.example.app.managementapi.ManagementApiApplication.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "employee")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // ADMIN, EMPLOYEE

    @Column(nullable = false)
    private Double hourlyRate = 0.0;

    @Enumerated(EnumType.STRING)
    private Seniority seniority = Seniority.JUNIOR;

    private Boolean active = true;


    @OneToMany(mappedBy = "employee")
    private List<Assignment> assignments;

    @OneToMany(mappedBy = "employee")
    @JsonManagedReference
    private List<LeaveRequest> leaveRequests;

    @OneToMany(mappedBy = "employee")
    private List<EmployeeSkill> skills;

    @OneToMany(mappedBy = "employee")
    private List<Bonus> bonuses;

    @OneToMany(mappedBy = "employee")
    private List<Payroll> payrolls;

    @OneToMany(mappedBy = "employee")
    private List<Notification> notifications;

    @OneToMany(mappedBy = "employee")
    private List<MonthlyReport> reports;
}



