package com.example.app.managementapi.ManagementApiApplication.repository;

import com.example.app.managementapi.ManagementApiApplication.entity.Assignment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.List;

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
}
