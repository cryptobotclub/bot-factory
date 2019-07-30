class Bot {


    process(candle, slice) {
              
        let candles = slice[0].candles; // 4h
        
         let data = BollingerBands.calculate({
            period : 14, 
            values: candles.map(p => p.close),
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