
class Bot {

    constructor() {
        this.datafeeds = [
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "6h",
                rollingWindowSize: 52,
            },
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "1d",
                rollingWindowSize: 100,
            }         

        ]
    }


    process(last, slice) {
        
        let candles0 = slice[0].candles; // 4h
        let candles1 = slice[1].candles; // 6h
        let candles2 = slice[2].candles; // 1d  

        if (candles0.length < 52 || candles1.length < 52 || candles2.length < 52) {
            plot("trend", 0)
            plot("ma", 4000, 4000, 4000, 4000)
            return;
        }

        // let up = this.uptrend(candles0);
        // let down = this.downtrend(candles0);

        //plot("trend", up ? 1 : down ? -1 : 0);

        let input0 = {
            high: candles0.map(p => p.high),
            low: candles0.map(p => p.low),
            close: candles0.map(p => p.close),
        }

        let input1 = {
            high: candles1.map(p => p.high),
            low: candles1.map(p => p.low),
            close: candles1.map(p => p.close),
        }

        let input2 = {
            high: candles2.map(p => p.high),
            low: candles2.map(p => p.low),
            close: candles2.map(p => p.close),
        }
    

        /// define trend (1d)
        let signal2 = this.ichimokuCloudSingal(input2); 
        plot("trend", signal2);
        let up =  signal2 > 0;
        let down =  signal2 < 0;

        // follow short term trend (4h)
        let signal1 = this.ichimokuCloudSingal(input1); 
        let buy = signal1 > 0;
        let sell = signal1 < 0;
 
        // let lowVolatility = this.lowVolatilityBB(candles2)
        let info = (up ? "uptrend " : down? "downtrend" : "sideways");

        // during sideways trading use different strategy
        if (up === false && down === false) {
            let response = this.sidewaysTrading(slice);
            buy = response.signal === 1;
            sell = response.signal === -1;
            info += response.info;
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


    uptrend(candles) {

        let close = candles.map(p => p.close);

        let close0 = close[close.length-1] * 1.00;

        let sma9 = SMA.calculate({period : 9, values : close});
        let sma21 = SMA.calculate({period : 21, values : close});
        let sma50 = SMA.calculate({period : 50, values : close});

        let lastsma9 = sma9[sma9.length-1];
        let lastsma21 = sma21[sma21.length-1];
        let lastsma50 = sma50[sma50.length-1];

       // let up = (close0 > lastsma9) && (lastsma9 > lastsma21) && (lastsma21 > lastsma50);

        let up = (lastsma9 - lastsma21) / lastsma9 * 100 > 1.00;

        plot("ma", close0, lastsma9, lastsma21, lastsma50)
        //console.log("close0", close0, "lastsma9: ", lastsma9);
        return up;
    }

    downtrend(candles) {

        let close = candles.map(p => p.close);

        let close0 = close[close.length-1] * 1.0;

        let sma9 = SMA.calculate({period : 9, values : close});
        let sma21 = SMA.calculate({period : 21, values : close});
        let sma50 = SMA.calculate({period : 50, values : close});

        let lastsma9 = sma9[sma9.length-1];
        let lastsma21 = sma21[sma21.length-1];
        let lastsma50 = sma50[sma50.length-1];

    
        //let down = (close0 < lastsma9) && (lastsma9 < lastsma21) && (lastsma21 < lastsma50);

        let down = (lastsma9 - lastsma21) / lastsma9 * 100 < -1.00;

        return down;
    }


    lowVolatilityBB(candles) {

        let close = candles.map(p => p.close)

        let last = candles[candles.length-1];

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

        // let upper0 = upperSma[upperSma.length-1];
        // let lower0 = lowerSma[lowerSma.length-1]
        let closeSMA0 = closeSMA[closeSMA.length-1]

        //let v = (upper0 - lower0) / last * 100.0;
        let v = Math.abs( close0 - closeSMA0 ) / closeSMA0  * 100.0
        let vround = Math.round(v * 100) / 100;
        
        let highVol = v > 10.0;

        // plot("BB", close0, bb.upper, bb.lower);
    
        return (highVol == false);
    }


    ichimokuCloudSingal(input) {

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



    ////////


    sidewaysTrading(slice) {
        
        let candles0 = slice[0].candles; // 4h

        this.state.count++;
        
        let weights = {
            
             ichimoku: 0,
               mfi:    1,
               macd:   1,
               rsi:    1,
               bb:     0,
               psar:   1,
               stoch:  1,
               obv:    0,

               profit: 1,
               buy:    1,
               sell:   -1,
       }

      

       let input = {
           opens: candles0.map(p => p.open),
           highs: candles0.map(p => p.high),
           lows: candles0.map(p => p.low),
           closes: candles0.map(p => p.close),
           volumes: candles0.map(p => p.volume),
       }
       

       let signal1 = weights.ichimoku !== 0 ? weights.ichimoku * this.ichimokuCloudSingal(input) : 0;
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


   profitTrade() {

       let position = this.positions[0];
       
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


   psarSignal(input) {

       let lastClose = input.closes[input.closes.length-1];
       
       let high = input.highs;
       let low = input.lows;
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
           values : input.closes,
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
           values: input.closes,
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
               values            : input.closes,
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
           close : input.closes,
           volume : input.volumes,
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
           high  : input.highs,
           low   : input.lows,
           close :  input.closes,
           volume  : input.volumes,
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
           high: input.highs,
           low: input.lows,
           close: input.closes,
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