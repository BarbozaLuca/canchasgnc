package com.estadio.api.canchas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacturacionDTO {
    private BigDecimal facturadoHoy;
    private BigDecimal facturadoSemana;
    private BigDecimal facturadoMes;
    private int reservasHoy;
    private int reservasSemana;
    private int reservasMes;
    private int canceladasMes;
    private int completadasMes;
}
