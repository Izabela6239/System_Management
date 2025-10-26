package com.example.app.managementapi.ManagementApiApplication.auth;

import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.enums.UserRole;
import com.example.app.managementapi.ManagementApiApplication.repository.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ExistingDataMigrator implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== MIGRATING EXISTING DATA ===");

        // Migrează Admini existenți
        List<Admin> existingAdmins = adminRepository.findAll();
        for (Admin admin : existingAdmins) {
            if (userRepository.findByUsername(admin.getUsername()).isEmpty()) {
                User user = new User();
                user.setUsername(admin.getUsername());
                user.setPassword(admin.getPassword()); // Sau passwordEncoder.encode() dacă vrei re-hash
                user.setRole(UserRole.ADMIN);
                user.setAdminId(admin.getId());
                user.setActive(admin.getActive());
                userRepository.save(user);
                System.out.println("✅ Migrated admin: " + admin.getUsername());
            }
        }

        // Migrează Employees existenți
        List<Employee> existingEmployees = employeeRepository.findAll();
        for (Employee employee : existingEmployees) {
            // Creează username pentru employee (dacă nu are)
            String username = employee.getEmail(); // Sau alt identificator
            if (userRepository.findByUsername(username).isEmpty()) {
                User user = new User();
                user.setUsername(username);
                user.setPassword(employee.getPassword()); // Sau passwordEncoder.encode()
                user.setRole(UserRole.EMPLOYEE);
                user.setEmployeeId(employee.getId());
                user.setActive(employee.getActive());
                userRepository.save(user);
                System.out.println("✅ Migrated employee: " + username);
            }
        }

        System.out.println("=== DATA MIGRATION COMPLETE ===");
    }
}