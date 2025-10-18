package com.example.app.managementapi.ManagementApiApplication.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "leave_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
//ca sa poti sa faci leave request trebuie sa creezi si niste angajati
public class LeaveRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    @JsonBackReference
    private Employee employee;

    /*@ManyToOne
    @JoinColumn(name = "admin_id") // <-- adăugat
    private Admin admin;*/

    private java.time.LocalDate fromDate;
    private java.time.LocalDate toDate;
    private String reason;

    @Enumerated(EnumType.STRING)
    private LeaveStatus status = LeaveStatus.PENDING;

    private String adminComment;
}
