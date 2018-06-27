import React, { Component } from 'react'
import spacetime from 'spacetime'
import './App.css'
import busData from './stubs/to-work.json'
import busDataTwo from './stubs/from-work.json'

const stub = [
  busData,
  busDataTwo
]

const toWork = {
  title: 'To netlify from home',
  transitSystem: 'sf-muni',
  routeTitle: 'Outbound to Third + 20th Streets',
  routeNumer: '22',
  stopId: '5018',
  minutesFromBus: '5'
}

const fromWork = {
  title: 'From Netlify to Home',
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
  const apiBaseUrl = 'http://webservices.nextbus.com/service/publicJSONFeed'
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
  renderTimes(sched) {
    const { data } = sched
    const times = data.predictions.direction.prediction
    console.log('sched.data.predictions.direction.title', sched.data.predictions.direction.title)
    console.log('times', times)
    const currentTime = spacetime.now()
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
      console.log('diff', diff)
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
          <button>Notify me</button>
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
      const routeTitle = predictions.routeTitle
      let timesData = sched
      console.log('routeTitle', routeTitle)
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
      }
      const routeDirectionTitle = predictions.direction.title


      // TODO fix street name
      const streetName = predictions.direction.stopTitle
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
    const date = spacetime.now()
    const currentTime = date.format('time')

    return (
      <div className="App">
        <header className="app-header">
          <h1 className="App-title">Busify</h1>
          <div>
            Good morning. Happy {date.dayName()}. The current time is {currentTime}
          </div>
        </header>
        <div className='routes'>
          {this.renderSchedules()}
        </div>
      </div>
    )
  }
}
