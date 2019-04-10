class Bot {


    process(candle) {
        
         let highs = this.state.candles.map(p => p.high);
         let lows = this.state.candles.map(p => p.low);
         let closes = this.state.candles.map(p => p.close);
         let volumes = this.state.candles.map(p => p.volume);
 
         let data = BollingerBands.calculate({
            period : 14, 
            values: closes,
            stdDev : 2,
         });

         let price = candle.close;

         let bb = data.pop();
         if (!bb) {
            this.plot("Bollinger Bands", 3500, 3500, 3500, 3500);   
            return;
         }

         this.plot("Bollinger Bands", price, bb.lower, bb.middle, bb.upper);
   
         let buy = price < bb.lower;
         let sell =  price > bb.upper;
 

         if (buy) {
             this.signal({
                 signal: 'BUY',
             })
         }
 
         if (sell) {       
             this.signal({
                 signal: 'SELL',
             })
         }
    }



}