CREATE TABLE grupos_tareas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    PRIMARY KEY (id)
);

CREATE TABLE grupos_usuarios (
    grupo_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    PRIMARY KEY (grupo_id, usuario_id),
    CONSTRAINT fk_grupo FOREIGN KEY (grupo_id) REFERENCES grupos_tareas(id),
    CONSTRAINT fk_usuario_grupo FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

ALTER TABLE tareas
ADD COLUMN grupo_id BIGINT NULL,
ADD COLUMN usuario_asignado_id BIGINT NULL,
ADD CONSTRAINT fk_tarea_grupo FOREIGN KEY (grupo_id) REFERENCES grupos_tareas(id),
ADD CONSTRAINT fk_tarea_usuario_asignado FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id);