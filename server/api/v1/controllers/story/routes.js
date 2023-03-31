const Express = require("express");
const controller = require("./controller");
const upload = require("../../../../helper/uploadHandler");
const auth = require("../../../../helper/auth");

module.exports = Express.Router()
  .use(auth.verifyToken)
  .get("/:userId", controller.getStories)
  .get("/getStory/:storyId", controller.getStory)
  .get("/getAllStories/:userId", controller.getAllStories)
  .delete("/:storyId", controller.deleteStory)
  .put("/likeDislikeStory/:storyId", controller.likeDislikeStory)
  .put("/watchStory/:storyId", controller.watchStory)
  .use(upload.uploadFile)
  .post("", controller.creatStory);
