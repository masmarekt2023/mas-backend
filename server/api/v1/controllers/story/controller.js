const Joi = require("joi");
const apiError = require("../../../../helper/apiError");
const responseMessage = require("../../../../../assets/responseMessage");
const { userServices } = require("../../services/user");
const { storyServices } = require("../../services/story");
const commonFunction = require("../../../../helper/util");
const response = require("../../../../../assets/response");
const { findUser } = userServices;
const { creatStory, removeStory, findStory, findStories } = storyServices;

class storyController {
  async getStories(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
    };
    try {
      const { userId } = await Joi.validate(req.body, validationSchema);
      const userResult = await findUser({ _id: userId });
      if (!userResult) {
        return res.json(apiError.notFound(responseMessage.USER_NOT_FOUND));
      }

      const result = await findStories({ userId: userId });

      return res.json(new response(result, responseMessage.USER_CREATED, 200));
    } catch (e) {
      next(e);
    }
  }

  async creatStory(req, res, next) {
    const validationSchema = {
      url: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        return res.json(apiError.notFound(responseMessage.USER_NOT_FOUND));
      }

      validatedBody.url = await commonFunction.getImageUrl(req.files);

      const resultObj = {
        url: validatedBody.url,
        userId: userResult._id,
        type: req.files[0].mimetype,
      };

      const result = await creatStory(resultObj);

      return res.json(new response(result, responseMessage.CREATE_STORY, 200));
    } catch (e) {
      next(e);
    }
  }

  async deleteStory(req, res, next) {
    const validationSchema = {
      storyId: Joi.string().required(),
    };
    try {
      const { storyId } = await Joi.validate(req.body, validationSchema);

      const storyInfo = await findStory({ _id: storyId });

      if (!storyInfo) {
        return res.json(apiError.notFound(responseMessage.STORY_NOT_FOUND));
      }

      const result = await removeStory({ _id: storyId });

      return res.json(new response(responseMessage.STORY_REMOVE, 200));
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new storyController();
