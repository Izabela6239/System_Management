package com.example.app.managementapi.ManagementApiApplication.leave_request;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployee(Employee employee);

    List<LeaveRequest> findByEmployeeIdAndStatus(Long employeeId, LeaveStatus status);
    @Query("""
       select lr from LeaveRequest lr
       where lr.employee.id = :employeeId
         and lr.status = com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveStatus.APPROVED
    """)
    List<LeaveRequest> findApprovedForEmployee(Long employeeId);

    List<LeaveRequest> findByEmployeeId(Long employeeId);
}

