package handlers

import (
	"net/http"
	"airres-api/services"

	"github.com/gin-gonic/gin"
)

func GetPredicciones(c *gin.Context) {
	alerts := services.AnalyzeCascadingDelays()
	c.JSON(http.StatusOK, alerts)
}

func GetYield(c *gin.Context) {
	suggestions := services.CalculateDynamicPricing()
	c.JSON(http.StatusOK, suggestions)
}
