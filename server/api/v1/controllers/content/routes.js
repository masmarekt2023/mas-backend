const Express = require("express");
const controller = require("./controller");
const auth = require("../../../../helper/auth");
const upload = require("../../../../helper/uploadHandler");

module.exports = Express.Router()

  .get("/content", controller.viewContent)
  .get("/landingContentList", controller.landingContentList)
  .get("/staticContentList", controller.staticContentList)

  .use(upload.uploadFile)
  .post("/uploadFile", controller.uploadFile)

  .use(auth.verifyToken)
  .post("/content", controller.createContent)
  .put("/content", controller.editContent)
  .put("/updateContentStatus", controller.updateContentStatus);
