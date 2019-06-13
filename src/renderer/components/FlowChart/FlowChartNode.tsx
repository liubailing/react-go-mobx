import React, { Component } from 'react';
import {DragNodeEvent, FCNodeType,FcNode } from './FCEntities';
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


    //@action
    // initData = (type: FCNodeType) => {
    //     let title = '';
    //     let src = '';

    //     switch (type) {
    //         case FCNodeType.Condition:
    //             title = '判断条件';
    //             src = 'condition';
    //             break;
    //         case FCNodeType.Data:
    //             title = '提取数据';
    //             src = 'data';
    //             break;
    //         case FCNodeType.SubEnd:
    //             title = '结束流程';
    //             src = 'subend';
    //             break;
    //         case FCNodeType.Input:
    //             title = '输入文字';
    //             src = 'input';
    //             break;
    //         case FCNodeType.Loop:
    //             title = '循环';
    //             src = 'loop';
    //             break;
    //         case FCNodeType.LoopBreak:
    //             title = '结束循环';
    //             src = 'loopbreak';
    //             break;
    //         case FCNodeType.MouseClick:
    //             title = '点击元素';
    //             src = 'mouseclick';
    //             break;
    //         case FCNodeType.MouseHover:
    //             title = '移动鼠标到元素上';
    //             src = 'mousehover';
    //             break;
    //         case FCNodeType.OpenWeb:
    //             title = '打开网页';
    //             src = 'openweb';
    //             break;
    //         case FCNodeType.Switch:
    //             title = '切换下拉选项';
    //             src = 'switch';
    //             break;
    //         case FCNodeType.Verify:
    //             title = '识别验证码';
    //             src = 'verify';
    //             break;
    //         default:
    //             title = '模拟数据';
    //             src = '';
    //             break;
    //     }

    //     return {
    //         title: title,
    //         src: src
    //     }
    // }

    render() {
        return (
            this.state.src ?
                <div draggable={true}>

                    <div
                        className="divNode"
                        title={`${this.state.title}`}
                        data-type={this.props.type}
                        onDragStart={(event: any) => {
                            event.dataTransfer.setData('text', event.target.textContent);
                            this.props.store.onDragStartFCNodeHandler({ type: this.props.type, name: this.state.title, event: event } as DragNodeEvent);
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