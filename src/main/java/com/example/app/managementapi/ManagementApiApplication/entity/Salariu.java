package com.example.app.managementapi.ManagementApiApplication.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "salarii")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Salariu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private String luna;
    private Double suma;
    private Double bonus;
}
