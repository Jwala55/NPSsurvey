const jwt = require('jsonwebtoken');
require('dotenv').config();


var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');


function sendEmail(Url, useremail) {

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: useremail,
        from: "info@loyalytics.in",
        subject: "hello",
        text: "Thank you for shopping with us. Please provide us with the feedback. Ignore if already done.",
        html: `<a href=" ${Url}">Feedback Form</a>`
    };
    sgMail.send(msg).then(() => { }, error => {
        console.error(error);

        if (error.response) {
            console.error(error.response.body)
        }
    });
}

function sendSms(sendlink, mobile) {
    const accountSid = process.env.ACC_KEY;
    const authToken = process.env.ACC_PASS;
    const twilio = require('twilio');
    const client = new twilio(accountSid,authToken);

    client.messages
        .create({
            body: `Thank you for shopping with us. Please provide us with the feedback. Here is the link.Ignore if already done ${sendlink}`,
            from: '+17343392200',
            to: `+91${mobile}`
        })
        .then(message => console.log(message.sid)).catch(err => console.log(err));
}

module.exports = { sendEmail, sendSms };