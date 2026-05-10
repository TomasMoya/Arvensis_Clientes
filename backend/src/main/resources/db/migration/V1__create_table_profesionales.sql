CREATE TABLE profesionales (
    id bigint not null AUTO_INCREMENT,
    nombre varchar(150) not null,
    apellido varchar(150) not null,
    email varchar(255) not null,
    telefono varchar(20) not null,
    profesion varchar(100) not null,
    direccion varchar(255) not null,
    estado varchar(20) not null,

    primary key(id)
)