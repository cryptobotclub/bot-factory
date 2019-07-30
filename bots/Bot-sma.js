
class Bot {

    constructor() {
        this.datafeeds = [
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "1d",
                rollingWindowSize: 20,
            }
        ]
        this.count = 0;
    }

    
    process(candle, slice) {
        
        let candles0 = slice[1].candles;

        let closes = candles0.map(p => p.close);
        let resp = SMA.calculate({period : 10, values : closes});

        let close0 = closes[closes.length-1];
        let sma0 = resp[resp.length-1];
        
        //console.log("closes: ", this.count++, "size: ", closes.length, "close0: ", close0, "sma0", sma0);
        this.plot("sma", sma0 ? sma0 : 0);

        let buy = close0 > sma0;
        let sell = close0 < sma0;

        if (buy) {
            this.signal({
                signal: 'BUY',
                info: 'close: ' + close0 + ", sma0: "+sma0,
            })
        }

        if (sell) {
            this.signal({
                signal: 'SELL',
                info: 'close: ' + close0 + ", sma0: "+sma0,
            })
        }
        
    }

    macdSignal(input) {

        let response = MACD.calculate({
                fastPeriod        : 12,
                slowPeriod        : 26,
                signalPeriod      : 9,
                SimpleMAOscillator: false,
                SimpleMASignal    : false,
                values            : input.closes,
        });
        
        let lastMACD = response.pop();
        let prevMACD = response.pop();
        
        
        if (lastMACD && prevMACD) {
  
            let signal = this.crossingUp(prevMACD, lastMACD) ? 1 :
                     this.crossingDown(prevMACD, lastMACD) ? -1 : 0;
            return ({
                signal: signal,
                macdSignal : lastMACD.signal,
                macd: lastMACD.MACD,
            });
        }

        
        return ({
            signal: 0,
            macdSignal : 0,
            macd: 0,
        })
    }


    
    // sell (short) signal occurs when the MACD line crosses below the Signal line.
    crossingDown(prevMACD, lastMACD) {

        let down =  (lastMACD.MACD < lastMACD.signal && prevMACD.MACD >= prevMACD.signal ) 
        return down;  
    }
   
    // a buy signal occurs when the MACD line crosses above the Signal line.
    crossingUp(prevMACD, lastMACD) {

        let up = (lastMACD.MACD > lastMACD.signal && prevMACD.MACD <= prevMACD.signal) 
        return up;
    }
       
}