FROM golang:1.20.3-buster AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN GOOS=linux go build -o build ./go/cmd

FROM gcr.io/distroless/base AS final
COPY --from=backend /app/build /
EXPOSE 3003
ENTRYPOINT ["/build"]
