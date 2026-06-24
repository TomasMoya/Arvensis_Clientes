package com.arvensis.profesionales.Usuario.Tareas.GrupoTareas;

import com.arvensis.profesionales.Usuario.Tareas.Tarea;
import com.arvensis.profesionales.Usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grupos_tareas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class GrupoTareas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String descripcion;

    @ManyToMany
    @JoinTable(
            name = "grupos_usuarios",
            joinColumns = @JoinColumn(name = "grupo_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    @JsonIgnore
    private List<Usuario> miembros = new ArrayList<>();

    @OneToMany(mappedBy = "grupoTareas", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Tarea> tareas = new ArrayList<>();

    public void actualizarGrupo(DatosActualizarGrupoDTO datos){
        if (datos.nombre() != null){
            this.nombre = datos.nombre();
        }
        if (datos.descripcion() != null){
            this.descripcion = datos.descripcion();
        }
    }
}
