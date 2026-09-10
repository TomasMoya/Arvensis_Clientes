CREATE TABLE comentarios_tarea (
    id BIGINT NOT NULL AUTO_INCREMENT,
    contenido VARCHAR(2000) NOT NULL,
    fecha_creacion DATETIME NOT NULL,
    tarea_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_comentario_tarea FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
