package com.example.app.managementapi.ManagementApiApplication.controller;

import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.entity.TaskStatus;
import org.springframework.web.bind.annotation.*;
import com.example.app.managementapi.ManagementApiApplication.service.TaskService;

import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // Preluare toate task-urile
    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    // Preluare task-uri după status
    @GetMapping("/status/{status}")
    public List<Task> getTasksByStatus(@PathVariable TaskStatus status) {
        return taskService.getTasksByStatus(status);
    }

    // Preluare task după id
    @GetMapping("/{id}")
    public Task getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    // Creare task
    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskService.createTask(task);
    }

    // Actualizare task (status și durata)
    @PatchMapping("/{id}")
    public Task updateTask(@PathVariable Long id,
                           @RequestParam(required = false) TaskStatus status,
                           @RequestParam(required = false) Integer plannedDurationMin) {
        return taskService.updateTask(id, status, plannedDurationMin);
    }

    // Ștergere task
    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }
}
