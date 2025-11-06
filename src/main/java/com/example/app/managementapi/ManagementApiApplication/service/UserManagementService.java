package com.example.app.managementapi.ManagementApiApplication.service;

import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.entity.Admin;
import com.example.app.managementapi.ManagementApiApplication.entity.Employee;
import com.example.app.managementapi.ManagementApiApplication.enums.UserRole;
import com.example.app.managementapi.ManagementApiApplication.repository.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.EmployeeRepository;
import com.example.app.managementapi.ManagementApiApplication.repository.UserRepository;
import com.example.app.managementapi.ManagementApiApplication.enums.Seniority;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.transaction.annotation.Transactional;


@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User createAdminUser(String username, String rawPassword, String name, String email) {
        // 1. Creează Admin (cu datele de business)
        Admin admin = new Admin();
        admin.setName(name);
        admin.setEmail(email);
        admin.setUsername(username); // Păstrăm pentru compatibilitate
        admin.setPassword(passwordEncoder.encode(rawPassword)); // Păstrăm pentru compatibilitate
        admin.setActive(true);
        Admin savedAdmin = adminRepository.save(admin);

        // 2. Creează User (doar pentru autentificare)
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(UserRole.ADMIN);
        user.setAdminId(savedAdmin.getId()); // Legătura către Admin
        user.setActive(true);

        return userRepository.save(user);
    }

    @Transactional
    public User createEmployeeUser(String username, String rawPassword, String name, String email,
                                   Double hourlyRate, Seniority seniority) {
        // 1. Creează Employee (cu datele de business)
        Employee employee = new Employee();
        employee.setName(name);
        employee.setEmail(email);
        employee.setPassword(passwordEncoder.encode(rawPassword));
        employee.setRole(UserRole.EMPLOYEE);
        employee.setHourlyRate(hourlyRate);
        employee.setSeniority(seniority);
        employee.setActive(true);
        Employee savedEmployee = employeeRepository.save(employee);

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(UserRole.EMPLOYEE);
        user.setEmployeeId(savedEmployee.getId());
        user.setActive(true);

        return userRepository.save(user);
    }
}