class Bot {


    process(candle) {
        
         let highs = this.state.candles.map(p => p.high);
         let lows = this.state.candles.map(p => p.low);
         let closes = this.state.candles.map(p => p.close);
         let volumes = this.state.candles.map(p => p.volume);
 
         let signal = this.ichimokuCloudSingal({
            highs:highs,
            lows:lows,
            closes:closes,
            volumes:volumes,
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


    ichimokuCloudSingal(input) {

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
            plot("IchimokuCloud", undefined, undefined, undefined, undefined)  // Tenkan Sen (red line) 
            return 0;
        }


        // Chinoku Span (green line) -  represents the current price, but it is shifted to the left by 26 periods.
        plot("IchimokuCloud", ic0.conversion, ic0.base, ic0.spanA, ic0.spanB)  // Tenkan Sen (red line) 
        plot("B - A:", (ic0.spanB - ic0.spanA)) 
    
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