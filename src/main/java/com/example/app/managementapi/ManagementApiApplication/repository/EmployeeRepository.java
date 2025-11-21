package com.example.app.managementapi.ManagementApiApplication.repository;

import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query("SELECT e FROM Employee e WHERE e.active = true")
    List<Employee> findActive();

    List<Employee> findByActiveTrue();
    List<Employee> findByRole(String role);

    @Query("SELECT DISTINCT e FROM Employee e JOIN e.skills es JOIN es.skill s WHERE s.name IN :skillNames")
    List<Employee> findBySkillNames(@Param("skillNames") List<String> skillNames);

    //boolean existsByUserId(Long id);
}