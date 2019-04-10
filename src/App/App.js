import React, { Component } from "react";
import { Table, Alert, Tabs, Tab } from 'react-bootstrap'; 
import { PacmanLoader } from 'react-spinners';
import { Link } from 'react-router-dom';

import Chart from "react-google-charts";

import NewPositionSettings from '../Components/NewPositionSettings'
import BotSettings from '../Components/BotSettings'
import Position from '../Components/Position'
import DataFeedSettings from '../Components/DataFeedSettings'
import TradingStats from '../Components/TradingStats'
import BotPositionsChart from '../Components/BotPositionsChart'
import BotPnLChart from '../Components/BotPnLChart'

import Api from '../API/Api'

import { css } from '@emotion/core';
import "./App.css";


const API_BASE_URL = "https://api.cryptobot.club/api"

const override = css`
    display: block;
    margin: 0 auto;
    border-color: black;
`;

class App extends Component {

  constructor(props) {

      super(props);

     //this.resetLocalStorage();

      let {botSettings, datafeedSettings, positionSettings} = this.fetchStateFromLocalStorage();

      this.state = {
        botSettings: botSettings,
        datafeedSettings: datafeedSettings, 
        positionSettings: positionSettings,

        chartData: undefined,
        userCharts: undefined,
        pnlChartData: undefined,
        positions: undefined,
        stats: undefined,
      };

  }


// Manage Local Storage

resetLocalStorage() {

    localStorage.removeItem("botSettings.botId");
    localStorage.removeItem("botSettings.balanceAmount");
    localStorage.removeItem("botSettings.exchangeFeesAmount");
    localStorage.removeItem("botSettings.tradeSideLongOnly");
  
    localStorage.removeItem("datafeedSettings.symbol");
    localStorage.removeItem("datafeedSettings.interval");
    localStorage.removeItem("datafeedSettings.dateTo");
    localStorage.removeItem("datafeedSettings.dateFrom");
  
    localStorage.removeItem("positionSettings.value");
    localStorage.removeItem("positionSettings.stopLoss");
    localStorage.removeItem("positionSettings.takeProfit");
    localStorage.removeItem("positionSettings.trailingStop");
}


fetchStateFromLocalStorage() {

  let botId = localStorage.getItem("botSettings.botId");
  let balanceAmount = localStorage.getItem("botSettings.balanceAmount");
  let exchangeFeesAmount = localStorage.getItem("botSettings.exchangeFeesAmount");
  let tradeSideLongOnly = localStorage.getItem("botSettings.tradeSideLongOnly");

 
  let symbol = localStorage.getItem("datafeedSettings.symbol");
  let interval = localStorage.getItem("datafeedSettings.interval");
  let dateToS = localStorage.getItem("datafeedSettings.dateTo");
  let dateFromS = localStorage.getItem("datafeedSettings.dateFrom");

  let value = localStorage.getItem("positionSettings.value");
  let stopLoss = localStorage.getItem("positionSettings.stopLoss");
  let takeProfit = localStorage.getItem("positionSettings.takeProfit");
  let trailingStop = localStorage.getItem("positionSettings.trailingStop");

  console.log("fetchStateFromLocalStorage trailingStop: ", stopLoss, takeProfit);
  

  var oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  let dateTo = (dateToS) ? new Date(Date.parse(dateToS)) : new Date();
  let dateFrom = (dateFromS !== null) ?  new Date(Date.parse(dateFromS)) : oneDayAgo;
  
  return {
    botSettings: {
      botId: botId ? botId : '',
      balanceAmount: balanceAmount ? balanceAmount : 10000,
      exchangeFeesAmount: exchangeFeesAmount ? exchangeFeesAmount : 0.2,
      tradeSideLongOnly: tradeSideLongOnly === 'true',
    },

    datafeedSettings: {
      symbol: symbol ? symbol : 'BTCUSDT',
      interval: interval ? interval : '1d',
      currency: symbol ? this.feedCurrency(symbol) : '',
      counterCurrency: symbol ? this.feedCounterCurrency(symbol) : '',
      dateFrom: dateFrom,
      dateTo: dateTo,
    },

    positionSettings: {
      strategyId: 'FIXED',
      value: value ? value : 1.0,
      stopLoss: stopLoss !== undefined ? stopLoss : 99,
      takeProfit: takeProfit ? takeProfit : undefined,
      trailingStop: trailingStop  && trailingStop === 'true' ? true  : false,
    },
  }
}


saveStateToLocalStorage(botSettings, datafeedSettings, positionSettings) {

  console.log("saveStateToLocalStorage: ", positionSettings)
  if (botSettings) { 
     botSettings.botId && localStorage.setItem("botSettings.botId", botSettings.botId);
     botSettings.balanceAmount && localStorage.setItem("botSettings.balanceAmount", botSettings.balanceAmount);
     botSettings.exchangeFeesAmount && localStorage.setItem("botSettings.exchangeFeesAmount", botSettings.exchangeFeesAmount);
     botSettings.tradeSideLongOnly && localStorage.setItem("botSettings.tradeSideLongOnly", botSettings.tradeSideLongOnly);
  }

  if (datafeedSettings) {
      datafeedSettings.symbol && localStorage.setItem("datafeedSettings.symbol", datafeedSettings.symbol);
      datafeedSettings.interval && localStorage.setItem("datafeedSettings.interval", datafeedSettings.interval);
      datafeedSettings.dateFrom && localStorage.setItem("datafeedSettings.dateFrom", datafeedSettings.dateFrom.toISOString());
      datafeedSettings.dateTo && localStorage.setItem("datafeedSettings.dateTo", datafeedSettings.dateTo.toISOString());
  }

  if (positionSettings) { 
      this.storeValue("positionSettings.value", positionSettings.value);
      this.storeValue("positionSettings.stopLoss", positionSettings.stopLoss);
      this.storeValue("positionSettings.takeProfit", positionSettings.takeProfit);
      this.storeValue("positionSettings.trailingStop", positionSettings.trailingStop);
  }
  
}


storeValue = (key, value) => {
  if (key && value !== 'undefined') {
      localStorage.setItem(key, value);
  } else {
      localStorage.removeItem(key)
  }
}


backtest = (event) => {

  let secsInDay = 60 * 60 * 24;
  let dateTo = this.state.datafeedSettings.dateTo;

  // round up the the end of the day
  let roundedUpDate =  new Date( Math.floor( (dateTo.getTime()  + secsInDay * 1000) / 1000 / secsInDay ) * secsInDay * 1000);
  console.log("backtest() - ", dateTo.toISOString(), " -> ", roundedUpDate.toISOString());

  let positionSettings = this.state.positionSettings;
  let botSettings = this.state.botSettings;
  let datafeedSettings = {
    symbol: this.state.datafeedSettings.symbol, 
    dateFrom: this.state.datafeedSettings.dateFrom.toISOString(), 
    dateTo: roundedUpDate.toISOString(), 
    interval: this.state.datafeedSettings.interval,
  }
  console.log("backtest - datafeedSettings: ", datafeedSettings, "botSettings :", botSettings, "positionSettings: ", positionSettings);
 
  this.executeCode(botSettings, datafeedSettings, positionSettings)
 
}

// Code execution

executeCode(botSettings, datafeedSettings, positionSettings)  {

  this.setState({
      running: true,
      error: undefined,
  })

  new Api().submitExecution(botSettings, datafeedSettings, positionSettings).then(data => {

      let { error, candles, charts, positions, stats, annotations, symbol, interval} = data;
      
      // handle execution error
      if (error) {
        this.setState({
             error: error,
             running: false,
        })
        return;
      }

      // map position open/close dates against position info
      let positionsMap = {}
      let closedPositions = [];
    
      positions.forEach( position => {                
          if (position.status === 'CLOSED') {
            positionsMap[position.openDate.toISOString()] = position;
            positionsMap[position.closedDate.toISOString()] = position;
            closedPositions.push(position);
          }
      })

      // make user charts
      let userCharts = this.makeUserCharts(charts);

      let chartInput = {
          ticker: this.state.datafeedSettings.symbol,
          interval: this.state.datafeedSettings.interval,
          candles: candles,
          positions: positions,       
          annotations: annotations, 
      }

      this.setState({
          positions: closedPositions,
          candles: candles,
          userCharts: userCharts,
          chartInput: chartInput,
          running: false,
          error: undefined,
      });

  })
  .catch(error => {
    console.log("error", error);
      this.setState({
        running: false,
        error: error.toString(),
     })
  });


}




/// Save Widgets Callbacks

saveBotSettings = (botSettings) => {     

  let {botId, balanceAmount, exchangeFeesAmount, tradeSideLongOnly} = botSettings;
  this.setState({
      botSettings: botSettings
  })

  this.saveStateToLocalStorage(botSettings, undefined, undefined);
}


saveDataFeedSettings = (datafeedSettings) => {

    let {symbol, currency, counterCurrency, interval, dateFrom, dateTo} = datafeedSettings;
    this.setState({
        datafeedSettings: datafeedSettings,
    })

    this.saveStateToLocalStorage(undefined, datafeedSettings, undefined);
   // this.saveStateToLocalStorage(symbol, interval, dateFrom, dateTo, this.state.botSettings.botId);
 
}

savePositionSettings = (positionSettings) => {
        
  let {valid, strategyId, value, stopLoss, takeProfit, trailingStop} = positionSettings;

  this.setState({
      positionSettings: positionSettings
  })
  this.saveStateToLocalStorage(undefined, undefined, positionSettings);

}



//// Charts


makeUserCharts = (chartsData) => {

  let charts = {};

  let chartNames = Object.keys(chartsData);
  chartNames.forEach(name => {
      charts[name] = [];
  })

  chartNames.forEach(name => {
    let data = chartsData[name];

    let rowlength;
    let chartRows = data.map( d => {

      var row = [d.date];
      let values = d.values;
    
      if (values.constructor === Array) {
        row = row.concat(values);
      } else {
        row.push(values);
      } 
      rowlength = row.length;
      return row;
    })
    
    // add columns names
    var columns = ["Date"];
    for (var i=1; i<rowlength; i++) {
      columns.push(name+" "+i);
    }

    charts[name].push( columns );
    charts[name] = charts[name].concat(chartRows);
  })
  
  return charts;
}



//// Helpers

feedCurrency = (symbol) => {

  let currencies = ['USDT', 'BTC', 'ETH']
  var currency;
  currencies.forEach ( c =>  {
      if (symbol.endsWith(c)) {
          currency = symbol.substring(0, symbol.indexOf(c));
      }
  })
  return currency;
}

feedCounterCurrency = (symbol) => {

  let currencies = ['USDT', 'BTC', 'ETH']
  var counterCurrency;
  currencies.forEach ( c =>  {
      if (symbol.endsWith(c)) {
          counterCurrency = c;
      }
  })

  return counterCurrency;
}

render() {


    // positions
    var count = 0;
    let positions = this.state.positions && this.state.positions.map( position => {
        let key = "key-" +count;
        count++;
        return (        
            <Position key={key} {...position} />
        )
    });


    var userCharts = this.state.userCharts && Object.keys(this.state.userCharts).map(name => {

        let chartData = this.state.userCharts[name];
        return (
          <Chart
          key={name}
          width={"100%"}
          height={"600px"}
          chartType="LineChart"
          loader={<div>Loading Chart</div>}
          data={chartData}
          options={{
            series: {
              0: { color: '#43459d' },
              1: { color: '#e7711b' },
              2: { color: '#e2431e' },
              3: { color: '#6f9654' },
              4: { color: '#1c91c0' },
              5: { color:  '#f1ca3a' },
            },
            // Use the same chart area width as the control for axis alignment.
            chartArea: { height: "80%", width: "100%" },
            hAxis: { slantedText: false },
            legend: { position: "top" },
            explorer: { 
              actions: ['dragToZoom', 'rightClickToReset'],
              axis: 'horizontal',
              keepInBounds: true,
              maxZoomIn: 10.0
            },
            colors: ["#336699"],
            format: "short",
            annotations: {
              textStyle: {
                fontSize: 24
              },
              alwaysOutside: true
            }
          }}
        />
        )
    })

  
    return (

      <div className="App">

        <div className="banner"> 
           <div>Bot Factory</div>
        </div>

        <div className="bot-editor-controllers-wrapper">

            <BotSettings   
                balanceAmount={this.state.botSettings.balanceAmount} 
                exchangeFeesAmount={this.state.botSettings.exchangeFeesAmount} 
                tradeSideLongOnly={this.state.botSettings.tradeSideLongOnly} 
                botId={this.state.botSettings.botId} 

                onChange={this.saveBotSettings}
            />

            <DataFeedSettings 
                 apiBaseUrl={API_BASE_URL}
                 symbol={this.state.datafeedSettings.symbol} 
                 interval={this.state.datafeedSettings.interval} 
                 dateFrom={this.state.datafeedSettings.dateFrom} 
                 dateTo={this.state.datafeedSettings.dateTo}

                 onChange={this.saveDataFeedSettings}
            />
   
            <NewPositionSettings
                currency={this.state.datafeedSettings.currency}  
                counterCurrency={this.state.datafeedSettings.counterCurrency}                                     
                strategyId={this.state.positionSettings.strategyId}  
                value={this.state.positionSettings.value}  
                stopLoss={this.state.positionSettings.stopLoss}  
                takeProfit={this.state.positionSettings.takeProfit} 
                trailingStop={this.state.positionSettings.trailingStop}  

                onChange={this.savePositionSettings}
            />

        </div>

        
        <div style={{margin:20}}>
            <button className="button" value="Backtest" onClick={this.backtest} 
                disabled={this.state.running ||
                    (this.state.positionSettings.valid == false) ||
                    (this.state.datafeedSettings.valid == false) ||
                    (this.state.botSettings.valid == false)
                    } >
                Backtest
            </button>
        </div>
    

    
        {this.state.error && 
        <Alert variant="danger"> 
            {this.state.error}
        </Alert>}    

        {this.state.running && 
        <div className="bot-editor-charts-loading"> 
                <PacmanLoader
                    css={override}
                    sizeUnit={"px"}
                    size={30}
                    margin="0"
                    color={'#333333'}
                    loading={this.state.running}
                />
        </div>}
        
        {!this.state.running && this.state.candles && 
                <TradingStats 
                    fees={this.state.botSettings.exchangeFeesAmount}
                    positions={this.state.positions} 
                    candles={this.state.candles}  
                    currency={this.state.datafeedSettings.currency}  
                    counterCurrency={this.state.datafeedSettings.counterCurrency} 
                    accountCurrency=''
                  /> }

<br/>

  {!this.state.chartInput && <Alert variant="light" style={{height: 100}}>  Results of your backtest will show here.</Alert>}
  
  {this.state.chartInput &&  
  <Tabs defaultActiveKey="charts" id="tabs" onSelect={this.handleTabSelected}>

        <Tab eventKey="charts" title="Charts">
            {!this.state.running && this.state.chartInput && <BotPositionsChart {...this.state.chartInput} />  }            
            {!this.state.running && userCharts}
            {!this.state.running && this.state.chartInput && <BotPnLChart {...this.state.chartInput} /> } 
        </Tab>

        <Tab eventKey="trades" title="Trades">
          {!this.state.running && positions && positions.length > 0 &&
            <div >
                <Table striped bordered hover responsive="sm">
                        <thead>
                            <tr>
                                <th>Opened</th>
                                <th>Closed</th>
                                <th>Side</th>
                                <th>Size</th>
                                <th>Entry</th>
                                <th>Last</th>
                                <th>Status</th>
                                <th>P&amp;L</th>
                                <th>P&amp;L Perc</th>
                                <th>Fees</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions}
                        </tbody>
                    </Table>
            </div>
          }  
        </Tab>

      </Tabs>}

        <div className="footer"> 
          <a href="https://cryptobot.club/">https://cryptobot.club</a> &nbsp;  © Copyrigtht 2019
        </div>
      </div>
        
    );
  }
}

export default App;
