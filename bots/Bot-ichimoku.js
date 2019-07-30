class Bot {


    process(last, slice) {
        
        let candles0 = slice[0].candles;

        if (candles0.length < 52) {
          this.plot("IchimokuCloud", 4000, 4000, 4000);
          plot("Span A / B", 4000,  4000) 
          return;
        }

        let high = candles0.map(p => p.high);
        let low = candles0.map(p => p.low);
 
        let signal = this.ichimokuCloudSingal(last.close, {
            high:high,
            low:low,
        });

        let buy = signal > 0;
        let sell = signal < 0;
 
        let info = "ichimoku: "+signal;

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


    ichimokuCloudSingal(last, input) {

       
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


        plot("IchimokuCloud", last, ic0.conversion, ic0.base)  // Tenkan Sen (red line) 
        plot("Span A / B", ic0.spanA,  ic0.spanB) 
    
        let buy  = last > ic0.conversion && 
                   last > ic0.base  && 
                   last > ic0.spanA  && 
                   last > ic0.spanB;

        let sell  = last < ic0.base;

        let signal = buy ? 1 : 
                     sell ? -1 : 0;

        return signal;
    }
}