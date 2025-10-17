package entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "salarii")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Salariu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "angajat_id")
    private User angajat;

    private String luna; // ex: 2025-10
    private Double suma;
    private Double bonus;
}
