class Bot {


    process(candle) {
 
        let highs = this.state.candles.map(p => p.high);
        let lows = this.state.candles.map(p => p.low);
        let closes = this.state.candles.map(p => p.close);
        let volumes = this.state.candles.map(p => p.volume);
        
        let buy, sell = false;
   
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