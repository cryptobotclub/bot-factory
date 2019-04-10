
class Bot {

    
    process(candle) {
        
  
        let closes = this.state.candles.map(p => p.close);

        let resp = this.macdSignal({
            closes:closes,
        }); 
 
        this.plot("macd", resp.macd, resp.macdSignal);
    
        let buy = resp.signal > 0;
        let sell = resp.signal < 0;

        if (buy) {
            this.signal({
                signal: 'BUY',
                info: 'macd: '+resp.macd + ", signal: "+resp.macdSignal,
            })
        }

        if (sell) {
            this.signal({
                signal: 'SELL',
                info: 'macd: '+resp.macd + ", signal: "+resp.macdSignal,
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