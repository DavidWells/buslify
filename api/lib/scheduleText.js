/* run step function */
const AWS = require('aws-sdk')
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN
const stepfunctions = new AWS.StepFunctions()

exports.handler = (event, context, callback) => {
  const body = JSON.parse(event.body)
  const { startAt, sendTo, message } = body
  const taskName = `bus-${startAt}`

  const params = {
    name: taskName, // taskID and user id?
    stateMachineArn: STATE_MACHINE_ARN,
    input: JSON.stringify({
      to: process.env.YOUR_PHONE_NUMBER,
      message: message,
      // image: "https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg",
      /* The timestamp must conform to the RFC3339 profile of ISO 8601
        1331209044000 to toISOString
        unix * 1000 => new Date(unix * 1000).toISOString() */
      /* "trigger_date": "2017-10-15T23:51:09.000Z" */
      trigger_date: new Date(startAt).toISOString()
    })
  }
  // start step function
  stepfunctions.startExecution(params, (err, data) => {
    if (err) {
      console.log(err, err.stack) // an error occurred
      return callback(err)
    }
    console.log(data) // successful response
    console.log(data.executionArn) // needed for cancels
    console.log(data.startDate)
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Started the step function. View the scheduled step function in aws console.',
        params: params
      }),
    };
    return callback(null, response)
  })
}
