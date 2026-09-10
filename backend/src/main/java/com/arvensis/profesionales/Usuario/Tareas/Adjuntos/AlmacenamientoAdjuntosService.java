package com.arvensis.profesionales.Usuario.Tareas.Adjuntos;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class AlmacenamientoAdjuntosService {

    private final Path directorioBase;

    public AlmacenamientoAdjuntosService(@Value("${app.adjuntos.directorio:uploads/adjuntos}") String directorio) throws IOException {
        this.directorioBase = Paths.get(directorio).toAbsolutePath().normalize();
        Files.createDirectories(this.directorioBase);
    }

    public String guardar(MultipartFile archivo, String extension) throws IOException {
        String nombreArchivo = UUID.randomUUID() + "." + extension;
        Path destino = directorioBase.resolve(nombreArchivo).normalize();
        Files.copy(archivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
        return nombreArchivo;
    }

    public Path resolver(String nombreArchivo) {
        return directorioBase.resolve(nombreArchivo).normalize();
    }

    public void eliminar(String nombreArchivo) {
        try {
            Files.deleteIfExists(resolver(nombreArchivo));
        } catch (IOException ignored) {
        }
    }
}
