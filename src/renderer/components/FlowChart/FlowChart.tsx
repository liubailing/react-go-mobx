import React , {Component} from 'react';
import go, { Diagram, ToolManager, GraphObject } from 'gojs';
import { ModelChangeEvent, GojsDiagram, ModelChangeEventType } from 'react-gojs';
import  {TaskFlowChart }from  '../../stores/TaskFlowChartStore';

import { DiagramState, FCNodeModel, FCLinkModel, DiagramCategory, NodeEventType, DragNodeEvent, NodeEvent, FCNodeType } from './FlowChartSetting';


import FlowChartDroper from './FlowChartDroper';
import FlowChartNode from './FlowChartNode';

import './FlowChart.less';

export interface FlowChartState{
    
}

export interface FlowChartProps {
    store: TaskFlowChart,
}


class FlowChart extends Component<FlowChartProps  ,FlowChartState> {
    constructor(props:any){
        super(props);
        this.state = {          
            
        }
    }

    
    render() {
        let arr: FCNodeType[] = [];
        for (const key in FCNodeType) {
            if (FCNodeType.hasOwnProperty(key)) {
                arr.push(FCNodeType[key] as FCNodeType);
            }
        }

        return (
            <div className="divFlowChart" id="divFlowChart">
            <div className="divFCNodes">
                {arr &&
                    arr.map((e, i)=> {                      
                        return <FlowChartNode key={i} type={e} store={this.props.store} />;
                    })}
                
            </div>
            <div className="divFCDiagrams">
                <FlowChartDroper   store={this.props.store}/>
            </div>
        </div>
        );
    }
}
export default FlowChart;