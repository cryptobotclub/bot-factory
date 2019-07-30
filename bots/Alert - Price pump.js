class Bot {


    process(candle, slice) {
        
        // sends and alert if price moves up by 2.00% in the last 2 candles
        let targetGain = 2.0;
        
        let candles = slice[0].candles;

        let last = candles[candles.length-1];
        let prev = candles[candles.length-2];
       
        if (!last || !prev) {
            console.log("process candle: ",  this.state.candles.length);
            return;
        }
           
        let gain =  (candle.close - prev.close) / prev.close * 100.0;
        if (gain > targetGain) {
             this.alert("price moved "+gain.toFixed(2) +" %");
        }
        
    }

}