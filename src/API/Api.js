
const defaultAPI = process.env.REACT_APP_API_SERVER || "http://localhost:3030";
const fetch = require("node-fetch");

class Api {

    constructor(apiUrl) {        
        this.apiUrl = apiUrl || defaultAPI;
    }

    async fetchAllTickers() {
      return new Promise((resolve) => {
        this.get("ticker/all", null, false).then((response) => {
          resolve(response);
        });
      });
    }
   
    async fetchCandles(ticker, from, to, interval) {
        //  GET  /ticker/BTCUSDT/candles?interval=1d&from=2018-02-01T00:00:00.000Z&to=2019-02-01T00:00:00.000Z
        let params = {
            interval: interval,
            from: from,
            to:to
        }
        
        return new Promise((resolve) => {
            this.get("ticker/"+ticker+"/candles", params).then((response) => {
              resolve(response);
            });
        });
    }

    async fetchCandlesForTicker(exchange, ticker, from, to, interval) {
        //  GET /price/bitstamp/BTCUSD/candles?from=2014-01-01T00:00:00.000Z&to=2014-01-31T23:59:59.000Z&interval=15h
        let params = {
            interval: interval,
            from: from,
            to:to
        }
        console.log("fetchCandlesForTicker params: ", params);
        return new Promise((resolve) => {
            this.get("price/"+exchange+"/"+ticker+"/candles", params).then((response) => {
              resolve(response);
            });
        });
    }


    async fetchAllBots() {

      return new Promise((resolve, reject) => {
        this.get("allbots").then(data => {              
              let files = data.response;
              resolve ({
                files: files,                
              });
          }).catch (error => {
              reject(error)
          });
      });
    }

    
    async submitExecution(botSettings, datafeedSettings, positionSettings) {

      let data = {
        botSettings,
        datafeedSettings,
        positionSettings,
      }
      
      console.log("submitExecution() ", data);

      return new Promise((resolve, reject) => {
        this.post("exec", data).then(response => {
              
              if (response.status === 'ERROR') {
                  resolve ({
                     error: response.error,
                  });
                  console.log("submitExecution() returned error: ", response.error );
                  return;
              }
              
              console.log("submitExecution() response: ", response);
              let { candles, charts, positions, stats, annotations, symbol, interval} = response.response;
             
              positions = this.parsePositions(positions);
              candles = this.parseCandles(candles);
              charts = this.parseCharts(charts);
              stats = stats;
              symbol = symbol;
              interval = interval;
              annotations = annotations;
             
              resolve ({
                  candles: candles,
                  charts: charts,
                  positions: positions,
                  stats: stats,
                  annotations: annotations,
                  interval: interval,
                  symbol: symbol,
              });

          }).catch (error => {
              reject(error)
          });
      });
  }



    parseCharts(chartsData) {

        let charts = {};
        let chartNames = Object.keys(chartsData);
    
        chartNames.forEach(name => {
    
          let chartData = chartsData[name];
    
          var chartValues = chartData.map(p => {
          
            let date = new Date(Date.parse(p.date));
           
            return {
              date: date,
              values: p.values,
            }
          });
    
          charts[name] = chartValues;
        })
        
        return charts;
      }
    
      
      parsePosition(p) {

        let openDate = new Date(Date.parse(p.openDate));
        let closedDate = new Date(Date.parse(p.closedDate));
        
        return {
          transactionId: p.transactionId,
          side:p.side,
          status: p.status,
          size: p.size,
          openDate: openDate,
          closedDate: closedDate,
          entryPrice: p.entryPrice,
          lastPrice: p.lastPrice,
          stopPrice: p.stopPrice,
          exitPrice: p.exitPrice,
          pnl: p.pnl,
          pnlPerc: p.pnlPerc,
          stopped : p.stopped,
          exited : p.exited,
          info: p.info,
          fees: p.fees,
        };
      }

      parsePositions(positionsJson) {
        var positions = positionsJson && positionsJson.map(p => {          
          return this.parsePosition(p);
        });
        return positions;
      }
    
      parseCandles (candleJson) {
    
        var candles = candleJson.map(p => {

          //console.log("parseCandles ===>: ", p, p.openDate , Date.parse(p.openDate));

          let openDate = new Date(Date.parse(p.openDate));
          let closeDate = new Date(Date.parse(p.closeDate));
          let open = parseFloat(p.open);
          let high = parseFloat(p.high);
          let low = parseFloat(p.low);
          let close = parseFloat(p.close);
          let volume = parseFloat(p.volume);
    
          return {
            openDate: openDate,
            closeDate: closeDate,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume
          };
        });
    
        return candles;
      }

    get(resource, params) {
    
        const query = params ? `?${this.parseQueryParams(params)}` : '';

        return new Promise((resolve, reject) => { 
            
            let url = `${this.apiUrl}/${resource}${query}`  
            console.log("GET ", url);
                      
            fetch(url, {
                mode: "cors",
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then((response) => {                       
                if(response.ok) {
                    response.json().then(json => {
                        //console.log("json: ", json);
                        resolve(json)
                    }).catch (error => {
                        reject(error)
                    });
                }
                else {
                    console.log("response.status: ", response.status);
                    console.log("url: ", url)
                    reject(response)
                }
            })
            .catch( error => {
                console.log("API.get() error ", error);
                reject(error)
            });
        });
    }

    post(resource, data) {

      return new Promise((resolve, reject) => {
          let params = this.requestParams('POST', data);
          fetch(`${this.apiUrl}/${resource}`, params).then(async (response) => {      
              const json = await response.json();
              resolve(json);
          }).catch((reason) => reject(reason));
      });
    }
    
    parseQueryParams(params) {
        return Object.keys(params).map((key) => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
        }).join('&');
    }
    
    requestParams(method, data) {
       
      let headers = {                
          'Content-Type': 'application/json'
      }
      let params = {
          method: method,         
          cache: "no-cache",
          headers: headers                      
      }
      if (data) {
          params.body = JSON.stringify(data)
      }
      return params;
    }

}

export default Api;
