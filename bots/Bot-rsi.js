class Bot {


    process(candle) {
        
        let closes = this.state.candles.map(p => p.close);
        
        // calculate rsi for all prices  
        let response = RSI.calculate({
            period: 5,
            values: closes,
        });

        let rsi = response[response.length-1];
        let buy = rsi < 30;
        let sell = rsi > 70;

        if (buy) {
            
            signal({
                signal: 'BUY',
                info: 'rsi: '+rsi,
                risk: 5,
                stop: candle.close * 0.99,
            })
        }

        if (sell) {
            signal({
                signal:'SELL',
                info: 'rsi: '+rsi,
                risk: 5,
                stop: candle.close * 1.01,
            })
        }


        this.plot("rsi", rsi, 30, 70);

    }

    shouldBuy(rsi) {          
        let response = rsi <= 30;
        return response;
    }

    shouldSell(rsi) {
        let response = rsi >= 70;
        return response;
    }


}