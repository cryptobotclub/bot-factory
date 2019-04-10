import React from 'react';
import ReactDOM from 'react-dom';
//import './index.css';

//import 'bootstrap/dist/css/bootstrap.css';
//import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap/dist/css/bootstrap.css';
import "shards-ui/dist/css/shards.min.css"
import "./shards-dashboard/styles/shards-dashboards.1.1.0.min.css";


import './styles.scss'; 


import App from './App/App';
import * as serviceWorker from './serviceWorker';


ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
