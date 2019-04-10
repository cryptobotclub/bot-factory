class Bot {


    process(candle) {
 
        let highs = this.state.candles.map(p => p.high);
        let lows = this.state.candles.map(p => p.low);
        let closes = this.state.candles.map(p => p.close);
        let volumes = this.state.candles.map(p => p.volume);

        let input = {
            highs:highs,
            lows:lows,
            closes:closes,
            volumes:volumes,
        }

        let signal = this.stochSingal(input);
        let info = signal.k0 &&  signal.d0 ?  "k0: "+ signal.k0.toFixed(2) + ", d0: "+signal.d0.toFixed(2)  : "";
        let buy = signal.signal >= 1;
        let sell = signal.signal <= -1;

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


    stochSingal(input) {
        
        let period = 14;
        let signalPeriod = 3;

        let stoch = Stochastic.calculate({
            high: input.highs,
            low: input.lows,
            close: input.closes,
            period: period,
            signalPeriod: signalPeriod
        })

        if (!stoch)  {
            this.plot("stoch", 0, 0, 20, 80);
            return {
                signal:0,
            };
        }
        
        let lastStoch = stoch[stoch.length - 1];
        let prevStoch = stoch[stoch.length - 2];

        if (!lastStoch || !prevStoch) {
            this.plot("stoch", 0, 0, 20, 80);
            return {
                signal:0,
            };
        }

        let k0 = lastStoch.k;
        let d0 = lastStoch.d;
        let k1 = prevStoch.k;
        let d1 = prevStoch.d;

        this.plot("stoch", k0, d0, 20, 80);

        let oversold = 20;
        let crossedAbove = k0 > d0 && (k0 - d0 > 1.0) ;
        //let buy = k0 < oversold; 
        //let buy = crossedAbove && (k0 > oversold) && (d0 <= oversold)
        let buy = crossedAbove && (k0 < oversold || d0 < oversold );
        
        let overbought = 80;
        let crossedBelow = k0 < d0 && (d0 - k0 > 1.0) ;
        //let sell = k0 > overbought; // 
        //let sell = crossedBelow && (k0 < overbought) && (d0 >= overbought)
        let sell = crossedBelow && (k0 > overbought || d0 > overbought );

   
        let signal = buy ? 1 : 
                     sell ? -1 : 0;

        // let v1 = k0? k0.toFixed(2) : '';
        // let v2 = d0 ? d0.toFixed(2) : '';
        // this.log("k0: "+ v1 +", d0: "+ v2);   

        return {
            signal:signal,
            k0:k0,
            d0:d0,
        };
    }


}