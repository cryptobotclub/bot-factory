
import Api from './src/API/Api'
const fs = require('fs');

const FEED_URL = "https://api.cryptobot.club/api"
//const FEED_URL = "http://localhost:3000"



// state across bot invocations
var positionCount = 0;
var positions = [];
var charts = {}
var lastTick;
var botSettings = {}
var positionSettings = {};
var annotations = {};

// bot settings
var balance = 0;
var fees = 0;  // percentage fees for an exchange order.
var buySideOnly = false; // this flag constrols if trades are place on both buy and sell sides or buy side only.

function init(bot, position) {

    positionCount = 0
    positions = [];
    charts = {};
    lastTick = undefined;
    annotations = {};

    positionSettings = position;
  
    // bot settings
    balance = Number(bot.balanceAmount);
    fees = Number(bot.exchangeFeesAmount);
    buySideOnly = bot.tradeSideLongOnly;
}


function botAlert(info) {
    annotations[lastTick.closeDate.toISOString()] = {
        date:lastTick.closeDate,
        info:info,
    }
}


function signal(data) {
                
    let openPosition = lastOpenPosition();
    
    if (openPosition && openPosition.side !== data.signal) {
        closePosition(openPosition, data.info);
        return;
    }

    let lastPosition = positions[positions.length-1];
    if (lastPosition && lastPosition.stopped === true && lastPosition.lastUpdatedDate === lastTick.closeDate) {
        console.log("stopped position ", lastPosition, " won't process signal: ", data)
        return 
    }
    
    if (!openPosition) {

        let size = sizeForSignal(data, positionSettings, lastTick.close)
 
        // oveeride with strategy settings
        if (data.size) {
            size = data.size;
        
        } else if (data.risk) {
            let entryPrice = lastTick.close;
            let stopPrice = data.stop;
            size = Math.abs( Number( (data.risk / (entryPrice - stopPrice)).toFixed(4)) );
        }
    
        if (!size) {
            console.log("Error processing signal. Invalid size: ", size, "signal: ", data)
            return;
        }
        if (size == 0) {
            console.log("Zero position size. cannot open position")
            return;
        }

        // stop and exit prices
        let stopPrice = data.stop  ? data.stop : stopForSettings(data.signal, positionSettings, lastTick); 
        let exitPrice = data.exit ? data.exit : exitForSignal(data.signal, positionSettings, lastTick);  
       
        // Open new position
        let position = {
            transactionId: positionCount++,
            status: 'OPEN',
            side: data.signal,
            info: data.info,
            stopPrice: stopPrice,
            exitPrice: exitPrice,  
            size: size,
            openDate: lastTick.closeDate,
            entryPrice: lastTick.close,
            lastPrice: lastTick.close,
            lastUpdatedDate: lastTick.closeDate,
            pnl:0.0,   
            pnlPerc:0.0,
            stopped: false,                 
        }

        // trailing stop
        if (positionSettings.trailingStop) {
            let trailingStopGap = position.side === 'BUY' ? position.entryPrice - position.stopPrice :
                                position.side === 'SELL' ? position.stopPrice - position.entryPrice : undefined; 
            position.trailingStopGap = trailingStopGap;
        }

        if (buySideOnly === false || position.side === 'BUY') {
            // 
            let cost = position.size * position.entryPrice * (1 + fees / 100.0);
            if (balance > cost) {
            console.log(position.openDate.toISOString(), "OPENED ", position.side, " entryPrice: ", position.entryPrice, " lastPrice: ", position.lastPrice)
                positions.push(position);
            } else {
                console.log("not enough balance: ", balance, ", cost: ", cost);
            }
            
        }
    }

}


function sizeForSignal(data, settings, price) {


    let size = 0;

    // default to position managment settings
    switch(settings.strategyId) {
        case "FIXED": {
            size = Number(settings.value);
        }
        break;
       
        case "RISK":  {
            let entryPrice = price;
            let stopPrice = price * settings.stopLoss / 100.0;
            size = Math.abs( Number( (settings.value / (entryPrice - stopPrice)).toFixed(4)) );
        }
        break;

        case "BALANCE":  {
            size =  balance > 0 ? (settings.value - (2 * fees)) * balance / price / 100.0 : 0;
        }
        break;
    }

    return size;
}



async function exec(code, botSettings, datafeedSettings, positionSettings) {
  
    let symbol = datafeedSettings.symbol;
    let interval = datafeedSettings.interval;
    let dateFrom =  datafeedSettings.dateFrom;
    let dateTo = datafeedSettings.dateTo;

    init(botSettings, positionSettings);

    let runnerCode = `
       
        const ADL = require('technicalindicators').ADL;
        const ADX = require('technicalindicators').ADX;        
        const ATR = require('technicalindicators').ATR;       
        const AwesomeOscillator = require('technicalindicators').AwesomeOscillator;
        const BollingerBands = require('technicalindicators').BollingerBands;
        const ForceIndex = require('technicalindicators').ForceIndex;
        const KST = require('technicalindicators').KST;
        const MFI = require('technicalindicators').MFI;
        const MACD = require('technicalindicators').MACD;
        const OBV = require('technicalindicators').OBV;
        const PSAR = require('technicalindicators').PSAR;      
        const ROC = require('technicalindicators').ROC;
        const RSI = require('technicalindicators').RSI;       
        const SMA = require('technicalindicators').SMA;   
        const Stochastic = require('technicalindicators').Stochastic;       
        const StochasticRSI = require('technicalindicators').StochasticRSI;
        const TRIX = require('technicalindicators').TRIX; 
        const EMA = require('technicalindicators').EMA;
        const WMA = require('technicalindicators').WMA;
        const WEMA = require('technicalindicators').WEMA;
        const WilliamsR = require('technicalindicators').WilliamsR;
        const IchimokuCloud = require('technicalindicators').IchimokuCloud;

        ${code}
        let bot = new Bot();        
        bot;
    `


        // create bot
        let bot = eval(runnerCode);
        if (!bot) throw Error("no bot instance");
        console.log("bot: ", bot);

        // inject helper functions into bot instance
        bot.plot = plot;
        bot.signal = signal;
        bot.alert = botAlert;

        bot.setState = (state) => {
            Object.keys(state).forEach( key => {
                bot.state[key] = state[key];
            }); 
        };

        // initialize bot state 
        bot.state =  bot.init ?  bot.init() : {}
        bot.state['candles'] = [];        
        console.log("exec() state inited! ",  bot.state);
        let other = bot.datafeeds ? bot.datafeeds : [];
        var datafeeds = [{
            exchange: "BINANCE",
            symbol: symbol,
            interval: interval,
            rollingWindowSize: 100,  // primary feed rolling window 
        }, ...other];

        // if (bot.state.datafeeds) {
        //     datafeeds.concat(bot.state.datafeeds);
        // }
        console.log("datafeeds: ", datafeeds);
        let feedsData = await fetchAllFeeds(datafeeds, dateFrom, dateTo);
    
    
        return new Promise( (resolve, reject) => {

        // primary feed
        let primaryFeed = feedsData[0];
        let candles = primaryFeed.candles;
        
        
        candles.forEach( candle => {
            
            lastTick = candle;
            let slice = getSlice(feedsData, candle.closeDate);
      
            // update bot open position
            bot.positions = positions.slice(0); // clone
            updatePositions(candle);
            
            // update bot state with last candle  limiting the # of candles to 100
            let botCandles = bot.state.candles;    
            botCandles.push(candle)       
            let tail = botCandles.slice(Math.max(botCandles.length - primaryFeed.rollingWindowSize, 0));
            bot.state.candles = tail; 
        
            // process last candle
            bot.process(candle, slice);  //TODO pass config      
                    
        });

        // close last position
        let lastPosition = positions[positions.length-1];
        if (lastPosition && lastPosition.status == 'OPEN') {
            closePosition(lastPosition);
        }
        
        let closedPoistions = positions.filter( p => p.status === 'CLOSED');
        let stats = makeStats(closedPoistions, candles);
        
        resolve({
            candles: candles,
            charts : charts,
            positions: closedPoistions,
            stats: stats,
            annotations: annotations,
            interval: interval,
            symbol: symbol,
        });


    });

}

// for each feed in the 'feedsData' array, returns an array of deed data
// including the latest 'rollingWindowSize' candes up to the date 'endDate'
function getSlice(feedsData, endDate) {

    var response = [];
    feedsData.forEach( (feed, idx) => {
        let rollingWindowSize = feed.rollingWindowSize;
        var candles = [];
        feed.candles.forEach(c => {
            if (c.closeDate <= endDate) {
                candles.push(c);
            }
        });

        let tail = candles.slice(Math.max(candles.length - rollingWindowSize, 0));
        response.push({ 
            exchange: feed.exchange,
            symbol: feed.symbol,
            interval: feed.interval,
            candles: tail
        });
    })

    return response;
}
      

function parseCandles (data) {
        
    var candles = data.map(p => {
       
        let openDate = parseDate(p.openDate);            
        let closeDate = roundDate(parseDate(p.closeDate));
     
        let open = parseFloat(p.open);
        let high = parseFloat(p.high);
        let low = parseFloat(p.low);
        let close = parseFloat(p.close);
        let volume = parseFloat(p.volume);

        return {
            //date:date,
            openDate:openDate,
            closeDate:closeDate,
            open:open,
            high:high,
            low:low,
            close:close,
            volume:volume,
        }
    });
    return candles;

}

function parseDate(dateString) {
    //let ts = Date.parse(dateString.replace(/-/g, "/"));  // "yyyy-MM-dd'T'HH:mm:ssZ
    let date = dateString ? new Date(Date.parse(dateString)) : undefined;
    // zero ms to allow chart annotiations to map to chart candle dates. 
    //TODO fix the annotation mappin in the chart component
    if (date) {
        date.setMilliseconds(0);
    }
    return date;
}

function roundDate(date) {
    // add 1 second to round up candle close date
    let roundedDate = new Date(date.getTime());
    roundedDate.setSeconds(roundedDate.getSeconds() + 1);
    return roundedDate;
}

function makeStats (positions, candles) {

    if (!positions || positions.length == 0) return {trades:0}

    var totalWins = 0;
    var totalLosts = 0;
    var totalPnl = 0.0;
    var pnlPercTotal = 0.0;
   
    var first = candles[0].openDate;
    var last = candles[candles.length-1].closeDate;

    let firstCandlePrice = candles[0].close;
    let lastCandlePrice = candles[candles.length-1].close;

    var firstPositionPrice = positions[0].entryPrice;
    var firstPositionSize = positions[0].size;

    positions.forEach(p => {
        
        if (p.pnl >= 0 ) totalWins += 1;
        else totalLosts += 1;

        totalPnl +=  p.pnl
        pnlPercTotal += p.pnlPerc;   
    })

 
    var trades = positions.length;
    var days;
    if (first && last) {
        let diff = last.getTime() - first.getTime();
        days = Math.ceil(diff / 24 / 60 / 60 / 1000);
    }

    totalPnl     =  Number(totalPnl.toFixed(2));
    pnlPercTotal =  Number(pnlPercTotal.toFixed(2));

    let dailyPnL = days && days > 0 ? Number( (totalPnl / days).toFixed(2) ) : undefined;
    let monthlyPnL      = Number((dailyPnL * 30).toFixed(2) );
    let winPerc         = Number((totalWins /  trades * 100.0).toFixed(2) );
    let pnlPercPerTrade = Number((pnlPercTotal / trades).toFixed(2) );

    let buyAndHold      = Number( ((lastCandlePrice - firstCandlePrice) * firstPositionSize).toFixed(2) );
    let vsBuyHold       = Number( (totalPnl - buyAndHold).toFixed(2) ); 

   
    return {
        trades: trades,
        wins: totalWins,
        losts: totalLosts,
       
        pnl: totalPnl,
        pnlPerc: pnlPercTotal,
        pnlPercPerTrade: pnlPercPerTrade, 
        days: days && Number(days.toFixed()),
        dailyPnL: dailyPnL,
        monthlyPnL : monthlyPnL,
        winPerc: winPerc,
        
        vsBuyHold: Number(vsBuyHold.toFixed(2)),
    }
}



function closePosition(position, info) {

    // check necessary because of stop/take profit     
    position.status = 'CLOSED';
    position.lastPrice = lastTick.close;
    position.closedDate = lastTick.closeDate;
    position.infoClose = info;
    updatePnL(position);
    updateBalance(position);

    console.log(position.closedDate, "CLOSED "+position.side, "entryPrice: ", position.entryPrice, "lastPrice: ", position.lastPrice, "pnl: ", position.pnl.toFixed(2), "fees: ", position.fees);
}


function updateBalance(position) {

    // subtract fees for the txs to open and close the position 
    let txfees = (fees * position.size * position.entryPrice / 100.0 ) + (fees * position.size * position.lastPrice / 100.0);
    position.fees =  Number( txfees.toFixed(2) );
    balance += ( position.pnl - txfees)
}

function handleTrailingStop(position) {

    let prevStop = position.stopPrice;
    if (position.side === 'BUY') {
        if ( (position.lastPrice - position.stopPrice) > position.trailingStopGap) {
            position.stopPrice = position.lastPrice - position.trailingStopGap;
            console.log("BUY position moving stop: ", prevStop, "-> ", position.stopPrice)
        }
    }

    if (position.side === 'SELL') {
        if ( (position.stopPrice - position.lastPrice) > position.trailingStopGap) {
            position.stopPrice = position.lastPrice + position.trailingStopGap;
            console.log("SELL position moving stop: ", prevStop, "-> ", position.stopPrice)
        }
    }

}


function lastOpenPosition() {

    let lastPosition = positions[positions.length-1];
    let lastOpenPosition = lastPosition && lastPosition.status === 'OPEN' ? lastPosition : undefined;
    return lastOpenPosition;
}


function updatePnL(position) {

    if (position.side === 'BUY') {
        position.pnl = Number(((position.lastPrice - position.entryPrice ) * position.size).toFixed(2));
        position.pnlPerc = Number(((position.lastPrice - position.entryPrice) / position.entryPrice * 100.0).toFixed(2));
    }

    if (position.side === 'SELL') {
        position.pnl = Number(((position.entryPrice - position.lastPrice) * position.size).toFixed(2));
        position.pnlPerc =  Number(((position.entryPrice - position.lastPrice) / position.entryPrice * 100.0).toFixed(2));
    }
}


function stopShouldTrigger(position, candle) {

    if (!position.stopPrice) return false;

    if (position.side === 'BUY' && position.stopPrice >= candle.low) {
        console.log("stopped",  position.stopPrice, " >= ", candle.low);
        return true;
    }

    if (position.side === 'SELL' && position.stopPrice <= candle.high) {
        console.log("stopped",  position.stopPrice, " <= ", candle.high);
        return true;
    }

    return false;
}


function takeProfitShouldTrigger(position, candle) {

    if (!position.exitPrice) return false;

    if (position.side === 'BUY' && position.exitPrice >= candle.high) {
        console.log("take profit",  position.exitPrice, " >= ", candle.high);
        return true;
    }

    if (position.side === 'SELL' && position.exitPrice <= candle.low) {
        console.log("take profit",  position.exitPrice, " <= ", candle.low);
        return true;
    }
    return false;
}


function stopForSettings(side, positionSettings, lastTick) {
    var stop = undefined;

    if (side === 'BUY') {
        stop = positionSettings.stopLoss ? lastTick.close * positionSettings.stopLoss / 100.0 : undefined;
    }
    if (side === 'SELL') {
        stop = positionSettings.stopLoss ? lastTick.close *  (2 - positionSettings.stopLoss / 100.0) : undefined;
    }
    return stop;
}


function exitForSignal(side, positionSettings, lastTick) {

    var exit = undefined;
    if (side === 'BUY') {
        exit = positionSettings.takeProfit ? lastTick.close * positionSettings.takeProfit / 100.0 : undefined;
    }
    if (side === 'SELL') {
        exit = positionSettings.takeProfit ? lastTick.close * (2 - positionSettings.takeProfit / 100.0 ) : undefined;
    }
    return exit;
}


function updatePositions(tick) {

    let position = lastOpenPosition();

    if (position) {

        // for all opoen positions update position lastPtice and P&L
        position.lastPrice = tick.close;
        position.lastUpdatedDate = tick.closeDate;
        updatePnL(position);

        // execute Stop Loss
        let stopped = stopShouldTrigger(position, tick);
        if (stopped)  {
            position.status = 'CLOSED';
            position.lastPrice = position.stopPrice;
            updatePnL(position);
            updateBalance(position);
            position.closedDate = tick.closeDate;
            position.stopped = true;
            console.log(position.closedDate, "STOPPED", position.lastPrice, "entry: ", position.entryPrice, "stop: ", position.stopPrice, "pnl: ", position.pnl.toFixed(2), "pnl %", position.pnlPerc.toFixed(2));
        }

        // execute Take Profit
        let takeProfit = takeProfitShouldTrigger(position, tick);
        if (takeProfit)  {
            position.status = 'CLOSED';
            position.lastPrice = position.exitPrice;
            updatePnL(position);
            updateBalance(position);
            position.closedDate = tick.closeDate;
            position.exited = true;
            console.log(position.closedDate, "TAKE PROFIT", position.lastPrice, "entry: ", position.entryPrice, "exit: ", position.exitPrice, "pnl: ", position.pnl.toFixed(2), "pnl %", position.pnlPerc.toFixed(2));
            
        }

        // handle trailing stop
        if (position.status === 'OPEN' && positionSettings.trailingStop === true) {
            handleTrailingStop(position);
        }
    }
}


function plot() {

   let chartName = arguments[0];
   let chart = charts[chartName];
   if (!chart) {
      chart = []
   }

   var values = [];
   for (var i = 1; i < arguments.length; i++) {
        values.push(arguments[i])
   } 

   chart.push({
       date: lastTick.closeDate, 
       values: values, 
   });

   charts[chartName] = chart;
  
}


// returns the array of the input 'feeds' with the candles property
function fetchAllFeeds (feeds, dateFrom, dateTo) {

    let promises = []

    feeds.forEach(feed => {

        let symbol = feed.symbol;
        let interval = feed.interval;

        let promise = new Promise((resolve, reject) =>{
            new Api(FEED_URL).fetchCandles(symbol, dateFrom, dateTo, interval).then (response => {  
                var candles = parseCandles(response);
                resolve(candles);
            }).catch(error => {
                reject(error);
            });
        })

        promises.push(promise);
    })

    return new Promise((resolve, reject) => {
        Promise.all(promises).then(candles => {
            var respnse = [];
            feeds.forEach( (feed, idx) => {
                feed.candles = candles[idx];
                respnse.push(feed)
            })
            resolve(respnse);
        });
    });

}
     
// the 'exchange 'parameter is not used as binance is the only exchange currenty integrated.
function fetchCandles(exchange, ticker, dateFrom, dateTo, interval) {

    return new Promise((resolve, reject) =>{

        // let isoDateTo = dateTo.toISOString();
        // let isoDateFrom = dateFrom.toISOString();

        new Api(FEED_URL).fetchCandles(ticker, dateFrom, dateTo, interval).then (response => {  
            var candles = parseCandles(response);
            resolve(candles);
        }).catch(error => {
            reject(error);
        });
    })

}


// this was used to provide price data from local files. 
// it came back handy when I was coding on a plane with no connectivity :)

function fetchCandlesFromFile(candlefile) {
    
    return new Promise((resolve, reject) =>{
        var contents = fs.readFileSync(candlefile, 'utf8');
        var json = JSON.parse(contents);
        var candles = makeCandles(json);
        console.log("fetchCandles: ", candlefile, "candles: ", candles.length);
        resolve(candles);
    })
}




export default exec;
