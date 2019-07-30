class Bot {


    constructor() {
        this.datafeeds = [
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "4h",
                rollingWindowSize: 100,
            },

        ]
    }


    process(candle, slice) {
        	
        	
        let candles = slice[0].candles; //1H
        let candles1D = slice[1].candles; //1d
        	
         let weights = {
             
              ichimoku: 0,
                mfi:    0,
                macd:   0,
                rsi:    0,
                bb:     0,
                psar:   0,
                stoch:  1,
                obv:    0,

                profit: 1,
                buy:    1,
                sell:   -1,
        }
 
  
        let up = this.uptrend(candles1D);
        let down = this.downtrend(candles1D);

        // if (up == true || down == true) {
        //     this.log( up ? "uptrending" : down ? "downtrending" : "n/a")
        //     return;
        // }

        // Continue only if market is SIDEWAYS
        let input = {
            highs: candles.map(p => p.high),
            lows: candles.map(p => p.low),
            closes: candles.map(p => p.close),
            volumes: candles.map(p => p.volume),
        }

        let signal1 = weights.ichimoku != 0 ? weights.ichimoku * this.ichimokuCloudSignal(input) : 0;
        let signal2 = weights.mfi != 0 ? weights.mfi * this.mfiSignal(input) : 0;
        let signal3 = weights.macd != 0 ? weights.macd * this.macdSignal(input) : 0;
        let signal4 = weights.rsi != 0 ? weights.rsi * this.rsiSignal(input) : 0;
        let signal5 = weights.bb != 0 ? weights.bb * this.bbSignal(input) : 0;
        let signal6 = weights.psar != 0 ? weights.psar * this.psarSignal(input) : 0;
        let signal7 = weights.stoch != 0 ? weights.stoch * this.stochSingal(input) : 0;
        let signal8 = weights.obv != 0 ? weights.obv * this.obvSignal(input) : 0;

        let signal9 = weights.profit != 0 ? weights.profit * this.profitTrade(2.0) : 0;

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
            this.signal({
                signal: 'BUY',
                info: info,
            })

        } else if (sell) {
    
            this.signal({
                signal: 'SELL',
                info: info,
            })
        }

    }


    profitTrade(target = 1.0) {

        let position = this.positions[this.positions.length-1];
        
        if (position && position.status === 'OPEN') {
            let pnlPerc = position.pnlPerc;
            let sell = position.side === 'BUY' && pnlPerc > target;
            let buy = position.side === 'SELL' && pnlPerc > target;
          
            if (sell) return -1;
            if (buy) return 1;
        }

        return 0;
    }


    uptrend(candles) {

        let close = candles.map(p => p.close);

        let close0 = close[close.length-1];

        let sma9 = SMA.calculate({period : 9, values : close});
        let sma21 = SMA.calculate({period : 21, values : close});
        let sma50 = SMA.calculate({period : 50, values : close});

        let lastsma9 = sma9[sma9.length-1];
        let lastsma21 = sma21[sma21.length-1];
        let lastsma50 = sma50[sma50.length-1];

        let up = (close0 > lastsma9) && (lastsma9 > lastsma21) && (lastsma21 > lastsma50);

        console.log("close0", close0, "lastsma9: ", lastsma9);
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

        let down = (close0 < lastsma9) && (lastsma9 < lastsma21) && (lastsma21 < lastsma50);
        return down;
    }


    stochSingal(input) {
        
        let period = 14;
        let signalPeriod = 3;
        let oversold = 30;  // 20
        let overbought = 70;  // 80

        let stoch = Stochastic.calculate({
            high: input.highs,
            low: input.lows,
            close: input.closes,
            period: period,
            signalPeriod: signalPeriod
        })

        if (!stoch) {
            plot("stoch", 50, 50, oversold, overbought);
            return 0;
        }
        
        let lastStoch = stoch[stoch.length - 1];
        let prevStoch = stoch[stoch.length - 2];

        if (!lastStoch || !prevStoch) {
            plot("stoch", 50, 50, oversold, overbought);
            return 0;
        }

        let k0 = lastStoch.k;
        let d0 = lastStoch.d;
        let k1 = prevStoch.k;
        let d1 = prevStoch.d;

        
        let crossedAbove = k1 <= d1 && k0 > d0;
        //let buy = k0 < oversold; 
        //let buy = crossedAbove && (k0 > oversold) && (d0 <= oversold)
        let buy = crossedAbove && (k0 < oversold);
        
        
        let crossedBelow = k1 >= d1 && k0 < d0;
        //let sell = k0 > overbought; // 
        //let sell = crossedBelow && (k0 < overbought) && (d0 >= overbought)
        let sell = crossedBelow && (k0 >= overbought);

        plot("stoch", k0, d0, oversold, overbought);
        
        //console.log("lastStoch", lastStoch);
        let signal = buy ? 1 : 
                     sell ? -1 : 0;

        return signal;
    }


    psarSignal(input) {

         let lastClose = input.closes[input.closes.length-1];`c`
         //console.log("lastClose:", lastClose);  


        let high = input.highs;
        let low = input.lows;
        let step = 0.02;
        let max = 0.2;

        let response = PSAR.calculate({ high, low, step, max });

                             
        let lastPSAR = response.length > 0 ? response[response.length-1] : undefined;
        
        if (!lastPSAR)  {
            plot("PSAR", 0, 0);
            plot("diff", 0);
            return 0;
        }

        let diff = lastClose - lastPSAR;
    
         plot("PSAR", lastPSAR, lastClose);
         plot("diff", diff);
  
        let buy = diff < 0;  // buy if price below psar
        let sell = diff > 0; // sel if price above psar
        
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
        plot("RSI", lastRSI ? lastRSI : 0);
        
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


    

    ichimokuCloudSignal(input) {
    
        var result = IchimokuCloud.calculate({
                high  : input.highs,
                low   : input.lows,
                conversionPeriod: 9,
                basePeriod: 26,
                spanPeriod: 52,
                displacement: 26
            }
        )

        let lastClose = input.closes[input.closes.length - 1];
       
        let ic0 = result[result.length - 1];
        let ic1 = result[result.length - 2];

        if (!ic0) {
            return 0;
        }

        // Chinoku Span (green line) -  represents the current price, but it is shifted to the left by 26 periods.
        // conversion Tenkan Sen (red line) 
        // base Kijun Sen (blue line) 

        let buy  = lastClose > ic0.conversion && 
                   lastClose > ic0.base  && 
                   lastClose > ic0.spanA  && 
                   lastClose > ic0.spanB;


        //let sell  = lastClose < ic0.base;
        let sell  = lastClose < ic0.conversion && 
                    lastClose < ic0.base  && 
                    lastClose < ic0.spanA  && 
                    lastClose < ic0.spanB;


 
        let signal = buy ? 1 : 
                     sell ? -1 : 0;

       
        return signal;
    }

       
}