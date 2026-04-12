package db

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var PGAmerica *gorm.DB
var PGEuropaAsia *gorm.DB

func InitPostgres() {
	dsnAm := os.Getenv("DB_PG1_DSN")
	if dsnAm == "" {
		dsnAm = "host=localhost user=postgres password=root dbname=airres_am port=5432 sslmode=disable"
	}
	dbAm, err := gorm.Open(postgres.Open(dsnAm), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to PG America:", err)
	}
	PGAmerica = dbAm
	log.Println("Connected to PG America")

	dsnEu := os.Getenv("DB_PG2_DSN")
	if dsnEu == "" {
		dsnEu = "host=localhost user=postgres password=root dbname=airres_eu port=5433 sslmode=disable"
	}
	dbEu, err := gorm.Open(postgres.Open(dsnEu), &gorm.Config{})
	if err != nil {
		log.Println("WARNING: Failed to connect to PG Europa (might not be required right now or starting up):", err)
	} else {
		PGEuropaAsia = dbEu
		log.Println("Connected to PG Europa/Asia")
	}
}
