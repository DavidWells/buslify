import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'

console.log(process.env.TWILIO_AUTH_TOKEN)

ReactDOM.render(<App />, document.getElementById('root'))
