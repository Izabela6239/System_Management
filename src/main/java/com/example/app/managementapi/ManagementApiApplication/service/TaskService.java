package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import com.example.app.managementapi.ManagementApiApplication.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // Preluare toate task-urile
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    // Preluare task-uri după status
    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatus(status);
    }

    // Preluare task-uri după tip
    public List<Task> getTasksByType(String type) {
        return taskRepository.findByType(type);
    }

    // Preluare task după id
    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task nu exista cu id-ul: " + id));
    }

    // Creare task nou
    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    // Actualizare status și durata estimată
    public Task updateTask(Long id, TaskStatus status, Integer plannedDurationMin) {
        Task task = getTaskById(id);
        if (status != null) task.setStatus(status);
        if (plannedDurationMin != null) task.setPlannedDurationMin(plannedDurationMin);
        return taskRepository.save(task);
    }

    // Ștergere task
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
