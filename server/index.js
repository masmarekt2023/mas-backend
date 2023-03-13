const Config = require("config");
const Routes = require("./routes");
const Server = require("./server");

const server = new Server()
  .router(Routes)
  .configureDb(Config.get(`dpUrl`))
  .then((_server) => _server.listen(Config.get("port")));

module.exports = server;
