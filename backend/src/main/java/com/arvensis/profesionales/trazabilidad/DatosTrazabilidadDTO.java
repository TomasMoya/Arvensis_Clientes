package com.arvensis.profesionales.trazabilidad;

public record DatosTrazabilidadDTO(
        Trafico trafico,
        Boolean seLeHablo,
        Boolean seMandoCatalogo,
        Boolean seLeVisito,
        Boolean compro,
        String comentSeLeHablo,
        String comentSeMandoCatalogo,
        String comentSeLeVisito,
        String comentCompro
) {}
