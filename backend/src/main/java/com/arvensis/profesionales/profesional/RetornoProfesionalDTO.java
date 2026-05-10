package com.arvensis.profesionales.profesional;


public record RetornoProfesionalDTO (
        Long id,
        String nombre,
        String apellido,
        String email,
        String telefono,
        String direccion,
        PersonalAsignado personalAsignado,
        Profesion profesion
) {
}
