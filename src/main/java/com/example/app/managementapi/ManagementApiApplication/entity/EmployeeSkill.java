package com.example.app.managementapi.ManagementApiApplication.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_skill")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSkill {
    @EmbeddedId
    private EmployeeSkillId id;

    @ManyToOne
    @MapsId("employeeId")
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @MapsId("skillId")
    @JoinColumn(name = "skill_id")
    private Skill skill;
}
