import React, { Component } from 'react'
import spacetime from 'spacetime'
import './App.css'
import busData from './stubs/to-work.json'
/*

import busDataTwo from './stubs/from-work.json'

const stub = [
  busData,
  busDataTwo
]
/**/

const toWork = {
  title: 'To Netlify 🚀 from 🏠',
  transitSystem: 'sf-muni',
  routeTitle: 'Outbound to Third + 20th Streets',
  routeNumer: '22',
  stopId: '5018',
  minutesFromBus: '5'
}

const fromWork = {
  title: 'To 🏠 from Netlify 🚀',
  transitSystem: 'sf-muni',
  routeNumer: '22',
  routeTitle: 'Inbound to Bay Street',
  stopId: '3410',
  minutesFromBus: '5'
}

const routes = [
  toWork,
  fromWork
]

function getBusData(routeInfo) {
  const { transitSystem, routeNumer, stopId } = routeInfo

  const apiBaseUrl = (isLocalHost()) ? 'http://webservices.nextbus.com/service/publicJSONFeed' : '/api/service/publicJSONFeed'
  const busApiUrl = `${apiBaseUrl}?command=predictions&a=${transitSystem}&r=${routeNumer}&s=${stopId}`

  // offline stub
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return Promise.resolve(busData)
  }

  return fetch(busApiUrl).then((response) => {
    return response.json()
  })
}

export default class App extends Component {
  state = {
    schedules: []
  }
  componentDidMount() {
    // promise.all or individual requests?
    const apiCalls = routes.map((routeInfo) => {
      return getBusData(routeInfo)
    })

    Promise.all(apiCalls).then((data) => {
      console.log('got all the stuff', data)
      const stateData = routes.map((routeInfo, i) => {
        return {
          ...routeInfo,
          // TODO change back to real data
          data: data[i]
        }
      })
      console.log('stateData', stateData)
      this.setState({
        schedules: stateData
      })
    })
  }
  handleBusNotification = (event) => {
    console.log('leaveTime', event.target.dataset.leaveTime)
    const leaveTime = event.target.dataset.leaveTime
    const data = {
      "message": "⊂◉‿◉つ bus time",
      "startAt": parseInt(leaveTime, 10),
    }
    selectBus(data).then(() => {
      alert('Reminder Set!')
    })
  }
  renderTimes(sched) {
    const { data } = sched
    const times = data.predictions.direction.prediction

    const timeZone = 'America/Los_Angeles'
    const currentTime = spacetime.now(timeZone)
    // Is there freakin time to make it?
    const timeToMakeIt = currentTime.clone().add(5, 'minutes')

    if (!times) {
      return <div>no times</div>
    }

    return times.map((time, i) => {
      // enrich data with exact bus time
      return {
        ...time,
        busTime: currentTime.clone().add(time.seconds, 'seconds')
      }
    }).filter((time) => {
      const { busTime } = time
      return busTime.isAfter(timeToMakeIt)
    }).map((time, i) => {
      const { busTime } = time
      const diff = currentTime.since(busTime)
      const leaveTime = busTime.clone().subtract(5, 'minutes')
      const leaveTimeDiff = currentTime.since(leaveTime)

      return (
        <div key={i} className='bus-card-contents'>
          <div className='bus-card-time'>
            <div>
              {busTime.format('time')} Bus
            </div>
            <div>
              <strong>{diff.precise}</strong>
            </div>
            <div>
              You must leave in: {leaveTimeDiff.rounded} to make it
            </div>
          </div>
          <button
            onClick={this.handleBusNotification}
            data-leave-time={leaveTime.epoch}
            className='notify-me-button'
          >
            Notify me
          </button>
        </div>
      )
    })
  }
  renderSchedules() {
    const { schedules } = this.state
    console.log('schedules', schedules)
    if (!schedules || !schedules.length) {
      return <div>No routes supplied</div>
    }

    return schedules.map((sched, i) => {
      const { data } = sched
      const { predictions } = data
      console.lo
      const routeTitle = predictions.routeTitle
      let timesData = sched

      let routeDirectionTitle = predictions.direction.title
      if (Array.isArray(predictions.direction)) {
        console.log('predictions.direction', predictions.direction)
        timesData = predictions.direction.reduce((acc, curr) => {
          console.log('curr', curr)
          if (curr.title === sched.routeTitle) {
            return curr
          }
          return acc
        }, {})
        console.log('timesData', timesData)
        // TODO update logic
        sched.data.predictions.direction.prediction = timesData.prediction
        routeDirectionTitle = timesData.title
      }



      // TODO fix street name
      const streetName = predictions.stopTitle
      return (
        <div className='bus-card' key={i}>
          <h1 className='bus-card-title'>
            {sched.title}
          </h1>
          <div className='bus-card-meta'>
            <div className='bus-card-route-title'>
              {routeTitle} - {streetName}
            </div>
            <div className='bus-card-route-description'>
              {routeDirectionTitle}
            </div>
          </div>
          {this.renderTimes(sched)}
        </div>
      )
    })

  }
  render() {
    const date = spacetime.now('America/Los_Angeles')
    const currentTime = date.format('time')

    return (
      <div className="App">
        <header className="app-header">
          <h1 className="App-title">Buslify</h1>
          <div>
            {greeting()} Happy {date.dayName()}. The current time is {currentTime}
          </div>
        </header>
        <div className='routes'>
          {this.renderSchedules()}
        </div>
      </div>
    )
  }
}

function greeting() {
  const now = new Date()
  const hrs = now.getHours()
  if (hrs < 12) {
    return 'Good morning!'
  }

  if (hrs >= 12 && hrs <= 17) {
    return 'Good afternoon!'
  }

  if (hrs >= 17 && hrs <= 24) {
    return 'Good evening!'
  }
}

function selectBus(data) {
  console.log('select bus', data)
  return fetch('https://zrer1fouga.execute-api.us-east-1.amazonaws.com/prod/schedule', {
    body: JSON.stringify(data),
    method: 'POST'
  }).then(response => {
    return response.json()
  })
}

function isLocalHost() {
  const isLocalhostName = window.location.hostname === 'localhost';
  const isLocalhostIPv6 = window.location.hostname === '[::1]';
  const isLocalhostIPv4 = window.location.hostname.match(
    // 127.0.0.1/8
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  );

  return isLocalhostName || isLocalhostIPv6 || isLocalhostIPv4;
}
