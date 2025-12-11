package com.example.app.managementapi.ManagementApiApplication.payroll;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findAllByOrderByCreatedAtDesc();
}