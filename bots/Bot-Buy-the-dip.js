class Bot {


    process(candle, slice) {
        
        let candles = slice[0].candles; // 4h
        
        let last = candles.pop();
        let prev = candles.pop();
       
        if (!last || !prev) {
            return;
        }
   
        let gain =  (last.close - prev.close) / prev.close * 100.0;
        let lastPos = this.positions.pop();
        let haveOpenPos = lastPos && lastPos.status === 'OPEN';
            
        if (gain < -1.0) {
             console.log("BUY gain: ", gain, lastPos);
             this.signal({
                 signal:'BUY',
                 info: 'price change: '+gain.toFixed(2)+'%',
             })
             
        } 
        
        if (haveOpenPos && gain > 3.0) {
            console.log("SELL gain: ", gain, lastPos);
            this.signal({
                signal: 'SELL',
                info: 'price change: ' + gain.toFixed(2) + '%',
            })
        }
        
    }

}