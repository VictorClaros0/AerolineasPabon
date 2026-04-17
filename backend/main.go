package main

import (
	"context"
	"log"
	"strconv"
	"time"

	"airres-api/db"
	"airres-api/models"
	"airres-api/routes"
	"airres-api/services"

	"encoding/json"
	"encoding/csv"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"gorm.io/gorm"
)

func main() {
	// Initialize databases
	db.InitPostgres()
	db.InitMongoDB()

	// Perform AutoMigrate
	if db.PGAmerica != nil {
		db.PGAmerica.AutoMigrate(&models.Avion{}, &models.Ciudad{}, &models.Puerta{}, &models.Asiento{}, &models.EstadoVuelo{}, &models.Vuelo{}, &models.Boleto{}, &models.Precios{}, &models.DetallesVuelos{})
	}
	if db.PGEuropaAsia != nil {
		db.PGEuropaAsia.AutoMigrate(&models.Avion{}, &models.Ciudad{}, &models.Puerta{}, &models.Asiento{}, &models.EstadoVuelo{}, &models.Vuelo{}, &models.Boleto{}, &models.Precios{}, &models.DetallesVuelos{})
	}

	// Seed Matrix Data
	seedMatrices(db.PGAmerica)
	seedMatrices(db.PGEuropaAsia)
	
	seedPrecios(db.PGAmerica)
	seedPrecios(db.PGEuropaAsia)

	seedAsientos(db.PGAmerica)
	seedAsientos(db.PGEuropaAsia)

    seedVuelos(db.PGAmerica)
    seedVuelos(db.PGEuropaAsia)

	// Seed MongoDB matrices
	seedMongoMatrices()
	syncPGSeatsToMongo()
	syncPGPuertasToMongo()
	seedMongoVuelos()

	// Start Background Multi-Master Syncing Goroutine
	go services.StartSyncService()

	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-User-Country", "X-Region"}
	r.Use(cors.New(config))

	// Register Routes
	routes.SetupRoutes(r)

	// Health check endpoint
	r.GET("/api/health", func(c *gin.Context) {
		country := c.GetHeader("X-User-Country")
		if country == "" {
			country = "Unknown"
		}
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "AirRes API is running",
			"country": country,
		})
	})

	log.Println("Starting server on :8080")
	r.Run(":8080")
}

func parseDatetime(date, t string) int64 {
	// CSV format: MM/DD/YY  H:MM  (e.g. "03/30/26" "17:33")
	layouts := []string{
		"01/02/06 15:04",  // MM/DD/YY H:MM  — primary format
		"01/02/06 15:04:05",
		"01/02/06",
		"1/2/06 15:04",   // M/D/YY H:MM  — for single-digit month/day
		"1/2/06",
		// Fallback 4-digit year formats
		"01/02/2006 15:04",
		"01/02/2006",
		"2006-01-02 15:04",
		"2006-01-02",
	}
	combined := strings.TrimSpace(date) + " " + strings.TrimSpace(t)
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, strings.TrimSpace(combined)); err == nil {
			return parsed.Unix()
		}
	}
	// Fallback: try date-only
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, strings.TrimSpace(date)); err == nil {
			return parsed.Unix()
		}
	}
	return 0
}

func seedMongoMatrices() {
	if db.MongoDatabase == nil {
		return
	}

	path := filepath.Join("data", "matrices.json")
	file, err := os.ReadFile(path)
	if err != nil {
		log.Printf("[Seed Mongo] Warning: could not read %s: %v", path, err)
		return
	}

	var data map[string]interface{}
	if err := json.Unmarshal(file, &data); err != nil {
		log.Printf("[Seed Mongo] Error parsing JSON: %v", err)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Upsert detalles_vuelos (travel time matrix)
	travelTime := data["travel_time"]
	_, err = db.MongoDatabase.Collection("detalles_vuelos").UpdateOne(
		ctx,
		bson.M{},
		bson.M{"$set": bson.M{"matriz_tiempos": travelTime}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("[Seed Mongo] Error upserting detalles_vuelos: %v", err)
	} else {
		log.Println("[Seed Mongo] Successfully seeded detalles_vuelos into MongoDB")
	}

	// Upsert precios (economy + first class fares)
	_, err = db.MongoDatabase.Collection("precios").UpdateOne(
		ctx,
		bson.M{},
		bson.M{"$set": bson.M{
			"matriz_precios_regular": data["economy_fares"],
			"matriz_precios_vip":     data["first_class_fares"],
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("[Seed Mongo] Error upserting precios: %v", err)
	} else {
		log.Println("[Seed Mongo] Successfully seeded precios into MongoDB")
	}
}

func seedMatrices(dbConn *gorm.DB) {
	if dbConn == nil {
		return
	}

	var count int64
	dbConn.Model(&models.DetallesVuelos{}).Count(&count)
	if count > 0 {
		return // Already seeded
	}

	path := filepath.Join("data", "matrices.json")
	file, err := os.ReadFile(path)
	if err != nil {
		log.Printf("[Seed] Warning: could not find %s for seeding: %v", path, err)
		return
	}

	var data map[string]interface{}
	if err := json.Unmarshal(file, &data); err != nil {
		log.Printf("[Seed] Error parsing JSON: %v", err)
		return
	}

	travelTimesJSON, _ := json.Marshal(data["travel_time"])
	detalles := models.DetallesVuelos{
		MatrizTiempos: travelTimesJSON,
	}

	if err := dbConn.Create(&detalles).Error; err != nil {
		log.Printf("[Seed] Error inserting details: %v", err)
	} else {
		log.Printf("[Seed] Successfully seeded DetallesVuelos matrix into %s", dbConn.Name())
	}
}

func seedPrecios(dbConn *gorm.DB) {
	if dbConn == nil {
		return
	}

	path := filepath.Join("data", "matrices.json")
	file, _ := os.ReadFile(path)
	var data map[string]interface{}
	json.Unmarshal(file, &data)

	regJSON, _ := json.Marshal(data["economy_fares"])
	vipJSON, _ := json.Marshal(data["first_class_fares"])

	var existing models.Precios
	err := dbConn.First(&existing).Error
	if err != nil {
		// No row at all - create
		precios := models.Precios{MatrizPreciosRegular: regJSON, MatrizPreciosVip: vipJSON}
		dbConn.Create(&precios)
		log.Printf("[Seed] Created Precios matrix into %s", dbConn.Name())
	} else if existing.MatrizPreciosRegular == nil || string(existing.MatrizPreciosRegular) == "null" {
		// Row exists but data is null - update it
		dbConn.Model(&existing).Updates(map[string]interface{}{
			"matriz_precios_regular": regJSON,
			"matriz_precios_vip":     vipJSON,
		})
		log.Printf("[Seed] Updated Precios matrix into %s", dbConn.Name())
	} else {
		log.Printf("[Seed] Precios already seeded in %s, skipping.", dbConn.Name())
	}
}

func seedAsientos(dbConn *gorm.DB) {
	if dbConn == nil {
		return
	}
	var count int64
	dbConn.Model(&models.Asiento{}).Count(&count)
	if count > 0 {
		return
	}

	var aviones []models.Avion
	dbConn.Find(&aviones)

	for _, avion := range aviones {
		log.Printf("[Seed] Generating seats for %s (VIP: %d, Regular: %d)", avion.Nombre, avion.AsientosVip, avion.AsientosRegular)
		
		// Generate VIP seats (Row 1 to X)
		vipRows := (avion.AsientosVip / 4) + 1
		for i := 0; i < avion.AsientosVip; i++ {
			row := (i / 4) + 1
			col := string(rune('A' + (i % 4)))
			seat := models.Asiento{
				Codigo:  strconv.Itoa(row) + col,
				IDAvion: avion.ID,
				Estado:  "AVAILABLE",
				Clase:   "VIP",
			}
			dbConn.Create(&seat)
		}

		// Generate Regular seats (Starting after VIP rows)
		for i := 0; i < avion.AsientosRegular; i++ {
			row := vipRows + (i / 6) + 1
			col := string(rune('A' + (i % 6)))
			seat := models.Asiento{
				Codigo:  strconv.Itoa(row) + col,
				IDAvion: avion.ID,
				Estado:  "AVAILABLE",
				Clase:   "REGULAR",
			}
			dbConn.Create(&seat)
		}
	}
	log.Printf("[Seed] Successfully seeded Asientos into %s", dbConn.Name())
}

func syncPGSeatsToMongo() {
	if db.MongoClient == nil || db.PGAmerica == nil {
		return
	}
	var seats []models.Asiento
	db.PGAmerica.Find(&seats)
	
	if len(seats) == 0 {
		return
	}

	coll := db.MongoDatabase.Collection("asientos")
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	
	log.Printf("[Seed Mongo] Syncing %d seats from PG to Mongo with BulkWrite...", len(seats))
	
	var updateModels []mongo.WriteModel
	for _, seat := range seats {
		filter := bson.M{"codigo": seat.Codigo, "id_avion": seat.IDAvion}
		update := bson.M{"$set": bson.M{
			"id":       seat.ID,
			"codigo":   seat.Codigo,
			"id_avion": seat.IDAvion,
			"estado":   seat.Estado,
			"clase":    seat.Clase,
		}}
		updateModels = append(updateModels, mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update).SetUpsert(true))
	}

	if len(updateModels) > 0 {
		opts := options.BulkWrite().SetOrdered(false)
		_, err := coll.BulkWrite(ctx, updateModels, opts)
		if err != nil {
			log.Printf("[Seed Mongo] Error syncing seats: %v", err)
		} else {
			log.Printf("[Seed Mongo] Successfully synced seats to MongoDB.")
		}
	}
}

func seedVuelos(dbConn *gorm.DB) {
	if dbConn == nil {
		return
	}
	var count int64
	dbConn.Model(&models.Vuelo{}).Count(&count)
	if count > 0 {
		return
	}

	// ==========================================
	// CHANGE DATASET PATH HERE
	// (Pronto lo cambiaremos, editar este path para el nuevo dataset)
	// ==========================================
	datasetPath := "02 - Practica 3 Dataset Flights (1).csv"
	file, err := os.Open(datasetPath)
	if err != nil {
		log.Printf("[Seed] Warning: could not find %s for seeding vuelos: %v", datasetPath, err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	// Skip header
	_, _ = reader.Read()

	records, err := reader.ReadAll()
	if err != nil {
		log.Printf("[Seed] Error reading CSV: %v", err)
		return
	}

	// Cache lookup tables for performance
	ciudades := make(map[string]uint)
	var ciudadList []models.Ciudad
	dbConn.Find(&ciudadList)
	for _, c := range ciudadList {
		ciudades[c.Codigo] = c.ID
	}

	estados := make(map[string]uint)
	var estadoList []models.EstadoVuelo
	dbConn.Find(&estadoList)
	for _, e := range estadoList {
		estados[e.Nombre] = e.ID
	}

	aviones := make(map[uint]uint)
	var avionList []models.Avion
	dbConn.Find(&avionList)
	for _, a := range avionList {
		aviones[a.ID] = a.ID
	}

	puertas := make(map[string]uint)
	var puertaList []models.Puerta
	dbConn.Find(&puertaList)
	for _, p := range puertaList {
		puertas[p.Puerta+"_"+strconv.Itoa(int(p.IDCiudad))] = p.ID
	}

	log.Printf("[Seed] Seeding %d vuelos into %s", len(records), dbConn.Name())
	batchSize := 1000
	var batch []models.Vuelo

	for i, record := range records {
		if len(record) < 7 {
			continue
		}

		flightDate := strings.TrimSpace(record[0])
		flightTime := strings.TrimSpace(record[1])
		origin := strings.TrimSpace(record[2])
		destination := strings.TrimSpace(record[3])
		aircraftStr := strings.TrimSpace(record[4])
		statusStr := strings.TrimSpace(record[5])
		gateStr := strings.TrimSpace(record[6])

		idOrigen, ok1 := ciudades[origin]
		idDestino, ok2 := ciudades[destination]
		if !ok1 || !ok2 {
			continue // Skip flights if cities not mapped
		}

		aircraftID, _ := strconv.Atoi(aircraftStr)
		if _, ok := aviones[uint(aircraftID)]; !ok {
			aircraftID = 1 // default safely
		}

		idEstado, ok := estados[statusStr]
		if !ok {
			idEstado = 1
		}

		// Gates logic: dynamically create if not exists
		gateKey := gateStr + "_" + strconv.Itoa(int(idOrigen))
		idPuerta, ok := puertas[gateKey]
		if !ok {
			newGate := models.Puerta{Puerta: gateStr, IDCiudad: idOrigen}
			if err := dbConn.Create(&newGate).Error; err == nil {
				puertas[gateKey] = newGate.ID
				idPuerta = newGate.ID
			}
		}

		vuelo := models.Vuelo{
			IDOrigen:      idOrigen,
			IDDestino:     idDestino,
			IDEstadoVuelo: idEstado,
			IDPuerta:      idPuerta,
			IDAvion:       uint(aircraftID),
			FechaSalida:   parseDatetime(flightDate, flightTime),
		}
		batch = append(batch, vuelo)

		if len(batch) >= batchSize || i == len(records)-1 {
			if err := dbConn.Create(&batch).Error; err != nil {
				log.Printf("[Seed] Error inserting vuelos batch: %v", err)
			}
			batch = batch[:0]
		}
	}
	log.Printf("[Seed] Successfully seeded Vuelos into %s", dbConn.Name())
}

func syncPGPuertasToMongo() {
	if db.MongoClient == nil || db.PGAmerica == nil {
		return
	}
	var puertas []models.Puerta
	db.PGAmerica.Find(&puertas)
	
	if len(puertas) == 0 {
		return
	}

	coll := db.MongoDatabase.Collection("puertas")
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	
	log.Printf("[Seed Mongo] Syncing %d puertas from PG to Mongo...", len(puertas))
	
	var updateModels []mongo.WriteModel
	for _, puerta := range puertas {
		filter := bson.M{"id": puerta.ID}
		update := bson.M{"$set": bson.M{
			"id":        puerta.ID,
			"puerta":    puerta.Puerta,
			"id_ciudad": puerta.IDCiudad,
		}}
		updateModels = append(updateModels, mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update).SetUpsert(true))
	}

	if len(updateModels) > 0 {
		opts := options.BulkWrite().SetOrdered(false)
		_, err := coll.BulkWrite(ctx, updateModels, opts)
		if err != nil {
			log.Printf("[Seed Mongo] Error bulk syncing puertas: %v", err)
		} else {
			log.Printf("[Seed Mongo] Successfully synced puertas to MongoDB.")
		}
	}
}

func seedMongoVuelos() {
	if db.MongoClient == nil || db.PGAmerica == nil {
		return
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	coll := db.MongoDatabase.Collection("vuelos")
	count, _ := coll.CountDocuments(ctx, bson.M{})
	if count > 0 {
		return
	}

	datasetPath := "02 - Practica 3 Dataset Flights (1).csv"
	file, err := os.Open(datasetPath)
	if err != nil {
		log.Printf("[Seed Mongo] Warning: could not find %s for seeding vuelos: %v", datasetPath, err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	_, _ = reader.Read() // Skip header

	records, err := reader.ReadAll()
	if err != nil {
		log.Printf("[Seed Mongo] Error reading CSV: %v", err)
		return
	}

	// Cache lookup tables from PG America to keep consistent IDs
	ciudades := make(map[string]uint)
	var ciudadList []models.Ciudad
	db.PGAmerica.Find(&ciudadList)
	for _, c := range ciudadList {
		ciudades[c.Codigo] = c.ID
	}

	estados := make(map[string]uint)
	var estadoList []models.EstadoVuelo
	db.PGAmerica.Find(&estadoList)
	for _, e := range estadoList {
		estados[e.Nombre] = e.ID
	}

	aviones := make(map[uint]uint)
	var avionList []models.Avion
	db.PGAmerica.Find(&avionList)
	for _, a := range avionList {
		aviones[a.ID] = a.ID
	}

	puertas := make(map[string]uint)
	var puertaList []models.Puerta
	db.PGAmerica.Find(&puertaList)
	for _, p := range puertaList {
		puertas[p.Puerta+"_"+strconv.Itoa(int(p.IDCiudad))] = p.ID
	}

	log.Printf("[Seed Mongo] Seeding %d vuelos direct into MongoDB with InsertMany", len(records))
	batchSize := 5000
	var batch []interface{}
	
	idCounter := uint(1)

	for i, record := range records {
		if len(record) < 7 {
			continue
		}

		flightDate := strings.TrimSpace(record[0])
		flightTime := strings.TrimSpace(record[1])
		origin := strings.TrimSpace(record[2])
		destination := strings.TrimSpace(record[3])
		aircraftStr := strings.TrimSpace(record[4])
		statusStr := strings.TrimSpace(record[5])
		gateStr := strings.TrimSpace(record[6])

		idOrigen, ok1 := ciudades[origin]
		idDestino, ok2 := ciudades[destination]
		if !ok1 || !ok2 {
			continue // Skip flights if cities not mapped
		}

		aircraftID, _ := strconv.Atoi(aircraftStr)
		if _, ok := aviones[uint(aircraftID)]; !ok {
			aircraftID = 1
		}

		idEstado, ok := estados[statusStr]
		if !ok {
			idEstado = 1
		}

		gateKey := gateStr + "_" + strconv.Itoa(int(idOrigen))
		idPuerta, ok := puertas[gateKey]
		if !ok {
			newGate := models.Puerta{Puerta: gateStr, IDCiudad: idOrigen}
			if err := db.PGAmerica.Create(&newGate).Error; err == nil {
				puertas[gateKey] = newGate.ID
				idPuerta = newGate.ID
			}
		}

		doc := bson.M{
			"id":             idCounter,
			"id_origen":      idOrigen,
			"id_destino":     idDestino,
			"id_estado_vuelo": idEstado,
			"id_puerta":      idPuerta,
			"id_avion":       uint(aircraftID),
			"fecha_salida":   parseDatetime(flightDate, flightTime),
		}
		idCounter++
		batch = append(batch, doc)

		if len(batch) >= batchSize || i == len(records)-1 {
			if len(batch) > 0 {
				_, err := coll.InsertMany(context.Background(), batch)
				if err != nil {
					log.Printf("[Seed Mongo] Error inserting batch: %v", err)
				}
				batch = batch[:0]
			}
		}
	}
	log.Printf("[Seed Mongo] Successfully seeded vuelos natively into MongoDB.")
}
