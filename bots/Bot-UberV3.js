class Bot {


    process(candle) {
       
        let weights = {

            ichimoku: 1,
            mfi:    0,
            macd:   0,
            rsi:    0,
            bb:     0,
            psar:   -1,
            stoch:  1,
            obv:    0,

            profit: 1,
            buy:    2,
            sell:   -1,
        }

 
        let highs = this.state.candles.map(p => p.high);
        let lows = this.state.candles.map(p => p.low);
        let closes = this.state.candles.map(p => p.close);
        let volumes = this.state.candles.map(p => p.volume);

    
        let input = {
            highs:highs,
            lows:lows,
            closes:closes,
            volumes:volumes,
        }

        let signal1 = weights.ichimoku != 0 ? weights.ichimoku * this.ichimokuCloudSignal(input) : 0;
        let signal2 = weights.mfi != 0 ? weights.mfi * this.mfiSignal(input) : 0;
        let signal3 = weights.macd != 0 ? weights.macd * this.macdSignal(input) : 0;
        let signal4 = weights.rsi != 0 ? weights.rsi * this.rsiSignal(input) : 0;
        let signal5 = weights.bb != 0 ? weights.bb * this.bbSignal(input) : 0;
        let signal6 = weights.psar != 0 ? weights.psar * this.psarSignal(input) : 0;
        let signal7 = weights.stoch != 0 ? weights.stoch * this.stochSingal(input) : 0;
        let signal8 = weights.obv != 0 ? weights.obv * this.obvSignal(input) : 0;

        let signal9 = weights.profit != 0 ? weights.profit * this.profitTrade() : 0;

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



    profitTrade() {

        let position = this.positions[this.positions.length-1];
        
        if (position && position.status === 'OPEN') {
            //console.log("open position: ",  position.pnlPerc);
            let pnlPerc = position.pnlPerc;
            let sell = position.side === 'BUY' && pnlPerc > 0.6;
            let buy = position.side === 'SELL' && pnlPerc > 0.6;
            // if (sell || sell) {
            //     console.log("open position: ",  position.pnlPerc, sell? "buy" : sell? "sell":"n/a");
            // }
          
            if (sell) return -1;
            if (buy) return 1;
        }
        return 0;
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
            plot("PSAR", 0);
            return 0;
        }

        //plot("PSAR", lastPSAR);

        let diff = lastClose - lastPSAR;
        //console.log("PSAR:", lastClose, lastPSAR, diff);  

        let signal = diff >= 0 ? -1 :  
                     diff < 0 ? 1 :  0;
        return signal;
    }
    

    bbSignal(input) {

        let price = input.closes[input.closes.length-1];
        if (!price) return 0;

        let data = BollingerBands.calculate({
            period : 14, 
            values: input.closes,
            stdDev : 2,
        });

        let bb = data.pop();
        if (!bb) return 0;
 
        this.plot("BB", price, bb.lower, bb.upper);

        let buy = price < bb.lower;
        let sell =  price > bb.upper;
 
        let signal = buy ? 1 : 
                     sell ? -1 : 0;
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

        //this.plot("stoch", k0, d0);
       

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

        let sell  = lastClose > ic0.conversion && 
                   lastClose > ic0.base  && 
                   lastClose > ic0.spanA  && 
                   lastClose > ic0.spanB;


        let buy  = lastClose < ic0.base;


        let signal = buy ? 1 : 
                       sell ? -1 : 0;

        return signal;
    }

  
       
}