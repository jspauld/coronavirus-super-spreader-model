import React from 'react';
import './App.css';
import { VictoryLegend, VictoryArea, VictoryBar, VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory';
import Sim from './simulation/Sim';
import 'bootstrap/dist/css/bootstrap.min.css';

import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Navbar from 'react-bootstrap/Navbar';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        useBuckets: true,
        buckets: [
          {bucketSize: 1, spread: 0.1},
          {bucketSize: 5, spread: 0.25},
          {bucketSize: 20, spread: 0.5},
          {bucketSize: 48, spread: 1},
          {bucketSize: 20, spread: 2},
          {bucketSize: 5, spread: 5},
          {bucketSize: 1, spread: 20},
        ],
        results: {
          simUsedBuckets: false,
          buckets: [],
          bucketCategories: [],
          infectious: [],
          infected: [],
          deaths: [],
          effectiveR0: [],
        },
    };
    this.sim = null;
    this.inputs = [
      ['Population', 'population', 1000000],
      ['Initial infected', 'initialInfected', 100],
      ['Initial R0', 'initialR0', 2.5],
      ['IFR', 'ifr', 0.5],
      ['Days before infectious', 'incubationDays', 3],
      ['Days Infectious', 'infectiveDays', 5],
      ['Days until death', 'averageDaysUntilDeath', 21],
      ['Days in chart', 'days', 150],

    ]
    this.mitigationInputs = [
      ['Mitigation start day', 'lockdownStart', 60],
      ['Mitigation days', 'lockdownDays', 14],
      ['Mitigation effectiveness', 'lockdownEffectiveness', 0],
    ]
    this.inputs.forEach(input=>{
      this.state[input[1]] = input[2]
    })
    this.mitigationInputs.forEach(input=>{
      this.state[input[1]] = input[2]
    })
    this.bucketInput = React.createRef(); 
  }

  componentDidMount = () => {
    this.runSimulation();
  }

  runSimulation = async () => {

    if (this.state.useBuckets) {
      const buckets = this.bucketInput.current.value.trim().split("\n").map(line=>JSON.parse(line));
      await this.setState({buckets});
    }

    // Reset chart
    let infectious = [];
    let infected = [];
    let deaths = [];
    let effectiveR0 = [];
    // console.log(this.state)
    this.sim = new Sim(this.state);
    for (let day = 1; day <= this.state.days; day++) {
      this.sim.startDay(day);
      infectious = [...infectious, this.sim.getInfectious()];
      infected = [...infected, this.sim.getTotalInfected()];
      deaths = [...deaths, this.sim.getTotalDeaths()];
      effectiveR0 = [...effectiveR0, this.sim.getEffectiveR0()];
    }
    const buckets = this.sim.getChartBuckets();
    console.log({buckets})
    const bucketCategories = this.sim.getChartBucketsCategories();
    this.setState({results: {
      bucketsUsed: this.state.useBuckets,
      infectious, infected, deaths, effectiveR0, buckets, bucketCategories}});
    this.sim.onComplete();
  }

  changeInput = (name, value) => {
    this.setState({[name]: value})
  }

  // handleNewDay = async () => {
  //   this.sim.handleNewDay();

  //   // this.setState(prevState => ({
  //   //   arrayvar: [...prevState.arrayvar, newelement]
  //   // }))

  //   await this.setState(prevState => ({
  //     infectious: [...prevState.infectious, this.sim.getInfectious()],
  //     done: [...prevState.done, this.sim.getDone()],
  //     dead: [...prevState.dead, this.sim.getDead()],
  //   }));
  //   console.log(this.sim.getInfectious());
  // }

  render = () => {
    return (
      <>
      <div style={{backgroundColor: '#343a40', padding: 20}}>
        <h1 style={{color: 'white'}}>
          Coronavirus Super Spreader Simulation
        </h1>
        <p>Created by <a href='https://twitter.com/jspaulding'>@jspaulding</a></p>
      </div>
      <Container fluid>
        <Row className='h-100'>
          {this.renderLeftCol()}
          {this.renderRightCol()}
        </Row>
      </Container>
      </>
    );
  }

  renderLeftCol = () => {
    const bucketString = this.state.buckets.reduce((a,b)=>`${a}${JSON.stringify(b)}\n`, '')
    return (
      <Col sm={5} style={{backgroundColor: '#d3d3d3', paddingTop: 20, paddingBottom: 20}}>
        <h5>Choose model</h5>
        <Form.Check
          name='useBuckets'
          type='radio'
          label="Naive"
          onChange={(e)=>this.changeInput(e.target.name, false)}
          defaultChecked={!this.state.useBuckets}
        />
        <Form.Check
          name='useBuckets'
          type='radio'
          label="Heterogeneous (accounts for super spreaders)"
          onChange={(e)=>this.changeInput(e.target.name, true)}
          defaultChecked={this.state.useBuckets}
        />
        {this.state.useBuckets && 
         <>
          <Form.Label column sm="6" style={{fontSize: 14}}>Buckets</Form.Label>
          <Form.Control ref={this.bucketInput} as='textarea' defaultValue={bucketString} style={{height: 200}} />
         </>
        }
       {this.renderSimulateButton()}
        <h5 style={{marginTop: 20}}>Mitigation</h5>
        {this.mitigationInputs.map(input=>this.renderInput(input))}
        <h5 style={{marginTop: 20}}>More parameters</h5>
        {this.inputs.map(input=>this.renderInput(input))}
        {this.renderSimulateButton()}
      </Col>
    )
  }

  renderSimulateButton = () => (
    <Button variant="primary" className='btn-block' onClick={this.runSimulation} style={{marginTop: 20}}>Run Simulation</Button>
  )

  renderInput = (input) => {
    return (
      <Form.Group key={input[1]} as={Row} className='inputContainer'>
        <Form.Label column sm="6" style={{fontSize: 14}}>{input[0]}</Form.Label>
        <Col sm="6">
          <Form.Control type="text" id={input[1]} defaultValue={input[2]} onChange={(e)=>this.changeInput(e.target.id, Number(e.target.value))} />
        </Col>
      </Form.Group>
    )
  }

  renderRightCol = () => {
    return (
      <Col sm={7} style={{paddingTop: 20}}>
        <div>
          <h5>Infected population over time</h5>
          {this.renderInfectedChart()}
          {this.state.results.bucketsUsed && <>
            <h5>Population infected by bucket</h5>
            {this.renderBucketsChart()}
          </>}
          <h5>R0 over time</h5>
          {this.renderR0Chart()}
        </div>
      </Col>
    )
  }

  renderInfectedChart = () => {
    return (
      <VictoryChart 
        theme={VictoryTheme.material}
        domain={{ x: [0, this.state.days], y: [0, this.state.population] }}
        style={{ labels: { fontSize: 8 } }}
      >
        <VictoryLegend x={10} y={10}
          // title="Legend"
          centerTitle
          orientation="horizontal"
          gutter={20}
          style={{ title: {fontSize: 14 }, labels: {fontSize: 10} }}
          data={[
            { name: "Infectious", symbol: { fill: "orange" } },
            { name: "Infected Population", symbol: { fill: "purple" } },
            // { name: "Total Dead", symbol: { fill: "red" } }
          ]}
        />
        <VictoryAxis
          // tickValues specifies both the number of ticks and where
          // they are placed on the axis
          // tickValues={[1, 2, 3, 4]}
          // tickFormat={["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"]}
        />
        <VictoryAxis
          dependentAxis
          // tickFormat specifies how ticks should be displayed
          tickFormat={(x) => (`${x / 1000000}m`)}
        />
          <VictoryArea data={this.state.results.infectious} style={{data: { fill: "orange", opacity: 1 }}} />
          <VictoryLine data={this.state.results.infected} style={{data: { stroke: 'purple', opacity: 1 }}} />
          {/* <VictoryLine data={this.state.deaths} style={{data: { fill: "red", opacity: 0.7 }}} /> */}
      </VictoryChart>
    )
  }

  renderBucketsChart = () => {
    return (
      <VictoryChart
        theme={VictoryTheme.material}
        // domain={{ y: [0, 1] }}
        domainPadding={20}
        height={200}
      >
        <VictoryAxis />
        <VictoryAxis dependentAxis tickFormat={(x) => (`${x*100}%`)} />
        <VictoryBar
          data={this.state.results.buckets} 
          categories={{ x: this.state.results.bucketCategories }}
          // barRatio={0.8} 
          style={{data: { fill: "purple" }}} />
      </VictoryChart>
    )
  }

  renderR0Chart = () => {
    return (
      <VictoryChart 
        theme={VictoryTheme.material}
        domain={{ x: [0, this.state.days], y: [0, 4] }}
        height={200}
      >
        <VictoryLegend x={10} y={10}
          // title="Legend"
          centerTitle
          orientation="horizontal"
          gutter={20}
          style={{ title: {fontSize: 14 }, labels: {fontSize: 10} }}
          data={[
            { name: "R0 Over Time", symbol: { fill: "purple" } },
            // { name: "Total Dead", symbol: { fill: "red" } }
          ]}
        />
      <VictoryAxis
      />
      <VictoryAxis
        dependentAxis
      />
        <VictoryLine data={this.state.results.effectiveR0} style={{data: { stroke: "purple", opacity: 1 }}} />
      </VictoryChart>
    )
  }
}

export default App;
