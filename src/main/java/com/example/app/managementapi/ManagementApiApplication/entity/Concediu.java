package com.example.app.managementapi.ManagementApiApplication.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "concedii")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Concediu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private LocalDate dataStart;
    private LocalDate dataEnd;
    private String status; // CERERE, ACCEPTAT, RESPINS
    private String motiv;
}
