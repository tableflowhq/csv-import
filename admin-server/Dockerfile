FROM golang:1.20.3-buster AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o build ./go/cmd

FROM ubuntu:latest AS final
COPY --from=backend /app/build /
EXPOSE 3003
ENTRYPOINT ["/build"]
