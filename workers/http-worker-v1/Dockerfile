FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest
RUN apk --no-cache add bash jq ca-certificates nodejs npm && \
    addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G appuser appuser && \
    mkdir -p /app/tmp && \
    chown -R appuser:appuser /app
WORKDIR /app
COPY --from=builder /app/main .
COPY tests/ ./tests/
RUN chown appuser:appuser main
USER appuser
EXPOSE 4001
ENV GIN_MODE=release
CMD ["./main"]
