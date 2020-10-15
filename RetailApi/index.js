const jwt = require('jsonwebtoken');
require('dotenv').config();
var guid = require('node-uuid');
var storage = require('azure-storage');
var sendObj = require('../funct');

var rp = require('request-promise');

entityGen = storage.TableUtilities.entityGenerator;
storageClient = storage.createTableService(process.env.TABLE_CRED);



module.exports = async function (context, myQueueItem) {
    context.log('JavaScript queue trigger function processed work item', myQueueItem);
    context.log(myQueueItem.name);

    const mobile = myQueueItem.mobile;              //getting values using queue trigger
    const email = myQueueItem.email;
    const client = myQueueItem.client;
    const name = myQueueItem.name;
    const id = myQueueItem.id;

    var storageTableQuery = await storage.TableQuery;

    var tableQuery = new storageTableQuery()             //query for table
        .where('mobile eq ?', mobile).and('email eq ?', email).and('PartitionKey eq ?', client);

    // fetching the Entities from table
    storageClient.queryEntities('npsResponse', tableQuery, null, async function (error, result, response) {

        if (!error) {            // checks if customer is present in table and there is no error

            const user = {
                "name": name,
                "mobile": mobile,
                "email": email,
                "client": client,
                "id": id
            }

            const jtoken = jwt.sign({ user }, process.env.SECRET_KEY, { expiresIn: '24h' });   // JWT Token

            const originalUrl = `${process.env.BASE_LINK}RetailSurveyNPS?token=${jtoken}`;         // feedback url to RetailSurveyNPS link
            const options = {
                method: 'POST',
                uri: process.env.LINK_SHORTENER,
                body: {
                    originalUrl,
                    shortBaseUrl: process.env.SHORT_BASE_URL,
                    customFields: {
                        mobile: myQueueItem.mobile,
                    },
                },
                headers: {
                    apiKey: process.env.LINK_SHORTENER_KEY,
                },
                json: true, // Automatically stringifies the body to JSON
            };
            const responseObj = await rp(options);

            console.log(responseObj);
            const Url = responseObj.shortUrl;
            console.log(Url);
            sendObj.sendEmail(Url, email);      // send email with shortened url
            sendObj.sendSms(Url, mobile);       // send msg with shortened url

        }
        else {
            console.log(error);
        }
    })

};