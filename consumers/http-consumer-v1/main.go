package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

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

type NotifierDataRequest struct {
	Message []NotifierData `json:"message"`
	UserId  uuid.UUID      `json:"UserId"`
}

type NotifierData struct {
	Title   string `json:"title"`
	Status  string `json:"status"`
	Failure string `json:"failure"`
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
		"Java", // name
		false,  // durable
		false,  // delete when unused
		false,  // exclusive
		false,  // no-wait
		nil,    // arguments
	)
	failOnError(err, "Failed to declare a queue")

	queueResponse, err := ch.QueueDeclare(
		"Processed", // name
		false,       // durable
		false,       // delete when unused
		false,       // exclusive
		false,       // no-wait
		nil,         // arguments
	)
	failOnError(err, "Failed to declare a queue")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

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
			requestURL := fmt.Sprintf(
				"http://localhost:%d/questions/%s/process?lang=%s",
				serverPort,
				questionId,
				strings.ToLower(data.Lang)) /* NOTE: toLower here is to avoid errors when validating lang on worker. */
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

			var notifierDataReq NotifierDataRequest
			err = json.Unmarshal(resBody, &notifierDataReq)
			notifierDataReq.UserId = data.UserId
			if err != nil {
				fmt.Printf("could not unmarshal notifier data\n")
			}

			notifierDataBytes, err := json.Marshal(notifierDataReq)
			if err != nil {
				log.Printf("[ERROR]: cannot marshal notifier data req")
			}

			err = ch.PublishWithContext(ctx,
				"",                 // exchange
				queueResponse.Name, // routing key
				false,              // mandatory
				false,              // immediate
				amqp.Publishing{
					ContentType: "text/plain",
					Body:        notifierDataBytes,
				})
			failOnError(err, "Failed to publish a message")
			log.Printf(" [x] Sent %s\n", notifierDataReq)
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}
