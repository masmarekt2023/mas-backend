const Joi = require("joi");
const apiError = require("../../../../helper/apiError");
const responseMessage = require("../../../../../assets/responseMessage");
const { userServices } = require("../../services/user");
const { storyServices } = require("../../services/story");
const commonFunction = require("../../../../helper/util");
const response = require("../../../../../assets/response");
const { findUser } = userServices;
const {
  creatStory,
  removeStory,
  findStory,
  findStories,
  updateStory,
} = storyServices;

class storyController {
  /**
   * @swagger
   * /story/:
   *   get:
   *     tags:
   *       - STORY
   *     description: get all story of the user
   *     produces:
   *       - application/json
   *     parameters:
   *        - name: token
   *          description: user token
   *          in: header
   *          required: true
   *       - name: userId
   *         description: user Id
   *         in: params
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async getStory(req, res, next){
    const validationSchema = {
      storyId: Joi.string().required(),
    };

    try {
      const { storyId } = await Joi.validate(req.params, validationSchema);

      const result = await findStories({ _id: storyId });

      if (!result) {
        return res.json(apiError.notFound("Story Not Found"));
      }

      return res.json(new response(result, responseMessage.STORY_FOUND, 200));
    } catch (e) {
      next(e);
    }
  }

  async getStories(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
    };
    try {
      const { userId } = await Joi.validate(req.params, validationSchema);
      const userResult = await findUser({ _id: userId });
      if (!userResult) {
        return res.json(apiError.notFound(responseMessage.USER_NOT_FOUND));
      }

      const result = await findStories({ userId: userId });

      return res.json(new response(result, responseMessage.STORY_FOUND, 200));
    } catch (e) {
      next(e);
    }
  }

  async getAllStories(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
    };
    try {
      const { userId } = await Joi.validate(req.params, validationSchema);
      const userResult = await findUser({ _id: userId });
      if (!userResult) {
        return res.json(apiError.notFound(responseMessage.USER_NOT_FOUND));
      }

      const result = await findStories({
        userId: { $in: userResult?.following },
      });

      const resultUserIds = [...new Set(result.map(i => i.userId))];

      const filterResult = resultUserIds.map(i => ({
        userId: i,
        result: result.filter((i2) => i2.userId === i),
      }));

      return res.json(
        new response(filterResult, responseMessage.STORY_FOUND, 200)
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * @swagger
   * /story/:
   *   post:
   *     tags:
   *       - STORY
   *     description: create new story
   *     produces:
   *       - application/json
   *     parameters:
   *        - name: token
   *          description: user token
   *          in: header
   *          required: true
   *       - name: file
   *         description: upload file
   *         in: form data
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
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

  /**
   * @swagger
   * /story/:
   *   delete:
   *     tags:
   *       - STORY
   *     description: delete story
   *     produces:
   *       - application/json
   *     parameters:
   *        - name: token
   *          description: user token
   *          in: header
   *          required: true
   *       - name: storyId
   *         description: story Id
   *         in: params
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteStory(req, res, next) {
    const validationSchema = {
      storyId: Joi.string().required(),
    };
    try {
      const { storyId } = await Joi.validate(req.params, validationSchema);

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

  /**
   * @swagger
   * /story/:
   *   put:
   *     tags:
   *       - STORY
   *     description: like dislike story
   *     produces:
   *       - application/json
   *     parameters:
   *        - name: token
   *          description: user token
   *          in: header
   *          required: true
   *       - name: storyId
   *         description: story Id
   *         in: params
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async likeDislikeStory(req, res, next) {
    const validationSchema = {
      storyId: Joi.string().required(),
    };
    try {
      const { storyId } = await Joi.validate(req.params, validationSchema);

      const storyResult = await findStory({ _id: storyId });
      if (storyResult) apiError.notFound(responseMessage.STORY_NOT_FOUND);

      if (storyResult.likeUsers.includes(req.userId)) {
        storyResult.likeUsers = storyResult.likeUsers.filter(
          (i) => i !== req.userId
        );
      } else {
        storyResult.likeUsers.push(req.userId);
      }

      const result = await updateStory(storyId, storyResult);

      return res.json(new response(result, "Like story successfully", 200));
    } catch (e) {
      next(e);
    }
  }

  /**
   * @swagger
   * /story/:
   *   put:
   *     tags:
   *       - STORY
   *     description: add user id when the user watch the story
   *     produces:
   *       - application/json
   *     parameters:
   *        - name: token
   *          description: user token
   *          in: header
   *          required: true
   *       - name: storyId
   *         description: story Id
   *         in: params
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async watchStory(req, res, next) {
    const validationSchema = {
      storyId: Joi.string().required(),
    };
    try {
      const { storyId } = await Joi.validate(req.params, validationSchema);

      const storyResult = await findStory({ _id: storyId });
      if (storyResult) apiError.notFound(responseMessage.STORY_NOT_FOUND);

      if (storyResult.watchUsers.includes(req.userId)) {
        return res.json(new response(null, responseMessage.STORY_WATCH, 400));
      } else {
        storyResult.watchUsers.push(req.userId);
      }

      const result = await updateStory(storyId, storyResult);

      return res.json(new response(result, "Like story successfully", 200));
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new storyController();
