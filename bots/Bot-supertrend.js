class Bot {

  constructor() {
    this.datafeeds = [
        {
            exchange: "BINANCE",
            symbol: "BTCUSDT",
            interval: "1d",
            rollingWindowSize: 15,
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
    
    let candles0 = slice[1].candles;

    if (candles0.length < 15) {
      this.plot("supertrend", 0, 0);
      return;
    }


    let last = candles0[candles0.length-1];

    let high = candles0.map(p => p.high);
    let low = candles0.map(p => p.low);
    let close = candles0.map(p => p.close);
 
    let supertrend = this.supertrend(last, {
      high: high,
      low: low,
      close: close,
      period: 14
    });

  
    this.plot("supertrend", supertrend.close, supertrend.supertrend);

    if (supertrend.signal === 1)  {
      this.signal({
          signal: 'BUY',
      })
    }
  
    if (supertrend.signal === -1)  {
      this.signal({
          signal: 'SELL',
      });
    }

  }

   
   
  supertrend(candle, input) {

    let bandFactor = 3;
    let result = ATR.calculate(input);

    let atr = result.pop();
    this.state.count++;

    if (!atr) return ({ 
        signal: 0,
    });
   
    this.state.supertrend.upperBandBasic = (candle.high + candle.low) / 2 + bandFactor * atr;
    this.state.supertrend.lowerBandBasic = (candle.high + candle.low) / 2 - bandFactor * atr;

    if (
      this.state.supertrend.upperBandBasic < this.state.lastSupertrend.upperBand ||
      this.state.lastClose > this.state.lastSupertrend.upperBand
    )
      this.state.supertrend.upperBand = this.state.supertrend.upperBandBasic;
    else this.state.supertrend.upperBand = this.state.lastSupertrend.upperBand;

 
    if (
      this.state.supertrend.lowerBandBasic > this.state.lastSupertrend.lowerBand ||
      this.state.lastClose < this.state.lastSupertrend.lowerBand
    )
      this.state.supertrend.lowerBand = this.state.supertrend.lowerBandBasic;
    else this.state.supertrend.lowerBand = this.state.lastSupertrend.lowerBand;

    if (
      this.state.lastSupertrend.supertrend == this.state.lastSupertrend.upperBand &&
      candle.close <= this.state.supertrend.upperBand
    )
      this.state.supertrend.supertrend = this.state.supertrend.upperBand;
    else if (
      this.state.lastSupertrend.supertrend == this.state.lastSupertrend.upperBand &&
      candle.close >= this.state.supertrend.upperBand
    )
      this.state.supertrend.supertrend = this.state.supertrend.lowerBand;
    else if (
      this.state.lastSupertrend.supertrend == this.state.lastSupertrend.lowerBand &&
      candle.close >= this.state.supertrend.lowerBand
    )
      this.state.supertrend.supertrend = this.state.supertrend.lowerBand;
    else if (
      this.state.lastSupertrend.supertrend == this.state.lastSupertrend.lowerBand &&
      candle.close <= this.state.supertrend.lowerBand
    )
      this.state.supertrend.supertrend = this.state.supertrend.upperBand;
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

    return ({ 
        signal: signal,
        close: candle.close,
        supertrend: this.state.supertrend.supertrend,
    }); ;
  }

}
