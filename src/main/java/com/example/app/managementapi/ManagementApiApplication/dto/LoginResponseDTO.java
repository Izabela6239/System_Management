package com.example.app.managementapi.ManagementApiApplication.dto;


import com.example.app.managementapi.ManagementApiApplication.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private String username;
    private UserRole role;
    private Long userId; // adminId sau employeeId
    private String message;
}