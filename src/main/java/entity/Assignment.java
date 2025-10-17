package entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assignment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private java.time.LocalDateTime assignedAt;
    private java.time.LocalDateTime acceptedAt;
    private java.time.LocalDateTime startedAt;
    private java.time.LocalDateTime finishedAt;
    private Integer actualDurationMin;
    private Integer adminGrade; // 0..10
    private Boolean valid = true;
}
