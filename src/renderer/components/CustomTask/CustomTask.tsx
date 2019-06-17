import React, { Component } from 'react';
import { observer } from "mobx-react";
import { Layout, Row, Col, Button } from 'antd';
import './CustomTask.less'
import { action } from "mobx";
import SplitPane from 'react-split-pane';
import { CustomTaskStore } from '../../stores/CustomTask/CustomTaskStore';
import Workflow from '../FlowChart/FlowChart';
import { ActionNodeType } from '../../stores/TaskFlowChartStore';


type CustomTaskProps = {
    customTaskStore: CustomTaskStore
}

type CustomTaskState = {
    editIndex: number
}

@observer
class CustomTask extends Component<CustomTaskProps, CustomTaskState> {

    constructor(props: CustomTaskProps) {
        super(props)
        this.state = {
            editIndex: 0
        }
    }

    componentWillMount() {
        //window.addEventListener('resize', this.onWindowResize)
    }

    componentDidMount() {
        // this.props.customTaskStore.initStore().then(() => {
        // });
    }

    componentDidUpdate() {
        //this.onWindowResize();
    }

    componentWillUnmount() {
        // 移除监听
        //window.removeEventListener('resize', this.onWindowResize);
    }

    /**
     * 尺寸变化时重置浏览器位置
     */
    @action
    // private onWindowResize = async (): Promise<void> => {
    //     //console.log()
    //     //this.props.customTaskStore.setBrowserBounds(this.browserBounds);
    // }

    /**
     * 尺寸变化时重置浏览器位置
     */
    @action
    private onChangeHorizontal = async (size: any): Promise<void> => {
        console.log(size)
        //this.props.customTaskStore.setBrowserBounds(this.browserBounds);
    }

    render() {
        return (
            <div>
                <Layout className='customtask'>
                    <Row className="customtask-header" type='flex'>
                        <Col span={24}>流程图接口示例</Col>
                    </Row>
                    <Row className="customtask-main">
                        <SplitPane split="horizontal" defaultSize="60%" onChange={size => this.onChangeHorizontal(size)} minSize={300} ref='mainSpliter'>
                            <SplitPane split="vertical" defaultSize="85%" minSize={500} className={'divSplitH'}>
                                <Workflow store={this.props.customTaskStore.taskFlowChart}></Workflow>
                                <div>
                                    <Row type='flex' className='divResult'>
                                        <Col>
                                            {
                                                this.props.customTaskStore.actionLogs.map((str, index) => {
                                                    return (
                                                        <Row key={index}>{this.props.customTaskStore.actionLogs.length - index}、{str}</Row>
                                                    )
                                                })
                                            }
                                        </Col>
                                    </Row>
                                </div>
                            </SplitPane>
                            <div className='divActions'>
                                <Row type='flex' className='divActionItem' style={{ marginTop: '5px' }}>
                                    <Col><label>初始：</label></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickInitFlowChart(true)}>初始化</Button></Col>
                                </Row>
                                <Row type='flex' className='divActionItem'>
                                    <Col><label>得到起始结点：</label></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickGetFirstNode()}>第一个节点</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickGetFirstNode('cond2')}>分支2的第一个节点</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem'>
                                    <Col><label>追加节点：</label></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNode()}>新增节点</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNodeByType(ActionNodeType.Loop)}>新增循环</Button></Col>

                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNodeByType(ActionNodeType.Navigate, this.props.customTaskStore.currKey)}>为循环追加打开网页</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNodeToNodeByType(ActionNodeType.Condition)}>当前值追加条件节点</Button></Col>

                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNodeByType(ActionNodeType.Condition, '')}>新增一个条件节点</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem'>
                                    <Col><label>存取数据</label></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickSaveData()}>第一个节点存储Data</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickGetData()}>取出Data</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem' style={{ marginTop: '10px' }}>
                                    <Col><label>预设流程图：</label></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickInitFlowChart(false)}>预设</Button></Col>
                                </Row>
                                <Row type='flex' className='divActionItem'>
                                    <Col><label>追加节点：</label></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNode("cond1")}>追加到分支1</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNode("cond2")}>追加到分支2</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickAppendNode("loop")}>追加到循环</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem'>
                                    <Col><label>删除节点：</label></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickDeleteNodeHandler("node1")}>删除节点</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickDeleteNodeHandler("loop")}>删除节点 循环</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickDeleteNodeHandler("cond")}>删除节点 条件</Button></Col>
                                    <Col><Button onClick={() => this.props.customTaskStore.onClickDeleteNodeHandler("test")}>删除测试节点</Button></Col>
                                </Row>

                            </div>
                        </SplitPane>
                    </Row>

                </Layout>
            </div>
        )
    }
}
export default CustomTask;