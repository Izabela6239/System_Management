package com.example.app.managementapi.ManagementApiApplication.repository;

import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployee(Employee employee);

    @Query("""
       select lr from LeaveRequest lr
       where lr.employee.id = :employeeId
         and lr.status = com.example.app.managementapi.ManagementApiApplication.entity.LeaveStatus.APPROVED
    """)
    List<LeaveRequest> findApprovedForEmployee(Long employeeId);
}
