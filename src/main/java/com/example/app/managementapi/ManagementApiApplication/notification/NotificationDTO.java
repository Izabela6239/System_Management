package com.example.app.managementapi.ManagementApiApplication.notification;

import java.time.LocalDateTime;

public record NotificationDTO(Long id, String sender, String type, String content, String payload, Boolean readFlag, LocalDateTime createdAt) {}

