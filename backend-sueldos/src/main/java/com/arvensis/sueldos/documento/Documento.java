package com.arvensis.sueldos.documento;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Guarda el objeto DB completo de la app de liquidacion de sueldos como un unico
 * documento JSON, tal cual como hoy vive en localStorage. La app del cliente ya
 * calcula todo (extras, aguinaldo, cuotas de prestamos, etc.); esta tabla solo
 * persiste ese resultado para que sea real y compartido en vez de vivir en un
 * navegador. Por ahora hay un solo documento (id fijo) porque solo un usuario
 * tiene acceso a esta app.
 */
@Entity
@Table(name = "documento")
@Getter
@Setter
public class Documento {

    @Id
    private Long id;

    @Column(name = "datos_json", columnDefinition = "JSON", nullable = false)
    private String datosJson;

    @Column(name = "actualizado", nullable = false)
    private Instant actualizado;
}
