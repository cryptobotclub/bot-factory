
class Bot {

    constructor() {
        this.datafeeds = [
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "6h",
                rollingWindowSize: 52,
            },
            {
                exchange: "BINANCE",
                symbol: "BTCUSDT",
                interval: "1d",
                rollingWindowSize: 100,
            }         

        ]
    }


    process(last, slice) {
        
        let candles0 = slice[0].candles; // 1h
        let candles1 = slice[1].candles; // 4h
        let candles2 = slice[2].candles; // 1h  

        if (candles0.length < 52 || candles1.length < 52 || candles2.length < 52) {
            plot("trend", 0)
            return;
        }

        let up = this.uptrend(candles2);
        let down = this.downtrend(candles2);

        plot("trend", up ? 1 : down ? -1 : 0);

        let input0 = {
            high: candles0.map(p => p.high),
            low: candles0.map(p => p.low),
            close: candles0.map(p => p.close),
        }

        let input1 = {
            high: candles1.map(p => p.high),
            low: candles1.map(p => p.low),
            close: candles1.map(p => p.close),
        }
    
        let signal1 = this.ichimokuCloudSingal(input1); 
        let buy = signal1 > 0;
        let sell = signal1 < 0;
 
        
        // let lowVolatility = this.lowVolatilityBB(candles2)

        if (up === false && down === false) {
            buy = signal1 < 0;
            sell = signal1 > 0;
        }

        if (buy) {
            this.signal({
                signal: 'BUY',
                info: (up ? "uptrend " : down? "downtrend" : "sideways"),
            })
        }
 
        if (sell) {       
            this.signal({
                signal: 'SELL',
                info:  (up ? "uptrend " : down? "downtrend" : "sideways"),
            })
        }
    }


    uptrend(candles) {

        let close = candles.map(p => p.close);

        let close0 = close[close.length-1];

        let sma9 = SMA.calculate({period : 9, values : close});
        let sma21 = SMA.calculate({period : 21, values : close});
        let sma50 = SMA.calculate({period : 50, values : close});

        let lastsma9 = sma9[sma9.length-1];
        let lastsma21 = sma21[sma21.length-1];
        let lastsma50 = sma50[sma50.length-1];

        let up = (close0 > lastsma9) && (lastsma9 > lastsma21) && (lastsma21 > lastsma50);

        console.log("close0", close0, "lastsma9: ", lastsma9);
        return up;
    }

    downtrend(candles) {

        let close = candles.map(p => p.close);

        let close0 = close[close.length-1];

        let sma9 = SMA.calculate({period : 9, values : close});
        let sma21 = SMA.calculate({period : 21, values : close});
        let sma50 = SMA.calculate({period : 50, values : close});

        let lastsma9 = sma9[sma9.length-1];
        let lastsma21 = sma21[sma21.length-1];
        let lastsma50 = sma50[sma50.length-1];

        let down = (close0 < lastsma9) && (lastsma9 < lastsma21) && (lastsma21 < lastsma50);
        return down;
    }


    lowVolatilityBB(candles) {

        let close = candles.map(p => p.close)

        let last = candles[candles.length-1];

        let close0 = candles[candles.length-1].close;
        // let close1 = candles[candles.length-2].close;
        // let close2 = candles[candles.length-3].close;
        // let close3 = candles[candles.length-4].close;

        let data = BollingerBands.calculate({
            period : 14, 
            values: close,
            stdDev : 2,
        });

        let bb = data[data.length-1];
       
        let upper = data.map(p => p.upper)
        let lower = data.map(p => p.lower)

        let upperSma = SMA.calculate({period : 10, values : upper});
        let lowerSma = SMA.calculate({period : 10, values : lower});

        let closeSMA = SMA.calculate({period : 50, values : close});

        // let upper0 = upperSma[upperSma.length-1];
        // let lower0 = lowerSma[lowerSma.length-1]
        let closeSMA0 = closeSMA[closeSMA.length-1]

        //let v = (upper0 - lower0) / last * 100.0;
        let v = Math.abs( close0 - closeSMA0 ) / closeSMA0  * 100.0
        let vround = Math.round(v * 100) / 100;
        
        let highVol = v > 10.0;

        // plot("BB", close0, bb.upper, bb.lower);
    
        return (highVol == false);
    }


    ichimokuCloudSingal(input) {

        let last = input.close[input.close.length -1];
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
    
        let buy  = last > ic0.conversion && 
                   last > ic0.base  && 
                   last > ic0.spanA  && 
                   last > ic0.spanB;

        let sell  = last < ic0.base && 
                    last < ic0.spanA  && 
                    last < ic0.spanB;

        let signal = buy ? 1 : 
                     sell ? -1 : 0;

        return signal;
    }
}