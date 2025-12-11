package com.example.app.managementapi.ManagementApiApplication.auth;

import lombok.Data;

@Data
public class LoginRequestDTO {
    private String username;
    private String password;
}