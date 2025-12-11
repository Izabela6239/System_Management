package com.example.app.managementapi.ManagementApiApplication.admin;

import com.example.app.managementapi.ManagementApiApplication.leave_request.LeaveRequest;
import com.example.app.managementapi.ManagementApiApplication.report.MonthlyReport;
import com.example.app.managementapi.ManagementApiApplication.task.Task;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "admin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AdminListener.class)

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


    @OneToMany(mappedBy = "admin")
    @JsonIgnore // previne afisarea recursiva
    private List<Task> managedTasks;


    @OneToMany(mappedBy = "admin")
    @JsonManagedReference
    private List<LeaveRequest> leaveRequestsHandled;


    @OneToMany(mappedBy = "admin", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<MonthlyReport> reportsGenerated;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public List<Task> getManagedTasks() {
        return managedTasks;
    }

    public void setManagedTasks(List<Task> managedTasks) {
        this.managedTasks = managedTasks;
    }

    public List<LeaveRequest> getLeaveRequestsHandled() {
        return leaveRequestsHandled;
    }

    public void setLeaveRequestsHandled(List<LeaveRequest> leaveRequestsHandled) {
        this.leaveRequestsHandled = leaveRequestsHandled;
    }


    public List<MonthlyReport> getReportsGenerated() {
        return reportsGenerated;
    }

    public void setReportsGenerated(List<MonthlyReport> reportsGenerated) {
        this.reportsGenerated = reportsGenerated;
    }
}
