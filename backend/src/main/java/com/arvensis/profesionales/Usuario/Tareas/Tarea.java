package com.arvensis.profesionales.Usuario.Tareas;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tareas")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Tareas {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
}
