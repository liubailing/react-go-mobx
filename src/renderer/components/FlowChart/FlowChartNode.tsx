import React, { Component } from 'react';
import {FCNodeType,FcNode } from './FCEntities';
import { observer } from "mobx-react";
import {TaskFlowChart} from '../../stores/TaskFlowChartStore';
import './FlowChartNode.less';

export interface FCNodeState {
    title: string
    src: any
}

export interface FCNodeProps {
    store: TaskFlowChart,
    type: string
}

@observer
class FCNode extends Component<FCNodeProps, FCNodeState> {
    constructor(props: FCNodeProps) {
        super(props);


        //let { title, src } = this.initData(this.props.type as FCNodeType);
        let node= new FcNode(this.props.type as FCNodeType);
        this.state = {
            title: node.name,
            src: node.src
        }

    }

    render() {
        return (
            this.state.src ?
                <div>
                    <div
                        draggable={true}
                        className="divNode"
                        title={`${this.state.title}`}
                        data-type={this.props.type}
                        onDragStart={(event: any) => {
                            event.dataTransfer.setData('text', event.target.textContent);
                            this.props.store.onDragStartFCNodeHandler(this.props.type as FCNodeType);
                            //console.log('FCNode onDragStart')
                        }}
                        onDragEnd={(event: any) => {
                            event.dataTransfer.setData('text', '');
                            this.props.store.onDragEndFCNodeHandler();
                            //console.log('FCNode onDragEnd')
                        }}
                    >

                        <img src={require(`../../assets/images/flowchart/${this.state.src}.png`)} title={`${this.state.title}`} />
                    </div>
                </div> : null)
    }
};

export default FCNode;