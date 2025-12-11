package com.example.app.managementapi.ManagementApiApplication.auth;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private String username;
    private UserRole role;
    private Long userId;
    private String message;
}