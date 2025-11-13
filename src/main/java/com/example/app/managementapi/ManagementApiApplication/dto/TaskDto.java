package com.example.app.managementapi.ManagementApiApplication.dto;

import lombok.Data;

@Data
public class TaskDto {
    private Long id;
    private String title;
    private String status;
    private Integer priority;
    private String deadline;
    private Integer difficulty;
    private Double revenue;
    private Double otherCosts;
}
