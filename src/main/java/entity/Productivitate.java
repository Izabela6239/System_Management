package entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "productivitate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Productivitate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne
    @JoinColumn(name = "angajat_id")
    private User angajat;

    private Integer durataRealizata; // în ore
    private Integer nota;
    private Double scorAI; // calculat ulterior
}
