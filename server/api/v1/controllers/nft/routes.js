const Express = require("express");
const controller = require("./controller");
const auth = require("../../../../helper/auth");
const upload = require("../../../../helper/uploadHandler");

module.exports = Express.Router()

    .get("/listAllNft", controller.listAllNft)
    .get("/listAllNft1", controller.listAllNFT1)
    .get("/nftList", controller.allNftAuctionList)
    .get("/nft/:_id", controller.viewNFT)
    .get("/nft1/:_id", controller.viewNFT1)

    .use(auth.verifyToken)

    .get("/viewNft/:_id", controller.viewNft)
    .get('/subscribers/:_id', controller.subscribersUser)
    .delete("/nft", controller.deleteNFT)
    .get("/listNFT", controller.listNFT)
    .get("/bundleList", controller.bundleList)
    .get("/allNftList", controller.allNftList)
    .get("/allNftListWithPopulated", controller.allNftListWithPopulated)

    .post("/createNft", controller.createAuctionNft)
    .get("/viewNft/:_id", controller.viewAuctionNft)
    .put("/editNft", controller.editAuctionNft)
    .get("/myNftList", controller.myAuctionNftList)
    .get("/myNft1List", controller.myAuctionNft1List)

    .get('/searchNft', controller.searchNft)

    .use(upload.uploadFile)
    .put("/nft", controller.editNFT)
    .post("/nft", controller.createNFT)
    .post("/nft1", controller.createNFT1)
