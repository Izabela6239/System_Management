package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatus(status);
    }

    public List<Task> getTasksByType(String type) {
        return taskRepository.findByType(type);
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task nu exista cu id-ul: " + id));
    }

    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, TaskStatus status, Integer plannedDurationMin) {
        Task task = getTaskById(id);
        if (status != null) task.setStatus(status);
        if (plannedDurationMin != null) task.setPlannedDurationMin(plannedDurationMin);
        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
