package entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // ADMIN sau ANG

    private String nume;
    private String prenume;
    private String email;

    private Double salariu;

    // Relații
    @OneToMany(mappedBy = "angajat")
    private List<Task> tasks;

    @OneToMany(mappedBy = "angajat")
    private List<Concediu> concedii;
}
