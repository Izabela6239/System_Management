package com.example.app.managementapi.ManagementApiApplication.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "admin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
//trebuie sa facem tabela in mysql cu admin
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private Boolean active = true;

   /* // Relații cu task-urile administrate
    @OneToMany(mappedBy = "admin")
    private List<Task> managedTasks;

    // Relații cu cererile de concediu gestionate
    @OneToMany(mappedBy = "admin")
    private List<LeaveRequest> leaveRequestsHandled;

    // Relații cu salariile administrate
    @OneToMany(mappedBy = "admin")
    private List<Payroll> payrollsManaged;

    // Relații cu rapoartele de productivitate
    @OneToMany(mappedBy = "admin")
    private List<MonthlyReport> reportsGenerated;*/
}
