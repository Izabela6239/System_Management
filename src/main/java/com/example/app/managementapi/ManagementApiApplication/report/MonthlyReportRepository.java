package com.example.app.managementapi.ManagementApiApplication.report;



import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Year;
import java.util.List;

@Repository
public interface MonthlyReportRepository extends JpaRepository<MonthlyReport, Long> {

    // Găsește toate rapoartele pentru un angajat
    List<MonthlyReport> findByEmployee(Employee employee);

    // Găsește raportul pentru o anumită lună
    List<MonthlyReport> findByEmployeeIdAndMonth(Long employeeId, Year month);

    // Sau doar cele ale unei anumite luni pentru toți angajații
    List<MonthlyReport> findByMonth(Year month);
}

