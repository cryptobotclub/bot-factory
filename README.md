# Crypto Bot Factory

Crypto Bot Factory is a Node.js app to help you code and backtest crypto trading bots for [Crypto Bot Club](https://cryptobot.club).

With Crypto Bot Factory you can code and backtest you JavaScript bots locally on your machine, using your favourite IDE, before you run them in the cloud on [Crypto Bot Club](https://cryptobot.club).

Crypto Bot Factory provides a runtime to test your bots locally, against historical data feeds, and display a summary of their trading performace in your browser.

We like to use [Visual Studio Code](https://code.visualstudio.com) to code our JavaScript bots but any text editor would do.


# Installation

1. Clone repo
2. [Install Node.js](https://nodejs.org/en/) 
3. [Install yarn](https://yarnpkg.com/lang/en/docs/install)
4. Build and start the app

Install on macOS with brew:
```
# install node.js and yarn (if needed)
brew update
brew install nvm
source $(brew --prefix nvm)/nvm.sh
brew install yarn

# install dependencies and build the app
yarn install
yarn build

# start the app
yarn factory
```


# Code your bots

Under the `bots` diredcory are a few basic bots you can use as a starting point.

## Technical analisys and candle pattern detection
1. Bots have access to all functionality included in [Travis CI technicalindicators](http://anandanand84.github.io/technicalindicators/ "technicalindicators") JavaScript library, which  


# Backtesting

This app allow to backtest your bots locally, against different feeds and time intervals, before you run them on [https://www.cryptotradrs.io/strategies](https://www.cryptotradrs.io/strategies). 

1. Point your browser to http://localhost:3030/ to access the app.



# Travis CI technicalindicators

## Available Indicators

1. [Accumulation Distribution Line (ADL)](https://tonicdev.com/anandaravindan/adl "ADL").
1. [Average Directional Index (ADX)](https://github.com/anandanand84/technicalindicators/blob/master/test/directionalmovement/ADX.js "ADX").
1. [Average True Range (ATR)](https://tonicdev.com/anandaravindan/atr "ATR").
1. [Awesome Oscillator (AO)](https://github.com/anandanand84/technicalindicators/blob/master/test/oscillators/AwesomeOscillator.js "AO").
1. [Bollinger Bands (BB)](https://tonicdev.com/anandaravindan/bb "BB").
1. [Commodity Channel Index (CCI)](https://github.com/anandanand84/technicalindicators/blob/master/test/oscillators/CCI.js "CCI").
1. [Force Index (FI)](https://github.com/anandanand84/technicalindicators/blob/master/test/volume/ForceIndex.js "FI").
1. [Know Sure Thing (KST)](https://tonicdev.com/anandaravindan/kst "KST").
1. [Moneyflow Index (MFI)](https://github.com/anandanand84/technicalindicators/blob/master/test/volume/MFI.js "MFI").
1. [Moving Average Convergence Divergence (MACD)](https://tonicdev.com/anandaravindan/macd "MACD").
1. [On Balance Volume (OBV)](https://tonicdev.com/anandaravindan/obv "OBV").
1. [Parabolic Stop and Reverse (PSAR)](https://github.com/anandanand84/technicalindicators/blob/master/test/momentum/PSAR.js "PSAR").
1. [Rate of Change (ROC)](https://tonicdev.com/anandaravindan/roc "ROC").
1. [Relative Strength Index (RSI)](https://tonicdev.com/anandaravindan/rsi "RSI").
1. [Simple Moving Average (SMA)](https://tonicdev.com/anandaravindan/sma "SMA").
1. [Stochastic Oscillator (KD)](https://tonicdev.com/anandaravindan/stochastic "KD").
1. [Stochastic RSI (StochRSI)](https://tonicdev.com/anandaravindan/stochasticrsi "StochRSI").
1. [Triple Exponentially Smoothed Average (TRIX)](https://tonicdev.com/anandaravindan/trix "TRIX").
1. [Typical Price](https://github.com/anandanand84/technicalindicators/blob/master/test/chart_types/TypicalPrice.js "Typical Price").
1. [Volume Weighted Average Price (VWAP)](https://github.com/anandanand84/technicalindicators/blob/master/test/volume/VWAP.js "VWAP").
1. [Volume Profile (VP)](https://github.com/anandanand84/technicalindicators/blob/master/test/volume/VolumeProfile.js "VP").
1. [Exponential Moving Average (EMA)](https://tonicdev.com/anandaravindan/ema "EMA").
1. [Weighted Moving Average (WMA)](https://tonicdev.com/anandaravindan/wma "WMA").
1. [Wilder’s Smoothing (Smoothed Moving Average, WEMA)](https://tonicdev.com/anandaravindan/wema "WEMA").
1. [WilliamsR (W%R)](https://tonicdev.com/anandaravindan/williamsr "W%R").
1. [Ichimoku Cloud](https://github.com/anandanand84/technicalindicators/blob/master/test/ichimoku/IchimokuCloud.js "Ichimoku Cloud").

## Other Utils

1. [Average Gain](https://github.com/anandanand84/technicalindicators/blob/master/test/Utils/AverageGain.js "")
1. [Average Loss](https://github.com/anandanand84/technicalindicators/blob/master/test/Utils/AverageLoss.js "")
1. [Highest](https://github.com/anandanand84/technicalindicators/blob/master/test/Utils/Highest.js "")
1. [Lowest](https://github.com/anandanand84/technicalindicators/blob/master/test/Utils/Lowest.js "")
1. [Standard Deviation](https://github.com/anandanand84/technicalindicators/blob/master/test/Utils/SD.js "")
1. [Sum](https://github.com/anandanand84/technicalindicators/blob/master/test/Utils/Sum.js "")


## CandleStick Pattern

1. [Abandoned Baby](https://runkit.com/anandaravindan/abandoned-baby).
1. [Bearish Engulfing Pattern](https://runkit.com/aarthiaradhana/bearishengulfingpattern).
1. [Bullish Engulfiing Pattern](https://runkit.com/aarthiaradhana/bullishengulfingpattern).
1. [Dark Cloud Cover](https://runkit.com/aarthiaradhana/darkcloudcover).
1. [Downside Tasuki Gap](https://runkit.com/aarthiaradhana/downsidetasukigap).
1. [Doji](https://runkit.com/aarthiaradhana/doji).
1. [DragonFly Doji](https://runkit.com/aarthiaradhana/dragonflydoji).
1. [GraveStone Doji](https://runkit.com/aarthiaradhana/gravestonedoji).
1. [BullishHarami](https://runkit.com/aarthiaradhana/bullishharami).
1. [Bearish Harami Cross](https://runkit.com/aarthiaradhana/bearishharamicross).
1. [Bullish Harami Cross](https://runkit.com/aarthiaradhana/bullishharamicross).
1. [Bullish Marubozu](https://runkit.com/aarthiaradhana/bullishmarubozu).
1. [Bearish Marubozu](https://runkit.com/aarthiaradhana/bearishmarubozu).
1. [Evening Doji Star](https://runkit.com/aarthiaradhana/eveningdojistar).
1. [Evening Star](https://runkit.com/aarthiaradhana/eveningstar).
1. [Bearish Harami](https://runkit.com/aarthiaradhana/bearishharami).
1. [Piercing Line](https://runkit.com/aarthiaradhana/piercingline).
1. [Bullish Spinning Top](https://runkit.com/aarthiaradhana/bullishspinningtop).
1. [Bearish Spinning Top](https://runkit.com/aarthiaradhana/bearishspinningtop).
1. [Morning Doji Star](https://runkit.com/aarthiaradhana/morningdojistar).
1. [Morning Star](https://runkit.com/aarthiaradhana/morningstar).
1. [Three Black Crows](https://runkit.com/aarthiaradhana/threeblackcrows).
1. [Three White Soldiers](https://runkit.com/aarthiaradhana/threewhitesoldiers).
1. [Bullish Hammer](https://runkit.com/nerdacus/technicalindicator-bullishhammer).
1. [Bearish Hammer](https://runkit.com/nerdacus/technicalindicator-bearishhammer).
1. [Bullish Inverted Hammer](https://runkit.com/nerdacus/technicalindicator-bullishinvertedhammer).
1. [Bearish Inverted Hammer](https://runkit.com/nerdacus/technicalindicator-bearishinvertedhammer).
1. [Hammer Pattern](https://runkit.com/nerdacus/technicalindicator-hammerpattern).
1. [Hammer Pattern (Unconfirmed)](https://runkit.com/nerdacus/technicalindicator-hammerpatternunconfirmed).
1. [Hanging Man](https://runkit.com/nerdacus/technicalindicator-hangingman).
1. [Hanging Man (Unconfirmed)](https://runkit.com/nerdacus/technicalindicator-hangingmanunconfirmed).
1. [Shooting Star](https://runkit.com/nerdacus/technicalindicator-shootingstar).
1. [Shooting Star (Unconfirmed)](https://runkit.com/nerdacus/technicalindicator-shootingstarunconfirmed).
1. [Tweezer Top](https://runkit.com/nerdacus/technicalindicator-tweezertop).
1. [Tweezer Bottom](https://runkit.com/nerdacus/technicalindicator-tweezerbottom).

