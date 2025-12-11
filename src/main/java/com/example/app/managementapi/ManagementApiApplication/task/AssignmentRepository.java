package com.example.app.managementapi.ManagementApiApplication.task;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    @Query("select a from Assignment a where a.employee.id = :employeeId order by a.assignedAt desc")
    List<Assignment> findByEmployeeId(Long employeeId);

    // pentru calcule recente (doar cele finalizate)
    @Query("""
       select a from Assignment a
       where a.employee.id = :employeeId and a.finishedAt is not null
       order by a.finishedAt desc
    """)
    List<Assignment> findRecentFinished(Long employeeId, Pageable pageable);

    List<Assignment> findByTaskId(Long taskId);

    Optional<Assignment> findByTaskIdAndEmployeeId(Long taskId, Long employeeId);

    boolean existsByTaskIdAndEmployeeId(Long taskId, Long employeeId);

    boolean existsByTaskId(Long taskId);


    @Query("SELECT a FROM Assignment a WHERE a.task.admin.id = :adminId")
    List<Assignment> findByAdminId(@Param("adminId") Long adminId);

    @Query("""
        SELECT a FROM Assignment a
        WHERE a.employee.id = :employeeId
        AND FUNCTION('MONTH', a.finishedAt) = :month
        AND FUNCTION('YEAR', a.finishedAt) = :year
    """)
    List<Assignment> findByEmployeeIdAndFinishedAtYearMonth(
            @Param("employeeId") Long employeeId,
            @Param("month") int month,
            @Param("year") int year
    );
    List<Assignment> findByEmployeeIdAndFinishedAtBetween(Long employeeId, LocalDateTime startDate, LocalDateTime endDate);
}