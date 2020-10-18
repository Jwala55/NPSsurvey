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
        html: `<h5>Thank you for shopping with us. Please provide us with the feedback. Ignore if already done.<h5><a href=" ${Url}">Feedback Form</a>`
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
    const client = new twilio(accountSid, authToken);

    client.messages
        .create({
            body: `Thank you for shopping with us. Please provide us with the feedback. Here is the link.Ignore if already done ${sendlink}`,
            from: '+17343392200',
            to: `+91${mobile}`
        })
        .then(message => console.log(message.sid)).catch(err => console.log(err));
}


/**
 * @async
 * @description This Method is to get the Token from Etisalat postal
 * @param {token} token Etisalat login token
 *
                ********APPROACH*********
      1. Create a POST request with the credential to Etisalat portal. 
      2. save the token in a variable and pass it to Send message function.
  */
const getToken_SendSms = async (mobile, Url) => {
    const options = {
        method: "POST",
        uri: `https://smartmessaging.etisalat.ae:5676/login/user/`,
        body: {
            username: process.env.ETISALAT_USER,
            password: process.env.ETISALAT_PASS,
        },
        json: true,
    };
    let x;
    try {
        // console.log(options);
        x = await rp(options);
        console.log("x is token", x.token);
    } catch (error) {
        console.log("err is ", error.message);
    }
    //Pass the Token to the sendSmsEtisalat function
    sendSmsEtisalat(mobile, Url, x.token);
};

/**
 * @async
 * @description To send SMS through Etisalat portal
 * @param {String} mobile Mobile which we are sending the SMS
 * @param {String} message Text message 
 * @param {String} token Login Token to access Etisalat portal and send sms.
 * @return {Promise<Data>} generalized object that contain all details of Draft Post.
 *
                ********APPROACH*********
      1. Parameters required to send the SMS
      2. Create a POST request to Etisalat portal using mobile, message and token.
      3. Send the SMS.
  */
const sendSmsEtisalat = async (mobile, message, token) => {
    const option = {
        method: "POST",
        uri: `https://smartmessaging.etisalat.ae:5676/campaigns/submissions/sms/nb`,
        body: {
            desc: "This is the description for campaign",
            campaignName: "test campaign",
            msgCategory: "4.6",
            contentType: "3.2",
            senderAddr: "AsterClinic",
            dndCategory: "Campaign",
            priority: 1,
            clientTxnId: 112346587965,
            recipient: mobile,
            dr: "1",
            msg: `Thank you for shopping with us. Please provide us with the feedback. Here is the link.Ignore if already done ${message}`,
        },
        json: true,
        headers: {
            "Content-Type": ["application/json", "text/plain"],
            Authorization: `Bearer ${token}`,
        },
    };
    try {
        const y = await rp(option);
        console.log("======RESPONSE======", y);
    } catch (err) {
        console.log("Error is ", err);
    }
};




module.exports = { sendEmail, sendSms, getToken_SendSms };