import http from "http"
import app from "./app.js"
import "./config/mongodbConfig.js"

const server = http.createServer(app)


const port = process.env.PORT || 8088;

server.listen(port, () => { 
  console.log(`app listening on port ${port}`);
});