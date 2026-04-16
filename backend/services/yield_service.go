package services

import (
	"airres-api/db"
	"airres-api/models"
)

type YieldSuggestion struct {
	Clase          string  `json:"clase"`
	Ocupacion      float64 `json:"ocupacion"` // porcentaje 0 a 1
	FactorSugerido float64 `json:"factor_sugerido"` // ej: 1.15 significa subir 15%
}

func CalculateDynamicPricing() []YieldSuggestion {
	if db.PGAmerica == nil {
		return []YieldSuggestion{}
	}

	var totalAsientos int64
	var vendidos int64
	var reservados int64

	db.PGAmerica.Model(&models.Asiento{}).Count(&totalAsientos)
	db.PGAmerica.Model(&models.Asiento{}).Where("estado = ?", "SOLD").Count(&vendidos)
	db.PGAmerica.Model(&models.Asiento{}).Where("estado = ?", "RESERVED").Count(&reservados)

	if totalAsientos == 0 {
		return []YieldSuggestion{}
	}

	ocupacion := float64(vendidos+reservados) / float64(totalAsientos)

	var factor float64 = 1.0
	if ocupacion > 0.85 {
		factor = 1.30 // +30%
	} else if ocupacion > 0.65 {
		factor = 1.15 // +15%
	} else if ocupacion < 0.3 {
		factor = 0.85 // -15%
	}

	return []YieldSuggestion{
		{Clase: "GENERAL", Ocupacion: ocupacion, FactorSugerido: factor},
	}
}
