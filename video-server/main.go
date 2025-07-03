package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RequestBody struct {
	//Data []uint8 `json:"data"`
	Data string `json:"data"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

func main() {
	router := gin.Default()

	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"video_stream_queue", // name
		false,                // durable
		false,                // delete when unused
		false,                // exclusive
		false,                // no-wait
		nil,                  // arguments
	)
	failOnError(err, "Failed to declare a queue")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	msgs, err := ch.Consume(
		"video_stream_queue",
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	router.POST("/video-stream", func(c *gin.Context) {
		var requestBody RequestBody

		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body."})
			return
		}

		_, err := base64.StdEncoding.DecodeString(requestBody.Data)
		if err != nil {
			c.JSON(400, gin.H{"error": "Base64 decoding failed"})
			return
		}

		body := requestBody
		//log.Printf(" [INFO]: Received Body %s.\n\n", body)

		bodyDataBytes, err := json.Marshal(body.Data)
		if err != nil {
			log.Println("[ERROR]: Cannot marshal body into byte array.")
			return
		}

		err = ch.PublishWithContext(ctx,
			"",     // exchange
			q.Name, // routing key
			false,  // mandatory
			false,  // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        bodyDataBytes,
			})
		failOnError(err, "Failed to publish a message")
		//log.Printf(" [x] Sent %s\n", body)

		c.Writer.WriteHeader(202)
	})

	router.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		defer conn.Close()
		for msg := range msgs {
			conn.WriteMessage(websocket.TextMessage, msg.Body)
		}
	})

	router.POST("/video-stream-octet", func(c *gin.Context) {
		rawData, err := c.GetRawData()
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to read brute data."})
			return
		}

		bodyDataBytes, err := json.Marshal(rawData)
		if err != nil {
			log.Fatalf("[ERROR]: Cannot marshal body into byte array.\n\n")
			return
		}

		err = ch.PublishWithContext(ctx,
			"",     // exchange
			q.Name, // routing key
			false,  // mandatory
			false,  // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        bodyDataBytes,
			})
		failOnError(err, "Failed to publish a message")

		c.Writer.WriteHeader(202)
	})

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PATCH", "PUT", "DELETE"}
	config.AllowHeaders = []string{"*"}

	router.Use(cors.New(config))
	router.Run("localhost:2002")
}
