package com.example.app.managementapi.ManagementApiApplication.ai;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import com.example.app.managementapi.ManagementApiApplication.task.Task;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_task_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiTaskHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private Integer plannedDuration;
    private Integer predictedDuration;
    private Integer actualDuration;
    private Integer grade;
    private Integer difficulty;
    private String type;
    private Double revenue;
    private Double otherCosts;
    private java.time.LocalDateTime finishedAt;
}
