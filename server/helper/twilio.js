const config = require("config");
let twilio = config.get("twilio");

const client = require('twilio')(twilio.account_sid, twilio.auth_token);
const image = "https://www.masplatform.net/images/logo.png";
const VerificationServiceId = twilio.verifySid;
module.exports = {
    sendVerification: async (to, channel, context = 'register', username = 'there') => {
        const subject = context === "withdraw" ? "Confirm Withdraw" : context === "reset_password" ? "Reset Password" : "Register";
        let payload = {to: to, channel: channel}
        if (channel === 'email') {
            payload = {
                channelConfiguration: {
                    template_id: twilio.template_id, //sendgrid dynamic template id
                    substitutions: {
                        context: subject, image: image,
                    }
                }, to: to, channel: channel
            }
        }
        try {
            return await client.verify.v2.services(VerificationServiceId)
                .verifications
                .create(payload)
        } catch (error) {
            return error;
        }
    }, checkVerification: async (to, otp) => {
        try {
            console.log(to, otp);
            return await client.verify.v2.services(VerificationServiceId)
                .verificationChecks
                .create({to: to, code: otp});
        } catch (error) {
            return error;
        }
    },
};


