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
    const name = myQueueItem.name

    var storageTableQuery = await storage.TableQuery;

    var tableQuery = new storageTableQuery()             //query for table
        .where('mobile eq ?', mobile).and('email ?', email).and('PartitionKey ?', client);

    // fetching the Entities from table
    storageClient.queryEntities('npsResponse', tableQuery, null, async function (error, result, response) {

        if (!error) {            // checks if customer is present in table and there is no error

            const user = {
                "name": name,
                "mobile": mobile,
                "email": email,
                "client": client
            }

            const jtoken = jwt.sign({ user }, 'secretkey', { expiresIn: '24h' });   // JWT Token

            const originalUrl = `http://localhost:7071/api/RetailSurveyNPS?token=${jtoken}`;         // feedback url to Call Center RetailSurveyNPS link
            const options = {
                method: 'POST',
                uri: process.env.LINK_SHORTENER,
                body: {
                    originalUrl,
                    shortBaseUrl: process.env.SHORT_BASE_URL,
                    customFields: {
                        mobile: req.body.mobile,
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
            sendObj.sendSms(Url, mobile);       // send msg with shortened url
            sendObj.sendEmail(Url, email);      // send email with shortened url
        }
        else {
            console.log(error);
        }
    })

};