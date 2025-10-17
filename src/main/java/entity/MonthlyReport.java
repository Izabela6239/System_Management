package entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "monthly_report")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private java.time.Year month;
    private Integer totalTasks = 0;
    private Double avgGrade;
    private Double totalRevenue;
    private Double totalCosts;
    private Double productivityScore;
}
