const Koa = require("koa");
const bodyparser = require("koa-bodyparser");
const routes = require("./routes");
const cors = require("koa-cors");

const app = new Koa();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyparser());
routes.forEach((r) => app.use(r));

app.listen(port);
console.log("RESTful API server started on: " + port);
