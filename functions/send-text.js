
// use twilio SDK to send text message https://www.twilio.com/docs/libraries/node
exports.handler = (event, context, callback) => {

   return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: process.env,
      })
   })  

}
