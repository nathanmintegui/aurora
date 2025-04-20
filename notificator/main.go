package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

type NotifierDataRequest struct {
	Message []NotifierData `json:"message"`
	UserId  uuid.UUID      `json:"UserId"`
}

type NotifierData struct {
	Title   string `json:"title"`
	Status  string `json:"status"`
	Failure string `json:"failure"`
}

func main() {
	http.HandleFunc("/events/{id}", eventsHandler)

	log.Println("Server listening on port 3001...")
	err := http.ListenAndServe(":3001", nil)
	if err != nil {
		log.Fatal("Server error:", err)
	}
}

func eventsHandler(w http.ResponseWriter, r *http.Request) {
	// Configurar cabeçalhos para CORS e SSE
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Type")
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	userId := r.PathValue("id")
	if userId == "" {
		http.Error(w, "UserId is empty.", http.StatusBadRequest)
		return
	}

	log.Printf("[DEBUG]: userID received >> %s", userId)

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Conectar ao RabbitMQ
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		http.Error(w, "Failed to connect to RabbitMQ", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		http.Error(w, "Failed to open a channel", http.StatusInternalServerError)
		return
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"Processed", // nome
		false,       // durável
		false,       // deletar quando não estiver em uso
		false,       // exclusivo
		false,       // sem espera
		nil,         // argumentos
	)
	if err != nil {
		http.Error(w, "Failed to declare a queue", http.StatusInternalServerError)
		return
	}

	msgs, err := ch.Consume(
		q.Name, // fila
		"",     // consumidor
		true,   // auto-ack
		false,  // exclusivo
		false,  // no-local
		false,  // no-wait
		nil,    // argumentos
	)
	if err != nil {
		http.Error(w, "Failed to register a consumer", http.StatusInternalServerError)
		return
	}

	// Canal para encerrar a conexão quando o cliente fechar
	notifyClose := r.Context().Done()

	for {
		select {
		case d, ok := <-msgs:
			if !ok {
				return // Sai do loop se o canal for fechado
			}
			log.Printf("Received a message: %s", d.Body)

			fmt.Fprintf(w, "data: %s\n\n", string(d.Body))

			var data NotifierDataRequest
			err = json.Unmarshal(d.Body, &data)
			if err != nil {
				log.Printf("[ERROR]: could not unmarshall message data")
			}

			/* Envia para o client apenas quando o ID é o mesmo */
			if data.UserId == uuid.MustParse(userId) {
				flusher.Flush()
				return
			}

		case <-notifyClose:
			log.Println("Client disconnected")
			return
		}
	}
}
