import React from 'react'
import DatePicker from "react-datepicker";
import {Alert} from "react-bootstrap"
import { Card, CardBody, CardTitle, } from 'reactstrap';

import Api from '../API/Api'
//import { reject } from 'q';

class DataFeedSettings extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            tickers: []
        }
    }

    componentWillMount() {
      
        let symbol = this.props.symbol;
        let interval = this.props.interval;
        let dateFrom = this.props.dateFrom;
        let dateTo = this.props.dateTo;

        this.updateDataFeedSettingsState(symbol, interval, dateFrom, dateTo);
   
        this.fetchTickers().then(tickers => {
            console.log("fetchTickers: ", tickers);
            this.setState({
                tickers:tickers,
            })
        }).catch(error => {
            console.log("error: ", error);
            this.setState({
                error: error.toString(),
            })
        })
    }


    fetchTickers = () => {
        
        return new Promise( resolve => {
            new Api(this.props.apiBaseUrl).fetchAllTickers().then(response => {
                var tickers = [];
                response.forEach(element => {
                    let currency = this.feedCurrency(element.symbol);
                    let counterCurrency = this.feedCounterCurrency(element.symbol);
                    tickers.push({
                        symbol: element.symbol,
                        currency: currency,
                        counterCurrency, counterCurrency,
                    })
                });
                resolve(tickers);
            })
        })

    }


    //// Event Handlers
    handleTickerChange = (event) => {

        let symbol = event.target.value;
        console.log("handleTickerChange: ", symbol);

        let interval = this.state.interval;
        let dateFrom = this.state.dateFrom;
        let dateTo = this.state.dateTo;

        this.updateDataFeedSettingsState(symbol, interval, dateFrom, dateTo);
   
    }
      
    handleIntervalChange = (event) => {
      
        const target = event.target;
        
        let symbol = this.state.symbol;
        let interval = target.value;
        let dateFrom = this.state.dateFrom;
        let dateTo = this.state.dateTo;

        this.updateDataFeedSettingsState(symbol, interval, dateFrom, dateTo);
   
    }
      
      
    handleStartDateChange = (dateFrom) => {
      
        let symbol = this.state.symbol;
        let interval = this.state.interval;
        let dateTo = this.state.dateTo;

        this.updateDataFeedSettingsState(symbol, interval, dateFrom, dateTo);
   
    }
      
      
      
    handleEndDateChange = (dateTo) => {
      
        let symbol = this.state.symbol;
        let interval = this.state.interval;
        let dateFrom = this.state.dateFrom;

        this.updateDataFeedSettingsState(symbol, interval, dateFrom, dateTo);

    }
      
    

    updateDataFeedSettingsState = (symbol, interval, dateFrom, dateTo) => {

        let valid = this.isValid(symbol, interval, dateFrom, dateTo)


        let currency = this.feedCurrency(symbol);
        let counterCurrency = this.feedCounterCurrency(symbol);
        
        let state = {
            symbol: symbol,
            currency: currency,
            counterCurrency: counterCurrency,
            interval: interval,
            dateFrom: dateFrom,
            dateTo: dateTo,
        }

        console.log("updateDataFeedSettingsState: ", state);

        this.setState(state);
        this.props.onChange(state);
    }


    // Helpers

    isValid = (symbol, interval, dateFrom, dateTo) => {
        
        let valid = true;
        let error = undefined;

        if (symbol === undefined || symbol === '') {
            valid = false;  
            error = "Select a market";
        } else  if (interval === undefined || interval === '') {
            valid = false;  
            error = "Select a candle interval";
        } else if (dateFrom >= dateTo) {
            valid = false;  
            error = "Invalid dates. 'From' date should be before 'To' date";
        }

        this.setState({
            error: error,
        })
    }
        

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
        
        let tickerOptions = this.state.tickers && this.state.tickers.length > 0 && this.state.tickers.map(ticker => {              
            return (        
                <option key={ticker.symbol} value={ticker.symbol} >{ticker.currency} / {ticker.counterCurrency}</option>
            )
        });

        return ( 

            <Card className="mt-0 mb-0 h-650" >                    
                <CardBody >
                <CardTitle >Data Feed {!this.state.error && <label>✅</label>} </CardTitle>
                <div className="bot-datafeed-section">
                    <div className="bot-editor-control" >
                        <div>Market</div> 
                        <select 
                            name="ticker"
                            value={this.state.symbol || ''}
                            onChange={this.handleTickerChange}
                        >          
                            <option value='' key='' >&lt; Select market &gt;</option>                                                
                            {tickerOptions}                   
                        </select>
                                
                    </div> 
                    <div className="bot-editor-control" >                    
                        <div>Candle Interval</div>
                        <select className="bot-editor-control-select"
                            name="interval"
                            value={this.state.interval}
                            onChange={this.handleIntervalChange}
                            >
                            <option value="1m">1m</option>
                            <option value="5m">5m</option>
                            <option value="10m">10m</option>
                            <option value="15m">15m</option>
                            <option value="30m">30m</option>
                            <option value="1h">1h</option>
                            <option value="2h">2h</option>
                            <option value="3h">3h</option>
                            <option value="4h">4h</option>
                            <option value="6h">6h</option>
                            <option value="1d">1d</option>
                        </select>
                    </div>
                    <div className="bot-editor-control" >   
                        <div>From</div>                 
                        <DatePicker  
                            popperModifiers={{
                            flip: {
                                enabled: false
                            },
                            }}
                            dateFormat="dd/MM/YYYY"
                            name="dateFrom"
                            selected={this.state.dateFrom}
                            onChange={this.handleStartDateChange}
                            showYearDropdown
                            autoComplete="off"
                        />
                    </div>
                    <div className="bot-editor-control" >  
                        <div>To</div>      
                        <DatePicker 
                            popperModifiers={{
                            flip: {
                                enabled: false
                            },
                            }}
                            dateFormat="dd/MM/YYYY"
                            name="dateTo"
                            selected={this.state.dateTo}
                            onChange={this.handleEndDateChange}
                            showYearDropdown
                            autoComplete="off"
                        />
                    </div>

                </div>
                {this.state.error && <Alert variant="danger" >{this.state.error}</Alert>}
                
                </CardBody>
            </Card>
        );
   
    }

};

export default DataFeedSettings;