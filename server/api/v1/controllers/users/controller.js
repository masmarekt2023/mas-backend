const Joi = require("joi");
const _ = require("lodash");
const config = require("config");
const jwt = require("jsonwebtoken");
const userModel = require("../../../../models/user");
const apiError = require("../../../../helper/apiError");
const response = require("../../../../../assets/response");
const bcrypt = require("bcryptjs");
const responseMessage = require("../../../../../assets/responseMessage");
const {userServices} = require("../../services/user");
const {subscriptionServices} = require("../../services/subscription");
const {buyingServices} = require("../../services/buying");
const {bundleServices} = require("../../services/bundle");
const {nftServices} = require("../../services/nft");
const {nft1Services} = require("../../services/nft1");
const {audienceServices} = require("../../services/audience");
const {notificationServices} = require("../../services/notification");
const {reportServices} = require("../../services/report");
const {chatServices} = require("../../services/chat");
const {transactionServices} = require("../../services/transaction");
const {auctionNftServices} = require("../../services/auctionNft");
const {donationServices} = require("../../services/donation");
const {orderServices} = require("../../services/order");
const {feeServices} = require("../../services/fee");
const {earningServices} = require("../../services/earning");
const {referralServices} = require("../../services/referral");
const {advertisementServices} = require("../../services/advertisement");
const {bannerServices} = require("../../services/banner");
const {
    followersList,
    followingList,
    latestUserListWithPagination,
    createUser,
    findUser,
    deleteUserBy_Id,
    deactivateUser,
    findUserData,
    updateUser,
    updateUserById,
    addbillUserById,
    userAllDetails,
    userAllDetailsByUserName,
    userSubscriberListWithPagination,
    userSubscriberList,
    findUserWithSelect,
    allUsersList,
    paginateSearch,
} = userServices;
const {
    createSubscription,
    findSubscription,
    updateSubscription,
    subscriptionList,
    subscriptionListWithAggregate,
    subscriptionWithPaginate,
    subscriptionWithPaginate1
} = subscriptionServices;
const {
    createbuying,
    
} = buyingServices;
const {findBundle} = bundleServices;
const {
    findNft,
    updateNft,
    nftSubscriber,
    nftSubscriberList,
    multiUpdateBundle,
    sharedBundleList,
    sharedBundleListPerticular,
    findUserNft,
} = nftServices;
const {
    findNFT1,
    findNFT11,
} = nft1Services;

const {
    createAudience,
    findAudience,
    findAudience1,
    updateAudience,
    feedUpdateAll,
    postList,
    audienceContentList,
    feedWithPagination
} = audienceServices;
const {createNotification} = notificationServices;
const {createReport, findReport} = reportServices;
const {findChat} = chatServices;
const {
    createTransaction,
    findTransaction,
    transactionList,
    depositeList,
    depositListWithPagination,
    depositListWithPopulate,
} = transactionServices;
const {findAuctionNft, updateAuctionNft} = auctionNftServices;
const {createDonation, findDonation, updateDonation, donationList} =
    donationServices;
const {updateOrder} = orderServices;
const {sortFee} = feeServices;
const {createEarning, findEarning, updateEarning, earningList} =
    earningServices;
const {findReferral} = referralServices;
const {findAdvertisements} = advertisementServices;
const {findBanner, paginateSearchBanner} = bannerServices;
const Twilio = require("../../../../helper/twilio");
const commonFunction = require("../../../../helper/util");
const fs = require("fs");
const status = require("../../../../enums/status");
const userType = require("../../../../enums/userType");
const nftModel = require("../../../../models/nft");
const bannerModel = require("../../../../models/banner");
const bannerAppModel = require("../../../../models/bannerApplication");
const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const tf = require('@tensorflow/tfjs-node');
tf.setBackend('tensorflow');
const { Canvas,ImageData } = canvas;
//const imageSize = require('image-size');

//const sizeOf = require('image-size');
const { createCanvas, loadImage } = require('canvas');
const { image } = require('image-js');
const { Readable } = require('readable-stream');
const { ItemAssignmentList } = require("twilio/lib/rest/numbers/v2/regulatoryCompliance/bundle/itemAssignment");

class userController {
    /**
     * @swagger
     * /user/sendOtpRegister:
     *   put:
     *     tags:
     *       - USER
     *     description: sendOtpRegister
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: email
     *         description: user email
     *         in: body
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async sendOtpRegister(req, res, next) {
        const validationSchema = {
            email: Joi.string().required(),
        };
        try {
            const {email} = await Joi.validate(req.body, validationSchema);
            const verify = await Twilio.sendVerification(
                email,
                "email",
                "register",
                ""
            );

            if (verify.status !== "pending") {
                return res.json(
                    new response(
                        {verification_sent: {email: false}},
                        "Verification email Service Error",
                        403
                    )
                );
            }
            return res.json(new response({otp: "sent"}, responseMessage.OTP_SEND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/register:
     *   post:
     *     tags:
     *       - USER
     *     description: register
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: register
     *         description: register
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/register'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async register(req, res, next) {
        const validationSchema = {
            userName: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string().allow(null, "").optional(),
            password: Joi.string().required(),
            otp: Joi.string().length(6).required(),
            referralCode: Joi.string().allow(null, "").optional(),
        };
        try {
            var result,
                firstCommission = {};
            const validatedBody = await Joi.validate(req.body, validationSchema);
            const {userName, password, email, phone, referralCode, otp} =
                validatedBody;

            var adminResult = await findUser({userType: userType.ADMIN});

            var userInfo = await findUser({
                $or: [{userName: userName}, {email: email}, {phone: phone}],
            });
            if (userInfo) {
                if (userInfo.email == email) {
                    return res.json(apiError.conflict(responseMessage.EMAIL_EXIST));
                }
                if (userInfo.phone == phone) {
                    return res.json(apiError.conflict(responseMessage.MOBILE_EXIST));
                }
                return res.json(apiError.conflict(responseMessage.USER_NAME_EXIST));
            }

            let userETHWallet = commonFunction.generateETHWallet();

            var obj = {
                name: userName,
                userName: userName,
                email: email,
                phone: phone,
                ethAccount: {
                    address: userETHWallet.address.toLowerCase(),
                    privateKey: userETHWallet.privateKey,
                },
                walletAddress: userETHWallet.address,
                password: bcrypt.hashSync(password),
                referralCode: await commonFunction.getReferralCode(),
                userType: userType.CREATOR,
                masBalance: 0,
                usdtBalance: 0,
                bnbBalance: 0,
                busdBalance: 0
            };

            if (referralCode) {
                let referralResult = await findUser({
                    referralCode: referralCode,
                    status: {$ne: status.DELETE},
                });
                if (!referralResult) {
                    return res.json(
                        apiError.notFound(responseMessage.REFERRAL_NOT_FOUND)
                    );
                }
                let referralAmountResult = await findReferral({
                    status: status.ACTIVE,
                });
                await updateUser(
                    {_id: referralResult._id},
                    {$inc: {masBalance: referralAmountResult.referralAmount}}
                );
                obj.referralUserId = referralResult._id;
                obj.masBalance = referralAmountResult.refereeAmount;
                var totalReferralAmount =
                    referralAmountResult.referralAmount +
                    referralAmountResult.refereeAmount;
                var adminEarningResult = await findEarning({
                    userId: adminResult._id,
                    status: status.ACTIVE,
                });
                if (!adminEarningResult) {
                    firstCommission.userId = adminResult._id;
                    firstCommission.referralBalance = totalReferralAmount;
                    await createEarning(firstCommission);
                } else {
                    await updateEarning(
                        {_id: adminEarningResult._id},
                        {$inc: {referralBalance: totalReferralAmount}}
                    );
                }
            }

            const verify = await Twilio.checkVerification(email, otp);
            if (verify.status === "pending" || !verify?.valid) {
                return res.json(
                    new response({verified: false}, "Code expired or invalid", 404)
                );
            }
            if (verify?.valid) {
                obj.emailVerification = true;
            }

            /*const verifyEmail = await Twilio.sendVerification(email,'email', 'register', userName);
      console.log("verifyEmail",verifyEmail)
      if(verifyEmail.status == 400){
        return res.json(new response({email_verification_sent:false}, "Email invalid", 400));
      }
      if(verifyEmail.status == 403){
        return res.json(new response({email_verification_sent:false}, "Email Verification Servive Unavailable", 403));
      }*/

            /****** ATTENTION THIS PART WILL BE ACTIVATED ANYTIME SOON */
            /*const verifyPhone = await Twilio.sendVerification(phone,'sms');
       console.log("verifyPhone",verifyPhone)
       if(verifyPhone.status == 400){
       return res.json(new response({phone_verification_sent:false}, "Phone number invalid", 400));
       }
       if(verifyPhone.status == 403){
        return res.json(new response({phone_verification_sent:false}, "SMS Verification Servive Unavailable", 403));
       }*/

            result = await createUser(obj);
            let token = await commonFunction.getToken({
                id: result._id,
                email: result.email,
                userType: result.userType,
            });
            return res.json(
                new response(
                    {
                        token: token,
                        sms_verification_sent: true,
                        email_verification_sent: true,
                    },
                    responseMessage.USER_CREATED
                )
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/login:
     *   post:
     *     tags:
     *       - USER
     *     description: login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: login
     *         description: login
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/login'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async login(req, res, next) {
        const validationSchema = {
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        };
        try {
            let token;
            const {email, password} = await Joi.validate(
                req.body,
                validationSchema
            );
            var userResult = await findUser({email: email});
            if (!userResult) {
                return res.json(new response({}, responseMessage.USER_NOT_FOUND));
            }

            if (userResult.blockStatus === true) {
                return res
                    .status(403)
                    .json(new response({}, responseMessage.LOGIN_NOT_ALLOWED));
            }
            if (!bcrypt.compareSync(password, userResult.password)) {
                return res
                    .status(400)
                    .json(new response({}, responseMessage.INCORRECT_LOGIN));
            }
            token = await commonFunction.getToken({
                id: userResult._id,
                email: userResult.email,
                userType: userResult.userType,
            });
            let obj = {
                userName: userResult.userName,
                name: userResult.name,
                token: token,
                isNewUser: userResult.isNewUser,
                isEmailVerified: userResult.emailVerification,
                isPhoneVerified: userResult.phoneVerification,
            };
            if (userResult.isNewUser)
                await updateUser({_id: userResult._id}, {isNewUser: false});
            return res.json(new response(obj, responseMessage.LOGIN));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/verifyOtp:
     *   put:
     *     tags:
     *       - USER
     *     description: verifyOtp
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: verifyOtp
     *         description: verifyOtp
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/verifyOtp'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async verifyOtp(req, res, next) {
        const validationSchema = {
            otp: Joi.string().length(6).required(),
            channel: Joi.string().allow(["email", "sms"]).required(),
            context: Joi.string()
                .allow(["register", "verifyLater", "withdraw"])
                .required(),
            txid: Joi.string().allow(null).optional(),
        };
        try {
            const {otp, channel, context, txid} = await Joi.validate(
                req.body,
                validationSchema
            );
            let userResult = await findUserWithSelect({_id: req.userId});
            if (!userResult) {
                return res.json(
                    new response(apiError.notFound(responseMessage.USER_NOT_FOUND))
                );
            }
            let tx;
            if (context === "withdraw") {
                tx = await transactionServices.findTransaction({
                    userId: req.userId,
                    _id: txid,
                });
                if (!tx) {
                    return res.json(
                        new response(apiError.notFound(responseMessage.DATA_NOT_FOUND))
                    );
                }
            }

            const to = channel === "email" ? userResult.email : userResult.phone;
            const verify = await Twilio.checkVerification(to, otp);
            if (verify.status == "400") {
                return res.json(
                    new response({verified: false}, "Email invalid", 400)
                );
            }
            if (verify.status === "pending" || !verify?.valid) {
                return res.json(
                    new response({verified: false}, "Code expired or invalid", 404)
                );
            }

            if (verify?.valid || verify.status == "approved") {
                if (context === "verifyLater") {
                    if (channel === "email") userResult.emailVerification = true;
                    if (channel === "sms") userResult.phoneVerification = true;
                    await userResult.save();
                }
                if (context === "withdraw") {
                    if (channel === "email") tx.email_security_verification = true;
                    if (channel === "sms") tx.sms_security_verification = true;
                    if (tx.email_security_verification) {
                        tx.transactionStatus = "APPROVED";
                    }
                    await tx.save();
                }

                return res.json(
                    new response(
                        {verified: verify?.valid},
                        responseMessage.OTP_VIRIFIED
                    )
                );
            }
            return res.json(
                new response({verified: verify?.valid}, "Code invalid", 400)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/resendOtp:
     *   put:
     *     tags:
     *       - USER
     *     description: resendOtp
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: resendOtp
     *         description: resendOtp
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/resendOtp'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async resendOtp(req, res, next) {
        const validationSchema = {
            channel: Joi.string().required(),
            context: Joi.string()
                .allow(["register", "verifyLater", "withdraw"])
                .required(),
        };
        try {
            const {channel, context} = await Joi.validate(
                req.body,
                validationSchema
            );
            let userResult = await findUserWithSelect({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const to = channel === "email" ? userResult.email : userResult.phone;
            const verify = await Twilio.sendVerification(
                to,
                channel,
                context,
                userResult.userName
            );

            if (verify.status == 400) {
                return res.json(
                    new response(
                        {verification_sent: {[channel]: false}},
                        "Verification " + channel + " Error sending code to " + to,
                        400
                    )
                );
            }
            if (verify.status == 403) {
                return res.json(
                    new response(
                        {verification_sent: {[channel]: false}},
                        "Verification " + channel + " Service Error",
                        403
                    )
                );
            }
            return res.json(new response({otp: "sent"}, responseMessage.OTP_SEND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/forgotPassword:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: forgotPassword
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: forgotPassword
     *         description: forgotPassword
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/forgotPassword'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async forgotPassword(req, res, next) {
        var validationSchema = {
            email: Joi.string().email().required(),
        };
        try {
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const {email} = validatedBody;
            var userResult = await findUser({email: email});
            if (!userResult) {
                return res.json(apiError.notFound(responseMessage.USER_NOT_FOUND));
            }

            const verifyEmail = await Twilio.sendVerification(
                email,
                "email",
                "reset_password",
                userResult.userName
            );
            if (verifyEmail.status == 400) {
                return res.json(
                    new response({email_verification_sent: false}, "Email invalid", 400)
                );
            }
            if (verifyEmail.status == 403) {
                return res.json(
                    new response(
                        {email_verification_sent: false},
                        "Email Verification Servive Unavailable",
                        403
                    )
                );
            }

            await updateUser({_id: userResult._id}, {isReset: true});
            return res.json(
                new response(
                    {email_verification_sent: true},
                    responseMessage.RESET_LINK_SEND
                )
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /admin/resetPassword:
     *   put:
     *     tags:
     *       - ADMIN
     *     description: resetPassword
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: path
     *         required: true
     *       - name: resetPassword
     *         description: resetPassword
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/resetPassword'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async resetPassword(req, res, next) {
        var validationSchema = {
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
            otp: Joi.string().length(6).required(),
        };
        try {
            const {email, password, otp} = await Joi.validate(
                req.body,
                validationSchema
            );
            var userResult = await findUser({email: email});
            if (!userResult) {
                return res.json(
                    new response(apiError.notFound(responseMessage.USER_NOT_FOUND))
                );
            }
            if (!userResult.isReset) {
                return res.json(
                    new response({verified: false}, "Error invalid request", 401)
                );
            }
            const verify = await Twilio.checkVerification(userResult.email, otp);
            if (verify.status == "400") {
                return res.json(
                    new response({verified: false}, "Email invalid", 400)
                );
            }
            if (verify.status == "404") {
                return res.json(
                    new response({verified: false}, "Code expired or invalid", 404)
                );
            }
            if (verify?.valid || verify.status == "approved") {
                userResult.password = bcrypt.hashSync(password);
                userResult.isReset = false;
                await userResult.save();
                return res.json(
                    new response({verified: verify?.valid}, responseMessage.PWD_CHANGED)
                );
            }
            return res.json(
                new response({verified: verify?.valid}, "Code invalid", 400)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/profile:
     *   get:
     *     tags:
     *       - USER
     *     description: profile
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async profile(req, res, next) {
        try {
            let userResult = await findUserWithSelect({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            var commissionResult = await sortFee({
                masHeld: {$lte: userResult.masBalance},
                status: status.ACTIVE,
            });

            var userDetails = {
                ...userResult._doc,
                withdrawFees: commissionResult?.contentCreatorFee || 1,
            };

            return res.send({
                userDetails,
                responseMessage: responseMessage.USER_DETAILS,
                statusCode: 200,
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/totalEarnings:
     *   get:
     *     tags:
     *       - USER
     *     description: totalEarnings
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async getTotalEarnings(req, res, next) {
        try {
            var userResult = await findUserWithSelect({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var result = await findEarning({
                userId: userResult._id,
                status: status.ACTIVE,
            });
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/commissionFee:
     *   get:
     *     tags:
     *       - USER
     *     description: getCommissionFee
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: mas
     *         description: mas
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async getCommissionFee(req, res, next) {
        try {
            var result = await sortFee({
                masHeld: {$lte: req.query.mas},
                status: status.ACTIVE,
            });
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/allUserList:
     *   get:
     *     tags:
     *       - USER
     *     description: allUserList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: type
     *         description: type-User/Creator
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async allUserList(req, res, next) {
        const validationSchema = {
            search: Joi.string().optional(),
            type: Joi.string().valid(userType.USER, userType.CREATOR).optional(),
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);

            var result = await allUsersList(validatedBody);
            var earnings = await earningList({});
            let usersWithEarnings = result.docs.map((user) => {
                const index = earnings.findIndex(
                    (el) => el.userId.toString() == user._id.toString()
                );
                if (index !== -1) {
                    const {masBalance, busdBalance, usdtBalance, referralBalance} =
                        earnings[index];
                    return {
                        ...user.toObject(),
                        masBalance,
                        busdBalance,
                        usdtBalance,
                        referralBalance,
                    };
                }
                return user.toObject();
            });
            result.docs = usersWithEarnings;
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/searchUser:
     *   get:
     *     tags:
     *       - USER
     *     description: searchUser
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: filter
     *         description: items that search will filter with
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async searchUser(req, res, next) {
        const validationSchema = {
            search: Joi.string().optional(),
            filter: Joi.array().optional(),
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);

            const result = await paginateSearch(validatedBody);
            const earnings = await earningList({});
            const usersWithEarnings = result.docs.map((user) => {
                const index = earnings.findIndex(
                    (el) => el.userId.toString() == user._id.toString()
                );
                if (index !== -1) {
                    const {masBalance, busdBalance, usdtBalance, referralBalance} =
                        earnings[index];
                    return {
                        ...user.toObject(),
                        masBalance,
                        busdBalance,
                        usdtBalance,
                        referralBalance,
                    };
                }
                return user.toObject();
            });
            result.docs = usersWithEarnings;
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/userprofile:
     *   get:
     *     tags:
     *       - USER
     *     description: profile
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async userprofile(req, res, next) {
        try {
            let userResult = await findUserData({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(new response(userResult, responseMessage.USER_DETAILS));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/nftTransactionList:
     *   get:
     *     tags:
     *       - USER
     *     description: nftTransactionList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async nftTransactionList(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let result = await transactionList({
                nftUserId: userResult._id,
                status: {$ne: status.DELETE},
            });
            if (result.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/myTransactionHistory:
     *   get:
     *     tags:
     *       - USER
     *     description: myTransactionHistory
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async myTransactionHistory(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let result = await transactionList({
                userId: userResult._id,
                status: {$ne: status.DELETE},
            });
            if (result.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/getUser/{userName}:
     *   get:
     *     tags:
     *       - USER
     *     description: getUser
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: false
     *       - name: userName
     *         description: userName
     *         in: path
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async getUser(req, res, next) {
        const validationSchema = {
            userName: Joi.string().required(),
        };
        try {
            let userResult;
            const {userName} = await Joi.validate(req.params, validationSchema);
            userResult = await userAllDetailsByUserName(userName);
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(new response(userResult, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/getUserDetail/{userName}:
     *   get:
     *     tags:
     *       - USER
     *     description: getUser
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: userName
     *         description: userName
     *         in: path
     *         required: true
     *       - name: token
     *         description: token
     *         in: header
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async getUserDetail(req, res, next) {
        const validationSchema = {
            userName: Joi.string().required(),
        };
        try {
            let userResult;
            const {userName} = await Joi.validate(req.params, validationSchema);
            if (req.headers.token) {
                jwt.verify(
                    req.headers.token,
                    config.get("jwtsecret"),
                    async (err, result) => {
                        if (err) {
                            throw apiError.unauthorized();
                        } else {
                            userModel.findOne({_id: result.id}, async (error, result2) => {
                                if (error) {
                                    return next(error);
                                } else if (!result2) {
                                    return apiError.notFound(responseMessage.USER_NOT_FOUND);
                                } else {
                                    if (result2.status == "BLOCK") {
                                        throw apiError.forbidden(responseMessage.BLOCK_BY_ADMIN);
                                    } else if (result2.status == "DELETE") {
                                        throw apiError.unauthorized(
                                            responseMessage.DELETE_BY_ADMIN
                                        );
                                    } else {
                                        userResult = await userAllDetailsByUserName(
                                            userName,
                                            result2._id
                                        );
                                        if (!userResult) {
                                            return apiError.notFound(responseMessage.USER_NOT_FOUND);
                                        }
                                        return res.json(
                                            new response(userResult, responseMessage.DATA_FOUND)
                                        );
                                    }
                                }
                            });
                        }
                    }
                );
            } else {
                userResult = await userAllDetailsByUserName(userName);
                if (!userResult) {
                    return apiError.notFound(responseMessage.USER_NOT_FOUND);
                }
                return res.json(new response(userResult, responseMessage.DATA_FOUND));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/userAllDetails/{_id}:
     *   get:
     *     tags:
     *       - USER
     *     description: userAllDetails
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async userAllDetails(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required(),
        };
        try {
            const {_id} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var subscriberDetails = [];
            let result = await userAllDetails(
                _id,
                userResult._id,
                userResult.subscribeNft
            );
            let data = result[0].bundleDetails;
            for (let i = 0; i < userResult.subscribeNft.length; i++) {
                for (let j = 0; j < data.length; j++) {
                    if (
                        userResult.subscribeNft[i].toString() === data[j]._id.toString()
                    ) {
                        subscriberDetails.push(data[j]);
                    }
                }
            }
            result = result[0];
            result.subscribeDetails = subscriberDetails;
            return res.send({
                result,
                responseMessage: responseMessage.DATA_FOUND,
                statusCode: 200,
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/updateProfile:
     *   put:
     *     tags:
     *       - USER
     *     description: updateProfile
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: updateProfile
     *         description: updateProfile
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/updateProfile'
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async updateProfile(req, res, next) {
    try {
      let validatedBody = req.body;

      if (validatedBody.profilePic) {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
      }
      if (validatedBody.coverPic) {
        validatedBody.coverPic = await commonFunction.getSecureUrl(
          validatedBody.coverPic
        );
      }
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        return apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      validatedBody.isUpdated = true;
       
      let updated = await updateUserById(userResult._id, validatedBody);
      return res.json(new response(updated, responseMessage.PROFILE_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

    async  bill(req, res, next) {
    // Validation schema
    const validationSchema = Joi.object({
        name: Joi.string().required(),
        surname: Joi.string().required(),
        email: Joi.string().required(), 
        phoneNumber: Joi.string().optional(),
        postcode: Joi.string().required(),
        address1: Joi.string().required(),
        address2: Joi.string().required(),
    }).unknown(false);
    console.log('Received PUT request to /user/bill with data:', req.body);

    const validateBody = (body, schema) => {
        return new Promise((resolve, reject) => {
            const { error, value } = schema.validate(body);
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        });
    };

    try {
        // Validate request body against schema
        const validatedBody = await validateBody(req.body, validationSchema);

        // Destructure validated data
        const { name, surname, email, phoneNumber,postcode, address1, address2 } = validatedBody;


        // Preparing the bill object
        const Bill = {
            name,
            surname,
            email,
            phoneNumber,
            postcode,
            address1,
            address2,
        };

        // Function to add bill - make sure this function is defined and imported properly
        let updated = await addbillUserById(req.userResult, Bill);

        // Assuming `response` and `responseMessage` are properly defined elsewhere
        return res.json({ success: true, data: updated, message: responseMessage.BILL_ADDED });
    } catch (error) {
        console.error('Error processing request:', error);
        if (error.isJoi) { // Handling Joi validation errors specifically
            return res.status(400).json({ error: error.details[0].message });
        }
        next(error); // Passing to the error-handling middleware
    }
  }

  async order(req, res, next) {
    console.log('Start processing PUT request to /user/order');
    const validationSchema = {
        nft1Id: Joi.string().required(),
    };
    try {
        const {nft1Id} = await Joi.validate(req.body, validationSchema);
        let userResult = await findUserData({userId: req.userId});
        if (!userResult) {
            console.error('User not found');
            throw apiError.notFound(responseMessage.USER_NOT_FOUND);
        }
        
        console.log('Finding admin user');
        var adminResult = await findUser({userType: userType.ADMIN});
        let Item = await findNFT1({
            _id: nft1Id,
            status: {$ne: status.DELETE},
        });
        if (!Item) {
            console.error('NFT not found');
            return apiError.notFound(responseMessage.NFT_NOT_FOUND);
        }
        
        let balance = Item.coinName.toLowerCase() + "Balance";
        console.log(`Price Required: ${Item.donationAmount},balance Available: ${userResult[balance]}`);
        if (userResult[balance] >= Item.donationAmount) {
            let CreatorUser = await findUser({
                _id: Item.userId,
                status: {$ne: status.DELETE},
            });
            console.log('item:', nft1Id);
            console.log('buyer:', userResult._id);
        

            let updateQuery = {};
            let updateQuery1 = {$addToSet: {buyNft1: Item._id}};
            var commissionObj = {},
                earningObj = {},
                firstCommission = {},
                userEarn = {};
            var donationAmount = Item.donationAmount;
            var commissionResult = await sortFee({
                masHeld: {$lte: userResult[balance]},
                status: status.ACTIVE,
            });
            
            
            var commissionFee =
            Number(donationAmount) * (commissionResult ? commissionResult.contentCreatorFee : 1 / 100)/100;
            var nft1DonationAmount = Number(donationAmount) + commissionFee;

            console.log('price of item:', donationAmount);
            console.log('fee:',commissionFee);
            console.log('fee of platform:', ((commissionResult ? commissionResult.contentCreatorFee:1/100)/100));
            console.log('price of item before fee:', nft1DonationAmount);

            updateQuery.$inc = {[balance]: Number(nft1DonationAmount)};
            updateQuery1.$inc = {[balance]: -Number(donationAmount)};
            commissionObj.$inc = {[balance]: Number(commissionFee)};
            earningObj.$inc = {[balance]: Number(nft1DonationAmount)};
            firstCommission[balance] = commissionFee;
            userEarn[balance] = nft1DonationAmount;

            if (!CreatorUser.supporters.includes(userResult._id)) {
                updateQuery.$addToSet = {supporters: Item.userId};
            }

            await updateUser({_id: ( CreatorUser._id)}, updateQuery);
            await updateUser({_id: (userResult._id)}, updateQuery1);

            let duration = Item.duration.split(" ")[0];
            var myDate = new Date().toISOString();
            myDate = new Date(myDate);
            myDate.setDate(myDate.getDate() + parseInt(duration));
            let validTillDate = myDate.toISOString();
            await createbuying({
                title: Item.itemTitle,
                name: Item.itemName,
                description: Item.details,
                validTillDate: validTillDate,
                duration: duration,
                masPrice: Item.donationAmount,
                nft1Id: Item._id,
                userId: userResult._id,
                fromAddress: userResult.ethAccount.address,
                toAddress: CreatorUser.ethAccount.address,
                amount: donationAmount,
            });
            await createTransaction({
                userId: userResult._id,
                nft1Id: Item._id,
                toDonationUser: CreatorUser._id,
                amount: donationAmount,
                transactionType: "buying",
                transactionStatus: "SUCCESS",
                adminCommission: commissionFee,
                coinName: Item.coinName,
            });
            console.log('item:', Item._id);
            console.log('buyer:', userResult._id);
            console.log('seller:', CreatorUser._id);
            console.log('coin:',Item.coinName);
            console.log('price:',donationAmount);
            console.log('fee:',commissionFee);
            

            await createNotification({
                title: `Item buy Notification!`,
                description: `Your item ${
                    Item.itemName
                } has been buyed by ${
                    userResult.name
                        ? userResult.name
                        : userResult.userName
                            ? userResult.userName
                            : "a new user."
                }.`,
                userId: Item.userId,
                nft1Id: Item._id,
                notificationType: "Item_buy",
                buyId: userResult._id,
            });
            Item.subscribers.push(userResult._id);
            await Item.save();
            var adminEarningResult = await findEarning({
                userId: adminResult._id,
                status: status.ACTIVE,
            });
            var userEarningResult = await findEarning({
                userId: Item._id,
                status: status.ACTIVE,
            });
            if (!adminEarningResult) {
                firstCommission.userId = adminResult._id;
                await createEarning(firstCommission);
            } else {
                await updateEarning({_id: adminEarningResult._id}, commissionObj);
            }

            if (!userEarningResult) {
                userEarn.userId = (Item._id);
                await createEarning(userEarn);
            } else {
                await updateEarning({_id: userEarningResult._id}, earningObj);
            }

            addUserIntoFeed(Item._id, userResult._id);
            return res.json(
                new response(
                    {
                        buyed: "yes",
                        nb: Item.subscribers.length,
                    },
                    responseMessage.BUYED
                )
            );
        } else {
            return res.json(
                new response(
                    {buyed: "no"},
                    responseMessage.INSUFFICIENT_BALANCE(Item.coinName),
                    400
                )
            );
        }
    } catch (error) {
        return next(error);
    }
    
    
  }

    async deleteProfile(req, res, next) {
        try {
          // Assuming you have a function to find the user by ID
          let userResult = await deleteUserBy_Id({ _id: req.userId });
          
          if (!userResult) {
            return apiError.notFound(responseMessage.USER_NOT_FOUND);
          }
      
          // Assuming you have a function to delete the user by ID
          await deleteUserBy_Id(userResult._id);
      
          return res.json(new response(null, responseMessage.PROFILE_DELETED));
        } catch (error) {
          return next(error);
        }
      }
    
    async deactivateProfile(req, res, next) {
        try {
          let userResult = await deactivateUser({ _id: req.userId });
      
          if (!userResult) {
            return apiError.notFound(responseMessage.USER_NOT_FOUND);
          }
      
          // Add logic to update the user's profile to deactivate it
          // Example: Set user.isActive to false in the database
          await updateUserById(userResult._id, { isActive: false });
      
          return res.json(new response({}, responseMessage.PROFILE_DEACTIVATED));
        } catch (error) {
          return next(error);
        }
      }

    /**
     * @swagger
     * /user/userList:
     *   get:
     *     tags:
     *       - USER
     *     description: userList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async userList(req, res, next) {
        try {
            let {search, page, limit} = req.query;
            let dataResults = await userSubscriberListWithPagination(
                search,
                page,
                limit
            );
            return res.json(new response(dataResults, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/latestUserList:
     *   get:
     *     tags:
     *       - USER
     *     description: latestUserList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *       - name: userType
     *         description: userType ? Admin || User || Creator
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async latestUserList(req, res, next) {
        try {
            let {search, page, limit, userType} = req.query;
            let dataResults = await latestUserListWithPagination(
                search,
                page,
                limit,
                userType
            );
            return res.json(new response(dataResults, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/subscribeNow/{nftId}:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: subscribeNow
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: nftId
     *         description: nftId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async subscribeNow(req, res, next) {
        const validationSchema = {
            nftId: Joi.string().required(),
        };
        try {
            const {nftId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUserData({_id: req.userId});
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var adminResult = await findUser({userType: userType.ADMIN});
            let Bundle = await findNft({
                _id: nftId,
                status: {$ne: status.DELETE},
            });
            if (!Bundle) {
                return apiError.notFound(responseMessage.NFT_NOT_FOUND);
            }
            let balance = Bundle.coinName.toLowerCase() + "Balance";
            if (userResult[balance] >= Bundle.donationAmount) {
                let CreatorUser = await findUser({
                    _id: Bundle.userId,
                    status: {$ne: status.DELETE},
                });

                let updateQuery = {};
                let updateQuery1 = {$addToSet: {subscribeNft: Bundle._id}};
                var commissionObj = {},
                    earningObj = {},
                    firstCommission = {},
                    userEarn = {};
                var donationAmount = Bundle.donationAmount;
                var commissionResult = await sortFee({
                    masHeld: {$lte: CreatorUser.masBalance},
                    status: status.ACTIVE,
                });
                var commissionFee =
                    Number(donationAmount) * (commissionResult ? commissionResult.contentCreatorFee : 1 / 100);
                var nftDonationAmount = Number(donationAmount) - commissionFee;

                updateQuery.$inc = {[balance]: Number(nftDonationAmount)};
                updateQuery1.$inc = {[balance]: -Number(donationAmount)};
                commissionObj.$inc = {[balance]: Number(commissionFee)};
                earningObj.$inc = {[balance]: Number(nftDonationAmount)};
                firstCommission[balance] = commissionFee;
                userEarn[balance] = nftDonationAmount;

                if (!CreatorUser.supporters.includes(userResult._id)) {
                    updateQuery.$addToSet = {supporters: Bundle.userId};
                }

                await updateUser({_id: CreatorUser._id}, updateQuery);
                await updateUser({_id: userResult._id}, updateQuery1);

                let duration = Bundle.duration.split(" ")[0];
                var myDate = new Date().toISOString();
                myDate = new Date(myDate);
                myDate.setDate(myDate.getDate() + parseInt(duration));
                let validTillDate = myDate.toISOString();
                await createSubscription({
                    title: Bundle.bundleTitle,
                    name: Bundle.bundleName,
                    description: Bundle.details,
                    validTillDate: validTillDate,
                    duration: duration,
                    masPrice: Bundle.donationAmount,
                    nftId: Bundle._id,
                    userId: userResult._id,
                    fromAddress: userResult.ethAccount.address,
                    toAddress: CreatorUser.ethAccount.address,
                    amount: donationAmount,
                });
                await createTransaction({
                    userId: userResult._id,
                    nftId: Bundle._id,
                    nftUserId: Bundle.userId,
                    toDonationUser: Bundle.userId,
                    amount: Bundle.donationAmount,
                    transactionType: "Donation",
                    transactionStatus: "SUCCESS",
                    adminCommission: commissionFee,
                    coinName: Bundle.coinName,
                });
                await createNotification({
                    title: `Bundle Subscription Notification!`,
                    description: `Your bundle ${
                        Bundle.bundleName
                    } has been subscribed by ${
                        userResult.name
                            ? userResult.name
                            : userResult.userName
                                ? userResult.userName
                                : "a new user."
                    }.`,
                    userId: Bundle.userId,
                    nftId: Bundle._id,
                    notificationType: "BUNDLE_SUBSCRIPTION",
                    subscriberId: userResult._id,
                });
                Bundle.subscribers.push(userResult._id);
                await Bundle.save();
                var adminEarningResult = await findEarning({
                    userId: adminResult._id,
                    status: status.ACTIVE,
                });
                var userEarningResult = await findEarning({
                    userId: CreatorUser._id,
                    status: status.ACTIVE,
                });
                if (!adminEarningResult) {
                    firstCommission.userId = adminResult._id;
                    await createEarning(firstCommission);
                } else {
                    await updateEarning({_id: adminEarningResult._id}, commissionObj);
                }

                if (!userEarningResult) {
                    userEarn.userId = CreatorUser._id;
                    await createEarning(userEarn);
                } else {
                    await updateEarning({_id: userEarningResult._id}, earningObj);
                }

                addUserIntoFeed(Bundle._id, userResult._id);
                return res.json(
                    new response(
                        {
                            subscribed: "yes",
                            nb: Bundle.subscribers.length,
                        },
                        responseMessage.SUBSCRIBED
                    )
                );
            } else {
                return res.json(
                    new response(
                        {subscribed: "no"},
                        responseMessage.INSUFFICIENT_BALANCE(Bundle.coinName),
                        400
                    )
                );
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/followProfile/{userId}:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: followProfile
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async followProfile(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
        };
        try {
            let notificationObj;
            const {userId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUserData({_id: req.userId});
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let userCheck = await findUser({
                _id: userId,
                status: {$ne: status.DELETE},
            });
            if (!userCheck) {
                throw apiError.notFound(responseMessage.NOT_FOUND);
            }
            if (
                userResult.following.includes(userCheck._id) ||
                userCheck.followers.includes(userResult._id)
            ) {
                await updateUser(
                    {_id: userResult._id},
                    {$pull: {following: userCheck._id}}
                );

                userCheck.followers.remove(userResult._id);
                await userCheck.save();
                return res.json(
                    new response(
                        {
                            subscribed: "no",
                            nb: userCheck.followers.length,
                        },
                        responseMessage.UNSUBSCRIBED
                    )
                );
            } else {
                notificationObj = {
                    userId: userCheck._id,
                    title: `New subscriber notification!`,
                    description: `@${userResult.userName} subscribed to your profile.`,
                    notificationType: "PROFILE_SUBSCRIBING",
                };
                await createNotification(notificationObj);
                await updateUser(
                    {_id: userResult._id},
                    {$addToSet: {following: userCheck._id}}
                );
                userCheck.followers.push(userResult._id);
                await userCheck.save();
                return res.json(
                    new response(
                        {
                            subscribed: "yes",
                            nb: userCheck.followers.length,
                        },
                        responseMessage.SUBSCRIBED
                    )
                );
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/profileFollowersList:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: My followers
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async profileFollowersList(req, res, next) {
        const validationSchema = {
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validateBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({_id: req.userId});
            let followersListResult = await followersList(userResult.followers, validateBody);
            return res.json(
                new response(followersListResult, responseMessage.DATA_FOUND)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/profileFollowingList:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: My following
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async profileFollowingList(req, res, next) {
        const validationSchema = {
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validateBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({_id: req.userId});
            let followingListResult = await followingList(userResult.following, validateBody);
            return res.json(
                new response(followingListResult, responseMessage.DATA_FOUND)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/mySubscriptions:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: mySubscriptions
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async mySubscriptions(req, res, next) {
        const validationSchema = {
            limit: Joi.number().optional(),
            page: Joi.number().optional(),
        };
        try {
            const validateBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const result = await subscriptionWithPaginate(validateBody, userResult._id);
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    async mypurchases(req, res, next) {
        const validationSchema = {
            limit: Joi.number().optional(),
            page: Joi.number().optional(),
        };
        try {
            const validateBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const result = await subscriptionWithPaginate1(validateBody, userResult._id);
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    async mysales(req, res, next) {
        const validationSchema = {
            limit: Joi.number().optional(),
            page: Joi.number().optional(),
        };
        try {
            const validateBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const result = await subscriptionWithPaginate1(validateBody, userResult._id);
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/followers:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: followers
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async mySubscribers(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let nftResult = await nftSubscriberList({userId: userResult._id});
            var users = [];
            for (let i of nftResult) {
                if (i.subscribers.length != 0) {
                    for (let j of i.subscribers) {
                        users.push(j);
                    }
                }
            }
            users = JSON.stringify(users);
            users = JSON.parse(users);
            var uniqueArray = [...new Set(users)];
            let result = await userSubscriberList({
                blockStatus: false,
                _id: {$in: uniqueArray},
            });

            return res.send({
                result: result,
                responseMessage: responseMessage.USER_DETAILS,
                statusCode: 200,
            });
        } catch (error) {
            return next(error);
        }
    }


    /**
     * @swagger
     * /user/shareWithAudience:
     *   post:
     *     tags:
     *       - USER SHARE WITH AUDIENCE
     *     description: shareWithAudience
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: title
     *         description: title
     *         in: formData
     *         required: false
     *       - name: details
     *         description: details
     *         in: formData
     *         required: false
     *       - name: mediaUrl
     *         description: mediaUrl
     *         in: formData
     *         type: file
     *         required: false
     *       - name: nftIds
     *         description: nftIds ?? array of elements
     *         in: formData
     *         required: false
     *       - name: postType
     *         description: postType
     *         in: formData
     *         required: false
     *     responses:
     *       creatorAddress: Joi.string().optional(),
     *       200:
     *         description: Returns success message
     */

    async shareWithAudience(req, res, next) {
        const validationSchema = {
            title: Joi.string().required(),
            details: Joi.string().required(),
            mediaUrl: Joi.string().optional(),
            nftIds: Joi.array().optional(),
            postType: Joi.string().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let nftResult = await nftSubscriberList({
                _id: {$in: validatedBody.nftIds},
                status: {$ne: status.DELETE},
            });
            var users = [];
            for (let i of nftResult) {
                if (i.subscribers.length != 0) {
                    for (let j of i.subscribers) {
                        users.push(j);
                    }
                }
            }
            users = JSON.stringify(users);
            users = JSON.parse(users);
            var uniqueArray = [...new Set(users)];
            validatedBody.mediaUrl = await commonFunction.getImageUrl(req.files);
            await deleteFile(req.files[0].path);
            validatedBody.userId = userResult._id;
            validatedBody.users = uniqueArray;
            validatedBody.nftId = validatedBody.nftIds;
            var result = await createAudience(validatedBody);
            await multiUpdateBundle(
                {_id: {$in: validatedBody.nftIds}},
                {$set: {isShared: true}}
            );
            var obj = {
                title: `New Media Share With Audience Alert! (${validatedBody.title})`,
                description: `You have received a notification for ${validatedBody.details}`,
                image: validatedBody.mediaUrl,
                nftIds: validatedBody.nftId,
            };
            for (let k of uniqueArray) {
                obj.userId = k;
                await createNotification(obj);
            }
            return res.json(new response(result, responseMessage.SHARED_AUDIENCE));
        } catch (error) {
            return next(error);
        }
    }

    async editAudience (req, res, next) {
        const validationSchema = {
            id: Joi.string().required(),
            postType: Joi.string().optional(),
            details: Joi.string().optional(),
            mediaUrl: Joi.string().optional()
        };
        try {
            const {id, postType, details} = await Joi.validate(req.body, validationSchema);
            const  userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let updateObj = {
                postType,
                details
            };
            if(req.files[0]?.path){
                updateObj.mediaUrl = await commonFunction.getImageUrl(req.files);
            }
            const data = await updateAudience({_id: id}, updateObj);
            return res.json(new response(data, 'Edited successfully'));
        }catch (e) {
            return next(e);
        }
    }

    /**
     * @swagger
     * /user/myFeed:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: myFeed
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async myFeed(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let bundleIds = await subscriptionList({
                userId: userResult._id,
                subscriptionStatus: {$ne: status.EXPIRED},
            });
            let ids = [];
            if (bundleIds.length !== 0) {
                for (let i = 0; i < bundleIds.length; i++) {
                    if (bundleIds[i].nftId) {
                        ids.push(bundleIds[i].nftId._id);
                    }
                }
            }
            var result = await postList();
            let result1 = [],
                subscribe = [],
                userResult2,
                userResult1,
                obj,
                obj1,
                bothResult;
            if (result) {
                for (let data of result) {
                    if (data.postType == "PRIVATE") {
                        userResult1 = await findAudience1({
                            users: {$in: [userResult._id]},
                            postType: "PRIVATE",
                        });
                        if (
                            userResult1 &&
                            data.userId.toString() != userResult._id.toString()
                        ) {
                            result1.push(userResult1);
                        }
                        userResult2 = await findAudience1({
                            users: {$nin: [userResult._id]},
                            postType: "PRIVATE",
                        });
                        if (userResult2) {
                            subscribe.push(userResult2);
                        }
                    } else {
                        if (data.userId.toString() != userResult._id.toString()) {
                            result1.push(data);
                        }
                    }
                }
            }
            obj = {result: result1, responseMessage: responseMessage.DATA_FOUND};
            obj1 = {
                result: subscribe,
                responseMessage: "Please subscribe bundle to watch this post.",
            };
            bothResult = {public_Private: obj, private: obj1};

            return res.json(new response(bothResult, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/likeDislikeNft/{nftId}:
     *   get:
     *     tags:
     *       - USER LIKE_DISLIKE
     *     description: likeDislikeNft
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: nftId
     *         description: nftId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async likeDislikeNft(req, res, next) {
        const validationSchema = {
            nftId: Joi.string().required(),
        };
        var updated;
        try {
            const {nftId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let nftCheck = await findNft({
                _id: nftId,
                status: {$ne: status.DELETE},
            });
            if (!nftCheck) {
                throw apiError.notFound(responseMessage.NFT_NOT_FOUND);
            }
            if (nftCheck.likesUsers.includes(userResult._id)) {
                updated = await updateNft(
                    {_id: nftCheck._id},
                    {$pull: {likesUsers: userResult._id}, $inc: {likesCount: -1}}
                );
                await updateUser(
                    {_id: userResult._id},
                    {$pull: {likesNft: nftCheck._id}}
                );
                return res.json(new response(updated, responseMessage.DISLIKE_BUNDLE));
            }
            updated = await updateNft(
                {_id: nftCheck._id},
                {$addToSet: {likesUsers: userResult._id}, $inc: {likesCount: 1}}
            );
            await updateUser(
                {_id: userResult._id},
                {$addToSet: {likesNft: nftCheck._id}}
            );
            return res.json(new response(updated, responseMessage.LIKE_BUNDLE));
        } catch (error) {
            return next(error);
        }
    }

    async userNft(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
        };
        try {
            const {userId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({_id: userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            const result = await findUserNft({userId: userId});

            return res.json(new response(result, responseMessage.DATA_FOUND, 200));
        } catch (e) {
            next(e);
        }
    }

    async topUser(req, res, next) {
        const validationSchema = {
            limit: Joi.number().optional(),
        };
        const {limit} = await Joi.validate(req.query, validationSchema);
        try {
            const result = await userModel.aggregate([
                {
                    $addFields: {
                        subCount: {$size: "$followers"},
                    },
                },
                {
                    $sort: {
                        subCount: -1,
                    },
                },
                {
                    $limit: limit ? limit : 6,
                },
            ]);
            return res.json(new response(result, responseMessage.DATA_FOUND, 200));
        } catch (e) {
            next(e);
        }
    }

    /**
     * @swagger
     * /user/likeDislikeAuctionNft/{auctionId}:
     *   get:
     *     tags:
     *       - USER LIKE_DISLIKE
     *     description: likeDislikeAuctionNft
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: auctionId
     *         description: auctionId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async likeDislikeAuctionNft(req, res, next) {
        const validationSchema = {
            auctionId: Joi.string().required(),
        };
        var updated;
        try {
            const {auctionId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let nftCheck = await findAuctionNft({
                _id: auctionId,
                status: {$ne: status.DELETE},
            });
            if (!nftCheck) {
                throw apiError.notFound(responseMessage.NFT_NOT_FOUND);
            }
            if (nftCheck.likesUsers.includes(userResult._id)) {
                updated = await updateAuctionNft(
                    {_id: nftCheck._id},
                    {$pull: {likesUsers: userResult._id}, $inc: {likesCount: -1}}
                );
                await updateUser(
                    {_id: userResult._id},
                    {$pull: {likesAuctionNft: nftCheck._id}}
                );
                return res.json(new response(updated, responseMessage.DISLIKES));
            }
            updated = await updateAuctionNft(
                {_id: nftCheck._id},
                {$addToSet: {likesUsers: userResult._id}, $inc: {likesCount: 1}}
            );
            await updateUser(
                {_id: userResult._id},
                {$addToSet: {likesAuctionNft: nftCheck._id}}
            );
            return res.json(new response(updated, responseMessage.LIKES));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/likeDislikeFeed/{feedId}:
     *   get:
     *     tags:
     *       - USER LIKE_DISLIKE
     *     description: likeDislikeFeed
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: feedId
     *         description: feedId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async likeDislikeFeed(req, res, next) {
        const validationSchema = {
            feedId: Joi.string().required(),
        };
        var updated;
        try {
            const {feedId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let feedCheck = await findAudience({
                _id: feedId,
                status: {$ne: status.DELETE},
            });
            if (!feedCheck) {
                throw apiError.notFound(responseMessage.FEED_NOT_FOUND);
            }
            if (feedCheck.likesUsers.includes(userResult._id)) {
                updated = await updateAudience(
                    {_id: feedCheck._id},
                    {$pull: {likesUsers: userResult._id}, $inc: {likesCount: -1}}
                );
                await updateUser(
                    {_id: userResult._id},
                    {$pull: {likesFeed: feedCheck._id}}
                );
                return res.json(new response(updated, responseMessage.DISLIKE_FEED));
            }
            updated = await updateAudience(
                {_id: feedCheck._id},
                {$addToSet: {likesUsers: userResult._id}, $inc: {likesCount: 1}}
            );
            await updateUser(
                {_id: userResult._id},
                {$addToSet: {likesFeed: feedCheck._id}}
            );
            return res.json(new response(updated, responseMessage.LIKE_FEED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/likeDislikeUser/{userId}:
     *   get:
     *     tags:
     *       - USER LIKE_DISLIKE
     *     description: likeDislikeUser
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async likeDislikeUser(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
        };
        var name;
        try {
            const {userId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let userCheck = await findUser({
                _id: userId,
                status: {$ne: status.DELETE},
            });
            if (!userCheck) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (userCheck.likesUsers.includes(userResult._id)) {
                await updateUser(
                    {_id: userCheck._id},
                    {$pull: {likesUsers: userResult._id}, $inc: {likesCount: -1}}
                );
                return res.json(new response({}, responseMessage.DISLIKE_USER));
            }
            if (userResult.name && userResult.userName) {
                name = userResult.name;
            } else if (userResult.userName && !userResult.name) {
                name = userResult.userName;
            } else if (!userResult.userName && userResult.name) {
                name = userResult.name;
            } else {
                name = "Mas user";
            }
            await createNotification({
                title: `Like Alert!`,
                description: `${name} liked your profile.`,
                userId: userCheck._id,
                notificationType: "LIKE_ALERT",
                likeBy: userResult._id,
            });
            await updateUser(
                {_id: userCheck._id},
                {$addToSet: {likesUsers: userResult._id}, $inc: {likesCount: 1}}
            );
            return res.json(new response({}, responseMessage.LIKE_USER));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/reportNow/{chatId}:
     *   get:
     *     tags:
     *       - USER REPORT
     *     description: reportNow
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: chatId
     *         description: chatId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async reportNow(req, res, next) {
        const validationSchema = {
            chatId: Joi.string().required(),
        };
        try {
            let reportedUserId;
            const {chatId} = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (userResult.blockStatus === true) {
                throw apiError.notAllowed(responseMessage.REPORT_NOT_ALLOWED);
            }
            let chatCheck = await findChat({
                _id: chatId,
                status: {$ne: status.DELETE},
            });
            if (!chatCheck) {
                throw apiError.notFound(responseMessage.CHAT_NOT_FOUND);
            }
            let reportCheck = await findReport({
                userId: userResult._id,
                chatId: chatId,
                status: {$ne: status.DELETE},
            });
            if (reportCheck) {
                throw apiError.conflict(responseMessage.ALREADY_REPORTED);
            }
            if (chatCheck.senderId.toString() === userResult._id.toString()) {
                reportedUserId = chatCheck.receiverId;
            } else {
                reportedUserId = chatCheck.senderId;
            }
            let notificationObj = {
                title: `Report Alert!`,
                description: `You are reported by someone.`,
                userId: reportedUserId,
                notificationType: "REPORT_ALERT",
                reportedBy: userResult._id,
            };
            await createNotification(notificationObj);

            let result = await createReport({
                userId: userResult._id,
                chatId: chatId,
            });
            return res.json(new response(result, responseMessage.REPORTED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/subscription/{_id}:
     *   get:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: viewSubscription
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async viewSubscription(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required(),
        };
        try {
            const {_id} = await Joi.validate(req.params, validationSchema);

            var subscriptionResult = await findSubscription({
                _id: _id,
                status: {$ne: status.DELETE},
            });
            if (!subscriptionResult) {
                throw apiError.conflict(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(
                new response(subscriptionResult, responseMessage.DETAILS_FETCHED)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/subscription:
     *   delete:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: deleteSubscription
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async deleteSubscription(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required(),
        };
        try {
            const {_id} = await Joi.validate(req.query, validationSchema);

            var subscriptionResult = await findSubscription({
                _id: _id,
                status: {$ne: status.DELETE},
            });
            if (!subscriptionResult) {
                throw apiError.conflict(responseMessage.DATA_NOT_FOUND);
            }
            var result = await updateSubscription(
                {_id: subscriptionResult._id},
                {status: status.DELETE}
            );
            return res.json(new response(result, responseMessage.DETAILS_FETCHED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/bundle/{_id}:
     *   get:
     *     tags:
     *       - USER BUNDLE
     *     description: viewBundle
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async viewBundle(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required(),
        };
        try {
            const {_id} = await Joi.validate(req.params, validationSchema);

            var bundleResult = await findBundle({
                _id: _id,
                status: {$ne: status.DELETE},
            });
            if (!bundleResult) {
                throw apiError.conflict(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(
                new response(bundleResult, responseMessage.DETAILS_FETCHED)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/bundleContentList:
     *   get:
     *     tags:
     *       - USER BUNDLE
     *     description: reportNow
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: nftId
     *         description: nftId
     *         in: query
     *         required: true
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: fromDate
     *         description: fromDate
     *         in: query
     *         required: false
     *       - name: toDate
     *         description: toDate
     *         in: query
     *         required: false
     *       - name: postType
     *         description: postType-PUBLIC/PRIVATE
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async bundleContentList(req, res, next) {
        try {
            const validationSchema = {
                nftId: Joi.string().required(),
                search: Joi.string().optional(),
                fromDate: Joi.string().optional(),
                toDate: Joi.string().optional(),
                postType: Joi.string().optional(),
                page: Joi.number().optional(),
                limit: Joi.number().optional(),
            };

            const validatedBody = await Joi.validate(req.query, validationSchema);
            var result = await audienceContentList(validatedBody);
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/donation:
     *   post:
     *     tags:
     *       - USER
     *     description: donation
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId ?? _id
     *         in: formData
     *         required: false
     *       - name: amount
     *         description: amount
     *         in: formData
     *         required: false
     *       - name: coinName
     *         description: coinName ?? USDT || BUSD || MAS || WARE || WBTC || ETH || BNB
     *         in: formData
     *         required: false
     *       - name: message
     *         description: message
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async donation(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
            amount: Joi.number().required().min(1),
            coinName: Joi.string().valid("MAS", "BUSD", "USDT").required(),
            message: Joi.string().optional().allow("").max(100),
        };
        const validate = Joi.validate(req.body, validationSchema);
        if (validate.error) {
            return res
                .status(400)
                .send(new response({}, validate.error.details[0].message, 400));
        }
        let amount = parseFloat(req.body.amount);
        let balance = req.body.coinName.toLowerCase() + "Balance";

        try {
            let donatorUser = await findUserData({
                _id: req.userId,
                status: {$ne: status.DELETE},
            });
            if (!donatorUser) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (parseFloat(donatorUser[balance]) >= amount) {
                let donatedToUser = await findUserData({
                    _id: req.body.userId,
                    status: {$ne: status.DELETE},
                });
                if (!donatedToUser) {
                    throw apiError.notFound(responseMessage.USER_NOT_FOUND);
                }

                let supporterCount = donatedToUser.supporters.includes(donatorUser._id);

                var commissionResult = await sortFee({
                    masHeld: {$lte: donatorUser.masBalance},
                    status: status.ACTIVE,
                });
                var commissionFee = amount * (commissionResult.contentCreatorFee / 100);
                var donationAmount = amount - commissionFee;

                const creditDonator = await updateUser(
                    {_id: donatorUser._id},
                    {
                        $inc: {[balance]: -amount},
                    }
                );

                if (!creditDonator) {
                    throw apiError.internal("Error updating user balance");
                }

                const debitDonatedTo = await updateUser(
                    {_id: donatedToUser._id},
                    {
                        $inc: {[balance]: donationAmount},
                    }
                );

                if (!debitDonatedTo) {
                    throw apiError.internal("Error updating user balance");
                }

                let certificate = await getCertificateNumber();

                await createTransaction({
                    userId: donatorUser._id,
                    toDonationUser: donatedToUser._id,
                    amount: amount,
                    transactionType: "Donation",
                    transactionStatus: "SUCCESS",
                    transactionHash: "INTERNAL_TX_CERTIFICATE" + certificate,
                    adminCommission: commissionFee,
                    coinName: req.body.coinName,
                });

                let message = `You have received a donation amount 
        of ${donationAmount} ${req.body.coinName} 
        by ${donatorUser.name}.`;
                await manageDonationData(
                    donatorUser._id,
                    donatedToUser._id,
                    supporterCount,
                    message,
                    amount,
                    commissionFee,
                    donationAmount,
                    req.body.coinName,
                    certificate
                );
                await createNotification({
                    title: `Donation received Notification`,
                    description: message,
                    userId: donatedToUser._id,
                    notificationType: "DONATION_RECEIVED",
                });
                return res.json(
                    new response(certificate, responseMessage.DONATION_SUCCESS)
                );
            } else {
                return res.json(
                    new response(
                        {}`you have insufficient balance in ${req.body.coinName} in your wallet, Please add more ${req.body.coinName} first to your wallet .`,
                        400
                    )
                );
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/donateUserList:
     *   get:
     *     tags:
     *       - USER
     *     description: donateUserList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async donateUserList(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let dataResults = await donationList({userId: userResult._id});
            if (dataResults.length == 0) {
                return apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(dataResults, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/sharedBundleList:
     *   get:
     *     tags:
     *       - USER
     *     description: sharedBundleList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async sharedBundleList(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let bundleIds = await nftSubscriber({isShared: true});
            bundleIds = bundleIds.map((i) => i._id);
            let dataResults = await sharedBundleList(userResult._id, bundleIds);
            return res.json(new response(dataResults, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/bundlePostList/{bundleId}:
     *   get:
     *     tags:
     *       - USER
     *     description: bundlePostList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: false
     *       - name: bundleId
     *         description: bundleId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async bundlePostList(req, res, next) {
        try {
            let bundleIds = req.params.bundleId;
            if (req.headers.token) {
                jwt.verify(
                    req.headers.token,
                    config.get("jwtsecret"),
                    async (err, result) => {
                        if (err) {
                            throw apiError.unauthorized();
                        } else {
                            userModel.findOne({_id: result.id}, async (error, result2) => {
                                if (error) {
                                    return next(error);
                                } else if (!result2) {
                                    return apiError.notFound(responseMessage.USER_NOT_FOUND);
                                } else {
                                    if (result2.status == "BLOCK") {
                                        throw apiError.forbidden(responseMessage.BLOCK_BY_ADMIN);
                                    } else if (result2.status == "DELETE") {
                                        throw apiError.unauthorized(
                                            responseMessage.DELETE_BY_ADMIN
                                        );
                                    } else {
                                        let dataResults = await sharedBundleListPerticular(
                                            result2._id,
                                            bundleIds
                                        );
                                        return res.json(
                                            new response(dataResults, responseMessage.DATA_FOUND)
                                        );
                                    }
                                }
                            });
                        }
                    }
                );
            } else {
                let dataResults = await sharedBundleListPerticular(bundleIds);
                return res.json(new response(dataResults, responseMessage.DATA_FOUND));
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/getAdvertisement:
     *   get:
     *     tags:
     *       - USER
     *     description: getAdvertisement
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async getAdvertisement(req, res, next) {
        try {
            var result = await findAdvertisements({
                status: status.ACTIVE,
                startDate: {$lte: new Date().toISOString()},
                endDate: {$gte: new Date().toISOString()},
            });
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    async getBanner(req, res, next) {
        try {
            var result = await findBanner({status: status.ACTIVE});
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    async listBanner(req, res, next) {
        const validationSchema = {
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            const result = await bannerModel.paginate({...validatedBody, status: 'ACTIVE'});
            if (!result) {
                return apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    async listAppBanner(req, res, next) {
        const validationSchema = {
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            const result = await bannerAppModel.paginate({...validatedBody, status: 'ACTIVE'});
            if (!result) {
                return apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/getCategory:
     *   get:
     *     tags:
     *       - USER
     *     description: getCategory
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async getCategory(req, res, next) {
        try {
            let userResult = await findUserData({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let address;
            if (
                userResult.userType === "Creator" ||
                userResult.userType === "Admin"
            ) {
                address = userResult.ethAccount.address;
            } else {
                address = userResult.walletAddress;
            }
            let categoryType = await commonFunction.getFeeCategory(
                blockchainUrl,
                address
            );
            return res.json(
                new response(categoryType.planType, responseMessage.DETAILS_FETCHED)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/getCertificates:
     *   get:
     *     tags:
     *       - USER
     *     description: getCertificates
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async getCertificates(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var certificateResult = await donationList({
                senderUserId: userResult._id,
                status: {$ne: status.DELETE},
            });
            if (certificateResult.length == 0) {
                throw apiError.conflict(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(
                new response(certificateResult, responseMessage.DETAILS_FETCHED)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/donationTransactionlist:
     *   get:
     *     tags:
     *       - TRANSACTION MANAGEMENT
     *     description: donationTransactionlist
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Data found sucessfully.
     *       404:
     *         description: Data not Found.
     *       501:
     *         description: Something went wrong.
     */
    async donationTransactionlist(req, res, next) {
        const validationSchema = {
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            var userResult = await findUser({
                _id: req.userId,
                status: {$ne: status.DELETE},
            });
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var result = await depositListWithPagination(
                userResult._id,
                validatedBody
            );
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/depositeTransactionlist:
     *   get:
     *     tags:
     *       - TRANSACTION MANAGEMENT
     *     description: depositeTransactionlist
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Data found sucessfully.
     *       404:
     *         description: Data not Found.
     *       501:
     *         description: Something went wrong.
     */
    async depositeTransactionlist(req, res, next) {
        try {
            var userResult = await findUser({
                _id: req.userId,
                status: {$ne: status.DELETE},
            });
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var result = await depositeList({toDonationUser: userResult._id});
            if (result.length == 0) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/viewTransaction/{_id}:
     *   get:
     *     tags:
     *       - TRANSACTION MANAGEMENT
     *     description: viewTransaction
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async viewTransaction(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required(),
        };
        try {
            const {_id} = await Joi.validate(req.params, validationSchema);
            var userResult = await findUser({
                _id: req.userId,
                userType: userType.USER,
            });
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var donationBuffer = await findTransaction({
                _id: _id,
                status: {$ne: status.DELETE},
            });
            if (!donationBuffer) {
                throw apiError.conflict(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(
                new response(donationBuffer, responseMessage.DETAILS_FETCHED)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/publicPrivateFeed:
     *   post:
     *     tags:
     *       - USER
     *     description: publicPrivateFeed
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: bundleType
     *         description: bundleType
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async publicPrivateFeed(req, res, next) {
        try {
            var userResult = await findUser({
                _id: req.userId,
                userType: userType.USER,
            });
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let feed = await postList({
                $and: [{status: status.ACTIVE}, {users: {$in: userResult._id}}],
            });
            if (feed.length == 0) {
                return apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            let totalNFT = [];
            for (let [userdata] of Object.entries(feed)) {
                for (let nftId of userdata["nftId"]) {
                    let nft = await findNft({
                        _id: nftId,
                        bundleType: req.body.bundleType,
                    });
                    if (nft) {
                        totalNFT.push(nft);
                    }
                }
            }
            return res.json(new response(totalNFT, responseMessage.DETAILS_FETCHED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/privatePublicFeed:
     *   post:
     *     tags:
     *       - USER
     *     description: privatePublicFeed
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: postType
     *         description: postType
     *         in: formData
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async privatePublicFeed(req, res, next) {
        try {
            var userResult = await findUser({
                _id: req.userId,
                userType: userType.USER,
            });
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let privatePublicFeed = await postList({
                postType: req.body.postType,
                likesUsers: {$in: userResult._id},
                status: status.ACTIVE,
            });
            return res.json(
                new response(privatePublicFeed, responseMessage.DETAILS_FETCHED)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/viewMyfeed:
     *   get:
     *     tags:
     *       - USER
     *     description: viewMyfeed
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async viewMyfeed(req, res, next) {
        try {
            var userResult = await findUser({
                _id: req.userId,
                userType: userType.USER,
            });
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let feed = await postList(
                {likesUsers: {$in: userResult._id}},
                {status: status.ACTIVE}
            );
            if (feed.length == 0) {
                return apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(feed, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    async getMyFeed(req, res, next) {
        const validationSchema = {
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validateBody = await Joi.validate(req.query, validationSchema);
            let userResult = await findUser({_id: req.userId});
            const query = {users: {$in: [userResult._id]}};
            const feedResult = await feedWithPagination(query, validateBody);
            return res.json(
                new response(feedResult, responseMessage.DATA_FOUND)
            );
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/findContentCreator/{_id}:
     *   get:
     *     tags:
     *       - USER
     *     description: findContentCreator
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id
     *         in: path
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async findContentCreator(req, res, next) {
        try {
            var userResult = await findUser({
                _id: req.userId,
                userType: userType.USER,
            });
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            var creatorResult = await findUserData({
                _id: req.params._id,
                userType: userType.CREATOR,
            });
            if (!creatorResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(new response(creatorResult, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/unSubscription:
     *   delete:
     *     tags:
     *       - USER SUBSCRIPTION
     *     description: unSubscription
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async unSubscription(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required(),
        };
        try {
            const {_id} = await Joi.validate(req.query, validationSchema);
            var userResult = await findUserData({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let nftCheck = await findNft({
                _id: _id,
                status: {$ne: status.DELETE},
            });
            var subscriptionResult = await findSubscription({
                nftId: nftCheck._id,
                status: {$ne: status.DELETE},
            });
            if (!subscriptionResult) {
                throw apiError.conflict(responseMessage.DATA_NOT_FOUND);
            }
            var result = await updateSubscription(
                {_id: subscriptionResult._id},
                {status: status.DELETE}
            );
            await updateNft(
                {_id: result.nftId},
                {
                    $pull: {subscribers: userResult._id},
                    $set: {subscriberCount: nftCheck.subscriberCount - 1},
                }
            );
            await updateUser(
                {_id: userResult._id},
                {$pull: {subscribeNft: result.nftId}}
            );
            return res.json(new response(result, responseMessage.DETAILS_FETCHED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/transactionList:
     *   get:
     *     tags:
     *       - TRANSACTION MANAGEMENT
     *     description: transactionList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: page
     *         description: page
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async transactionList(req, res, next) {
        const validationSchema = {
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let data;
            var userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            data = await depositListWithPopulate(userResult._id, validatedBody);
            return res.json(new response(data, responseMessage.DETAILS_FETCHED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/sharedFeedList:
     *   get:
     *     tags:
     *       - USER
     *     description: sharedFeedList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async sharedFeedList(req, res, next) {
        try {
            let userResult = await findUser({_id: req.userId});
            if (!userResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let shared = await postList({
                userId: userResult._id,
                nftId: req.body.nftId,
                status: "ACTIVE",
            });
            if (shared.length == 0) {
                return apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            return res.json(new response(shared, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    async getSubscription(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
            nftId: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.params, validationSchema);
            const subscription = await findSubscription(validatedBody);
            if (!subscription) {
                return apiError.notFound(responseMessage.SUBSCRIPTION_NOT_FOUND);
            }
            return res.json(new response(subscription, responseMessage.DETAILS_FETCHED));
        } catch (error) {
            return next(error);
        }
    }

    async getBannerDuration(req, res, next) {
        try {
            let adminResult = await findUser({
                userType: { $in: [userType.ADMIN, userType.SUB_ADMIN] },
            });
            if (!adminResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(
                new response(adminResult.bannerDuration, responseMessage.DATA_FOUND)
            );
        } catch (e) {
            next(e);
        }
    }

    async getAppBannerDuration(req, res, next) {
        try {
            let adminResult = await findUser({
                userType: { $in: [userType.ADMIN, userType.SUB_ADMIN] },
            });
            if (!adminResult) {
                return apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(
                new response(adminResult.bannerAppDuration, responseMessage.DATA_FOUND)
            );
        } catch (e) {
            next(e);
        }
    }
    async main() {
        try {
          const uploadsDirectory = './uploads';
          
          // Read all files in the 'uploads' directory
          const files = fs.readdirSync(uploadsDirectory);
      
          // Filter only image files (you may want to adjust the filter based on your image file extensions)
          const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
      
          if (imageFiles.length < 2) {
            console.log('Insufficient images in the "uploads" directory.');
            return;
          }
      
          // Take the last two image files
          const imageName1 = imageFiles[imageFiles.length - 2];
          const imageName2 = imageFiles[imageFiles.length - 1];
      
          const imagePath1 = path.join(uploadsDirectory, imageName1);
          const imagePath2 = path.join(uploadsDirectory, imageName2);
      
          console.log('Current Working Directory:', process.cwd());
          console.log('Image 1: ', imageName1);
          console.log('Path 1: ', path.resolve(imagePath1));
          console.log('Image 2: ', imageName2);
          console.log('Path 2: ', path.resolve(imagePath2));
      
          const isSamePerson = await matchFaces(imagePath1, imagePath2);
      
          if (isSamePerson) {
            console.log('The two images belong to the same person.');
          } else {
            console.log('The two images belong to different people.');
          }
        } catch (error) {
          console.error('An error occurred:', error);
        }
      }
}

module.exports = new userController();

const deleteFile = async (filePath) => {
    fs.unlink(filePath, (deleteErr) => {
        if (deleteErr) {
            return deleteErr;
        }
    });
};

const manageDonationData = async (
    senderUserId,
    userId,
    supporterCount,
    message,
    amount,
    commission,
    donationAmount,
    coinName,
    certificate
) => {
    try {
        var adminResult = await findUser({userType: userType.ADMIN});
        if (supporterCount === true) {
            await updateUser(
                {_id: userId},
                {$addToSet: {supporters: senderUserId}, $inc: {supporterCount: 1}}
            );
        }

        let commissionObj = {},
            earningObj = {},
            firstCommission = {},
            userEarn = {};

        let balance = coinName.toLowerCase() + "Balance";

        commissionObj.$inc[balance] = parseFloat(commission);
        earningObj.$inc[balance] = parseFloat(donationAmount);
        firstCommission[balance] = commission;
        userEarn[balance] = donationAmount;

        let findData = await findDonation({
            userId: userId,
            status: {$ne: status.DELETE},
        });
        let obj = {
            userId: userId,
            history: [
                {
                    senderUserId: senderUserId,
                    message: message,
                    amount,
                    coinName: coinName,
                },
            ],
            certificateNumber: certificate,
        };
        obj[balance] = amount;
        if (!findData) {
            await createDonation(obj);
        } else {
            let incrementQuery = {
                $inc: {balance: parseFloat(amount)},
                $push: {
                    history: {
                        senderUserId: senderUserId,
                        message: message,
                        amount,
                        coinName: coinName,
                    },
                },
            };
            await updateDonation({_id: findData._id}, incrementQuery);
        }

        var adminEarningResult = await findEarning({
            userId: adminResult._id,
            status: status.ACTIVE,
        });
        var userEarningResult = await findEarning({
            userId: userId,
            status: status.ACTIVE,
        });
        if (!adminEarningResult) {
            firstCommission.userId = adminResult._id;
            await createEarning(firstCommission);
        } else {
            await updateEarning({_id: adminEarningResult._id}, commissionObj);
        }

        if (!userEarningResult) {
            userEarn.userId = userId;
            await createEarning(userEarn);
        } else {
            await updateEarning({_id: userEarningResult._id}, earningObj);
        }
    } catch (err) {
        return err;
    }
};

const getCertificateNumber = () => {
    const digits = "0123456789";
    let txnId = "";
    for (let i = 0; i < 12; i++) {
        txnId += digits[Math.floor(Math.random() * 10)];
    }
    return txnId;
};

const addUserIntoFeed = async (nftId, userId) => {
    let audienceRes = await postList({
        nftId: {$in: [nftId]},
        status: {$ne: status.DELETE},
    });
    audienceRes = audienceRes.map((i) => i._id);
    await feedUpdateAll(
        {_id: {$in: audienceRes}},
        {$addToSet: {users: userId}}
    );
};
async function loadModels() {
    try {
      // Load face detection model
      await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
      console.log('Face detection model loaded successfully.');
  
      // Load face landmarks model
      await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
      console.log('Face landmarks model loaded successfully.');
  
      // Load face recognition model
      await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
      console.log('Face recognition model loaded successfully.');
  
      console.log('All models loaded successfully.');
    } catch (error) {
      console.error('Error loading models:', error);
    }
  }
  loadModels();
  async function matchFaces(imagePath1, imagePath2, desiredWidth, desiredHeight) {
    try {
      console.log('Loading models...');
      await loadModels();
  
      //console.log('Detecting face in the first image1...');
      const image1 = await loadImage(imagePath1);
      const canvas1 = createCanvas(image1.width, image1.height);
      const ctx1 = canvas1.getContext('2d');
      ctx1.drawImage(image1, 0, 0);
      const img1Buffer = canvas1.toBuffer('image/png'); // Convert canvas buffer to Buffer
      const img1Array = new Uint8Array(canvas1.height* canvas1.width* 4);
      const channels = 4; // Assuming RGBA format, adjust if necessary
      console.log('Image 1 Dimensions:', canvas1.height, canvas1.width);
      console.log('Channels:', channels);
      console.log('Total Values in Image Array:', img1Array.length);
      const img1Tensor = faceapi.tf.tensor3d(
        img1Array,
        [canvas1.height, canvas1.width, 4],
        'int32'
      );
  
      console.log('Image 1 Dimensions:', img1Tensor.shape,img1Tensor);
    
      try {
        /*const results1 = await faceapi
          .detectAllFaces(img1Tensor)
          .withFaceLandmarks()
         .withFaceDescriptors();*/
        //console.log(`Face detected in the image1 (${results1.length}):`, results1);
      } catch (error) {
        console.error(`Error in detecting face in the image1: ${error}`);
      }
  
      //console.log('Detecting face in the second image2...');
      const image2 = await loadImage(imagePath2);
      const canvas2 = createCanvas(image2.width, image2.height);
      const ctx2 = canvas2.getContext('2d');
      ctx2.drawImage(image2, 0, 0);
      const img2Buffer = canvas2.toBuffer('image/png'); // Convert canvas buffer to Buffer
      const img2Array = new Uint8Array(canvas2.height* canvas2.width* 4);
      console.log('Image 2 Dimensions:', canvas2.height, canvas2.width);
      console.log('Channels:', channels);
      console.log('Total Values in Image Array:', img2Array.length);
      const img2Tensor = faceapi.tf.tensor3d(
        img2Array,
        [canvas2.height, canvas2.width, 4],
        'int32'
      );
      console.log('Image 2 Dimensions:', img2Tensor.shape,img2Tensor);
  
      try {
       /*const results2 = await faceapi
          .detectAllFaces(img2Tensor)
          .withFaceLandmarks()
          .withFaceDescriptors();*/
        //console.log(`Face detected in the image2 (${results2.length}):`, results2);
      } catch (error) {
        console.error(`Error in detecting face in the image2: ${error}`);
      }
  
      //console.log('Creating face matcher...');
      //if (results1.length === 0 || results2.length === 0) {
        //console.log('No faces detected in one or both images.');
       // return false;
      //}
      //const faceMatcher = new faceapi.FaceMatcher(results1);
  
      //console.log('Finding best matches...');
      //const bestMatch = results2.map((face) => faceMatcher.findBestMatch(face.descriptor));
  
      //console.log('Best matches:', bestMatch);
  
      //console.log('Checking if all matches meet the distance threshold...');
      //const threshold = 0.6; // Adjust the distance threshold as needed
      //const areMatchesValid = bestMatch.every((match) => match.distance < threshold);
  
      //console.log('Result:', areMatchesValid);
  
      //return areMatchesValid;
    } catch (error) {
      console.error('Error in matchFaces:', error);
      throw error; // Rethrow the error to indicate failure
    }
  }
