////  Momentum trade

//// 3 bars play:
////  1st bar: wide range green bar above resistance
////  2nd bar: narrow range resting bar (up to  50% of the move, relatively equals highs)
////  3rd bar: Continuation bar, breaks the high of the 1st and 2nd bar
//// Stop loss undee the second bar

class Bot {


    constructor() {
        this.datafeeds = [
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "5m",
                rollingWindowSize: 28,
            }
        ]
    }


    process(last, slice) {
        
         
        let candles = slice[0].candles; 
        
        let buy, sell = false;
        let info = "";

        if (this.haveOpenPosition() === false) {
            buy = this.shouldOpenPosition(candles, last, 'BUY');
            //sell = this.shouldOpenPosition(candles, last, 'SELL');
        } else {

            let position = this.positions[this.positions.length-1];
            if (position && position.pnlPerc > 3.0) {
                buy = position.side === 'SELL';
                sell = position.side === 'BUY';
                info = ("pnl: "+position.pnlPerc+"%");
            }
        }


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


    shouldOpenPosition(candles, last, side="BUY") {

        // last 3 candles
        let bar0 = candles[candles.length-1]
        let bar1 = candles[candles.length-2]
        let bar2 = candles[candles.length-3]

        //// determine support and resitance levels
        let segmentSize = 50;   
        let rangePct = 1.0;    // percentage distance from support/resistance level
        let recentCandles = candles.slice(0, candles.length-1); // all but the last element
        let levels = this.supportResistanceLevels(recentCandles, segmentSize, rangePct);

        let suppResistLvl = side === 'BUY' ?  this.closeToSupport(levels, bar2.close, 2.0) : 
                              side === 'SELL' ? this.closeToResistance(levels, bar2.close, 2.0) : undefined

        let haveSupportResistance = suppResistLvl !== undefined;
        let recent = candles.slice(0, candles.length-3); // all but the last 3 elements
        let widerange = this.largeCandleRange(recent, 3); // ATR range of recent candles (excluding the last 3)
        let narrowrange = widerange / 2.0;

        // 1st bar - igniting above resitance
        let largeBar2 = this.wideRangeCandle(bar2, widerange, side);

        // 2nd bar -  resting bar
        let narrowBar1 = this.narrowRangeCandle(bar1, narrowrange);
        let restingBar1 = this.restingBar(bar1, bar2, side);

        // 3rd bar - breaks high(low) of previous 2 
        let breakingBar3 = this.breakingBar(bar1, bar2, last, side);

       // let openPosition = haveSupportResistance && largeBar2 && narrowBar1 && restingBar1 && breakingBar3;

        let openPosition =  largeBar2 && narrowBar1 && restingBar1 && breakingBar3;

        if (openPosition) {
            console.log("large bar: ", bar2);
            console.log("narrow resting bar: ", bar1);
            console.log("breaking last: ", last);
        }

        let info = {

        }
        return openPosition;

    }


    breakingBar(bar1, bar2, last, side) {

        let breaking = false;
        if (side === 'BUY') {
            breaking = (last.close > bar1.high) && (last.close > bar2.high)
        } 

        if (side === 'SELL') {
             breaking = (last.close < bar1.low) && (last.close < bar2.low)
        } 

        return breaking;
    }

    restingBar(bar, previous, side) {

        let resting = false;
        if (side === 'BUY') {
            resting = (bar.close < previous.close) 
        } 
        if (side === 'SELL') {
            resting = (bar.close > previous.close)
        } 
        return resting;
    }

    wideRangeCandle(candle, range, side='BUY') {
    
        let wide = false;
        if (side === 'BUY') {
            wide = candle.close > candle.open && (candle.close - candle.open) > range;
        } 
        if (side === 'SELL') {
            wide = candle.close < candle.open && (candle.open - candle.close) > range;
        } 
        if (wide) {
            console.log("*** wide candle: ", candle.openDate.toISOString(), " - ", (candle.close - candle.open), " > ", range);
        } 
        return wide;
    }


    narrowRangeCandle(candle, range) {
        let  narrow = Math.abs(candle.close - candle.open) < range;
        return narrow;
    }



    closeToSupport(levels, close, range=5.0) {
        
        let response = undefined;
        for (var i=0; i<levels.length; i++) {
            let lvl = levels[i].level;

            let bottomRange =  close * (1.0 - range/100.0);
            let closeSupport = lvl > bottomRange && lvl < close; // support 'lvl' below current 'close' price
            if (closeSupport) {
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
    

    largeCandleRange(candles, factor=2.0) {

        let sum = 0;
        candles.forEach( c => {
            sum += Math.abs(c.close - c.open);
        })

        //let avg2 = sum 
        let avgRange = sum / candles.length;

        let close0 = candles[candles.length-1].close;
        let open0 = candles[candles.length-1].open;

        let diff0 = Math.abs(close0 - open0);
   
        if (diff0 > factor * avgRange) {
            console.log("range: ", avgRange, " diff: ", diff0, " candles: ", candles.length);

        }
       
        let largeRange = avgRange * factor;
        return largeRange;
    }

    // largeCandleRange(candles, factor=2.0) {

    //     let atrs = ATR.calculate({
    //         high: candles.map(p => p.high),
    //         low: candles.map(p => p.low),
    //         close: candles.map(p => p.close),
    //         period: 14
    //     });
    //     let atr0 = atrs.pop();

    //     let close0 = candles[candles.length-1].close;
    //     let open0 = candles[candles.length-1].open;
    //     this.plot("ATR", atr0);
    //     this.plot("diff", Math.abs( close0 - open0));

    //     let candleRange = atr0 * factor;
    //     return candleRange;
    // }



    ///// SUPPORT / RESISTANCE


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


    slope(values) {

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

}