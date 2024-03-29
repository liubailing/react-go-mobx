import React, { Component } from 'react';
import { TaskFlowChart } from '../../stores/TaskFlowChartStore';
import { FCNodeType } from './FCEntities';
import FlowChartDroper from './FlowChartDroper';
import FlowChartNode from './FlowChartNode';

import './FlowChart.less';

export interface FlowChartState {

}

export interface FlowChartProps {
    store: TaskFlowChart,
}


class FlowChart extends Component<FlowChartProps, FlowChartState> {
    constructor(props: any) {
        super(props);
        this.state = {

        }
    }


    render() {
        let arr: string[] = [];
        for (const key in FCNodeType) {
            if (FCNodeType.hasOwnProperty(key)) {
                arr.push(FCNodeType[key]);
            }
        }

        return (
            <div className="divFlowChart" id="divFlowChart">
                <div className="divFCNodes">
                    {arr &&
                        arr.map((e, i) => {
                            return <FlowChartNode key={i} type={e} store={this.props.store} />;
                        })}

                </div>
                <div className="divFCDiagrams">
                    <FlowChartDroper store={this.props.store} />
                </div>
            </div>
        );
    }
}
export default FlowChart;