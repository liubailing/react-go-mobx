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
    store: CustomTaskStore
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
                                <Workflow store={this.props.store.taskFlowChart}></Workflow>
                                <div>
                                    <Row type='flex' className='divResult'>
                                        <Col>
                                            {
                                                this.props.store.actionLogs.map((str, index) => {
                                                    return (
                                                        <Row key={index}>{this.props.store.actionLogs.length - index}、{str}</Row>
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
                                    <Col><Button onClick={() => this.props.store.onClickInitFlowChart(true)}>初始化</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickGetAll()}>得到全部</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem'>
                                    <Col><label>追加节点：</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickAppendNode()}>新增节点</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickAppendNodeByType(ActionNodeType.Loop)}>新增循环</Button></Col>

                                    <Col><Button onClick={() => this.props.store.onClickAppendNodeByType(ActionNodeType.Navigate, this.props.store.currKey)}>为循环追加打开网页</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickAppendNodeToNodeByType(ActionNodeType.Condition)}>当前值追加条件节点</Button></Col>

                                    <Col><Button onClick={() => this.props.store.onClickAppendNodeByType(ActionNodeType.Condition, '')}>新增一个条件节点</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem'>
                                    <Col><label>存取数据</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickSaveData('')}>第一个节点存储Data</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickGetData('')}>取出Data</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem' style={{ marginTop: '10px' }}>
                                    <Col><label>流程图测试：</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickInitFlowChart(false)}>加载 测试流程图</Button></Col>
                                    <Col><span style={{ color: 'red' }}>以下操作请在 “加载 测试流程图 ”之后进行操作 </span></Col>
                                </Row>
                                <Row type='flex' className='divActionItem'>
                                    <Col><label>选中节点：</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickSelectNodeHandler("")}>选中第一个节点</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickSelectNodeHandler("loop")}>选中 循环</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickSelectNodeHandler("branch1-2")}>选中 条件分支2</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickSelectNodeHandler("cond")}>选中 条件</Button></Col>
                                </Row>
                                <Row type='flex' className='divActionItem'>
                                    <Col><label>得到起始结点：</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickGetFirstNode()}>第一个节点</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickGetFirstNode('branch1-2')}>分支2的第一个节点</Button></Col>
                                </Row>
                                <Row type='flex' className='divActionItem'>
                                    <Col><label>“值”操作：</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickGetData('node1')}>取出node1的Data</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickGetData('loop')}>取出node1的Data</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickSaveData('loop')}>改变 loop</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickGetData('loop')}>再取出node1的Data</Button></Col>
                                </Row>
                                <Row type='flex' className='divActionItem'>
                                    <Col><label>追加节点：</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickAppendBranchNode("branch1-1")}>条件分支1增加条件分支(没实现)</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickAppendNode("branch1-1")}>追加到分支1</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickAppendNode("branch1-2")}>追加到分支2</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickAppendNode("loop")}>追加到循环</Button></Col>
                                </Row>

                                <Row type='flex' className='divActionItem'>
                                    <Col><label>删除节点：</label></Col>
                                    <Col><Button onClick={() => this.props.store.onClickDeleteNodeHandler("node1")}>删除节点</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickDeleteNodeHandler("loop")}>删除节点 循环</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickDeleteNodeHandler("branch1-2")}>删除节点 条件分支2</Button></Col>
                                    <Col><Button onClick={() => this.props.store.onClickDeleteNodeHandler("cond")}>删除节点 条件</Button></Col>
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