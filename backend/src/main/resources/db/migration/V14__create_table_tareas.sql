CREATE TABLE tareas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion VARCHAR(500),
    fecha_limite DATETIME,
    prioridad ENUM('BAJA', 'MEDIA', 'ALTA') NOT NULL,
    estado ENUM('PENDIENTE', 'PROCESANDO', 'FINALIZADA') NOT NULL DEFAULT 'PENDIENTE',
    usuario_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tarea_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);