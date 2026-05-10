package com.arvensis.profesionales.trazabilidad;

import com.arvensis.profesionales.profesional.Profesional;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table (name = "trazabilidad")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode (of = "id")
public class Trazabilidad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated (EnumType.STRING)
    private Trafico trafico;
    private boolean seLeHablo;
    private LocalDateTime fechaQueSeLeHablo;
    private boolean seMandoCatalogo;
    private boolean seLeVisito;
    private boolean compro;
    @OneToOne(mappedBy = "trazabilidad")
    @JsonIgnore
    private Profesional profesional;
    private String comentSeLeHablo;
    private String comentSeMandoCatalogo;
    private String comentSeLeVisito;
    private String comentCompro;

    public void setSeLeHabloTrue(){
        this.seLeHablo = true;
        this.fechaQueSeLeHablo = LocalDateTime.now();
    }

    public void actualizarDatos(DatosTrazabilidadDTO datosTrazabilidadDTO) {
        if (datosTrazabilidadDTO.seLeHablo() != null) {
            this.seLeHablo = datosTrazabilidadDTO.seLeHablo();
            if (datosTrazabilidadDTO.seLeHablo()) {
                this.fechaQueSeLeHablo = LocalDateTime.now();
            } else {
                this.fechaQueSeLeHablo = null;
            }
        }
        if (datosTrazabilidadDTO.trafico() != null) this.trafico = datosTrazabilidadDTO.trafico();
        if (datosTrazabilidadDTO.seMandoCatalogo() != null) this.seMandoCatalogo = datosTrazabilidadDTO.seMandoCatalogo();
        if (datosTrazabilidadDTO.seLeVisito() != null)      this.seLeVisito = datosTrazabilidadDTO.seLeVisito();
        if (datosTrazabilidadDTO.compro() != null)          this.compro = datosTrazabilidadDTO.compro();
        if (datosTrazabilidadDTO.comentSeLeHablo() != null) this.comentSeLeHablo = datosTrazabilidadDTO.comentSeLeHablo();
        if (datosTrazabilidadDTO.comentSeLeVisito() != null)      this.comentSeLeVisito = datosTrazabilidadDTO.comentSeLeVisito();
        if (datosTrazabilidadDTO.comentCompro() != null)          this.comentCompro = datosTrazabilidadDTO.comentCompro();
        if (datosTrazabilidadDTO.comentSeMandoCatalogo() != null) this.comentSeMandoCatalogo = datosTrazabilidadDTO.comentSeMandoCatalogo();
    }
}
