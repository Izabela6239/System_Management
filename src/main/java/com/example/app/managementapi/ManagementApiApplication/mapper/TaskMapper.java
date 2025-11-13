package com.example.app.managementapi.ManagementApiApplication.mapper;

import com.example.app.managementapi.ManagementApiApplication.dto.TaskDto;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;

public class TaskMapper {

    public static TaskDto toDto(Task t) {
        if(t == null) return null;

        TaskDto dto = new TaskDto();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setStatus(t.getStatus() != null ? t.getStatus().name() : null);
        dto.setPriority(t.getPriority());
        dto.setDeadline(t.getDeadline() != null ? t.getDeadline().toString() : null);
        dto.setDifficulty(t.getDifficulty());
        dto.setRevenue(t.getRevenue());
        dto.setOtherCosts(t.getOtherCosts());
        return dto;
    }
}

