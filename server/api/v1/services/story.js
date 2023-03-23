const storyModel = require("../../../models/story");

const storyServices = {
  creatStory: async (query) => {
    return await storyModel.create(query);
  },

  removeStory: async (query) => {
    return await storyModel.deleteOne(query);
  },

  findStory: async (query) => {
    return await storyModel.findOne(query);
  },

  findStories: async (query) => {
    return await storyModel.find(query);
  }
};

module.exports = { storyServices };