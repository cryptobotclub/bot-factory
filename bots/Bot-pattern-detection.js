class Bot {

    constructor() {
        this.datafeeds = [
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "2h",
                rollingWindowSize: 160,
            }
        ]
    }

  

    
    process(candle, slice) {
    
        var bullishengulfingpattern =require('technicalindicators').bullishengulfingpattern;
        var bearishengulfingpattern = require('technicalindicators').bearishengulfingpattern;


        let candles0 = slice[0].candles;

        if (candles0.length < 1) return;
  
        let last0 = candles0[candles0.length-1];

    
        let input = {
            open: candles0.map(p => p.open),
            high: candles0.map(p => p.high),
            low: candles0.map(p => p.low),
            close: candles0.map(p => p.close),
        }

        let bullish = bullishengulfingpattern(input);
        let bearish = bearishengulfingpattern(input);
      

        this.plot("engulfing patterns ", bullish === true? 1 : 0, bearish === true? 1 : 0 );

        let buy = false;
        let sell = false;

        if (bullish)  {
            this.signal({
                signal: 'BUY',
            })
        }
      
        if (bearish)  {
            this.signal({
                signal: 'SELL',
            });
        }
          
       
    }
    
     
   
}