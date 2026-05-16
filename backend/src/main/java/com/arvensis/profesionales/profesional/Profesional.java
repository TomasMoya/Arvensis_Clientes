package com.arvensis.profesionales.profesional;

import com.arvensis.profesionales.trazabilidad.Trazabilidad;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table (name = "profesionales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode (of = "id")
public class Profesional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    @Enumerated (EnumType.STRING)
    @Column (nullable = true)
    private Profesion profesion;
    private String direccion;
    @Enumerated (EnumType.STRING)
    private Estado estado;
    @Enumerated (EnumType.STRING)
    private PersonalAsignado personalAsignado;
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "trazabilidad_id", referencedColumnName = "id")
    private Trazabilidad trazabilidad;

    public Profesional(DatosProfesionalDTO datosRegistroProfesional) {
        this.id = null;
        this.nombre = datosRegistroProfesional.nombre();
        this.apellido = datosRegistroProfesional.apellido();
        this.email = datosRegistroProfesional.email();
        this.telefono = datosRegistroProfesional.telefono();
        this.profesion = datosRegistroProfesional.profesion();
        this.direccion = datosRegistroProfesional.direccion();
        this.estado = Estado.HABILITADO;
    }

    public void deshabilitarProfesional() {
        this.estado = Estado.DESHABILITADO;
    }

    public void actualizarProfesional(DatosProfesionalDTO datos){
        if (datos.nombre() != null){
            this.nombre = datos.nombre();
        }
        if (datos.apellido() != null){
            this.apellido = datos.apellido();
        }
        if (datos.email() != null){
            this.email = datos.email();
        }
        if (datos.telefono() != null){
            this.telefono = datos.telefono();
        }
        if (datos.profesion() != null){
            this.profesion = datos.profesion();
        }
        if (datos.direccion() != null){
            this.direccion = datos.direccion();
        }
    }
}
