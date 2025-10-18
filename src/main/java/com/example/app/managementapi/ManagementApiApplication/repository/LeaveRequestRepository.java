package com.example.app.managementapi.ManagementApiApplication.repository;

import com.example.app.managementapi.ManagementApiApplication.entity.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    // găsește cererile pentru un angajat
    List<LeaveRequest> findByEmployee(Employee employee);
}
