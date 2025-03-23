package main

import (
	"fmt"
	"log"
	"net/http"

	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	http.HandleFunc("/events", eventsHandler)
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

			// Enviar evento SSE
			fmt.Fprintf(w, "data: %s\n\n", string(d.Body))
			flusher.Flush()

		case <-notifyClose:
			log.Println("Client disconnected")
			return
		}
	}
}
