package com.example.app.managementapi.ManagementApiApplication.repository;

import com.example.app.managementapi.ManagementApiApplication.entity.Task;
import com.example.app.managementapi.ManagementApiApplication.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // ✅ METODE DERIVATE STANDARD (safe)
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByPriority(Integer priority);
    List<Task> findByType(String type);
    List<Task> findByAdminId(Long adminId);

    // ✅ METODĂ DEFAULT pentru unassigned tasks
    default List<Task> findUnassigned() {
        return findByStatus(TaskStatus.NEW);
    }

    // ✅ QUERY-URI CUSTOM PRIN ASSIGNMENTS (pentru EmployeeService)

    /**
     * Găsește toate task-urile asignate unui employee prin assignments
     */
    @Query("SELECT DISTINCT t FROM Task t JOIN t.assignments a WHERE a.employee.id = :employeeId")
    List<Task> findTasksByEmployeeId(@Param("employeeId") Long employeeId);

    /**
     * Găsește task-urile asignate unui employee filtrate după status
     */
    @Query("SELECT DISTINCT t FROM Task t JOIN t.assignments a WHERE a.employee.id = :employeeId AND t.status = :status")
    List<Task> findTasksByEmployeeIdAndStatus(@Param("employeeId") Long employeeId, @Param("status") TaskStatus status);

    /**
     * Verifică dacă un task este asignat unui employee
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Assignment a WHERE a.task.id = :taskId AND a.employee.id = :employeeId")
    boolean isTaskAssignedToEmployee(@Param("taskId") Long taskId, @Param("employeeId") Long employeeId);

    // ✅ QUERY-URI pentru AssignmentService (AI assignments)

    /**
     * Găsește task-uri cu status NEW pentru AI assignment
     */
    @Query("SELECT t FROM Task t WHERE t.status = 'NEW'")
    List<Task> findUnassignedTasksForAI();

    /**
     * Găsește task-uri după dificultate
     */
    List<Task> findByDifficulty(Integer difficulty);

    /**
     * Găsește task-uri cu deadline în viitor
     */
    @Query("SELECT t FROM Task t WHERE t.deadline > CURRENT_TIMESTAMP")
    List<Task> findTasksWithFutureDeadline();

    /**
     * Găsește task-uri cu deadline expirat
     */
    @Query("SELECT t FROM Task t WHERE t.deadline < CURRENT_TIMESTAMP AND t.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Task> findTasksWithExpiredDeadline();
}