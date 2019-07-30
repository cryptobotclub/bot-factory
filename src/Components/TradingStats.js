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
        let fees = newProps.fees ? parseFloat(newProps.fees) : 0;
        let stats = this.makeStats(newProps.positions, newProps.candles, fees);
        this.setState({
            currency: currency,
            counterCurrency: counterCurrency,            
            stats: stats,
        })
    }


    makeStats = (positions, candles, fees) => {

     
        if (!candles || candles.length == 0) {
            console.log("makeStats() No candles: " + candles);
            return;
        }

        let wins = 0;
        let losts = 0;

        // total pnl
        let pnl = 0.0;
        let pnlPerc = 0.0;

        // avg wins
        let winsPnl = 0.0;
        let winsPnlPerc = 0.0;
       
        // avg losts
        let lostsPnl = 0.0;
        let lostsPnlPerc = 0.0;

  
        // drawdown
        let peekPnl = 0;
        let cyclePnl = 0;
        let throughPnl = 0;
        let drawdown = 0;

        let peekPnlPerc = 0;
        let cyclePnlPerc = 0;
        let throughPnlPerc = 0;
        let drawdownPerc = 0;

        let first = candles[0].openDate;
        let last = candles[candles.length-1].closeDate;
    
        let firstCandlePrice = candles[0].close;
        let lastCandlePrice = candles[candles.length-1].close;
    
        let firstPositionPrice = positions && positions.length > 0 && positions[0].entryPrice;
        let firstPositionSize = positions && positions.length > 0 ? positions[0].size : 1.0;
        
        positions.forEach(p => {

            let txfees = (fees / 100.0 * p.size * p.entryPrice ) + (fees / 100.0 * p.size * p.lastPrice );
            let tradefees =  Number( txfees.toFixed(2) );
            let netTradePnl = p.pnl - tradefees;
            let netTradePnlPerc = p.pnlPerc - 2*fees;
            
            // total pnl and total pnlPerc
            pnl += netTradePnl;
            pnlPerc += netTradePnlPerc;   

            // drawdown calculation
            if (pnl >= peekPnl) {
                peekPnl = pnl;
                throughPnl = 0;
                cyclePnl = 0;
            } else {
                cyclePnl += netTradePnl;
                throughPnl = Math.min(throughPnl, cyclePnl);
                drawdown = Math.min(drawdown, throughPnl);
            }

            if (pnlPerc >= peekPnlPerc) {
                peekPnlPerc = pnlPerc;
                throughPnlPerc = 0;
                cyclePnlPerc = 0;
            } else {
                cyclePnlPerc += netTradePnlPerc;
                throughPnlPerc = Math.min(throughPnlPerc, cyclePnlPerc);
                drawdownPerc = Math.min(drawdownPerc, throughPnlPerc);
            }

      
            // Total Win and Loss calculation
            if (p.pnl >= 0) {
                wins++;
                winsPnl += netTradePnl; 
                winsPnlPerc += netTradePnlPerc;  
            } else { 
                losts++;
                lostsPnl += netTradePnl; 
                lostsPnlPerc += netTradePnlPerc;  
            }

        })
    
     
        var trades = positions.length;
        var days;
        if (first && last) {
            let diff = last.getTime() - first.getTime();
            days = Number(  Math.ceil(diff / 24 / 60 / 60 / 1000).toFixed() );
        }
    
        let winPerc = Number((wins / trades * 100.0).toFixed(2) );

        // total pnl stats
        pnl = Number(pnl.toFixed(2));
        pnlPerc = Number(pnlPerc.toFixed(2));
        let pnlTrade = Number((pnl / trades).toFixed(2) );
        let pnlTradePerc = Number((pnlPerc / trades).toFixed(2) );
    
        let profitFactor = Number( Math.abs((winsPnl / lostsPnl).toFixed(2)) );
    
 
        // avg pnl stats
        let avgWins = Number( (winsPnl / wins).toFixed(2) );
        let avgLosts = Number(( lostsPnl / losts).toFixed(2) );
        let avgWinsPerc = Number( (winsPnlPerc / wins).toFixed(2) );
        let avgLostsPerc = Number( (lostsPnlPerc / losts).toFixed(2) );

        // expectancy and expectation
        let expectancy =  Number( (pnl / trades).toFixed(2) );
        let expectation = Number( (expectancy / Math.abs(avgLosts) ).toFixed(2) );


        let dailyPnL = days && days > 0 ? Number( (pnl / days).toFixed(2) ) : 0;
        let dailyPnLPerc = Number( (pnlPerc / days).toFixed(2) );

        let monthlyPnL = Number( (dailyPnL * 30).toFixed(2) );
        let monthlyPnLPerc = Number( (dailyPnLPerc * 30).toFixed(2) );

        let buyAndHold      = Number( ((lastCandlePrice - firstCandlePrice) * firstPositionSize).toFixed(2) );
        let buyAndHoldPerc  = Number( ((lastCandlePrice - firstCandlePrice) / firstCandlePrice * 100.00).toFixed(2) );
        
        drawdown =  Number( drawdown.toFixed(2) );
        drawdownPerc =  Number( drawdownPerc.toFixed(2) );

        return {

            trades: trades,
            wins: wins,
            losts: losts,
            days: days,
            winPerc: winPerc,
           
            profitFactor: profitFactor,

            expectancy: expectancy,
            expectation: expectation,
            drawdown: drawdown,
            drawdownPerc: drawdownPerc,

            pnl: pnl,
            pnlPerc: pnlPerc,
            winsPnl: winsPnl,
            winsPnlPerc: winsPnlPerc,
            lostsPnl: lostsPnl,
            lostsPnlPerc: lostsPnlPerc,

            avgWins: avgWins,
            avgWinsPerc: avgWinsPerc,
            avgLosts: avgLosts,
            avgLostsPerc: avgLostsPerc,
            
            pnlTrade: pnlTrade, 
            pnlTradePerc: pnlTradePerc, 
    
            dailyPnL: dailyPnL,
            dailyPnLPerc: dailyPnLPerc,

            monthlyPnL : monthlyPnL,
            monthlyPnLPerc: monthlyPnLPerc,

            buyAndHold: buyAndHold,
            buyAndHoldPerc: buyAndHoldPerc,
        }
    }
    
 
    

    render() {
        
        if (!this.state.stats) {
            return (<div className="bot-performance-wrapper"> No stats!</div>)
        }

        let wins = this.state.stats.wins;
        let winPerc = this.state.stats.winPerc ? this.state.stats.winPerc + " %": '';

        let pnl = this.state.stats.pnl + " " +this.state.counterCurrency;
        let pnlPerc = this.state.stats.pnlPerc ? this.state.stats.pnlPerc.toFixed(2) + ' %' : 'n/a';

        let pnlTrade = isNaN(this.state.stats.pnlTrade) ? 'n/a' : this.state.stats.pnlTrade + " " +this.state.counterCurrency;
        let pnlTradePerc = this.state.stats.pnlTradePerc ? this.state.stats.pnlTradePerc.toFixed(2) + ' %' : 'n/a';
       
        let dailyPnL = this.state.stats.dailyPnL + " " +this.state.counterCurrency;
        let dailyPnLPerc = this.state.stats.dailyPnLPerc ? this.state.stats.dailyPnLPerc.toFixed(2) + ' %' : 'n/a';

        let monthlyPnL = this.state.stats.monthlyPnL + " " +this.state.counterCurrency;
        let monthlyPnLPerc = this.state.stats.monthlyPnLPerc ? this.state.stats.monthlyPnLPerc.toFixed(2) + ' %' : 'n/a';

        let tradesDaysValue = this.state.stats.trades + " / " + this.state.stats.days;
        
        let buyAndHold = this.state.stats.buyAndHold + " " + this.state.counterCurrency
        let buyAndHoldPerc = this.state.stats.buyAndHoldPerc ? this.state.stats.buyAndHoldPerc + ' %' : 'n/a';

        let avgWins = this.state.stats.avgWins + " " +this.state.counterCurrency;
        let avgWinsPerc = this.state.stats.avgWinsPerc ? this.state.stats.avgWinsPerc + ' %' : 'n/a';

        let avgLosts = this.state.stats.avgLosts + " " +this.state.counterCurrency;
        let avgLostsPerc = this.state.stats.avgLostsPerc ? this.state.stats.avgLostsPerc + ' %' : 'n/a';

        let profitFactor = this.state.stats.profitFactor;
        
        let drawdown = this.state.stats.drawdown + " " +this.state.counterCurrency;
        let drawdownPerc = this.state.stats.drawdownPerc ? this.state.stats.drawdownPerc + ' %' : 'n/a';

        let expectancy = this.state.stats.expectancy;
        let expectation = this.state.stats.expectation;

        return (

     <Container fluid className="main-content-container px-4">
         <Row>


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


{/* new stats */}
<Col className="col-lg mb-4" key="5" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Avg Win"
                    value={avgWins}
                    percentage={avgWinsPerc}
                    increase={this.state.stats.avgWinsPerc>= 0}
                />
</Col>

<Col className="col-lg mb-4" key="6" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Avg Loss"
                    value={avgLosts}
                    percentage={avgLostsPerc}
                    increase={this.state.stats.avgLostsPerc >= 0}
                />
</Col>



<Col className="col-lg mb-4" key="7" >
                <StatsBox1
                    id={`small-stats-1`}
                    variation="1"
                    label="Profit Factor"
                    value={profitFactor}        
                />
</Col>

<Col className="col-lg mb-4" key="8" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Drawdown"
                    value={drawdown}
                    percentage={drawdownPerc}
                    increase={this.state.stats.drawdownPerc >= 0}
                />
</Col>

<Col className="col-lg mb-4" key="9" >
                <StatsBox1
                    id={`small-stats-1`}
                    variation="1"
                    label="Expectancy"
                    value={expectancy}        
                />
</Col>

<Col className="col-lg mb-4" key="10" >
                <StatsBox1
                    id={`small-stats-1`}
                    variation="1"
                    label="Expectation"
                    value={expectation}        
                />
</Col>





<Col className="col-lg mb-4" key="11" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Avg Daily P&L"
                    value={dailyPnL}
                    percentage={dailyPnLPerc}
                    increase={this.state.stats.dailyPnLPerc >= 0}
                />
</Col>
<Col className="col-lg mb-4" key="12" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Avg Monthly P&L"
                    value={monthlyPnL}
                    percentage={monthlyPnLPerc}
                    increase={this.state.stats.monthlyPnLPerc >= 0}
                />
</Col>



<Col className="col-lg mb-4" key="13" >
                <StatsBox2
                    id={`small-stats-1`}
                    variation="1"
                    label="Buy & Hold"
                    value={buyAndHold}
                    percentage={buyAndHoldPerc}
                    increase={this.state.stats.buyAndHoldPerc >= 0}
                />
</Col>


            </Row>
            </Container> 
        );
    }


};

export default TradingStats;
