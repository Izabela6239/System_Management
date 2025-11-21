package com.example.app.managementapi.ManagementApiApplication.dto;

import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TaskDto {
    private Long id;
    private String title;
    private String type; // ✅
    private Integer difficulty;
    private String requiredSkills; // sau String/List
    private Integer plannedDuration;
    private Integer predictedDuration; // ✅
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate deadline;
    private Integer priority;
    private Double revenue;
    private Double otherCosts;
    private TaskStatus status;
}
