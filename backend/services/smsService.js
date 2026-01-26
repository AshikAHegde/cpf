const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

/**
 * Sends an SMS message.
 * Defaults to Mock functionality (logging to console) if Twilio keys are not set.
 * 
 * @param {string} to - The recipient's phone number.
 * @param {string} body - The message body.
 * @returns {Promise<boolean>} - Returns true if sent (or mocked), false on failure.
 */
const sendSMS = async (to, body) => {
    try {
        if (client && fromPhoneNumber) {
            // Real SMS via Twilio
            const message = await client.messages.create({
                body: body,
                from: fromPhoneNumber,
                to: to
            });
            console.log(`[SMS] Sent to ${to}: CID=${message.sid}`);
            return true;
        } else {
            // Mock SMS
            console.log(`\n--- [MOCK SMS SERVICE] ---`);
            console.log(`To: ${to}`);
            console.log(`Body: ${body}`);
            console.log(`--------------------------\n`);
            return true;
        }
    } catch (error) {
        console.error("Error sending SMS:", error.message);
        return false;
    }
};

module.exports = { sendSMS };
