class Bot {


    process(candle, slice) {
        
        let candles = slice[0].candles; // 4h

        let last = candles[candles.length-1];
        let prev = candles[candles.length-2];

        if (!last || !prev) {
            process.exit(1);
            this.plot("ATR", 0);
            this.plot("diff",0);
            return;
        }

        let atrs = ATR.calculate({
            high: candles.map(p => p.high),
            low: candles.map(p => p.low),
            close: candles.map(p => p.close),
            period: 14
        });
        let atr0 = atrs.pop();

        this.plot("ATR", atr0);
        this.plot("diff", (last.close - atr0 ));

        let change = last.close - prev.close;
        let f = 0.5;
        let buy = change < 0 && Math.abs(change) > (f *atr0);        
        
        if (buy) {
            let info = "atr: "+atr0.toFixed(2)+" change: "+change.toFixed(2);
             this.signal({
                 signal:'BUY',
                 info: info,
             })
        } 
        
        let lastPos = this.positions.pop();
        let pullback = prev.close > last.close;
        let sell = lastPos && lastPos.status === 'OPEN' && 
                    (lastPos.pnlPerc > 2.0 || (pullback && Math.abs(lastPos.pnlPerc) > 2.0));
        
        if (sell) {
            let info = "pnlPerc: "+lastPos.pnlPerc.toFixed(2);
            this.signal({
                signal: 'SELL',
                info: info,
            })
        }
    }

}