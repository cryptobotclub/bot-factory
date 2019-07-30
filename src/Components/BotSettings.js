import React from 'react'
import Switch from 'react-switch'
import { Card, CardBody, CardTitle } from 'reactstrap';
import Api from '../API/Api'
import {Alert} from "react-bootstrap"


class BotSettings extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            bots: [],
            botId: '',
            balanceAmount: '',
            exchangeFeesAmount: '',
            tradeSideLongOnly: false,
        }
    }

    componentWillMount() {

        let botId = this.props.botId;
        let balanceAmount = this.props.balanceAmount;
        let exchangeFeesAmount = this.props.exchangeFeesAmount;
        let tradeSideLongOnly = this.props.tradeSideLongOnly;
         
        new Api().fetchAllBots().then(bots => {
            
            let selectedBot = bots.files.filter( name => name === botId)
            //let detaultBot =  selectedBot ? selectedBot : bots.files[0];
           
            this.setState({   
                bots: bots.files,
            })
        });

        
        this.updateBotSettingsState(botId, balanceAmount, exchangeFeesAmount, tradeSideLongOnly);

    }


    // Event Handlers

    handleBotChange = (event) => {
            
        let selectedOption =  event.target.options[event.target.options.selectedIndex];

        let botId = selectedOption.value;
        let balanceAmount = this.state.balanceAmount;
        let exchangeFeesAmount = this.state.exchangeFeesAmount;
        let tradeSideLongOnly = this.state.tradeSideLongOnly;
        
        this.updateBotSettingsState(botId, balanceAmount, exchangeFeesAmount, tradeSideLongOnly);
   
    }


    handleBalanceAmountChange = (event) => {

        let value = event.target.value;
        console.log("handleBalanceAmountChange value: ", value);
        this.setState({
            balanceAmount: value,
        });
    
        let botId = this.state.botId;
        let exchangeFeesAmount = this.state.exchangeFeesAmount;
        let tradeSideLongOnly = this.state.tradeSideLongOnly;
        
        this.updateBotSettingsState(botId, value, exchangeFeesAmount, tradeSideLongOnly);
    }


    handleExchangeFeesChange = (event) => {

        let value = event.target.value;
        console.log("handleExchangeFeesChange value: ", value);
        this.setState({
            exchangeFeesAmount: value,
        });

        let botId = this.state.botId;
        let balanceAmount = this.state.balanceAmount;
        let tradeSideLongOnly = this.state.tradeSideLongOnly;
        
        this.updateBotSettingsState(botId, balanceAmount, value, tradeSideLongOnly);
    }

    handleTradeSideChange = (checked) => {

        console.log("handleTradeSideChange value: ", checked);
        this.setState({
            tradeSideLongOnly: checked,
        });

        let botId = this.state.botId;
        let balanceAmount = this.state.balanceAmount;
        let exchangeFeesAmount = this.state.exchangeFeesAmount;
        
        this.updateBotSettingsState(botId, balanceAmount, exchangeFeesAmount, checked);
    }


    isValid = (botId, balanceAmount, exchangeFeesAmount, tradeSideLongOnly) => {
        
        let balance = balanceAmount !== '' ? parseFloat(balanceAmount) : undefined;
        let fees =  exchangeFeesAmount !== undefined && exchangeFeesAmount !== '' ? parseFloat(exchangeFeesAmount): undefined;
    
        var valid = true;
        let error = undefined;

        if (botId === undefined || botId === '') {
            valid = false;  
            error = "Select a strategy";
        } else  if (balance === undefined || isNaN(balance) || balance <= 0) {
            valid = false;  
            error = "Invalid balance";
        } else if (fees === undefined || isNaN(fees) || fees < 0) {
            valid = false;  
            error = "Invalid fees";
        }

        this.setState({
            error: error,
        })

        return valid;
    }


    updateBotSettingsState = (botId, balanceAmount, exchangeFeesAmount, tradeSideLongOnly) => {

        let valid = this.isValid(botId, balanceAmount, exchangeFeesAmount, tradeSideLongOnly)

        let state = {
            valid: valid,
            botId: botId,
            balanceAmount: balanceAmount,
            exchangeFeesAmount: exchangeFeesAmount,
            tradeSideLongOnly: tradeSideLongOnly,
        }

        this.setState(state)
        this.props.onChange(state);
    }

    render() {
        
        let userBotOptions = null;
        if (this.state.bots) {
            userBotOptions = this.state.bots.map(bot => {               
                return ( 
                    <option id={bot} value={bot} key={bot} >{bot}</option>
                )
            });
        }
     
     
        return ( 
       
            <Card className="mt-0 mb-0 h-350">
                <CardBody >
                <CardTitle >Bot Settings {this.state.error && <label>⚠️</label>} </CardTitle>
  
                    <div className="bot-strategy-select"> 

                        <div className="text-right">Strategy</div>             
                        <select 
                            name="bot"
                            value={this.state.botId ? this.state.botId : ''}
                            onChange={this.handleBotChange}
                            >

                            {userBotOptions && <option value="" key="user-bots"> &lt; Select strategy &gt; </option> }
                            {userBotOptions} 

                        </select>

                        <div className="text-right">Initial Balance {this.state.counterCurrency ? this.state.counterCurrency  : 'USDT'}</div> 
                        <input  className="bot-settings-input"  placeholder="" value={this.state.balanceAmount}
                            name="balanceAmount" onChange={this.handleBalanceAmountChange} />

                        <div className="text-right">Avg. Exchange Fees (%)</div> 
                        
                        <input className="bot-settings-input" placeholder="%" value={this.state.exchangeFeesAmount}
                                name="exchangeFees" onChange={this.handleExchangeFeesChange} />

                        <div  className="text-right">Long Trades Only</div> 
                            <Switch
                                onChange={this.handleTradeSideChange}
                                checked={this.state.tradeSideLongOnly ? this.state.tradeSideLongOnly  : false }
                                id="bot-trade-side-switch"
                                checkedIcon={false}
                                uncheckedIcon={false}
                            />
                    </div> 
                    {this.state.error && <Alert variant="danger" >{this.state.error}</Alert>}
            </CardBody>
        </Card>
    )}
}

export default BotSettings;