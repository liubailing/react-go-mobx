import React, { Component, Fragment } from 'react';
import { observer } from "mobx-react";
import { Layout, Row, Col, Icon, Select, Switch, Checkbox, Button, Input, Collapse } from 'antd';
import './CustomTask.less'
import { observable, action } from "mobx";
import SplitPane from 'react-split-pane';
import ReactDOM from 'react-dom'
import { CustomTaskStore } from '../../stores/CustomTask/CustomTaskStore';
import Workflow from '../FlowChart/FlowChart';

const Option = Select.Option;
const Panel = Collapse.Panel;



type CustomTaskProps = {
    customTaskStore: CustomTaskStore
}

type CustomTaskState = {
    editIndex: number
}

@observer
class CustomTask extends Component<CustomTaskProps, CustomTaskState> {
    private container: any;

    constructor(props: CustomTaskProps) {
        super(props)
        this.state = {
            editIndex: 0
        }
    }

    componentWillMount() {
        window.addEventListener('resize', this.onWindowResize)
    }

    //点击当前行，行前有个箭头
    private handleEdit = (index: number) => {
        this.setState({
            editIndex: index
        });
    };



    componentDidMount() {
        this.props.customTaskStore.initStore().then(() => {
        });
    }

    componentDidUpdate() {
        this.onWindowResize();
    }

    componentWillUnmount() {
        // 移除监听
        window.removeEventListener('resize', this.onWindowResize);
    }


    /**
     * 尺寸变化时重置浏览器位置
     */
    @action
    private onWindowResize = async (): Promise<void> => {
        //console.log()
        //this.props.customTaskStore.setBrowserBounds(this.browserBounds);
    }

    /**
     * 尺寸变化时重置浏览器位置
     */
    @action
    private onChangeHorizontal = async (size:any): Promise<void> => {
        //console.log()
        //this.props.customTaskStore.setBrowserBounds(this.browserBounds);
    }


    render=()=> {
        return (
            <div>
                <Layout className='customtask'>
                    <Row className="customtask-header" type='flex'>
                    </Row>

                    <Row className="customtask-main">
                        <SplitPane split="horizontal" defaultSize="60%" onChange={size => this.onChangeHorizontal(size)}  minSize={300} ref='mainSpliter'>
                            <SplitPane split="vertical" defaultSize="85%" minSize={500} className={'divSplitH'}>
                                <Workflow store={this.props.customTaskStore.taskFlowChart}></Workflow>
                                <div className='divActions'>
                                    <Row  type='flex'   className='divActionItem'>
                                        <Col><Button  onClick={()=>this.props.customTaskStore.onClickGetFirstNode()}>得到第一个节点</Button></Col>
                                        <Col><Button  onClick={()=>this.props.customTaskStore.onClickGetFirstNode('cond2')}>得到 分支2第一个节点</Button></Col>
                                    </Row>
                                    <Row type='flex'  className='divActionItem'>
                                        <Col><Button onClick={()=>this.props.customTaskStore.onClickAppendNode()}>追加节点</Button></Col>
                                        <Col><Button  onClick={()=>this.props.customTaskStore.onClickAppendNode("cond1")}>追加节点 分支1</Button></Col>
                                        <Col><Button  onClick={()=>this.props.customTaskStore.onClickAppendNode("cond2")}>追加节点 分支2</Button></Col>
                                        <Col><Button  onClick={()=>this.props.customTaskStore.onClickAppendNode("loop")}>追加节点 循环</Button></Col>
                                    </Row> 
                                    <Row  type='flex'  className='divActionItem'>
                                        <Col><Button  onClick={()=>this.props.customTaskStore.onClickDeleteNodeHandler("node1")}>删除节点  循环</Button></Col>
                                        <Col><Button  onClick={()=>this.props.customTaskStore.onClickDeleteNodeHandler("loop")}>删除节点  循环</Button></Col>
                                    </Row> 
                                    <Row  type='flex'  className='divActionItem'>
                                        <Col><div id='divResult'></div></Col>
                                    </Row>                                  
                                </div>
                            </SplitPane>

                            <div> 浏览器 </div>
                            
                        </SplitPane>
                    </Row>
                </Layout>
            </div>
        )
    }
}
export default CustomTask;