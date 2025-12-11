package com.example.app.managementapi.ManagementApiApplication.auth;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import jakarta.persistence.PostPersist;

public class EmployeeListener {

    @PostPersist
    public void onPostPersist(Employee employee) {
        UserRepository userRepository = SpringContext.getBean(UserRepository.class);

        if (userRepository.findByUsername(employee.getEmail()).isEmpty()) {
            User user = new User();
            user.setUsername(employee.getEmail());
            user.setPassword(employee.getPassword());
            user.setRole(UserRole.EMPLOYEE);
            user.setEmployeeId(employee.getId());
            user.setActive(employee.getActive());
            userRepository.save(user);
            System.out.println("✅ Migrated new employee: " + employee.getEmail());
        }
    }
}
