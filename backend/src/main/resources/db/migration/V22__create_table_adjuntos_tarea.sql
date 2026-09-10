CREATE TABLE adjuntos_tarea (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_contenido VARCHAR(100),
    tamanio_bytes BIGINT NOT NULL,
    fecha_subida DATETIME NOT NULL,
    tarea_id BIGINT NOT NULL,
    usuario_id BIGINT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_adjunto_tarea FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
    CONSTRAINT fk_adjunto_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
