package com.example.app.managementapi.ManagementApiApplication.repository;

import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // Preluare task-uri după status
    List<Task> findByStatus(TaskStatus status);

    // Preluare task-uri după priority
    List<Task> findByPriority(Integer priority);

    // Poți adăuga și alte metode custom dacă ai nevoie, de ex. după tip sau dificultate
    List<Task> findByType(String type);

    //o sa ne trebuiasca mai incolo
   // List<Task> findByEmployee(Employee employee);
}
