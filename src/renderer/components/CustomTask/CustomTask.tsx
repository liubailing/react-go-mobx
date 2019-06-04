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
        //this.props.customTaskStore.setBrowserBounds(this.browserBounds);
    }

    render() {
        return (
            <div>
                <Layout className='customtask'>
                    <Row className="customtask-header" type='flex'>
                    </Row>

                    <Row className="customtask-main">
                        <SplitPane split="horizontal" defaultSize="50%" onChange={size => this.onWindowResize()} ref='mainSpliter'>
                            {

                                <SplitPane split="vertical" defaultSize="50%" minSize={350}>
                                    <div><Workflow store={this.props.customTaskStore.taskFlowChart}></Workflow> </div>
                                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, overflow: 'auto' }}></div>
                                </SplitPane>

                            }
                        </SplitPane>
                    </Row>
                </Layout>
            </div>
        )
    }
}
export default CustomTask;