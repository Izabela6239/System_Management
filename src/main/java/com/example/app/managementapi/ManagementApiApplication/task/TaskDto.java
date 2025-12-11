package com.example.app.managementapi.ManagementApiApplication.task;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TaskDto {
    private Long id;
    private String title;
    private String type;
    private Integer difficulty;
    private List<String> requiredSkills;
    private Integer plannedDuration;
    private Integer predictedDuration;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate deadline;
    private Integer priority;
    private Double revenue;
    private Double otherCosts;
    private TaskStatus status;
}