import React from 'react'
import { Container, Row, Col } from "shards-react";

import StatsBox1 from './StatsBox1'
import StatsBox2 from './StatsBox2'

import './TradingStats.css'



class TradingStats extends React.Component {

    constructor(props) {
        super(props);
    }

    componentWillMount() {
        
        let positions = this.props.positions;
        let candles = this.props.candles;
        
        console.log("componentWillMount fees: ", fees, ", positions: ", positions);
        let fees = this.props.fees ? parseFloat(this.props.fees) : 0;

        let props = this.props;
        let stats = this.makeStats(positions, candles, fees);

        this.setState({
            ...props,
            stats:stats,
        })
    }


    componentWillReceiveProps(newProps) { 
 
        let currency = newProps.currency;
        let counterCurrency = newProps.counterCurrency;   
        let positions = newProps.positions;
        let candles = newProps.candles;

        console.log("componentWillReceiveProps fees: ", fees, ", positions: ", positions);
        let fees = newProps.fees ? parseFloat(newProps.fees) : 0;

        let stats = this.makeStats(newProps.positions, newProps.candles, fees);
        this.setState({
            currency: currency,
            counterCurrency: counterCurrency,            
            stats:stats,
        })
    }


    makeStats = (positions, candles, fees) => {

       // if (!positions || positions.length == 0) return {trades:0}
    
        var wins = 0;
        var losts = 0;
        var pnl = 0.0;
        var pnlPerc = 0.0;
       
        if (!candles || candles.length == 0) {
            console.log("makeStats() No candles: " + candles);
            return;
        }

        var first = candles[0].openDate;
        var last = candles[candles.length-1].closeDate;
    
        let firstCandlePrice = candles[0].close;
        let lastCandlePrice = candles[candles.length-1].close;
    
        var firstPositionPrice = positions && positions.length > 0 && positions[0].entryPrice;
        var firstPositionSize = positions && positions.length > 0 ? positions[0].size : 1.0;
        
        positions.forEach(p => {

            if (p.pnl >= 0 ) wins++;
            else losts++;
    
            let txfees = (fees / 100.0 * p.size * p.entryPrice ) + (fees / 100.0 * p.size * p.lastPrice );
            let tradefees =  Number( txfees.toFixed(2) );
            pnl += (p.pnl - tradefees) ; //( p.pnl - p.fees )
            pnlPerc += ( p.pnlPerc - 2*fees );   
        })
    
     
        var trades = positions.length;
        var days;
        if (first && last) {
            let diff = last.getTime() - first.getTime();
            days = Math.ceil(diff / 24 / 60 / 60 / 1000);
        }
    
        let winPerc = Number((wins / trades * 100.0).toFixed(2) );

        pnl = Number(pnl.toFixed(2));
        pnlPerc = Number(pnlPerc.toFixed(2));
  
        let pnlTrade = Number((pnl / trades).toFixed(2) );
        let pnlTradePerc = Number((pnlPerc / trades).toFixed(2) );
    
        let dailyPnL = days && days > 0 ? Number( (pnl / days).toFixed(2) ) : 0;
        let dailyPnLPerc = Number((pnlPerc / days).toFixed(2) );

        let monthlyPnL = Number((dailyPnL * 30).toFixed(2) );
        let monthlyPnLPerc = Number((dailyPnLPerc * 30).toFixed(2) );

        let buyAndHold = Number( ((lastCandlePrice - firstCandlePrice) * firstPositionSize).toFixed(2) );
        let vsBuyHold = Number( (pnl - buyAndHold).toFixed(2) );
    

        return {
            trades: trades,
            wins: wins,
            losts: losts,
            days: Number(days.toFixed()),
            winPerc: winPerc,
           
            pnl: pnl,
            pnlPerc: pnlPerc,

            pnlTrade: pnlTrade, 
            pnlTradePerc: pnlTradePerc, 
    
            dailyPnL: dailyPnL,
            dailyPnLPerc: dailyPnLPerc,

            monthlyPnL : monthlyPnL,
            monthlyPnLPerc: monthlyPnLPerc,

            vsBuyHold: Number(vsBuyHold.toFixed(2)),
        }
    }
    
 
    

    render() {
        
        if (!this.state.stats) {
            return (<div className="bot-performance-wrapper"> No stats!</div>)
        }

        let wins = this.state.stats.wins;
        let winPerc = this.state.stats.winPerc ? this.state.stats.winPerc + " %": '';
        console.log("wins: ", this.state.stats.wins )
        
        console.log("winPerc: ", this.state.stats.winPerc )

        let pnl = this.state.stats.pnl + " " +this.state.counterCurrency;
        let pnlPerc = this.state.stats.pnlPerc ? this.state.stats.pnlPerc.toFixed(2) + ' %' : 'n/a';

        let pnlTrade = isNaN(this.state.stats.pnlTrade) ? 'n/a' : this.state.stats.pnlTrade + " " +this.state.counterCurrency;
        let pnlTradePerc = this.state.stats.pnlTradePerc ? this.state.stats.pnlTradePerc.toFixed(2) + ' %' : 'n/a';
       
        let dailyPnL = this.state.stats.dailyPnL + " " +this.state.counterCurrency;
        let dailyPnLPerc = this.state.stats.dailyPnLPerc ? this.state.stats.dailyPnLPerc.toFixed(2) + ' %' : 'n/a';

        let monthlyPnL = this.state.stats.monthlyPnL + " " +this.state.counterCurrency;
        let monthlyPnLPerc = this.state.stats.monthlyPnLPerc ? this.state.stats.monthlyPnLPerc.toFixed(2) + ' %' : 'n/a';

        let tradesDaysValue = this.state.stats.trades + " / " + this.state.stats.days;
        let vsBuyHold = this.state.stats.vsBuyHold + " " + this.state.counterCurrency

        return (

     <Container fluid className="main-content-container px-4">
         <Row>
                        
                {this.state.accountBalance &&
                 <Col className="col-lg mb-4" key="0" >
                    <div className="bot-performance-element">
                        <div className="bot-performance-title">Total Asset Value </div>
                        <div className="bot-performance-value">{this.state.accountBalance.toFixed(2)} {this.state.accountCurrency}</div>
                    </div>
                 </Col>
                }

<Col className="col-lg mb-4" key="1" >
                <StatsBox1
                    id={`small-stats-1`}
                    variation="1"
                    label="Trades / Days"
                    value={tradesDaysValue}
                 
                />
</Col>

<Col className="col-lg mb-4" key="2" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Wins"
                    value={wins}
                    percentage={winPerc}
                    increase={this.state.stats.winPerc>= 0}
                />
</Col>

<Col className="col-lg mb-4" key="3" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="P&L"
                    value={pnl}
                    percentage={pnlPerc}
                    increase={this.state.stats.pnlPerc >= 0}
                />
</Col>

<Col className="col-lg mb-4" key="4" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="P&L / Trade"
                    value={pnlTrade}
                    percentage={pnlTradePerc}
                    increase={this.state.stats.pnlTradePerc >= 0}
                />
</Col>


<Col className="col-lg mb-4" key="5" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Avg Daily P&L"
                    value={dailyPnL}
                    percentage={dailyPnLPerc}
                    increase={this.state.stats.dailyPnLPerc >= 0}
                />
</Col>
<Col className="col-lg mb-4" key="6" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Avg Monthly P&L"
                    value={monthlyPnL}
                    percentage={monthlyPnLPerc}
                    increase={this.state.stats.monthlyPnLPerc >= 0}
                />
</Col>



<Col className="col-lg mb-4" key="7" >
                <StatsBox1
                    id={`small-stats-1`}
                    variation="1"
                    label="vs Buy & Hold"
                    value={vsBuyHold}
                    increase={this.state.stats.vsBuyHold >= 0}
                />
</Col>


            </Row>
            </Container> 
        );
    }


};

export default TradingStats;
