package com.example.app.managementapi.ManagementApiApplication.repository;

import com.example.app.managementapi.ManagementApiApplication.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    List<Payroll> findByEmployeeId(Long employeeId);

    List<Payroll> findByYearAndMonth(int year, int month);

    boolean existsByEmployeeIdAndYearAndMonth(Long employeeId, int year, int month);
}
