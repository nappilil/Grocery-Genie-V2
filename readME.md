# Grocery Genie v2

## To Run the Application Through Docker
```bash
touch .env.docker
```
```bash
# copy the following inside .env.docker
MONGO_URI= # enter mongo db atlas connection string 
```
```bash
docker build --no-cache .
```
```bash
docker-compose up
```

## To Run the Application Locally
```bash
touch .env
```
```bash
# copy the following inside .env
MONGO_URI= # enter mongo db atlas connection string 
```
```bash
npm i
```
```bash
npm start
```

## To Seed The File
```bash
npm run seed
```
## Server
Routes will be running on:
```
http://localhost:3000
```
