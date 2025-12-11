package com.example.app.managementapi.ManagementApiApplication.employee;

import jakarta.persistence.*;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
class EmployeeSkillId implements java.io.Serializable {
    private Long employeeId;
    private Long skillId;
}