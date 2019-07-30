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
        let close0 = candles0[candles0.length - 1].close;
        let close1 = candles0[candles0.length - 2].close;
    

    
        //// determine support and resitance levels
        let segmentSize = 50;   
        let rangePct = 1.0;    // percentage distance from support/resistance level
        let candles = candles0.slice(0, candles0.length); // all but the last element
        let levels = this.supportResistanceLevels(candles, segmentSize, rangePct);

        let buy, sell = false;
        var info = "";

        /// test if broken resistance
        if (close1 && close0) {
            let brokenRes = this.brokenResistance(levels, close1, close0);
            let closeToResistance = this.closeToResistance(levels, close0, 3.0);
            buy = brokenRes === true && closeToResistance === false;
            info = (  brokenRes ? "broken resistance" : "" ) 
        }
    
        // check if should take profits
        let haveOpenPosition = this.haveOpenPosition();

        if (haveOpenPosition) {
            let position = this.openPosition();
            let takeProfit = position.pnlPerc > 2.0;

            let brokenSup = this.brokenSupport(levels, close1, close0);
            //sell = takeProfit === true && brokenSup === true;
            sell =  brokenSup === true && (position.pnlPerc > 4.0 || position.pnlPerc < -2.0);
            info = (  brokenSup ? "broken support" : "" + " pnlPerc: "+position.pnlPerc ) 
        }

       
        // place trades
        if (buy) {
            this.signal({
                signal: 'BUY',
                info: info,
            })
        }
 
        if (sell) {       
            this.signal({
                signal: 'SELL',
                info: info,
            })
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


    separateSupportResistances(levels, last) {

        var supports = [];
        var resistances = [];

        levels.forEach(level => {
            if (level.level >= last) {
                resistances.push(level)
            }

            if (level.level <= last) {
                supports.push(level)
            }
        })

        return ({
            supports: supports,
            resistances: resistances,
        })
    }


    brokenSupport(levels, previous, last) {

        let response = false;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;
            if (previous >= lvl && last < lvl) {
                response = true;
                break;
            }
        }
        return response
    }


    brokenResistance(levels, previous, last) {

        let response = false;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;
            if (previous <= lvl && last > lvl) {
                response = true;
                break;
            }
        }
        return response
    }


    closeToResistance(levels, close, range=5.0) {
        
        if (close === 4025.91) {
            console.log("closeToResistance: ", close)
        }

        let response = false;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;

            let topRange =  close * (1.0 + range/100.0);
            let closeResistance = lvl > close && topRange > lvl;
            if (closeResistance) {
                response = true;
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