import React, { Component } from 'react';
import { Provider, inject } from 'mobx-react';
import './App.less';
import CustTask from '../components/CustomTask/CustomTask'
import { CustomTaskStore } from '../stores/CustomTask/CustomTaskStore'
type AppProps = {
    entry: string;

}
export default class App extends Component<AppProps> {
    customTaskStore:CustomTaskStore
    constructor(props: AppProps) {
        super(props);
        this.customTaskStore = new CustomTaskStore();
    }
    
    render() {      
        return (
            <Provider>
                <CustTask customTaskStore = {this.customTaskStore} ></CustTask>
            </Provider>
        );
    }
}