import React from 'react'
import DatePicker from "react-datepicker";

import { Alert, Form, Row, Col} from "react-bootstrap"
import { Card, CardBody, CardTitle, } from 'reactstrap';


import Api from '../API/Api'


class DataFeedSettings extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            tickers: []
        }
    }

    componentWillMount() {
      
        let exchange = this.props.exchange === undefined ? "BINANCE" : this.props.exchange ;
        let symbol = this.props.symbol;
        let interval = this.props.interval ;
        let dateFrom = this.props.dateFrom;
        let dateTo = this.props.dateTo;
        let rollingWindowSize = this.props.rollingWindowSize === undefined ? 1 : this.props.rollingWindowSize;

        this.updateDataFeedSettingsState(exchange, symbol, interval, dateFrom, dateTo, rollingWindowSize);
   
        this.fetchTickers().then(tickers => {
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

    handleExchangeChange = (event) => {
        console.log("handleExchangeChange", event.target);
    }

    handleTickerChange = (event) => {

        let symbol = event.target.value;
     
        let exchange = this.state.exchange;
        let interval = this.state.interval;
        let dateFrom = this.state.dateFrom;
        let dateTo = this.state.dateTo;
        let rollingWindowSize = this.state.rollingWindowSize;
        this.updateDataFeedSettingsState(exchange, symbol, interval, dateFrom, dateTo, rollingWindowSize);
    }
      
    handleIntervalChange = (event) => {
      
        const target = event.target;
        let interval = target.value;

        let exchange = this.state.exchange;
        let symbol = this.state.symbol;   
        let dateFrom = this.state.dateFrom;
        let dateTo = this.state.dateTo;
        let rollingWindowSize = this.state.rollingWindowSize;
        this.updateDataFeedSettingsState(exchange, symbol, interval, dateFrom, dateTo, rollingWindowSize);
    }
      
    handleRollingWindowSizeChange = (event) => {
      
        const target = event.target;
        let rollingWindowSize = target.value;

        let exchange = this.state.exchange;
        let symbol = this.state.symbol;
        let interval = this.state.interval;
        let dateFrom = this.state.dateFrom;
        let dateTo = this.state.dateTo;

        this.updateDataFeedSettingsState(exchange, symbol, interval, dateFrom, dateTo, rollingWindowSize);
    }
      
    handleStartDateChange = (dateFrom) => {
        
        // round date
        dateFrom.setHours(0);
        dateFrom.setMinutes(0);
        dateFrom.setSeconds(0);
        dateFrom.setMilliseconds(0);

        let exchange = this.state.exchange;
        let symbol = this.state.symbol;
        let interval = this.state.interval;
        let dateTo = this.state.dateTo;
        let rollingWindowSize = this.state.rollingWindowSize;

        this.updateDataFeedSettingsState(exchange, symbol, interval, dateFrom, dateTo, rollingWindowSize);
   
    }
      
      
      
    handleEndDateChange = (dateTo) => {
      

        console.log("handleEndDateChange: ", dateTo);

        let exchange = this.state.exchange;
        let symbol = this.state.symbol;
        let interval = this.state.interval;
        let dateFrom = this.state.dateFrom;
        let rollingWindowSize = this.state.rollingWindowSize;

        this.updateDataFeedSettingsState(exchange, symbol, interval, dateFrom, dateTo, rollingWindowSize);

    }
      
    

    updateDataFeedSettingsState = (exchange, symbol, interval, dateFrom, dateTo, rollingWindowSize) => {

        let valid = this.isValid(symbol, interval, dateFrom, dateTo, rollingWindowSize)
        let currency = this.feedCurrency(symbol);
        let counterCurrency = this.feedCounterCurrency(symbol);
        

        //dateTo.setDate(dateTo.getDate() + 1);
        dateTo.setHours(23);
        dateTo.setMinutes(59);
        dateTo.setSeconds(59);
        dateTo.setMilliseconds(0);

        dateFrom.setHours(0);
        dateFrom.setMinutes(0);
        dateFrom.setSeconds(0);
        dateFrom.setMilliseconds(0);

        let state = {
            exchange: exchange,
            symbol: symbol,
            currency: currency,
            counterCurrency: counterCurrency,
            interval: interval,
            dateFrom: dateFrom,
            dateTo: dateTo,
            rollingWindowSize: rollingWindowSize,
        }
        this.setState(state);
        this.props.onChange(state);
    }


    // Helpers

    isValid = (symbol, interval, dateFrom, dateTo, rollingWindowSize) => {
        
        let valid = true;
        let error = undefined;

        let windowSize = Number(rollingWindowSize);

        if (symbol === undefined || symbol === '') {
            valid = false;  
            error = "Select a market";
        } else  if (interval === undefined || interval === '') {
            valid = false;  
            error = "Select a candle interval";
        } else if (dateFrom >= dateTo) {
            valid = false;  
            error = "Invalid dates. 'From' date should be before 'To' date";
        } else if (windowSize === undefined || isNaN (windowSize) || windowSize <= 0 ) {
            valid = false;  
            error = "Invalid rolling window size.";
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
                <CardTitle >Data Feed {this.state.error && <label>⚠️</label>} </CardTitle>
                
                <Form>

                    <Row>
                        <Col>
                            <Form.Group controlId="feedSettings.exchange">
                                <Form.Label>Exchange</Form.Label>
                                <Form.Control as="select" value={this.state.symbol || ''} onChange={this.handleExchangeChange}>
                                    <option value='BINANCE' key='' >Binance</option>
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group controlId="feedSettings.market">
                                <Form.Label>Market</Form.Label>
                                <Form.Control as="select" value={this.state.symbol || ''} onChange={this.handleTickerChange}>
                                    <option value='' key='' >&lt; Select market &gt;</option>                                                
                                    {tickerOptions}   
                                </Form.Control>

                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>                    
                        <Col>
                            <Form.Group controlId="feedSettings.candleSize">
                                <Form.Label>Candle Interval</Form.Label>
                                <Form.Control as="select" 
                                    value={this.state.interval} onChange={this.handleIntervalChange}>
                                    <option value='' key='' >&lt; Select candle interval &gt;</option> 
                                 
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
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group controlId="feedSettings.rollingWindowSize">
                                <Form.Label>Rolling Window Size</Form.Label>
                                <Form.Control className="text-right" style={{maxWidth:100}} type="text" placeholder="" autoComplete="off" 
                                 value={this.state.rollingWindowSize} name="rollingWindowSize" onChange={this.handleRollingWindowSizeChange}/>
                            </Form.Group>
                        </Col>

                    </Row>

                    <Row>
                        <Col>
                            <Form.Group controlId="feedSettings.dateFrom">
                                <Form.Label>From</Form.Label><br/>
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
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group controlId="feedSettings.dateTo">
                                <Form.Label> To </Form.Label><br/>
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
                            </Form.Group>
                        </Col>
                    </Row>

                </Form>
                {this.state.error && <Alert variant="danger" >{this.state.error}</Alert>}
                
                </CardBody>
            </Card>
        );
   
    }

};

export default DataFeedSettings;