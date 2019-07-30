class Bot {

    constructor() {
        this.datafeeds = [
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "4h",
                rollingWindowSize: 20,
            },
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "1d",
                rollingWindowSize: 20,
            }
        ]
    }

  
    init() {
        return {
          supertrend: {
            upperBandBasic: 0,
            lowerBandBasic: 0,
            upperBand: 0,
            lowerBand: 0,
            supertrend: 0
          },
    
          lastSupertrend: {
            upperBandBasic: 0,
            lowerBandBasic: 0,
            upperBand: 0,
            lowerBand: 0,
            supertrend: 0
          },
          lastClose: 0,
          count: 0,
        };
    }
    
    
    process(candle, slice) {
    
        let candles0 = slice[0].candles;
        let candles1 = slice[1].candles;
        let candles2 = slice[2].candles;

        if (candles0.length < 1) return;
        if (candles1.length < 1) return;
        if (candles2.length < 1) return;

        let last0 = candles0[candles0.length-1];
        let last1 = candles1[candles1.length-1];
        let last2 = candles2[candles2.length-1];


        let supertrend0 = this.supertrend(last0, {
            high: candles0.map(p => p.high),
            low: candles0.map(p => p.low),
            close: candles0.map(p => p.close),
            period: 14
        });
       
        
        let supertrend1 = this.supertrend(last1, {
            high: candles1.map(p => p.high),
            low: candles1.map(p => p.low),
            close: candles1.map(p => p.close),
            period: 14
        });
         
      
        let supertrend2 = this.supertrend(last2, {
            high: candles2.map(p => p.high),
            low: candles2.map(p => p.low),
            close: candles2.map(p => p.close),
            period: 14
        });

        let sum = supertrend0 + supertrend1 + supertrend2;
        this.plot("supertrend", sum, supertrend0, supertrend1, supertrend2);

        let info = "Supertrend: [" + supertrend0 + ", " + supertrend1 + ", " + supertrend2+"]";

        if (supertrend0 === 1 && supertrend1 === 1 && supertrend2 === -1)  {
            this.signal({
                signal: 'BUY',
                info: info,
            })
        }
      
        if ( supertrend0 === -1 && supertrend1 === -1 && supertrend2 === 1 )  {
            this.signal({
                signal: 'SELL',
                info: info,
            });
        }
          
       
    }
    
       
       
    supertrend(candle, input) {
    
        let bandFactor = 3;
        let result = ATR.calculate(input);
    
        let atr = result.pop();
        this.state.count++;
    
    
        if (!atr) return;
       
        this.state.supertrend.upperBandBasic = (candle.high + candle.low) / 2 + bandFactor * atr;
        this.state.supertrend.lowerBandBasic = (candle.high + candle.low) / 2 - bandFactor * atr;
    
        if (
          this.state.supertrend.upperBandBasic < this.state.lastSupertrend.upperBand ||
          this.state.lastClose > this.state.lastSupertrend.upperBand
        ) this.state.supertrend.upperBand = this.state.supertrend.upperBandBasic;
        else this.state.supertrend.upperBand = this.state.lastSupertrend.upperBand;
    
        if (
          this.state.supertrend.lowerBandBasic > this.state.lastSupertrend.lowerBand ||
          this.state.lastClose < this.state.lastSupertrend.lowerBand
        ) this.state.supertrend.lowerBand = this.state.supertrend.lowerBandBasic;
        else this.state.supertrend.lowerBand = this.state.lastSupertrend.lowerBand;
    
        if (
          this.state.lastSupertrend.supertrend == this.state.lastSupertrend.upperBand &&
          candle.close <= this.state.supertrend.upperBand
        ) this.state.supertrend.supertrend = this.state.supertrend.upperBand;
        else if (
          this.state.lastSupertrend.supertrend == this.state.lastSupertrend.upperBand &&
          candle.close >= this.state.supertrend.upperBand
        ) this.state.supertrend.supertrend = this.state.supertrend.lowerBand;
        else if (
          this.state.lastSupertrend.supertrend == this.state.lastSupertrend.lowerBand &&
          candle.close >= this.state.supertrend.lowerBand
        )
          this.state.supertrend.supertrend = this.state.supertrend.lowerBand;
        else if (
          this.state.lastSupertrend.supertrend == this.state.lastSupertrend.lowerBand &&
          candle.close <= this.state.supertrend.lowerBand
        ) this.state.supertrend.supertrend = this.state.supertrend.upperBand;
        else this.state.supertrend.supertrend = 0;
    
        this.state.lastClose = candle.close;
    
        this.state.lastSupertrend = {
            upperBandBasic : this.state.supertrend.upperBandBasic,
            lowerBandBasic : this.state.supertrend.lowerBandBasic,
            upperBand : this.state.supertrend.upperBand,
            lowerBand : this.state.supertrend.lowerBand,
            supertrend : this.state.supertrend.supertrend,
        };
    
        let signal = 0;
        if(candle.close > this.state.supertrend.supertrend){
          signal = 1;
        }
       
        if(candle.close < this.state.supertrend.supertrend){
          signal = -1
        }
    
        return signal;
    }
   
}