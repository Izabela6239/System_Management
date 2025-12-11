package com.example.app.managementapi.ManagementApiApplication.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);
    List<Task> findByAdminId(Long adminId);
    default List<Task> findUnassigned() {
        return findByStatus(TaskStatus.NEW);
    }
    @Query("SELECT DISTINCT t FROM Task t JOIN t.assignments a WHERE a.employee.id = :employeeId")
    List<Task> findTasksByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT DISTINCT t FROM Task t JOIN t.assignments a WHERE a.employee.id = :employeeId AND t.status = :status")
    List<Task> findTasksByEmployeeIdAndStatus(@Param("employeeId") Long employeeId, @Param("status") TaskStatus status);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Assignment a WHERE a.task.id = :taskId AND a.employee.id = :employeeId")
    boolean isTaskAssignedToEmployee(@Param("taskId") Long taskId, @Param("employeeId") Long employeeId);

    @Query("SELECT t FROM Task t WHERE t.status = 'NEW'")
    List<Task> findUnassignedTasksForAI();

    List<Task> findByDifficulty(Integer difficulty);

    @Query("SELECT t FROM Task t WHERE t.deadline > CURRENT_TIMESTAMP")
    List<Task> findTasksWithFutureDeadline();

    @Query("SELECT t FROM Task t WHERE t.deadline < CURRENT_TIMESTAMP AND t.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Task> findTasksWithExpiredDeadline();
    List<Task> findByAdminIdAndStatus(Long adminId, TaskStatus status);


}