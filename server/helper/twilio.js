const config = require("config");
let twilio = config.get("twilio");

const client = require('twilio')(twilio.account_sid, twilio.auth_token);
const VerificationServiceId = 'VA297d1cee78ad4c273e047fe8d86e4581';
module.exports = {
    sendVerification: async (to, channel, context = 'register', username='there') => {
        let payload = {to: to, channel: channel}
        if(channel === 'email' && context === 'withdraw'){
            payload = {channelConfiguration: {
                template_id: 'd-d2e292a1468f48caa048ae315245772b', //sendgrid dynamic template id
                substitutions: {
                    username: username,
                    context:  'Confirm Withdraw'
                }
              }, to: to, channel: channel}
        }
        if(channel === 'email' && context === 'reset_password'){
            payload = {channelConfiguration: {
                template_id: 'd-d2e292a1468f48caa048ae315245772b',
                substitutions: {
                    username: username,
                    context:  'Reset Password'
                }
              }, to: to, channel: channel} 
        }
        try {
            return await client.verify.v2.services(VerificationServiceId)
            .verifications
            .create(payload)
        } catch (error) {
            return error ;
        }
    },
    checkVerification: async (to, otp) => {
        try {
            console.log(to,otp);
            return await client.verify.v2.services(VerificationServiceId)
            .verificationChecks
            .create({to: to, code: otp});
        } catch (error) {
            return error;
        }
    },
};


