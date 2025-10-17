package entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bonus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bonus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private Double amount;
    private String reason;
    private java.time.Year month;
}
