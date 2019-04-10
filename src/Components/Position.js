import React from 'react'

class Position extends React.Component {

    constructor(props) {
        super(props);
    }

    componentWillMount() {
        this.setState({            
            ...this.props,
            toPositionDetails:false
        })
    }

    componentWillReceiveProps(newProps) {    
        this.setState({            
            ...newProps,
        })
    }

    toPositionDetails = (event) => {
       if (this.state.navigationEnabled) {
           this.setState({toPositionDetails:true})
       }
    }


    render() {

        let openDate = this.state.openDate;
        let closedDate = this.state.closedDate;

        let symbol = this.state.symbol;
        let side = this.state.side === 'BUY' ? 'BUY' : 
                    this.state.side === 'SELL' ? 'SELL' : 'n/a';
     
        let size = this.state.size;        
        let baseCurrency = this.state.baseCurrency;
        let counterCurrency = this.state.counterCurrency;
        let price = this.state.entryPrice;
        let last = this.state.lastPrice.toFixed(2);
       
        let pnl = this.state.pnl && this.state.pnl.toFixed(2);  // this.state.pnl; 
        let pnlPerc = this.state.pnlPerc.toFixed(2) + ' %';

        let status = this.state.stopped && this.state.stopped === true ? 'STOPPED' : this.state.status;
        let pnlStyle = (this.state.pnl >= 0) ? "green" : (this.state.pnl < 0) ? "red": undefined;
        let fees = this.state.fees !== undefined ? this.state.fees : 'n/a'

        return (
        <tr>
            <td className="text-center">{openDate.toLocaleDateString()} {openDate.toLocaleTimeString()}</td>
            {status !== 'OPEN' ? <td className="text-center">{closedDate && closedDate.toLocaleDateString()}  {closedDate && closedDate.toLocaleTimeString()} </td> : '' }
            <td className="text-center">{side}</td>
            <td className="text-right">{size} {baseCurrency} </td>
            <td className="text-right"> {price} {counterCurrency} </td>
            <td className="text-right"> {last} {counterCurrency} </td>
            <td className="text-center"> {status} </td>
            <td className={`text-right ${pnlStyle}`}> {pnl} {counterCurrency} </td>
            <td className={`text-right ${pnlStyle}`}> {pnlPerc} </td>
            <td className="text-center"> {fees} </td>
        </tr>);
    }


};

export default Position;