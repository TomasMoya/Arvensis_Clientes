package com.arvensis.profesionales.profesional.exportacion;

import com.arvensis.profesionales.profesional.Profesional;
import com.arvensis.profesionales.profesional.ProfesionalRepository;
import com.arvensis.profesionales.trazabilidad.Trazabilidad;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/profesionales/exportar")
public class ExportacionController{

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @GetMapping
    public ResponseEntity<byte[]> profesionalesExcel(HttpServletResponse response) throws IOException {
        List<Profesional> profesionales = profesionalRepository.findAllWithTrazabilidad();

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Profesionales");

        //Encabezados
        Row header = sheet.createRow(0);
        String[] columnas = {
                "Nombre", "Apellido", "Email", "Teléfono", "Dirección", "Profesión",
                "Se le habló", "Fecha contacto", "Se mandó catalogo", "Se le visitó",
                "Compró"
        };
        for (int i = 0; i < columnas.length; i++){
            header.createCell(i).setCellValue(columnas[i]);
        }

        //Datos
        int rowNum = 1;
        for (Profesional p : profesionales){
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(p.getNombre() != null ? p.getNombre() : "");
            row.createCell(1).setCellValue(p.getApellido() != null ? p.getApellido() : "");
            row.createCell(2).setCellValue(p.getEmail() != null ? p.getEmail() : "");
            row.createCell(3).setCellValue(p.getTelefono() != null ? p.getTelefono() : "");
            row.createCell(4).setCellValue(p.getDireccion() != null ? p.getDireccion() : "");
            row.createCell(5).setCellValue(p.getProfesion() != null ? p.getProfesion().name() : "");

            Trazabilidad t = p.getTrazabilidad();
            if(t != null){
                row.createCell(6).setCellValue(t.isSeLeHablo());
                row.createCell(7).setCellValue(t.getFechaQueSeLeHablo() != null ? t.getFechaQueSeLeHablo().toString() : "");
                row.createCell(8).setCellValue(t.isSeMandoCatalogo());
                row.createCell(9).setCellValue(t.isSeLeVisito());
                row.createCell(10).setCellValue(t.isCompro());
            }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        workbook.write(baos);
        workbook.close();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "profesionales.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(baos.toByteArray());
    }
}
