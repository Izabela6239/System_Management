package com.example.app.managementapi.ManagementApiApplication.dto;

import lombok.Data;

@Data
public class LoginRequestDTO {
    private String username;
    private String password;
}