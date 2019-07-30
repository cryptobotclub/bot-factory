// 2h candles

// Go LONG if resistance breaks and there is no resitance in sight 
// Go SHORT if support breaks and there is no support in sight

// Exit LONG if close to resitance and trade is profitable
// Exit SHORT if close to support and trade is profitable

class Bot {

    constructor() {
        // this.datafeeds = [
        //     {  
        //         exchange: "BINANCE",
        //         symbol: "BTCUSDT",
        //         interval: "1d",
        //         rollingWindowSize: 52,
        //     }
        // ]
    }


    process(last, slice) {
        
        let candles0 = slice[0].candles;

        let buy, sell = false;
        var info = "";

        // check if have open position
        let haveOpenPosition = this.haveOpenPosition();

        if (!haveOpenPosition) {

            // create signal if support or resistance broke
            let signal = this.shouldOpenPosition(candles0);
            if (signal) {
                this.signal(signal)
            }

        }

       // check if should close position
        if (haveOpenPosition) {
            let position = this.openPosition();

            let signal = this.shouldClosePosition(candles0, position);
            if (signal) {
                this.signal(signal)
            }

        }

    }


    shouldClosePosition(candles, position) {

        if (candles.length < 3) {
            console.log("shouldClosePosition - ", candles.length);
            return;
        }

        let close0 = candles[candles.length - 1].close;
        let close1 = candles[candles.length - 2].close;
        let close2 = candles[candles.length - 3].close;

        //// determine support and resitance levels
        let segmentSize = 50;   
        let rangePct = 1.0;    // percentage distance from support/resistance level
        let recentCandles = candles.slice(0, candles.length-1); // all but the last element
        let levels = this.supportResistanceLevels(recentCandles, segmentSize, rangePct);


        let buy = false;
        let sell = false;
        let info = "";

        let takeProfit = position.pnlPerc > 2.0;
        let side = position.side;

        /// test if broken resistance
        if (side === "BUY" && close0 && close1 && close2) {
            let closeResistanceLvl = this.closeToResistance(levels, close0, 3.0);

            // close position if close to resistance
            sell = (closeResistanceLvl !== undefined && takeProfit); // have close resistance
            if (sell) {
                return({
                    signal: 'SELL',
                    info: "close to resistance "+closeResistanceLvl,
                })
            }
        }

        /// test if broken support
        if (side === "SELL" && close0 && close1 && close2) {
            let closeSupportLvl = this.closeToSupport(levels, close0, 3.0);

            // close position if close to support
            buy = (closeSupportLvl !== undefined && takeProfit);
            if (buy) {
                return({
                    signal: 'BUY',
                    info: "close to support "+closeSupportLvl,
                })
            }
        }

    }


    shouldOpenPosition(candles) {

        if (candles.length < 3) {
            console.log("shouldOpenPosition - ", candles.length);
            return;
        }

        let close0 = candles[candles.length - 1].close;
        let close1 = candles[candles.length - 2].close;
        let close2 = candles[candles.length - 3].close;

        //// determine support and resitance levels
        let segmentSize = 50;   
        let rangePct = 1.0;    // percentage distance from support/resistance level
        let recentCandles = candles.slice(0, candles.length-1); // all but the last element
        let levels = this.supportResistanceLevels(recentCandles, segmentSize, rangePct);


        let buy = false;
        let sell = false;
        let info = "";

        /// test if broken resistance
        if (close0 && close1 && close2) {
            let resistanceLvl = this.brokenResistance(levels, close2, close1, close0);
            let closeResistanceLvl = this.closeToResistance(levels, close0, 3.0);
            buy = resistanceLvl && closeResistanceLvl === undefined;
            info = (  buy ? "broken resistance: "+resistanceLvl.toFixed(2) : "" ) 
        }

        if (buy) {
            let signalInfo = {
                signal: 'BUY',
                info: info,
            }
            return signalInfo;
        }


        /// test if broken support
        if (close0 && close1 && close2) {
            let supportLvl = this.brokenSupport(levels, close2, close1, close0);
            let closeSupportLvl = this.closeToSupport(levels, close0, 3.0);
            sell = supportLvl && closeSupportLvl === undefined;
            info = ( sell ? "broken support "+supportLvl.toFixed(2) : "" ) 
        }

        if (sell) {
            let signalInfo = {
                signal: 'SELL',
                info: info,
            }
            return signalInfo;
        }
        
    }

//// SUPPORT RESISTANCE LEVELS    

    support(candles, segmentSize = 5, rangePct = 1.5) {
        let resp = this.supportResistanceLevels(candles, segmentSize, rangePct);
        return resp.supports;
    }

    resistance(candles, segmentSize = 5, rangePct = 1.5) {
        let resp = this.supportResistanceLevels(candles, segmentSize, rangePct);
        return resp.resistances;
    }

    supportResistanceLevels(candles, segmentSize = 5, rangePct = 1.5) {
        
        //params

        let closes = candles.map(p => p.close); // array of close prices

        let last = closes[closes.length-1];


        let closeSegment = closes.slice(closes.length - segmentSize, closes.length);
        let candlesSegment = candles.slice(candles.length - segmentSize, candles.length);

        // 1. calculate local mix/max
        
        // 1.1 1st and 2nd derivatives
        let dx1s = this.slope(closeSegment);
     
        let levels = this.levelsForSegment(candlesSegment, dx1s);

        // 2. aggreagte levels based on price range 'rangePct'

        let aggregated = this.aggregateLevels(levels, rangePct);
        return aggregated;
    }


    slope (values) {

        var derivative = []
        for (var i=0; i<values.length; i++) {
            
            if (i == 0) {
                derivative.push(NaN);
            } else {
                let f1 = values[i-1];
                let f0 = values[i];
                let diff = f0 - f1;
                derivative.push(diff);
            }
        }
        return derivative;
    }


    levelsForSegment(candles, derivative) {

        var levels = []

        for (var i=1; i<derivative.length; i++) {
            
            let d1 = derivative[i-1];
            let d0 = derivative[i];
            let min = d1 <= 0 && d0 >= 0;
            let max = d1 >= 0 && d0 <= 0;
            if (min || max) {
                let c1 = candles[i-1];
                let c0 = candles[i];

                let l1 = c1.close;
                let l0 = c0.close;

                let level =  min === true ? Math.min(c0.close, c1.close) :
                                max === true ? Math.max(c0.close, c1.close) : NaN;
                levels.push({
                    level: c1.close,
                    volume: c1.volume,
                })
            }
        }
        return levels;
    }



    aggregateLevels(levels, rangePerc) {

        var copy = levels.splice(0)

        var supportsResistances = [];

        while (copy.length > 0) {

            // 1. find level with max volume
            let maxLevel = {level:undefined, volume:0};
            copy.forEach( level => {
                maxLevel = level.volume > maxLevel.volume ? level : maxLevel
            })

            var withinRangeIdx = []; // indices of levels in range of maxLevel
        
            // aggreagate around maxLevel
            if (maxLevel.level) {

                copy.forEach( (level, idx) => {
                   
                    if ( ( level.level <= maxLevel.level * (1.0 + rangePerc / 100.0)) && 
                        ( level.level >= maxLevel.level * (1.0 - rangePerc / 100.0)) ) {
                       // level is in range of maxLevel
                       withinRangeIdx.push(idx)
                    }

                })


                let priceVols = 0;
                let totalVols = 0;
                withinRangeIdx.forEach(idx => {
                    let lvl = copy[idx]
                    priceVols += (lvl.level * lvl.volume);
                    totalVols += lvl.volume;
                })

                // support/resitance level with weighted price and total volume
                let avgPrice = priceVols / totalVols;
                let supportRes = { 
                    level: avgPrice,
                    volume : totalVols,
                    n: withinRangeIdx.length,
                }

                supportsResistances.push(supportRes)
                //remove aggregated levels  and cntinue  (withinRangeIdx from copu)
            
                var i = 0;
                withinRangeIdx.forEach(idx => {
                    copy.splice(idx - i++, 1)
                })
            }
        }

        return supportsResistances;
    }


    brokenSupport(levels, close2, close1, close0) {

        let response = undefined;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;
            let dropping = (close1 < close2) && (close0 < close1) && (close1 - close0) > (close2 - close1);
            if (close2 >= lvl && close1 < lvl && dropping) {
                response = lvl;
                break;
            }
        }
        return response
    }


    brokenResistance(levels, close2, close1, close0) {

        let response = undefined;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;
            if (close2 <= lvl && close1 > lvl && close0 > close1) {
                response = lvl;
                break;
            }
        }
        return response
    }


    closeToResistance(levels, close, range=5.0) {
        
        let response = undefined;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;

            let topRange =  close * (1.0 + range/100.0);
            let closeResistance = lvl > close && topRange > lvl;
            if (closeResistance) {
                response = lvl;
                break;
            }
        }
        return response
    }


    closeToSupport(levels, close, range=5.0) {
        
        let response = undefined;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;

            let bottomRange =  close * (1.0 - range/100.0);
            let closeSupport = lvl < close && bottomRange < lvl;
            if (closeSupport) {
                response = lvl;
                break;
            }
        }
        return response
    }

//// POSITION MANAGEMENT

openPosition() {
    let position = this.positions[this.positions.length-1];
    let positionOpen = position && position.status === 'OPEN';
    if (positionOpen) return position;

}


haveOpenPosition() {
    let position = this.positions[this.positions.length-1];
    let positionOpen = position && position.status === 'OPEN' ? true : false;
    return positionOpen;
}

openTradePnlPerc() {

    let pnlPerc = undefined;
    let position = this.positions[this.positions.length-1];
    
    if (position && position.status === 'OPEN') {
        pnlPerc = position.pnlPerc;
    }

    return pnlPerc;
}

profitTrade() {

   let position = this.positions[this.positions.length-1];
   
   if (position && position.status === 'OPEN') {
       
       console.log("last position is open. side: "+ position.side +", pnl: "+ position.pnl+", pnlPerc: "+ position.pnlPerc+", info: "+position.info);
       let entryPrice = position.entryPrice;
       let pnl = position.pnl;
       let pnlPerc = position.pnlPerc;
       let sell = position.side === 'BUY' && pnlPerc > 0.5;
       let buy = position.side === 'SELL' && pnlPerc > 0.5;
     
       if (sell) return -1;
       if (buy) return 1;
   }

   return 0;
}


   
}