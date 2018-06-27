const twilio = require('twilio')
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = twilio(twilioAccountSid, twilioAuthToken)

// use twilio SDK to send text message
module.exports = (event, context, callback) => {
  const body = JSON.parse(event.body)

  const sms = {
    to: body.to,
    body: body.message || '',
    from: process.env.TWILIO_PHONE_NUMBER,
  }

  // add image to sms if body.image supplied
  if (body.image) {
    sms.mediaUrl = body.image
  }

  twilioClient.messages.create(sms).then((message) => {
    console.log(`text message sent!`, message.body)
    console.log(`date_created: ${message.date_created}`)
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Text message successfully sent!',
        data: message,
      })
    })
  }).catch((error) => {
    console.log('text message failed', error)
    return callback(null, {
      statusCode: error.status,
      body: JSON.stringify({
        message: error.message,
        error: error,
      })
    })
  })
}
