package com.example.app.managementapi.ManagementApiApplication.entity;

import com.example.app.managementapi.ManagementApiApplication.auth.EmployeeListener;
import com.example.app.managementapi.ManagementApiApplication.auth.User;
import com.example.app.managementapi.ManagementApiApplication.enums.Seniority;
import com.example.app.managementapi.ManagementApiApplication.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "employee")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(EmployeeListener.class)
//1. Employee login → primește JWT cu role=EMPLOYEE și employeeId=123
//2. Frontend salvează token
//3. La fiecare request: Authorization: Bearer <token>
//4. Backend verifică:
//   - Token valid? ✓
//   - Are role EMPLOYEE? ✓
//   - employeeId din token corespunde cu cererea? ✓
//5. Returnează DOAR datele angajatului 123
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;

    @Column(unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; //EMPLOYEE

    @Column(nullable = false)
    private Double hourlyRate = 0.0;

    @Enumerated(EnumType.STRING)
    private Seniority seniority = Seniority.JUNIOR;

    private Boolean active = true;


    @OneToMany(mappedBy = "employee")
    @JsonIgnore
    private List<Assignment> assignments;

    @OneToMany(mappedBy = "employee")
    @JsonManagedReference
    private List<LeaveRequest> leaveRequests;

    @OneToMany(mappedBy = "employee")
    @JsonIgnore
    private List<EmployeeSkill> skills;

    @OneToMany(mappedBy = "employee")
    @JsonIgnore
    private List<Bonus> bonuses;

    @OneToMany(mappedBy = "employee")
    @JsonIgnore
    private List<Payroll> payrolls;

    @OneToMany(mappedBy = "employee")
    @JsonIgnore
    private List<Notification> notifications;

   /* @OneToMany(mappedBy = "employee")
    @JsonIgnore
    private List<MonthlyReport> reports;*/

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

    //de ce ai nevoie de set si get role aici ca employee n are rol
    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Double getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(Double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public Seniority getSeniority() {
        return seniority;
    }

    public void setSeniority(Seniority seniority) {
        this.seniority = seniority;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public List<Assignment> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<Assignment> assignments) {
        this.assignments = assignments;
    }

    public List<LeaveRequest> getLeaveRequests() {
        return leaveRequests;
    }

    public void setLeaveRequests(List<LeaveRequest> leaveRequests) {
        this.leaveRequests = leaveRequests;
    }

    public List<EmployeeSkill> getSkills() {
        return skills;
    }

    public void setSkills(List<EmployeeSkill> skills) {
        this.skills = skills;
    }

    public List<Bonus> getBonuses() {
        return bonuses;
    }

    public void setBonuses(List<Bonus> bonuses) {
        this.bonuses = bonuses;
    }

    public List<Payroll> getPayrolls() {
        return payrolls;
    }

    public void setPayrolls(List<Payroll> payrolls) {
        this.payrolls = payrolls;
    }

    public List<Notification> getNotifications() {
        return notifications;
    }

    public void setNotifications(List<Notification> notifications) {
        this.notifications = notifications;
    }

    public void setUser(User user) {
        this.id = user.getId();
    }

    /*public List<MonthlyReport> getReports() {
        return reports;
    }

    public void setReports(List<MonthlyReport> reports) {
        this.reports = reports;
    }*/
}