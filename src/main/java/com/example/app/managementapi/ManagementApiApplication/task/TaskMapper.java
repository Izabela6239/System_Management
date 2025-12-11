package com.example.app.managementapi.ManagementApiApplication.task;

public class TaskMapper {

    public static TaskDto toDto(Task task) {
        if (task == null) {
            return null;
        }

        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setType(task.getType());
        dto.setDifficulty(task.getDifficulty());
        dto.setRequiredSkills(task.getRequiredSkillsJson());
        dto.setPlannedDuration(task.getPlannedDurationMin());
        dto.setPredictedDuration(task.getPredictedDurationMin());
        dto.setDeadline(task.getDeadline());
        dto.setPriority(task.getPriority());
        dto.setRevenue(task.getRevenue());
        dto.setOtherCosts(task.getOtherCosts());
        dto.setStatus(TaskStatus.valueOf(task.getStatus() != null ? task.getStatus().name() : "NEW"));

        return dto;
    }
}