package com.example.app.managementapi.ManagementApiApplication.notification;

import com.example.app.managementapi.ManagementApiApplication.employee.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String recipient;
        private String sender;
        private String type;
        @Column(name = "task_id")
        private Long taskId;

        @Column(name = "task_status", length = 50)
        private String taskStatus;
        @Column(length = 1000)
        private String content;

        @Lob
        private String payload;

        private Boolean readFlag = false;

        private LocalDateTime createdAt = LocalDateTime.now();

        @ManyToOne
        @JoinColumn(name = "employee_id")
        private Employee employee;
}
