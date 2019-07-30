class Bot {


    init() {
        return ({
            sent: false,
            price: undefined,
        })      
    }

    process(last) {
        
        // sends and alert if price moves up by 2.00% in the last 2 candles
        let targetPrice = 8000.00;
        
        this.setState({
            price: last.close,
        })

        if (last.close > targetPrice && this.state.sent === false) {
             this.alert("price hit "+targetPrice);
             this.setState({
                 sent: true,
             })
        }
        
    }

}