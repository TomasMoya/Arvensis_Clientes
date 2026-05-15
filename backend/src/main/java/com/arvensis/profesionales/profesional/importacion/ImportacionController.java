package com.arvensis.profesionales.profesional.importacion;

import com.arvensis.profesionales.profesional.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/profesionales/importar")
public class ImportacionController {

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity importar(@RequestParam("file") MultipartFile file) throws IOException {

        List<DatosImportacionDTO> registros = new ArrayList<>();
        List<String> emailsDuplicados = new ArrayList<>();

        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        for (Row row : sheet) {
            if (row.getRowNum() == 0) continue; // saltar encabezado

            String idExterno  = getCellValue(row.getCell(0));
            String nombre     = getCellValue(row.getCell(1));
            String email      = getCellValue(row.getCell(2));
            String telefono   = getCellValue(row.getCell(3));
            String direccion  = getCellValue(row.getCell(4));

            if (nombre == null || nombre.isBlank()) continue;

            // Verificar duplicados por email
            if (email != null && !email.isBlank() &&
                    profesionalRepository.existsByEmail(email)) {
                emailsDuplicados.add(email);
            }

            registros.add(new DatosImportacionDTO(idExterno, nombre, email, telefono, direccion));
        }

        workbook.close();

        // Si hay duplicados, devolver 409 con la lista
        if (!emailsDuplicados.isEmpty()) {
            return ResponseEntity.status(409).body(Map.of(
                    "duplicados", emailsDuplicados,
                    "registros", registros
            ));
        }

        guardarRegistros(registros);
        return ResponseEntity.ok(Map.of("importados", registros.size()));
    }

    @PostMapping(value = "/confirmar", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity confirmar(@RequestBody List<DatosImportacionDTO> registros) {
        guardarRegistros(registros);
        return ResponseEntity.ok(Map.of("importados", registros.size()));
    }

    private void guardarRegistros(List<DatosImportacionDTO> registros) {
        registros.forEach(r -> {
            Profesional p = new Profesional();

            String[] partes = (r.nombre() != null ? r.nombre() : "").split(" ", 2);
            p.setNombre(partes[0]);
            p.setApellido(partes.length > 1 ? partes[1] : "");

            p.setEmail(r.email());
            p.setTelefono(r.telefono());
            p.setDireccion(r.direccion());
            p.setEstado(Estado.HABILITADO);
            profesionalRepository.save(p);
        });
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default      -> null;
        };
    }
}
