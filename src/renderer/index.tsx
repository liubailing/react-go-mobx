import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';



//从主进程变量中获取入口参数
//为了防止在浏览器中查看时没有remote的情况， 需要加上默认为main
const root = document.getElementById('root');
ReactDOM.render(<App  entry='test'/>, root);

 