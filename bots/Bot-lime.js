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
        
        let candles0 = slice[0].candles; // 1h -  define trend
        //let candles1 = slice[1].candles; // 1h  - trade trending market
        console.log("candles0: ", candles0.length);


        let input0 = {
            high: candles0.map(p => p.high),
            low: candles0.map(p => p.low),
            close: candles0.map(p => p.close),
        }

        let buy = false;
        let sell = false;
        let info = "";
        let brokenSupport = undefined;
        let brokenResistance = undefined;

        let candle0 = candles0[candles0.length-1];
        let candle1 = candles0[candles0.length-2];


        if (candle0 && candle1) {
            let segmentSize = 28;   
            let rangePct = 0.75;    // percentage distance from support/resistance level
            let candles = candles0.slice(0, candles0.length-1); // all but the last element
            let {supports, resistances} = this.supportResistanceLevels(candles, segmentSize, rangePct);
   
            console.log("supports: ", supports);
            console.log("resistances: ", resistances);
            brokenSupport = this.brokenSupportResistence(candle1, supports, 1); 
            brokenResistance = this.brokenSupportResistence(candle1, resistances, 1);
        }

        // find support and resistance

        let haveOpenPosition = this.haveOpenPosition();

        if (haveOpenPosition === false && (brokenSupport || brokenResistance)) {
            let broken = (brokenSupport && candle0.close < candle0.open && candle0.close < candle1.close ) || 
                         (brokenResistance && candle0.close > candle0.open && candle0.close > candle1.close ) 

            if (broken)  {  
                buy = brokenResistance !== undefined;
                sell = brokenSupport !== undefined  && buy === false;
                info += (buy ? "broken resistance "+brokenResistance.level+" ("+brokenResistance.strength+")" :
                         sell ? "broken support "+brokenSupport.level+" ("+brokenSupport.strength+")"  : "");
            }
        }


        if (haveOpenPosition === true && (brokenSupport || brokenResistance)) {
            let position = this.openPosition();
            let pnlChanged = Math.abs(position.pnlPerc) > 0.5 ;
            if (position.side === 'BUY' && brokenSupport && pnlChanged) {
                info += ("broken support "+brokenSupport.level+" ("+brokenSupport.strength+")");
                sell = true;
            }
            if (position.side === 'SELL' && brokenResistance && pnlChanged) {
                info += ("broken resistance "+brokenResistance.level+" ("+brokenResistance.strength+")");
                buy = true;
            }            
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





///// TRADING STRATEGIES
    
    sidewaysTrading(candles) {
        
       
        this.state.count++;
        
        let weights = {
            
             ichimoku: 0,
               mfi:    0,
               macd:   0,
               rsi:    1,
               bb:     0,
               psar:   0,
               stoch:  1,
               obv:    0,

               profit: 0,
               buy:    1,
               sell:   -1,
       }

       let input = {
           open: candles.map(p => p.open),
           high: candles.map(p => p.high),
           low: candles.map(p => p.low),
           close: candles.map(p => p.close),
           volume: candles.map(p => p.volume),
       }
       
       let signal1 = weights.ichimoku !== 0 ? weights.ichimoku * this.ichimokuCloudSignal(input) : 0;
       let signal2 = weights.mfi !== 0 ? weights.mfi * this.mfiSignal(input) : 0;
       let signal3 = weights.macd !== 0 ? weights.macd * this.macdSignal(input) : 0;
       let signal4 = weights.rsi !== 0 ? weights.rsi * this.rsiSignal(input) : 0;
       let signal5 = weights.bb !== 0 ? weights.bb * this.bbSignal(input) : 0;
       let signal6 = weights.psar !== 0 ? weights.psar * this.psarSignal(input) : 0;
       let signal7 = weights.stoch !== 0 ? weights.stoch * this.stochSingal(input) : 0;
       let signal8 = weights.obv !== 0 ? weights.obv * this.obvSignal(input) : 0;

       let signal9 = weights.profit !== 0 ? weights.profit * this.profitTrade() : 0;

       let sum = signal1 +
                 signal2 + 
                 signal3 + 
                 signal4 + 
                 signal5 + 
                 signal6 + 
                 signal7 +
                 signal8 +
                 signal9;
  
       let buy = sum >= weights.buy;
       let sell = sum <= weights.sell;
 
       let info = "";
           info += signal1 !== 0 ? "ichimoku: "+signal1+" " : "";
           info += signal2 !== 0 ? " mfi: "+signal2+" " : "";
           info += signal3 !== 0 ? " macd: "+signal3+" " : "";
           info += signal4 !== 0 ? " rsi: "+signal4+" " : "";
           info += signal5 !== 0 ? " bb: "+signal5+" " : "";
           info += signal6 !== 0 ? " psar: "+signal6+" " : "";
           info += signal7 !== 0 ? " stoch: "+signal7+" " : "";
           info += signal8 !== 0 ? " obv: "+signal8+" " : "";
           info += signal9 !== 0 ? " profit: "+signal9+" " : "";
           info = info.trim();
       
       if (buy) {
           return({
               signal: 1,
               info: info,
           })

       }
       
       if (sell) {
            return ({
               signal: -1,
               info: info,
           })
       }

       return  ({
            signal: 0,
            info: info,
       })
      
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

        // last price
        let lastIdx = candles.length -1;
        let last = closes[lastIdx];  
        
        let segments = this.splitList(closes, segmentSize);


        const supports = this.identifyLevel(segments, rangePct, 'support');
        const resistances = this.identifyLevel(segments, rangePct, 'resistance');

        // Smoothen the levels
        let doneSupport = false;
        let doneResistance = false;
        while (!doneSupport || !doneResistance) {
           let removedSupport = this.smoothen(supports, rangePct);
           let removedResistance = this.smoothen(resistances, rangePct);
           doneSupport = removedSupport === 0;
           doneResistance = removedResistance === 0;
        }

        return ({
            supports: supports,
            resistances: resistances,
        })

    }


    smoothen(levels, rangePct) {
        if (levels.length < 2)
            return 0;

        var removeIdx = [];
        levels.sort( (a, b) =>  b.strength - a.strength);
        //console.log("sorted", levels);

        for (var i=0; i < (levels.length -1); i++ ) {

            let currentLevel = levels[i].level;
            let nextLevel = levels[i+1].level;
            let difference = Math.abs( nextLevel - currentLevel);
            let threshold = currentLevel * rangePct / 100.0;
            if (difference < threshold) {
                let remove = levels[i].strength < levels[i+1].strength ? i : (i+1);
                removeIdx.push(remove);
            }
        }

        // remove duplicate levels 
        if (removeIdx.length > 0) {
            console.log("levels before: ", levels.length, levels);
            var j = 0;
            for (var i=0; i<removeIdx.length; i++) {
                let idx = removeIdx[i];
                levels.splice(idx - j++, 1)
            }
            console.log("levels after:", levels.length, levels);
        }

        return removeIdx.length;

    }

    
    splitList(values, segmentSize) {

        var segments = [] // array of array of floats (2-dim array)

        // split the array 'values' into segments of 'segmentSize' elements
        let from = 0, to = 0;
        while (from < values.length) {
            to = from + segmentSize;
            if (to > values.length) {
                to = values.length;
            }
            segments.push(values.slice(from, to));
            from = to;
        }

        return segments;
    }


    identifyLevel(segments, rangePct, type) {

        var levels = [];

        // array of local min/max for each segment
        var aggregateVals = [];
        segments.forEach( s => {
            let val = type === 'resistance' ? Math.max.apply(null, s) : 
                      type === 'support' ? Math.min.apply(null, s) : undefined;

            // local min/max should not be at the edge of the segment
            let noboundaries =  (val !== s[0]) && (val !== s[s.length-1]);
            if (noboundaries) {                
                aggregateVals.push(val)
            }           
        })

    
        var count = 0;
        while (aggregateVals.length > 0) {

            var withinRange = [];
            var withinRangeIdx = []; //set


            // determine Support/resistance level  (min/max of all remained segments )
            let node = type === 'resistance' ? Math.max.apply(null, aggregateVals) : 
                       type === 'support' ? Math.min.apply(null, aggregateVals) : undefined;

            // Find elements within price range 'rangePct' of 'node'
            for (var i = 0; i < aggregateVals.length; ++i) {

                // local min/max for a segment
                let val = aggregateVals[i];

                // aggreagate local min/max -> check if val in in range of node
                if (type === 'support') {
                    let threshold  = node * (1 + (rangePct / 100.0));
                    if (val < threshold) {
                        withinRangeIdx.push(i);
                        withinRange.push(val);                    
                    } 
                }

                if (type === 'resistance') {
                    let threshold  = node * (1 + ( -1 * rangePct / 100.0));
                    if (val > threshold) {
                        withinRangeIdx.push(i);
                        withinRange.push(val);                    
                    } 
                }
            }

            if (withinRange.length === 0) {
                console.log("invalid withinRange", withinRange);
                process.exit(1);
            }

            // Remove elements within range from aggregateVals
            // var i = 0;
            // for (var idx in withinRangeIdx) {
            //     aggregateVals.splice(idx - i++, 1)
            // }
            var i = 0;
            withinRangeIdx.forEach(idx => {
                aggregateVals.splice(idx - i++, 1)
            })

            // var j = 0;
            // for (var i=0; i<withinRangeIdx.length; i++) {
            //     let idx = withinRangeIdx[i];
            //     withinRangeIdx.splice(idx - j++, 1)
            //}

            // Take an average
            var sum = 0.0;

            withinRange.forEach(val => {
                sum +=  parseFloat(val);
                //console.log("sum: ", sum, "val: ", val , "withinRange: ", withinRange);
            })

            let avg = sum / withinRange.length;
            let strength = withinRange.length;

            // let threshold = avg * (1 - (rangePct / 100));
            // let levelType =  (priceAsOfDate < threshold) ? 'resistance' : 'support';

            console.log(type, "level: ", avg, "strength: ", strength);
            levels.push({
                type: type,
                level: avg, 
                strength: strength,
            })
            
        }

        console.log("Found levels: ", levels.length);
        return levels;
    }

    brokenSupportResistence(candle, levels, strength) {

        var brokenLevel = undefined;

        levels.forEach(level => {

            if (level.type === 'support') {
                let support = level.level;
                let broken = candle.close < support && candle.high >= support && level.strength >= strength;
                if (broken) {
                    brokenLevel = {
                        type: 'support',
                        level: level.level,
                        strength: level.strength,
                    }
                }
            }

            if (level.type === 'resistance') {
                let resistance = level.level;
                let broken = candle.close > resistance && candle.low <= resistance && level.strength >= strength;;
                if (broken) {
                    brokenLevel = {
                        type: 'resistance',
                        level: level.level,
                        strength: level.strength,
                    }
                }
            }


        })

        if (brokenLevel) {
            console.log("brokenLevel: ", brokenLevel);
        }

        return  brokenLevel;
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




///// TREND DETECTION

    uptrend(candles) {

        let close = candles.map(p => p.close);

        let close0 = close[close.length-1];

        let sma9 = SMA.calculate({period : 9, values : close});
        let sma21 = SMA.calculate({period : 21, values : close});
        let sma50 = SMA.calculate({period : 50, values : close});

        let lastsma9 = sma9[sma9.length-1];
        let lastsma21 = sma21[sma21.length-1];
        let lastsma50 = sma50[sma50.length-1];

        //let up = (close0 > lastsma9) && (lastsma9 > lastsma21) && (lastsma21 > lastsma50);
        let up = (close0 > lastsma9);
       
        plot("ma", close0, lastsma9, lastsma21, lastsma50)
        //console.log("close0", close0, "lastsma9: ", lastsma9);
        return up;
    }

    downtrend(candles) {

        let close = candles.map(p => p.close);

        let close0 = close[close.length-1];

        let sma9 = SMA.calculate({period : 9, values : close});
        let sma21 = SMA.calculate({period : 21, values : close});
        let sma50 = SMA.calculate({period : 50, values : close});

        let lastsma9 = sma9[sma9.length-1];
        let lastsma21 = sma21[sma21.length-1];
        let lastsma50 = sma50[sma50.length-1];

    
        //let down = (close0 < lastsma9) && (lastsma9 < lastsma21) && (lastsma21 < lastsma50);
        let down = (close0 < lastsma9);

        //let down = (lastsma9 - lastsma21) / lastsma9 * 100 < -1.00;

        return down;
    }


    lowVolatilityBB(candles) {

        let close = candles.map(p => p.close)

        let last = candles[candles.length-1].close;

        let close0 = candles[candles.length-1].close;
        // let close1 = candles[candles.length-2].close;
        // let close2 = candles[candles.length-3].close;
        // let close3 = candles[candles.length-4].close;

        let data = BollingerBands.calculate({
            period : 14, 
            values: close,
            stdDev : 2,
        });

        let bb = data[data.length-1];
       
        let upper = data.map(p => p.upper)
        let lower = data.map(p => p.lower)

        let upperSma = SMA.calculate({period : 10, values : upper});
        let lowerSma = SMA.calculate({period : 10, values : lower});

        let closeSMA = SMA.calculate({period : 50, values : close});

        let upper0 = upperSma[upperSma.length-1];
        let lower0 = lowerSma[lowerSma.length-1]
       // let closeSMA0 = closeSMA[closeSMA.length-1]

        let v = (upper0 - lower0) / last * 100.0;
        //let v = Math.abs( close0 - closeSMA0 ) / closeSMA0  * 100.0
        let vround = Math.round(v * 100) / 100;
        
        let highVol = v > 5.0;

        plot("BB", close0, bb.upper, bb.lower);
        plot("high Volatility", highVol ? 1.0 : 0.0)
        //console.log("volatility:", highVol ? "HIGH" : "LOW", " : ", v );

        return (highVol == false);
    }



///// TA SIGNALS

    ichimokuCloudSignal(input) {

        
        let last = input.close[input.close.length -1];
        var result = IchimokuCloud.calculate({
                high  : input.high,
                low   : input.low,
                conversionPeriod: 9,
                basePeriod: 26,
                spanPeriod: 52,
                displacement: 26
            }
        )

        let ic0 = result[result.length - 1];
        //let ic1 = result[result.length - 2];


        // Conversion - Tenkan Sen (red line) - moving average of middle value of the highest and lowest points over the last 9 periods
        // Base - Kijun Sen  (blue line) - moving average of middle value of the highest and lowest points over the last 26 periods
        // Lagging Span - Chinoku Span (green line) – the current close price shifted to the left by 26 periods.
        // Leading Span A / Span B - Senkou Span or “The Cloud” (orange lines) -  The cloud also represents the furthest support/resistance level, where our trading position is recommended.

   
        // Long when
        // - price goes through the Conversion (red) and Base (blue)
        // - price goes through the cloud

        // Close Longs when the prices closes below Base (blue)

        // When Leading Span A is rising and above Leading Span B, this helps confirm the uptrend 
        // When Leading Span A is falling and below Leading Span B, this helps confirm the downtrend. 
    
        let last1 = last * 1;
        let last2 = last * 1;

        let buy  = last1 > ic0.conversion && 
        last1 > ic0.base  && 
        last1 > ic0.spanA  && 
        last1 > ic0.spanB;

        let sell  = last2 < ic0.conversion && 
        last2 < ic0.base && 
        last2 < ic0.spanA  && 
        last2 < ic0.spanB;

        let signal = buy ? 1 : 
                     sell ? -1 : 0;

        return signal;
    }


   psarSignal(input) {

       let lastClose = input.closes[input.close.length-1];
       
       let high = input.high;
       let low = input.low;
       let step = 0.02;
       let max = 0.2;

       let response = PSAR.calculate({ high, low, step, max });

                            
       let lastPSAR = response.length > 0 ? response[response.length-1] : undefined;
       
       if (!lastPSAR)  {
           return 0;
       }

       let diff = lastClose - lastPSAR;
 
       let buy = diff < 0;  // buy if price below psar
       let sell = diff > 0; // sell if price above psar
       
       let signal = buy ? 1 : sell ? -1 :  0;
                    
       return signal;
   }
   

   bbSignal(input) {

       let response = BB.calculate({
           period : 14, 
           values : input.close,
           stdDev : 2
       });

       let lastBB = response.length > 0 ? response[response.length-1] : undefined;
       
       if (!lastBB)  {
           plot("BB gap", 0);
           return 0;
       }

       let {lower, upper} = lastBB;
       let diff = upper - lower;

       // if (diff > 30)
       // console.log("diff", diff);

       let signal = diff <= 10 ? -1 : 
                    diff > 30 ? 1 :  0;
       return signal;
   }
   
   rsiSignal(input) {
       
       let response = RSI.calculate({
           period: 5,
           values: input.close,
       });
       
       let lastRSI = response.length > 0 ? response[response.length-1] : undefined;
       //plot("RSI", lastRSI);
       
       if (!lastRSI) return 0;
       else if (lastRSI <= 10) return 1; //3;
       else if (lastRSI <= 20) return 1;
       else if (lastRSI >= 90) return -1; //-3;
       else if (lastRSI >= 80) return -1;
       
       return 0; 
   
   }

   macdSignal(input) {

       let response = MACD.calculate(
           {
               fastPeriod        : 12,
               slowPeriod        : 26,
               signalPeriod      : 9,
               SimpleMAOscillator: false,
               SimpleMASignal    : false,
               values            : input.close,
           }
       );
       
       let lastMACD = response.pop();
       let prevMACD = response.pop();
       
       var signal = 0;
       if (lastMACD && prevMACD) {
           // sell (short) signal occurs when the MACD line crosses below the Signal line.             
           // a buy signal occurs when the MACD line crosses above the Signal line.
           let crossdown =  (lastMACD.MACD < lastMACD.signal && prevMACD.MACD >= prevMACD.signal ) 
           let crossup = (lastMACD.MACD > lastMACD.signal && prevMACD.MACD <= prevMACD.signal) 
           signal = crossup ? 1 : crossdown ? -1 : 0;
       }

       return signal;
   }

   obvSignal(input) {

       let obv = OBV.calculate({
           close : input.close,
           volume : input.volume,
       });

       let sma = SMA.calculate({period : 5, values : obv});
       let lastSMA1 = sma[sma.length - 1];
       let lastSMA2 = sma[sma.length - 2];
       let lastSMA3 = sma[sma.length - 3];
       let lastSMA4 = sma[sma.length - 4];

       //plot("obv-sma", lastSMA1? lastSMA1 : 0);
       if (!lastSMA1 || !lastSMA2 || !lastSMA3 || !lastSMA4) return 0;

       // raising obv -> BUY
       // dropping ovb -> SELL
       let signal =  lastSMA4 > lastSMA3 && lastSMA3 > lastSMA2  && lastSMA2 > lastSMA1  ? -1 :
                     lastSMA4 < lastSMA3 && lastSMA3 < lastSMA2  && lastSMA2 < lastSMA1  ? 1 :  0;
       
        return signal; 
   }

   mfiSignal(input) {

       let mfi = MFI.calculate({
           high  : input.high,
           low   : input.low,
           close :  input.close,
           volume  : input.volume,
           period : 14,
       });
       let lastMFI = mfi[mfi.length - 1];
       //("mfi", lastMFI? lastMFI : 0);

       let signal =
               lastMFI > 90 ? -3 :
               lastMFI > 80 ? -1 :                
               lastMFI < 10 ? 3 :
               lastMFI < 20 ? 1 : 0;
       // let signal =
       //     lastMFI > 80 ? 1 :         
       //     lastMFI < 20 ? -1 : 0;

       return signal;
   }


   stochSingal(input) {
       
       let period = 14;
       let signalPeriod = 3;

       let stoch = Stochastic.calculate({
           high: input.high,
           low: input.low,
           close: input.close,
           period: period,
           signalPeriod: signalPeriod
       })

       if (!stoch) return 0;
       
       let lastStoch = stoch[stoch.length - 1];
       let prevStoch = stoch[stoch.length - 2];

       if (!lastStoch || !prevStoch) return 0;

       let k0 = lastStoch.k;
       let d0 = lastStoch.d;
       let k1 = prevStoch.k;
       let d1 = prevStoch.d;

       let oversold = 20;
       let crossedAbove = k1 <= d1 && k0 > d0;
       //let buy = k0 < oversold; 
       //let buy = crossedAbove && (k0 > oversold) && (d0 <= oversold)
       let buy = crossedAbove && (k0 < oversold);
       
       let overbought = 80;
       let crossedBelow = k1 >= d1 && k0 < d0;
       //let sell = k0 > overbought; // 
       //let sell = crossedBelow && (k0 < overbought) && (d0 >= overbought)
       let sell = crossedBelow && (k0 >= overbought);

       //console.log("lastStoch", lastStoch);
       let signal = buy ? 1 : 
                    sell ? -1 : 0;

       return signal;
   }

   
}