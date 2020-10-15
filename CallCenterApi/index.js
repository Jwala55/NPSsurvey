const jwt = require('jsonwebtoken');
require('dotenv').config();
var guid = require('node-uuid');
var storage = require('azure-storage');
var sendObj = require('../funct');
var rp = require('request-promise');

entityGen = storage.TableUtilities.entityGenerator;
storageClient = storage.createTableService(process.env.TABLE_CRED);




module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body.mobile === "" && req.body.name === "") {  // if req.body is empty

        context.res = {
            status: 204,
            body: "name and mobile not present"
        }
    }

    const mobile = req.body.mobile;
    const name = req.body.name;
    const client = req.body.client;
    const id = req.body.id;


    var storageTableQuery = storage.TableQuery;

    var tableQuery = new storageTableQuery()         //query for table
        .where('mobile eq ?', mobile).and('name eq ?', name).and('PartitionKey eq ?', client);

    // fetching the Entities from table
    storageClient.queryEntities('npsResponse', tableQuery, null, async function (error, result, response) {

        if (!error) {       // checks if customer is present in table and there is no error

            const user = {
                "name": req.body.name,
                "mobile": req.body.mobile,
                "client": req.body.client,
                "id": req.body.id
            }

            const jtoken = jwt.sign({ user }, process.env.SECRET_KEY, { expiresIn: '24h' }); // JWT Token

            const originalUrl = `${process.env.BASE_LINK}SurveyResponse?token=${jtoken}`;  // feedback url to Call Center SurveyReponse link
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
            sendObj.sendSms(Url, mobile) // send msg with shortened url
        }
        else {
            console.log(error);
        }
    })


}