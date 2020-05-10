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

class App extends React.Component {

  constructor(props) {
    super(props);
    this.emptyResults = {
      buckets: [],
      bucketCategories: [],
      infectious: [],
      infected: [],
      deaths: [],
      effectiveR0: [],
      herdImmunity: [],
    }
    this.state = {
        useBuckets: false,
        usedBuckets: false,
        useAnimate: true,
        naiveModelBuckets: [
          {relativeSize: 1, spreadMultiple: 1}
        ],
        buckets: [
          {relativeSize: 1, spreadMultiple: 20},
          {relativeSize: 5, spreadMultiple: 5},
          {relativeSize: 20, spreadMultiple: 2},
          {relativeSize: 48, spreadMultiple: 1},
          {relativeSize: 20, spreadMultiple: 0.5},
          {relativeSize: 5, spreadMultiple: 0.25},
          {relativeSize: 1, spreadMultiple: 0.1},
        ],
        results: this.emptyResults,
    };
    this.day = 0;
    this.sim = null;
    this.inputs = [
      ['Population', 'population', 1000000],
      ['Initial infected', 'initialInfected', 1000],
      ['Initial R0', 'initialR0', 2.5],
      // ['IFR', 'ifr', 0.5],
      ['Days before infectious', 'incubationDays', 3],
      ['Days Infectious', 'infectiveDays', 7],
      // ['Days until death', 'averageDaysUntilDeath', 21],
      ['Days in chart', 'days', 150],
      ['Mitigation start day', 'lockdownStart', 60],
      ['Mitigation days', 'lockdownDays', 14],
      ['Mitigation effectiveness', 'lockdownEffectiveness', 0],
    ]
    this.inputs.forEach(input=>{
      this.state[input[1]] = input[2]
    })
    this.bucketTextInput = React.createRef(); 
  }

  componentDidMount = () => {
    this.runSimulation();
  }

  runSimulation = async () => {

    console.log('runSimulation')

    if (this.state.useBuckets) {
      const buckets = this.bucketTextInput.current.value.trim().split("\n").map(line=>JSON.parse(line));
      await this.setState({buckets});
    }

    this.setState({
      results: this.emptyResults,
      usedBuckets: this.state.useBuckets,
    });

    this.day = 0;
    this.sim = new Sim(this.state);

    clearInterval(this.timer);
    if (this.state.useAnimate) {
      this.timer = setInterval(()=>{
        this.animateDay()
      }, 100);
    } else {
      for (let day = 1; day <= this.state.days; day++) {
        this.sim.processDay(day);
      }
      const results = this.sim.finishRun();
      this.setState({results})
    }
  }

  animateDay = () => {
    this.day++;
    if (this.day < this.state.days) {
      const results = this.sim.processDay(this.day)
      this.setState({results})
    } else {
      clearInterval(this.timer);
      this.sim.finishRun();
    }
  }

  changeInput = (name, value) => {
    this.setState({[name]: value})
  }

  render = () => {
    return (
      <>
      <div style={{backgroundColor: '#371A32', padding: 20, paddingTop: 30, paddingBottom: 30, fontSize: 15, color: 'white'}}>
        <h2 style={{fontWeight: 'bold', color: 'white'}}>
          Coronavirus Super Spreader Model
        </h2>
        <span>Created by <a style={{color: '#F2C7EB'}} href='https://twitter.com/jspaulding'>Jesse Spaulding</a>. Source code available on <a style={{color: '#F2C7EB'}} href="https://github.com/jspauld/coronavirus-super-spreader-model">GitHub</a></span>
      </div>
      {this.renderDescription()}
      <Container fluid>
        <Row className='h-100'>
          {this.renderLeftCol()}
          {this.renderRightCol()}
        </Row>
      </Container>
      </>
    );
  }

  renderDescription = () => {
    return (
      <div style={{backgroundColor: '#F2C7EB', padding: 20, fontSize: 15, borderRadius: 0}}>
        <p style={{maxWidth: 1000}}>
        <b>About this model:</b> This model helps visualize how heterogeneity in the population affects the level at which we can expect to achieve herd immunity.
        I created this because some epidemiologists have been <a href="https://www.nytimes.com/2020/05/01/opinion/sunday/coronavirus-herd-immunity.html">making arguments against herd immunity</a> using naive models that fail to account for heterogeneity entirely.
        </p>
        <p style={{maxWidth: 1000}}>
          <b>Why heterogenity matters:</b> Not everyone is alike in their likelihood of catching and spreading the virus. 
          Someone who lives in a dense urban area and goes to crowded bars every night is <i>MUCH</i> more likely to contract and spread the virus than a person who sits at home playing video games all day. 
          "Super spreaders" catch the virus first, and as they become immune the R0 is lowered among the remaining population.
        </p>
        <p style={{maxWidth: 1000}}>
          <b>Disclaimer:</b> I'm not an epidemiologist. There may be errors in my code. Code available on <a href="https://github.com/jspauld/coronavirus-super-spreader-model">GitHub</a>.
        </p>
      </div>
    )
  }

  renderLeftCol = () => {
    const bucketString = this.state.buckets.reduce((a,b)=>`${a}${JSON.stringify(b)}\n`, '')
    return (
      <Col sm={5} style={{backgroundColor: '#F1EBF0', paddingTop: 30, paddingBottom: 30}}>
        

        <h4 style={{marginBottom: 20}}>Choose model</h4>
        <Form.Check
          id='useBucketsNo'
          name='useBuckets'
          type='radio'
          label="Naive"
          onChange={(e)=>this.changeInput(e.target.name, false)}
          defaultChecked={!this.state.useBuckets}
        />
        <Form.Check
          id='useBucketsYes'
          name='useBuckets'
          type='radio'
          label="Heterogeneous (accounts for super spreaders)"
          onChange={(e)=>this.changeInput(e.target.name, true)}
          defaultChecked={this.state.useBuckets}
        />
        {this.state.useBuckets && 
         <>
          <Form.Label column sm="6" style={{fontSize: 14}}>Buckets</Form.Label>
          <Form.Control ref={this.bucketTextInput} as='textarea' defaultValue={bucketString} style={{height: 200, fontSize: 14}} />
         </>
        }

      <Form.Check
        id='useAnimate'
        name='useAnimate'
        type='checkbox'
        label="Animate charts"
        style={{marginTop: 30}}
        onChange={(e)=>this.changeInput(e.target.name, e.target.checked)}
        defaultChecked={this.state.useAnimate}
      />

       {this.renderSimulateButton()}

        <h4 style={{marginTop: 30}}>Parameters</h4>
        {this.inputs.map(input=>this.renderInput(input))}
        {this.renderSimulateButton()}
      </Col>
    )
  }

  renderSimulateButton = () => (
    <>
      <Button variant="primary" className='btn-lg' onClick={this.runSimulation} style={{marginTop: 20}}>Run Simulation</Button>
    </>
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
      <Col sm={7} style={{paddingTop: 30}}>
        <div>
          <h4>Population infected over time</h4>
          {this.renderInfectedChart()}
          {this.state.usedBuckets && <>
            <h4>Population infected by bucket</h4>
            <p>The population is divided into buckets according to likelihood of catching and spreading the virus.</p>
            {this.renderBucketsChart()}
          </>}
          <h4>R0 over time</h4>
          {this.renderR0Chart()}
        </div>
      </Col>
    )
  }

  renderInfectedChart = () => {
    return (
      <VictoryChart 
        theme={VictoryTheme.material}
        domain={{ x: [0, this.state.days], y: [0, 1] }}
        style={{ labels: { fontSize: 8 } }}
        height={270}
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
            { name: "Herd Immunity", symbol: { fill: "pink" } },
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
          tickFormat={(x) => (`${x*100}%`)}
        />
          <VictoryArea data={this.state.results.infectious} style={{data: { fill: "orange", opacity: 1 }}} />
          <VictoryLine data={this.state.results.infected} style={{data: { stroke: 'purple', opacity: 1 }}} />
          <VictoryLine data={this.state.results.herdImmunity} style={{data: { stroke: 'pink', strokeWidth: 2, opacity: 1 }}} />
          {/* <VictoryLine data={this.state.deaths} style={{data: { fill: "red", opacity: 0.7 }}} /> */}
      </VictoryChart>
    )
  }

  renderBucketsChart = () => {
    return (
      <VictoryChart
        theme={VictoryTheme.material}
        domain={{ y: [0, 1] }}
        domainPadding={20}
        height={220}
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
        height={220}
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
