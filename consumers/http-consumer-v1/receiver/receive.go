package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

type QueueData struct {
	RequestId  uuid.UUID `json:"RequestId"`
	QuestionId uuid.UUID `json:"QuestionId"`
	UserId     uuid.UUID `json:"UserId"`
	Lang       string    `json:"Lang"`
	Code       string    `json:"Code"`
}

const serverPort = 4001

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

func main() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"Javascript", // name
		false,        // durable
		false,        // delete when unused
		false,        // exclusive
		false,        // no-wait
		nil,          // arguments
	)
	failOnError(err, "Failed to declare a queue")

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	var forever chan struct{}

	go func() {
		for d := range msgs {
			log.Printf("Received a message: %s\n", d.Body)

			var data QueueData

			err = json.Unmarshal(d.Body, &data)
			if err != nil {
				fmt.Printf("could not unmarshal queue messagez\n")
			}

			/* Attempt to perform HTTP request for worker */
			questionId := "5353aedc-c178-4677-a9dd-53cb2644a078"

			jsonBody := []byte(data.Code)
			bodyReader := bytes.NewReader(jsonBody)
			requestURL := fmt.Sprintf("http://localhost:%d/questions/%s/process", serverPort, questionId)
			req, err := http.NewRequest(http.MethodPost, requestURL, bodyReader)
			if err != nil {
				fmt.Printf("client: could not create request: %s\n", err)
			}

			res, err := http.DefaultClient.Do(req)
			if err != nil {
				fmt.Printf("client: error making http request: %s\n", err)
			}

			resBody, err := io.ReadAll(res.Body)
			if err != nil {
				fmt.Printf("client: could not read response body: %s\n", err)
			}
			fmt.Printf("client: response body: %s\n", resBody)
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}
