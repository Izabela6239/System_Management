package com.example.app.managementapi.ManagementApiApplication.mapper;

import com.example.app.managementapi.ManagementApiApplication.dto.TaskDto;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;

public class TaskMapper {

    public static TaskDto toDto(Task task) {
        if (task == null) {
            return null;
        }

        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setType(task.getType()); // ✅ Adaugă acest câmp
        dto.setDifficulty(task.getDifficulty());
        dto.setRequiredSkills(task.getRequiredSkillsJson()); // sau parsează JSON dacă e necesar
        dto.setPlannedDuration(task.getPlannedDurationMin());
        dto.setPredictedDuration(task.getPredictedDurationMin()); // ✅ Adaugă
        dto.setDeadline(task.getDeadline());
        dto.setPriority(task.getPriority());
        dto.setRevenue(task.getRevenue());
        dto.setOtherCosts(task.getOtherCosts());
        dto.setStatus(TaskStatus.valueOf(task.getStatus() != null ? task.getStatus().name() : "NEW"));

        return dto;
    }
}

