package com.example.app.managementapi.ManagementApiApplication.auth;

import com.example.app.managementapi.ManagementApiApplication.dto.LoginRequestDTO;
import com.example.app.managementapi.ManagementApiApplication.dto.LoginResponseDTO;
import com.example.app.managementapi.ManagementApiApplication.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequest) {
        LoginResponseDTO response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // frontend-ul va șterge token-ul din localStorage
        return ResponseEntity.ok("Logout successful");
    }
}