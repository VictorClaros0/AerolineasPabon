package db

import (
	"context"
	"log"
	"time"

	"airres-api/config"

	"gorm.io/gorm"
)

// isDBAlive checks if a GORM DB connection is up by pinging
func isDBAlive(db *gorm.DB) bool {
	if db == nil {
		return false
	}
	sqlDB, err := db.DB()
	if err != nil {
		return false
	}
	return sqlDB.Ping() == nil
}

// isMongoAlive checks if the MongoDB connection is up by pinging
func isMongoAlive() bool {
	if MongoClient == nil {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	err := MongoClient.Ping(ctx, nil)
	return err == nil
}

// GetNodeStatuses returns the alive status of all configured database nodes
func GetNodeStatuses() map[string]bool {
	return map[string]bool{
		"america": isDBAlive(PGAmerica),
		"europa":  isDBAlive(PGEuropaAsia),
		"mongo":   isMongoAlive(),
	}
}

// GetDBForCountry returns the appropriate Postgres Database connection and the region name
func GetDBForCountry(countryOrRegion string) (*gorm.DB, string) {
	region := countryOrRegion
	// If it's not a known region code, try to map from country name
	if region != "America" && region != "Europa" && region != "Asia" {
		region = config.GetRegionFromCountry(countryOrRegion)
	}
	
	if region == "America" {
		if isDBAlive(PGAmerica) {
			log.Printf("[Router] Route request to PG America\n")
			return PGAmerica, "America"
		} else if isDBAlive(PGEuropaAsia) {
			log.Printf("[Router] Fallback: PG America down. Route request to PG Europa\n")
			return PGEuropaAsia, "Europa"
		}
	}

	if region == "Europa" {
		if isDBAlive(PGEuropaAsia) {
			log.Printf("[Router] Route request to PG Europa\n")
			return PGEuropaAsia, "Europa"
		} else if isDBAlive(PGAmerica) {
			log.Printf("[Router] Fallback: PG Europa down. Route request to PG America\n")
			return PGAmerica, "America"
		}
	}

	if region == "Asia" {
		if isMongoAlive() {
			log.Printf("[Router] Route request to Mongo Asia\n")
			return nil, "Asia"
		} else if isDBAlive(PGEuropaAsia) {
			log.Printf("[Router] Fallback: Mongo Asia down. Route request to PG Europa\n")
			return PGEuropaAsia, "Europa"
		} else if isDBAlive(PGAmerica) {
			log.Printf("[Router] Fallback: Mongo Asia & PG Europa down. Route request to PG America\n")
			return PGAmerica, "America"
		}
	}

	return PGAmerica, "America"
}
