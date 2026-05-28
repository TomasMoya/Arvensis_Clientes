package com.arvensis.profesionales.Usuario.Tareas;

import com.arvensis.profesionales.Usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tareas")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Tarea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titulo;
    private String descripcion;
    private LocalDateTime fechaLimite;
    @Enumerated (EnumType.STRING)
    private Prioridad prioridad;
    @Enumerated (EnumType.STRING)
    private EstadoTarea estado;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn (name = "usuario_id")
    @JsonIgnore
    private Usuario usuario;

    public void actualizarDatos(DatosActualizarTareaDTO datos){
        if (datos.titulo() != null) this.titulo = datos.titulo();
        if (datos.descripcion() != null) this.descripcion = datos.descripcion();
        if (datos.fechaLimite() != null)      this.fechaLimite = datos.fechaLimite();
        if (datos.prioridad() != null)          this.prioridad = datos.prioridad();
        if (datos.estado() != null) this.estado = datos.estado();
    }
}
