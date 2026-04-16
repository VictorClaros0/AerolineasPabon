package handlers

import (
	"context"
	"net/http"
	"time"

	"airres-api/db"
	"airres-api/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"gorm.io/gorm"
)

type DashboardData struct {
	Finanzas   FinanzasData   `json:"finanzas"`
	Inventario InventarioData `json:"inventario"`
	Geografia  GeografiaData  `json:"geografia"`
	Flota      []FlotaData    `json:"flota"`
	Pasajeros  []PasajeroData `json:"pasajeros"`
}

type FinanzasData struct {
	VentasVIP     float64 `json:"ventas_vip"`
	VentasRegular float64 `json:"ventas_regular"`
	TotalVentas   float64 `json:"total_ventas"`
}

type InventarioData struct {
	AsientosLibres    int64 `json:"asientos_libres"`
	AsientosReservados int64 `json:"asientos_reservados"`
	AsientosVendidos  int64 `json:"asientos_vendidos"`
	VuelosScheduled   int64 `json:"vuelos_scheduled"`
	VuelosBoarding    int64 `json:"vuelos_boarding"`
	VuelosDeparted    int64 `json:"vuelos_departed"`
	VuelosInFlight    int64 `json:"vuelos_in_flight"`
	VuelosLanded      int64 `json:"vuelos_landed"`
	VuelosArrived     int64 `json:"vuelos_arrived"`
	VuelosDelayed     int64 `json:"vuelos_delayed"`
}

type GeografiaData struct {
	TopRutas       []RutaData     `json:"top_rutas"`
	ComprasPorPais []CompraPaisData `json:"compras_por_pais"`
}

type RutaData struct {
	Origen     string `json:"origen"`
	Destino    string `json:"destino"`
	Cantidad   int64  `json:"cantidad"`
}

type CompraPaisData struct {
	Pais     string `json:"pais"`
	Cantidad int64  `json:"cantidad"`
}

type FlotaData struct {
	AvionId     uint   `json:"avion_id"`
	Nombre      string `json:"nombre"`
	Fabricante  string `json:"fabricante"`
	Estado      string `json:"estado"`
	Ubicacion   string `json:"ubicacion"`
}

type PasajeroData struct {
	Nombre    string `json:"nombre"`
	Pasaporte string `json:"pasaporte"`
}

// GetDashboardData returns aggregated data for the admin dashboard
func GetDashboardData(c *gin.Context) {
	tag := c.GetHeader("X-Region")
	if tag == "" {
		tag = c.GetHeader("X-User-Country")
	}
	dbConn, region := db.GetDBForCountry(tag)

	if region == "Asia" && db.MongoDatabase != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		data := getMongoDashboardData(ctx)
		c.JSON(http.StatusOK, data)
		return
	} else if dbConn != nil {
		data := getPostgresDashboardData(dbConn)
		c.JSON(http.StatusOK, data)
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{"error": "No database connection for region"})
}

func getPostgresDashboardData(dbConn *gorm.DB) DashboardData {
	data := DashboardData{}

	// Finanzas
	var ventasVIP, ventasRegular float64
	dbConn.Model(&models.Boleto{}).Select("COALESCE(SUM(costo), 0)").Where("id_asiento IN (?)", dbConn.Table("asientos").Select("id").Where("clase = ?", "VIP")).Scan(&ventasVIP)
	dbConn.Model(&models.Boleto{}).Select("COALESCE(SUM(costo), 0)").Where("id_asiento IN (?)", dbConn.Table("asientos").Select("id").Where("clase = ?", "REGULAR")).Scan(&ventasRegular)
	data.Finanzas.VentasVIP = ventasVIP
	data.Finanzas.VentasRegular = ventasRegular
	data.Finanzas.TotalVentas = ventasVIP + ventasRegular

	// Inventario - Asientos
	dbConn.Model(&models.Asiento{}).Where("estado = ?", "AVAILABLE").Count(&data.Inventario.AsientosLibres)
	dbConn.Model(&models.Asiento{}).Where("estado = ?", "RESERVED").Count(&data.Inventario.AsientosReservados)
	dbConn.Model(&models.Asiento{}).Where("estado = ?", "SOLD").Count(&data.Inventario.AsientosVendidos)

	// Inventario - Vuelos
	dbConn.Model(&models.Vuelo{}).Where("id_estado_vuelo = ?", 1).Count(&data.Inventario.VuelosScheduled)
	dbConn.Model(&models.Vuelo{}).Where("id_estado_vuelo = ?", 2).Count(&data.Inventario.VuelosBoarding)
	dbConn.Model(&models.Vuelo{}).Where("id_estado_vuelo = ?", 3).Count(&data.Inventario.VuelosDeparted)
	dbConn.Model(&models.Vuelo{}).Where("id_estado_vuelo = ?", 4).Count(&data.Inventario.VuelosInFlight)
	dbConn.Model(&models.Vuelo{}).Where("id_estado_vuelo = ?", 5).Count(&data.Inventario.VuelosLanded)
	dbConn.Model(&models.Vuelo{}).Where("id_estado_vuelo = ?", 6).Count(&data.Inventario.VuelosArrived)
	dbConn.Model(&models.Vuelo{}).Where("id_estado_vuelo > ?", 6).Count(&data.Inventario.VuelosDelayed)

	// Geografía (Mock of top routes by flight count)
	type TopRoute struct {
		IdOrigen  uint
		IdDestino uint
		Count     int64
	}
	var topRoutes []TopRoute
	dbConn.Table("vuelos").Select("id_origen, id_destino, COUNT(*) as count").Group("id_origen, id_destino").Order("count DESC").Limit(5).Scan(&topRoutes)
	
	for _, tr := range topRoutes {
		var ciudadOrigen, ciudadDestino models.Ciudad
		dbConn.First(&ciudadOrigen, tr.IdOrigen)
		dbConn.First(&ciudadDestino, tr.IdDestino)
		data.Geografia.TopRutas = append(data.Geografia.TopRutas, RutaData{
			Origen:   ciudadOrigen.Codigo,
			Destino:  ciudadDestino.Codigo,
			Cantidad: tr.Count,
		})
	}
	
	// Geografía Compras (Approximation by passenger locations - mock for now)
	data.Geografia.ComprasPorPais = []CompraPaisData{
		{Pais: "Bolivia", Cantidad: 12500},
		{Pais: "Estados Unidos", Cantidad: 4300},
		{Pais: "España", Cantidad: 2100},
		{Pais: "Colombia", Cantidad: 1100},
		{Pais: "Ucrania", Cantidad: 5}, // as requested
	}

	// Flota (Find the last flight for each plane)
	var aviones []models.Avion
	dbConn.Find(&aviones)
	for _, a := range aviones {
		var lastVuelo models.Vuelo
		err := dbConn.Where("id_avion = ?", a.ID).Order("id DESC").First(&lastVuelo).Error
		
		ubicacion := "Desconocida"
		estado := "INACTIVO"
		if err == nil {
			var ciudad models.Ciudad
			dbConn.First(&ciudad, lastVuelo.IDDestino)
			ubicacion = ciudad.Codigo + " (" + ciudad.Pais + ")"
			if lastVuelo.IDEstadoVuelo < 6 {
				estado = "EN VUELO"
			} else {
				estado = "ESTACIONADO"
			}
		}

		data.Flota = append(data.Flota, FlotaData{
			AvionId:    a.ID,
			Nombre:     a.Nombre,
			Fabricante: a.Fabricante,
			Estado:     estado,
			Ubicacion:  ubicacion,
		})
	}

	// Pasajeros (Unique passenger list)
	var boletos []models.Boleto
	dbConn.Select("nombre_pasajero, pasaporte").Distinct("pasaporte").Limit(500).Find(&boletos)
	pasaporteMap := make(map[string]bool)
	for _, b := range boletos {
		if b.Pasaporte != "" && !pasaporteMap[b.Pasaporte] {
			pasaporteMap[b.Pasaporte] = true
			data.Pasajeros = append(data.Pasajeros, PasajeroData{
				Nombre:    b.NombrePasajero,
				Pasaporte: b.Pasaporte,
			})
		}
	}

	return data
}

func getMongoDashboardData(ctx context.Context) DashboardData {
	data := DashboardData{}
	
	// For MongoDB we'll use simple queries, similar logic to above.
	// This is a simplified version just returning counts because full aggregation can be complex depending on schema.
	if db.MongoDatabase == nil {
		return data
	}

	// Inventario - Asientos
	asientosColl := db.MongoDatabase.Collection("asientos")
	data.Inventario.AsientosLibres, _ = asientosColl.CountDocuments(ctx, bson.M{"estado": "AVAILABLE"})
	data.Inventario.AsientosReservados, _ = asientosColl.CountDocuments(ctx, bson.M{"estado": "RESERVED"})
	data.Inventario.AsientosVendidos, _ = asientosColl.CountDocuments(ctx, bson.M{"estado": "SOLD"})

	vuelosColl := db.MongoDatabase.Collection("vuelos")
	data.Inventario.VuelosScheduled, _ = vuelosColl.CountDocuments(ctx, bson.M{"id_estado_vuelo": 1})
	data.Inventario.VuelosBoarding, _ = vuelosColl.CountDocuments(ctx, bson.M{"id_estado_vuelo": 2})
	data.Inventario.VuelosDeparted, _ = vuelosColl.CountDocuments(ctx, bson.M{"id_estado_vuelo": 3})
	data.Inventario.VuelosInFlight, _ = vuelosColl.CountDocuments(ctx, bson.M{"id_estado_vuelo": 4})
	data.Inventario.VuelosLanded, _ = vuelosColl.CountDocuments(ctx, bson.M{"id_estado_vuelo": 5})
	data.Inventario.VuelosArrived, _ = vuelosColl.CountDocuments(ctx, bson.M{"id_estado_vuelo": 6})
	
	// Mock Geography for Mongo DB
	data.Geografia.ComprasPorPais = []CompraPaisData{
		{Pais: "China", Cantidad: 15300},
		{Pais: "Japón", Cantidad: 4300},
		{Pais: "Rusia", Cantidad: 2100},
	}

	// Aviones
	avionesColl := db.MongoDatabase.Collection("aviones")
	cursor, _ := avionesColl.Find(ctx, bson.M{})
	var aviones []models.Avion
	cursor.All(ctx, &aviones)

	for _, a := range aviones {
		data.Flota = append(data.Flota, FlotaData{
			AvionId:    a.ID,
			Nombre:     a.Nombre,
			Fabricante: a.Fabricante,
			Estado:     "ESTACIONADO",
			Ubicacion:  "Asia (Sincronizado)",
		})
	}

	return data
}
