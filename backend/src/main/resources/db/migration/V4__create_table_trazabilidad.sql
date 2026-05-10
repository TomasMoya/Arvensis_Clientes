CREATE TABLE trazabilidad (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    se_le_hablo         BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_que_se_le_hablo DATETIME,
    se_mando_catalogo   BOOLEAN NOT NULL DEFAULT FALSE,
    se_le_visito        BOOLEAN NOT NULL DEFAULT FALSE,
    compro              BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id)
);

ALTER TABLE profesionales
ADD COLUMN trazabilidad_id BIGINT,
ADD CONSTRAINT fk_trazabilidad
    FOREIGN KEY (trazabilidad_id) REFERENCES trazabilidad(id);