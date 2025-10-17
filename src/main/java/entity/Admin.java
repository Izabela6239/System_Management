package entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "admin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    // Relații cu angajații administrați
    @OneToMany(mappedBy = "admin")
    private List<Employee> managedEmployees;

    // Relații cu task-urile administrate
    @OneToMany(mappedBy = "admin")
    private List<Assignment> managedAssignments;

    // Relații cu cererile de concediu gestionate
    @OneToMany(mappedBy = "admin")
    private List<LeaveRequest> leaveRequestsHandled;

    // Relații cu salariile administrate
    @OneToMany(mappedBy = "admin")
    private List<Payroll> payrollsManaged;

    // Relații cu rapoartele de productivitate
    @OneToMany(mappedBy = "admin")
    private List<MonthlyReport> reportsGenerated;
}
