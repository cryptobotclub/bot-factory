import React from 'react'
import Switch from 'react-switch'
import {Alert} from "react-bootstrap"
import { Card, CardBody, CardTitle } from 'reactstrap';

class NewPositionSettings extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
          
            strategyId: '',
            value: '',
            stopLoss: '',
            takeProfit: '',
            trailingStop: false,

            currency: '',
            counterCurrency: '',
            selectedPositionStrategyName: '',
        
        }
    }

    componentWillMount() {

        let currency = this.props.currency;
        let counterCurrency = this.props.counterCurrency;
        this.setState({
            currency: currency,
            counterCurrency: counterCurrency,
        })

        let strategyId = this.props.strategyId;
        let value = this.props.value ? this.props.value : '';

        let stopLoss = this.props.stopLoss ? this.props.stopLoss : '';
        let takeProfit = this.props.takeProfit ? this.props.takeProfit : '';
        let trailingStop = this.props.trailingStop !== undefined ? this.props.trailingStop : false;
            
        this.updatePositionManagementState(strategyId, value, stopLoss, takeProfit, trailingStop);
   
    }

    componentDidUpdate(prevProps) {

        if (prevProps.strategyId !== this.state.strategyId) {
            this.updatePositionStrategyPlaceholder(this.state.strategyId, this.state.currency, this.state.counterCurrency);
        }
    }
    
    componentWillReceiveProps(newProps) {       
        
        let currency = newProps.currency;
        let counterCurrency = newProps.counterCurrency;
       
        if (currency && counterCurrency) {
            this.updatePositionStrategyPlaceholder(this.state.strategyId, currency, counterCurrency);
        }
        this.setState({
            currency: currency,
            counterCurrency: counterCurrency,
        })
    }

  
    handlePositionStrategyChange = (event) => {

        let selectedOption =  event.target.options[event.target.options.selectedIndex];
        let strategyId = selectedOption.value;

        // reset size, stop and profit values when the strategy changes
        let positionValue = '';
        let positionStopLossValue = '';
        let positionTakeProfitValue = '';
        let trailingStop = false;

        this.updatePositionManagementState(strategyId, positionValue, positionStopLossValue, positionTakeProfitValue, trailingStop);
    }


    handlePositionValueChange = (event) => {

        let value = event.target.value;
        this.setState({
            value: value,
        })

        console.log("handlePositionValueChange - value: ", value);

        let strategyId = this.state.strategyId;
        let positionValue = value;
        let positionStopLossValue = this.state.stopLoss;
        let positionTakeProfitValue = this.state.takeProfit;
        let trailingStop = this.state.trailingStop;

        this.updatePositionManagementState(strategyId, positionValue, positionStopLossValue, positionTakeProfitValue, trailingStop); 
    }


    handleStopAmountChange = (event) => {

        let value =  event.target.value;        
        console.log("handleStopAmountChange() value: '"+value+"'");
     
        let strategyId = this.state.strategyId;
        let positionValue = this.state.value;
        let positionStopLossValue = value;
        let positionTakeProfitValue = this.state.takeProfit;
        let trailingStop = this.state.trailingStop;

        this.updatePositionManagementState(strategyId, positionValue, positionStopLossValue, positionTakeProfitValue, trailingStop);
       
    }


    handleProfitAmountChange = (event) => {

        let value =  event.target.value;
        // this.setState({
        //     takeProfit: value,
        // })
  
        let strategyId = this.state.strategyId
        let positionValue = this.state.value;
        let positionStopLossValue = this.state.stopLoss;
        let positionTakeProfitValue = value;
        let trailingStop = this.state.trailingStop;

        this.updatePositionManagementState(strategyId, positionValue, positionStopLossValue, positionTakeProfitValue, trailingStop);
    
    }


    handleTrailingStopChange = (checked) => {

        let trailingStop = this.state.stopLoss && checked;
        this.setState({
            trailingStopEnabled: trailingStop,
        })

        let strategyId = this.state.strategyId
        let positionValue = this.state.value;
        let positionStopLossValue = this.state.stopLoss;
        let positionTakeProfitValue = this.state.takeProfit;

        this.updatePositionManagementState(strategyId, positionValue, positionStopLossValue, positionTakeProfitValue, trailingStop);

    }
   
   

    // Helpers

    updatePositionStrategyPlaceholder = (strategyId, currency, counterCurrency) => {

        if (strategyId === 'RISK')  {
            this.setState({
                positionStrategyValuePlaceHolder: counterCurrency,
            })
        } else if (strategyId === 'BALANCE' ) {
            this.setState({
                positionStrategyValuePlaceHolder: "%",
            })
        } else if (strategyId === 'FIXED' ) {
            this.setState({
                positionStrategyValuePlaceHolder: currency,
            })
        } 
    }





    nameForStrategyType = (strategyId) => {
        var name = '-'
        switch (strategyId) {
            case 'RISK' :
            name = 'Risk & Stop Level'
                break;
            case 'FIXED' :
            name = 'Fixed Size'
                break;
            case 'BALANCE' :
            name = 'Balance Percentage'
                 break;
        }
        console.log(strategyId, " => ", name);
        return name;
    }


    updatePositionManagementState = (strategyId, amount, stop, profit, trailing) => {

        // console.log("updatePositionManagementState strategyId: ", strategyId, "positionValue: ", positionValue, 
        //             "stopValue: ", stopValue, "profitValue: ", profitValue, "trailingStop: ", trailing);
    
        let strategyName = this.nameForStrategyType(strategyId);
        let valid = this.isValid(strategyId, amount, stop, profit, trailing)

        let state = {
            valid: valid,
            strategyId: strategyId,
            value: amount,
            stopLoss: stop,
            takeProfit: profit,
            trailingStop: trailing,

            selectedPositionStrategyName: strategyName,
        };
        this.setState(state);
        this.props.onChange(state);
    }



    isValid = (strategyId, amountValue, stopValue, profitValue, trailing) => {
        
        let amount = amountValue !== '' ? parseFloat(amountValue) : undefined;
        let stop =  stopValue !== undefined && stopValue !== '' ? parseFloat(stopValue): undefined;
        let profit = profitValue !== undefined && profitValue !== '' ? parseFloat(profitValue) : undefined;

        var valid = true;
        let error = undefined;

        if ( stop !== undefined && (stop <= 0 || stop >= 100 ))  {  
            // if present, profit % is greater than 100%
            // requires a stop % between 0% and 100% 
            valid = false; 
            error = "Invalid stop value";
        }

        if ( profit !== undefined && profit <= 100 )  {  
            // if present, profit % is greater than 100%
            // requires a stop % between 0% and 100% 
            valid = false; 
            error = "Invalid take profit value";
        }

        if ((strategyId === 'FIXED' || strategyId === 'RISK') && (amount === undefined || amount <= 0))  {
            valid = false;                       // requires a positive amount 
            error = 'Invalid size'
        } 

        if (strategyId === 'RISK' && (amount === undefined || stop === undefined)) {
            valid = false;                              
            error = 'Missing risk amount and stop levels'
        } 

        if (strategyId === 'BALANCE' &&  (amount === undefined || amount <= 0 || amount >= 100))  {
            // requires a balance % between 0% and 100%
            // if present, profit % is greater than 100%
            valid = false;  
            error = "Invalid balance percentage";
        } 

        if (!stop && trailing === true )  {
            valid = false;  
            error = "Missing stop value for trailing stop";
        }

        if (amount === undefined || isNaN(amount)) {
            valid = false;  
            error = "Invalid size";
        }
        if (stop !== undefined && isNaN(stop)) {
            valid = false;  
            error = "Invalid stop";
        }
        if (profit !== undefined && isNaN(profit)) {
            valid = false;  
            error = "Invalid take profit";
        }
        
        this.setState({
            error: error,
        })

        return valid;
    }


    render() {
        
        
        return (
            <Card className="mt-0 mb-0 h-350">
                <CardBody >
                <CardTitle >Trade Settings {this.state.error && <label>⚠️</label>} </CardTitle>
    
                    <div className="bot-config-position-selection">
                    <div>Strategy </div> <div>Amount</div>
                    <select 
                        name="position-strategy"
                        value={this.state.strategyId}
                        onChange={this.handlePositionStrategyChange}
                    >                                                          
                        <option value="FIXED" key="FIXED">Fixed Size</option>   
                        <option value="RISK" key="RISK">Risk &amp; Stop Level</option>  
                        <option value="BALANCE" key="BALANCE">Balance Percentage</option>             
                    </select>
                    
                    <div className="bot-config-position-amount">
                        <input className="bot-settings-input" type="text" placeholder="" autoComplete="off"
                            value={this.state.value} name="amount" onChange={this.handlePositionValueChange} />
                        <div>&nbsp;&nbsp;&nbsp;{this.state.positionStrategyValuePlaceHolder}</div> 
                    </div>

    
                    <div>Stop Loss (%) </div> <div>Take Profit (%)</div>

                    <input  className="bot-settings-input"  placeholder="[1 - 99]"  autoComplete="off"
                        value={this.state.stopLoss} name="stop" onChange={this.handleStopAmountChange} />
                    <input  className="bot-settings-input"  placeholder="> 100" autoComplete="off"
                        value={this.state.takeProfit} name="profit" onChange={this.handleProfitAmountChange} />
                
                    <div>Trailing Stop </div> <div></div>
                    <div> 
                        <Switch
                            onChange={this.handleTrailingStopChange}
                            checked={this.state.trailingStop}
                            id="bot-trailing-stop-switch"
                            checkedIcon={false}
                            uncheckedIcon={false}
                        />  
                    </div>   <div></div>
                                      
                </div>
                {this.state.error && <Alert variant="danger" >{this.state.error}</Alert>}                    
                </CardBody>
            </Card>
        );
   
    }

};

export default NewPositionSettings;