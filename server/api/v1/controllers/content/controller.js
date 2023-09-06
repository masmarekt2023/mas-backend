const Joi = require("joi");
const response = require("../../../../../assets/response");
const responseMessage = require("../../../../../assets/responseMessage");
const { contentServices } = require("../../services/content");
const { findContent, updateContent } = contentServices;
const commonFunction = require("../../../../helper/util");
const contentModel = require("../../../../models/content");
const status = require("../../../../enums/status");

class contentController {
  /**
   * @swagger
   * /content/content:
   *   get:
   *     tags:
   *       - CONTENT
   *     description: viewContent
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: type
   *         description: type-talent/solution/howItWorks
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async viewContent(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
      type: Joi.string().valid("solution", "howItWorks").required(),
    };
    try {
      const validBody = await Joi.validate(req.query, validationSchema);
      var result = await findContent(validBody);
      return res.json(new response(result, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /content/content:
   *   put:
   *     tags:
   *       - CONTENT
   *     description: editContent
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: editContent
   *         description: editContent
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/editContent'
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async createContent(req, res, next) {
    const validationSchema = {
      title: Joi.string().optional().allow(""),
      type: Joi.string().valid("flexible", "static").required(),
      description: Joi.string().optional().allow(""),
      contentFile: Joi.string().optional().allow(""),
      background: Joi.string().optional().allow(""),
      contents: Joi.any(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      for (let file of req.files) {
        validatedBody[file.fieldname] = await commonFunction.getFileUrlOnPhone(
          file.path
        );
      }
      validatedBody.contents = JSON.parse(validatedBody.contents);
      const result = await contentModel.create(validatedBody);
      return res.json(new response(result, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  async editContent(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
      title: Joi.string().optional().allow(""),
      description: Joi.string().optional().allow(""),
      contentFile: Joi.string().optional().allow(""),
      background: Joi.string().optional().allow(""),
      contents: Joi.any(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      for (let file of req.files) {
        validatedBody[file.fieldname] = await commonFunction.getFileUrlOnPhone(
          file.path
        );
      }
      validatedBody.contents = JSON.parse(validatedBody.contents);
      await updateContent({ _id: validatedBody._id }, validatedBody);
      return res.json(new response(null, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /content/landingContentList:
   *   get:
   *     tags:
   *       - CONTENT
   *     description: landingContentList
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async landingContentList(req, res, next) {
    try {
      const result = await contentModel.find({
        status: { $ne: status.DELETE },
        type: "flexible"
      });
      return res.json(new response(result, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  async staticContentList(req, res, next) {
    try {
      const result = await contentModel.find({
        status: { $ne: status.DELETE },
        type: "static"
      });
      return res.json(new response(result, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  async updateContentStatus(req, res, next) {
    const validationSchema = {
      id: Joi.string().required(),
      status: Joi.string().valid("ACTIVE", "BLOCK", "DELETE").required(),
    };
    try {
      const { id, status } = await Joi.validate(req.body, validationSchema);
      await contentModel.findByIdAndUpdate(id, { status: status });

      const resMessage = `Section ${
        status === "BLOCK"
          ? "Blocked"
          : status === "DELETE"
          ? "Deleted"
          : "Active"
      } Successfully`;

      return res.json(new response(null, resMessage));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /content/uploadFile:
   *   post:
   *     tags:
   *       - CONTENT
   *     description: uploadFile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: file
   *         description: file
   *         in: formData
   *         required: true
   *         type: file
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async uploadFile(req, res, next) {
    try {
      let result = await commonFunction.getImageUrl(req.files);
      return res.json(new response(result, responseMessage.UPLOAD_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new contentController();
