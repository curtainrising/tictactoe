# tictactoe
## Running locally
### Tools
The tools used here are mongodb, mongoexpress, and rabbitmq. To run them locally you can use the existing docker-compose file
```
docker-compose -f docker-compose-local-tools.yml up
```
### Web/Server
To run these manually you should run an npm install in each folder.
To run the server side you can run the script
```
npm run start-dev
```
To run the web side you can run
```
npm run start-dev
```
To run everything locally
```
docker-compose -f docker-compose-local.yml up
```