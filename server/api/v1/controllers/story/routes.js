const Express = require("express");
const controller = require("./controller");
const upload = require("../../../../helper/uploadHandler");
const auth = require("../../../../helper/auth");

module.exports = Express.Router()
  .use(auth.verifyToken)
  .get("", controller.getStories)
  .delete("", controller.deleteStory)
  .use(upload.uploadFile)
  .post("", controller.creatStory);
