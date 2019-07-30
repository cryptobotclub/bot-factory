import React from 'react'
import Chart from "react-google-charts";


class BotPositionsChart extends React.Component {

    constructor(props) {
        super(props);
   }

    componentWillMount() {
        this.setState({
            chartData: {}
        });
        this.makeChart(this.props.interval, this.props.candles, this.props.positions, this.props.annotations);
    }

    componentWillReceiveProps(newProps) {     
        this.makeChart(newProps.interval, newProps.candles, newProps.positions, newProps.annotations);
    }

    makeChart = (interval, candles, positions, annotations) => {

        if (!positions || positions.length == 0 ) {
            console.log("!! no positions");
        } 

        let secsInInterval = this.secsForInterval(interval);
        let positionsMap = this.makePositionMap(positions, secsInInterval)
        let chartData = this.makePriceChartData(interval, candles, positionsMap, annotations);
        this.setState({
            chartData: chartData
        });

    }


    makePositionMap(positions, secsInInterval) {

        let positionMap = {};
    
        positions.forEach( position => {
            
            //console.log("makePositionMap - ", secsInInterval, position);

            let createdDate = position.openDate;
            if (createdDate) {
                let createdCandleDate = new Date( Math.floor(createdDate.getTime() / secsInInterval / 1000) * secsInInterval * 1000);
                let pos1s = positionMap[createdCandleDate.toISOString()];
                if (!pos1s) pos1s = [];
                pos1s.push(position)
                positionMap[createdCandleDate.toISOString()] = pos1s;
            }
   
            let closedDate = position.closedDate ?  position.closedDate : position.lastUpdatedDate;
            if (closedDate) {
                let lastCandleDate =  new Date( Math.floor(closedDate.getTime()  / secsInInterval / 1000) * secsInInterval * 1000);                
                let pos2s = positionMap[lastCandleDate.toISOString()] 
                if (!pos2s) pos2s = [];                
                let included = pos2s.filter(p => (p.transactionId === position.transactionId));   
                         
                if (included.length == 0) {   
                   pos2s.push(position)
                }
                positionMap[lastCandleDate.toISOString()] = pos2s; 
            }      

        })
        return positionMap;
    }
      
    // P&L Chart helpers
    makePriceChartData = (interval, candles, positionsMap, annotations) => {

      // make price chart
      let prices = [];
      let dates = [];
      candles.forEach(candle => {
          prices.push(candle.close);
          dates.push(candle.closeDate);
      });

        var data = [
        [
            "Date",
            "Price",
            { role: "style", type: "string" },
            { role: "annotation", type: "string" },
            { role: "annotationText", type: "string" }
        ]
        ];

   
        let secsInInterval = this.secsForInterval(interval);
        
        for (var i = 0; i < dates.length; i++) {

            // candle close date and price
            let date = dates[i];
            let close = prices[i];

            let annotation = null;
            let style = null;
            let annotationText = null;
            //let pnlAnnotationText = null;

            let positions = positionsMap[date.toISOString()];
     
            //let signalsInfo = positionMap[date.toISOString()];
            let annotationInfo = this.makeAnnotationInfo(date, positions, secsInInterval, annotations);

      
            if (annotationInfo) {
                annotation = annotationInfo.annotation;
                annotationText = annotationInfo.annotationText;
                style = annotationInfo.style;
            }
    
            let row = [date, close, style, annotation, annotationText];
            data.push(row);
        }
        return data;
    }

    roundDate = (date) => {

        // add 1 second to round up close date
        let roundedDate = new Date(date.getTime());
        roundedDate.setSeconds(roundedDate.getSeconds() + 1);
        return roundedDate;
    }

    sameCandleDate = (positionDate, candleDate, candleIntervalSecs) => {
        let poistionCandleDate =  new Date( Math.floor(positionDate.getTime()  / candleIntervalSecs / 1000) * candleIntervalSecs * 1000);        
        let sameCandle = candleDate.getTime() === poistionCandleDate.getTime();
        return sameCandle;
    }

    secsForInterval = (interval) => {

       
        let secs = 0;
        
        switch(interval) {
            case "1m":
            secs =  60;
            break;      
            case "5m":
            secs = 5 * 60;
            break;
            case "10m":
            secs = 10 * 60;
            break;
            case "15m":
            secs = 15 * 60;
            break;
            case "30m":
            secs = 30 * 60;
            break;
            case "1h":
            secs = 60 * 60;
            break;
            case "2h":
            secs = 2 * 60 * 60;
            break;
            case "3h":
            secs = 3 * 60 * 60;
            break;          
            case "4h":
            secs = 4 * 60 * 60;
            break;
            case "6h":
            secs = 6 * 60 * 60;
            break;
            case "1d":
            secs = 24 * 60 * 60;
            break;
            default:
            secs = 0;
        }

        return secs;
    }


    makeAnnotationInfo = (date, positions, secsInInterval, annotations)  => {

        let logInfo = annotations[date.toISOString()];
        let infoSymbol = logInfo && logInfo.info.length > 0 ? "ⓘ" : undefined;
        let logText = logInfo && logInfo.info.length > 0 ?  logInfo.info : undefined;
        let dateFormatted = logInfo ? this.formatDate(logInfo.date) : undefined;
    
        var annotation;
        var annotationText;
        var style;
    
        if (positions) {
           annotation = "";
           annotationText = "";
           style = "";
        }
   
        
        var count = 0;
        positions && positions.forEach(position => {
        
            let openPosition = this.sameCandleDate(position.openDate, date, secsInInterval);   
 
            let closedDate = position.closedDate ? position.closedDate : position.lastUpdatedDate;     // date.toISOString() === position.createdOn;
            let closedPosition = position.closedDate && this.sameCandleDate(closedDate, date, secsInInterval); // date.toISOString() === position.lastUpdated;
            let stopped = closedPosition && position.stopped === true;  
    
            style =  openPosition ? "point { color: #000000; fill-color: #0000FF }" :              
                     closedPosition && position.pnl >= 0 ? "point { color: #000000; fill-color: #00FF00 }" :
                     closedPosition && position.pnl < 0 ? "point { color: #000000; fill-color: #FF0000 }" :
                     null;
            
            let openSymbol = openPosition && position.side === 'BUY' ? "▲" :
                             openPosition &&  position.side === 'SELL' ? "▼" :'n/a'
    
            let closeSymbol = closedPosition &&  position.side === 'BUY' ? "▼" :
                              closedPosition &&  position.side === 'SELL' ? "▲" : 'n/a'
      
            dateFormatted = openPosition && closedPosition ?  this.formatDate(date) :
                            openPosition ? this.formatDate(position.openDate)  : 
                            closedPosition ? this.formatDate(closedDate) : 'n/a';

            // add annotation for open position and close position
            annotation += openPosition ? openSymbol : '';
            annotation += closedPosition && stopped ? "■" : closedPosition ? closeSymbol : '';
    
            let pnlInfo = closedPosition  && position.pnlPerc ? ", pnl: " + position.pnl.toFixed(2) + " ("+position.pnlPerc.toFixed(2) + '%)' : '' ;
            
            let infoOpen = openPosition && position.info ? ' info: ' + position.info : ''
            let infoClose = closedPosition && position.infoClose ? ' info: ' + position.infoClose : ''

            let events = "";
            events += openPosition ? position.side+" @ "+position.entryPrice.toFixed(2) + infoOpen : '';

            events += closedPosition && stopped ? " Stopped @ "+position.lastPrice.toFixed(2)  :
                      closedPosition ? " Closed @ "+position.lastPrice.toFixed(2) + infoClose:'';
    
            // concatenate annotations from multiple positions on the same candle
            annotationText = count > 0 ? annotationText + " | " : annotationText;
            annotationText += (events + " " + pnlInfo);

            count++;
        })
    
        annotation = annotation ? annotation : infoSymbol;
        annotationText = annotationText ? annotationText : dateFormatted + " " +  logText;
        
    
        return ({
          annotation:annotation,
          annotationText:annotationText,
          style:style,
        })
    
    }

    formatDate = (date) => {

        // var dformat = [date.getDate(), date.getMonth()+1, date.getFullYear()].join('/')+' '+
        //                 [date.getHours() < 10 ?  "0" + date.getHours() : date.getHours(), 
        //                 date.getMinutes() < 10 ?  "0" + date.getMinutes() : date.getMinutes(), 
        //                 date.getSeconds() < 10 ? "0" + date.getSeconds(): date.getSeconds()].join(':');
        var dformat = [date.getHours() < 10 ?  "0" + date.getHours() : date.getHours(), 
                      date.getMinutes() < 10 ?  "0" + date.getMinutes() : date.getMinutes(), 
                      date.getSeconds() < 10 ? "0" + date.getSeconds(): date.getSeconds()].join(':');
         return dformat;
    }


    render() {
           
        // if ( !this.state.chartData ) {
        //     return <div />
        // }
        
        return (
            <div className="mainchart">
            <Chart
                width={'100%'}
                height={'600px'}
                chartType="LineChart"
                loader={<div>Loading Chart</div>}
                data={this.state.chartData}
                options={{
                    // Use the same chart area width as the control for axis alignment.
                    chartArea: { height: "80%", width: "100%" },
                    hAxis: { slantedText: false },
                    legend: { position: "top" },
                    explorer: { 
                      actions: ['dragToZoom', 'rightClickToReset'],
                      axis: 'horizontal',
                      keepInBounds: true,
                      maxZoomIn: 10.0
                    },
                    colors: ["#4682B4"],
                    format: "short",
                    annotations: {
                      textStyle: {
                        fontSize: 24
                      },
                      alwaysOutside: true
                    }
                }}

                rootProps={{ 'data-testid': '3' }}
                chartPackages={['corechart', 'controls']}
                
            /> 
            </div>
        );
    }

};

export default BotPositionsChart;