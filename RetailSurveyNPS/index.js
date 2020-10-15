const jwt = require('jsonwebtoken');
var azure = require('azure-storage');
var tableService = azure.createTableService(process.env.TABLE_CRED);
var entGen = azure.TableUtilities.entityGenerator;

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const { token } = req.query;
    try {
        const validationValue = validateToken(token);   // checks for token validation
        context.log(validationValue)

        if (validationValue) {

            const mobile = await validationValue.user.mobile;     // getting values from jwt payload
            const name = await validationValue.user.name;
            const client = await validationValue.user.client;
            const id = await validationValue.user.id;
            const resp = await req.body.resp;                   // getting value from body
            var entity = {
                PartitionKey: entGen.String(client),
                RowKey: entGen.String(id),
                mobile: entGen.String(mobile),
                resp: entGen.String(resp),
                name: entGen.String(name)
            };
            tableService.insertOrReplaceEntity('npsResponse', entity, function (error, result, response) {  // Inserts and updates the response in table
                if (!error) {
                    console.log(result);
                }
            });

        }
    } catch (err) {
        console.log(err);
    }


    function validateToken(token) {    // function for validating token
        return jwt.verify(token, process.env.SECRET_KEY);
    }

}