package com.example.app.managementapi.ManagementApiApplication.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String type;
    private Integer difficulty; // 1..5

    @Column(columnDefinition = "JSON")
    private String requiredSkillsJson;

    private Integer plannedDurationMin;
    private Integer predictedDurationMin;
    private java.time.LocalDateTime deadline;
    private Integer priority = 3;
    private Double revenue = 0.0;
    private Double otherCosts = 0.0;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.NEW;

    @OneToMany(mappedBy = "task")
    private List<Assignment> assignments;

    @OneToOne(mappedBy = "task")
    private AiTaskHistory aiHistory;
}


