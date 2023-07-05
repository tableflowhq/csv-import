# admin-server

### API docs (Swagger)

Run backend API and view docs here:
http://localhost:3003/public/swagger/index.html

Install swag (https://github.com/swaggo/swag)

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

Format docs

```bash
swag fmt
```

Generate docs

```bash
swag init -d go/pkg/web/,go/pkg/model/,go/pkg/types/ -g server.go --parseInternal -ot yaml,go,json
```

### Misc Backend

Recursively update all packages

```bash
go get -u ./...
go mod tidy
```

Docker
```bash
docker-compose -f docker-compose.dev-frontend.yml up -d
```
```bash
docker-compose -f docker-compose.dev-frontend.yml up -d --build backend
```
```bash
docker-compose -f docker-compose.dev-backend.yml up -d
```
