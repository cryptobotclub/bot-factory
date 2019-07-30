import React from 'react'
import Chart from "react-google-charts";


class BotPnLChart extends React.Component {


    constructor(props) {
        super(props);
    }

    componentWillMount() {
        this.setState({
            chartData: {}
        });
        this.makeChart(this.props.interval, this.props.candles, this.props.positions);
    }

    componentWillReceiveProps(newProps) {         
        this.makeChart(newProps.interval, newProps.candles, newProps.positions);
    }


    makeChart = (interval, candles, positions) => {

        if (!positions || positions.length == 0 ) {
            console.log("BotPnLChart !! no positions");
        } 

        let secsInInterval = this.secsForInterval(interval);
        let positionsMap = this.makePositionMap(positions, secsInInterval)
        let chartData = this.makePnlChartData(candles, positionsMap, secsInInterval);
        this.setState({
            chartData: chartData
        });

    }



    makePnlChartData = (candles, positionsMap, secsInInterval) => {

        // candles.forEach(c => {
        //     console.log("candle: ", c.closeDate.toISOString() , c);
        // })

        let dates = [];
        candles.forEach(p => {
            dates.push(p.closeDate);
        });
   

        var data = [
            [
                "Date",
                "P&L",
                { role: "style", type: "string" },
                { role: "annotation", type: "string" },
                { role: "annotationText", type: "string" }
            ]
            ];

      
        var pnl = 0;
        
        for (var i = 0; i < dates.length; i++) {

            let date = dates[i];
            let annotation = null;
            let pnlAnnotationText = null;
            let style = null;

            let positions = positionsMap[date.toISOString()];
            var pcount = 0;
            positions && positions.forEach( position => {

                let openPosition = this.sameCandleDate(position.openDate, date, secsInInterval);   
    
                let closedDate = position.closedDate ? position.closedDate : position.lastUpdatedDate;     // date.toISOString() === position.createdOn;
                let closedPosition = position.closedDate && this.sameCandleDate(closedDate, date, secsInInterval); // date.toISOString() === position.lastUpdated;
                let stopped = closedPosition && position.stopped === true;  

                //console.log(date.toISOString(), "count: ", i, "pcount: ", pcount,  " pnl:", position.pnl, " position: ", position);
                
                if (closedPosition) {
                   let formattedDate = this.formatDate(closedDate);
                    annotation = "●"
                    pnl += position.pnl;
                    let pnlPerc = position.pnlPerc ? position.pnlPerc.toFixed(2) + '%' : '';
                    pnlAnnotationText = position.pnl ? formattedDate+" pnl: "+ position.pnl.toFixed(2)+", "+pnlPerc+" "  : "";
                    //console.log(date.toISOString(), "CLOSED", "count: ", i, "pcount: ", pcount, " pnl:", position.pnl, pnl, " position: ", position);
                }

                pcount++;

                if (closedPosition)  {
                    style = position.pnl >= 0 ? "point { color: #00FF00; fill-color: #00FF00 }" : 
                            position.pnl < 0 ? "point { color: #FF0000; fill-color: #FF0000 }" : null;
                }
            });
      
            let row = [date, pnl, style,  annotation, pnlAnnotationText];
            data.push(row);
           
        }
        return data;
    };


    formatDate = (date) => {

        // var dformat = [date.getDate(), date.getMonth()+1, date.getFullYear()].join('/')+' '+
        //               [date.getHours() < 10 ?  "0" + date.getHours() : date.getHours(), 
        //               date.getMinutes() < 10 ?  "0" + date.getMinutes() : date.getMinutes(), 
        //               date.getSeconds() < 10 ? "0" + date.getSeconds(): date.getSeconds()].join(':');
        var dformat = [date.getHours() < 10 ?  "0" + date.getHours() : date.getHours(), 
                      date.getMinutes() < 10 ?  "0" + date.getMinutes() : date.getMinutes(), 
                      date.getSeconds() < 10 ? "0" + date.getSeconds(): date.getSeconds()].join(':');
         return dformat;
    }

  
     makePositionMap(positions, secsInInterval) {

        let positionMap = {};
    
        positions.forEach( position => {

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

    sameCandleDate = (positionDate, candleDate, candleIntervalSecs) => {  
        let poistionCandleDate =  new Date( Math.floor(positionDate.getTime()  / candleIntervalSecs / 1000) * candleIntervalSecs * 1000);        
        let sameCandle = candleDate.getTime() === poistionCandleDate.getTime();
        return sameCandle;
    }

    render() {
           
        // if ( !this.state.chartData ) {
        //     return <div />
        // }

        return (

            <Chart
                width={'100%'}
                height={'300px'}
                chartType="LineChart"
                loader={<div>Loading PnL Chart</div>}
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
            />
        );
    }

};

export default BotPnLChart;