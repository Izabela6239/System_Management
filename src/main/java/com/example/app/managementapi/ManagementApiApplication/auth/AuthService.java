package com.example.app.managementapi.ManagementApiApplication.auth;

import com.example.app.managementapi.ManagementApiApplication.admin.Admin;
import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import com.example.app.managementapi.ManagementApiApplication.admin.AdminRepository;
import com.example.app.managementapi.ManagementApiApplication.employee.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final AdminRepository adminRepository;
    private final EmployeeRepository employeeRepository;

    public LoginResponseDTO login(LoginRequestDTO loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = (User) authentication.getPrincipal();
        String jwt = jwtUtil.generateToken(user);

        //String displayName = getBusinessDisplayName(user);
        Long businessEntityId = getBusinessEntityId(user);

        return new LoginResponseDTO(
                jwt,
                user.getUsername(),
                user.getRole(),
                businessEntityId,
                "Login successful"
        );
    }

    private String getBusinessDisplayName(User user) {
        if (user.isAdmin()) {
            Admin admin = adminRepository.findById(user.getAdminId())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));
            return admin.getName();
        } else if (user.isEmployee()) {
            Employee employee = employeeRepository.findById(user.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            return employee.getName();
        }
        return user.getUsername();
    }

    private Long getBusinessEntityId(User user) {
        if (user.isAdmin()) return user.getAdminId();
        if (user.isEmployee()) return user.getEmployeeId();
        return null;
    }
}