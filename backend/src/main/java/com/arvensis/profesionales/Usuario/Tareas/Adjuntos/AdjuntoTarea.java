package com.arvensis.profesionales.Usuario.Tareas.Adjuntos;

import com.arvensis.profesionales.Usuario.Tareas.Tarea;
import com.arvensis.profesionales.Usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "adjuntos_tarea")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class AdjuntoTarea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombreOriginal;
    private String nombreArchivo;
    private String tipoContenido;
    private Long tamanioBytes;
    private LocalDateTime fechaSubida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarea_id")
    @JsonIgnore
    private Tarea tarea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    private Usuario usuario;

    @PrePersist
    public void prePersist() {
        if (this.fechaSubida == null) {
            this.fechaSubida = LocalDateTime.now();
        }
    }
}
