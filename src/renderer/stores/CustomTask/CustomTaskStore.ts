import { observable, computed, action, toJS } from "mobx";
import TaskFlowChartStore, { TaskFlowChart, ActionNode, ActionNodeType, ITaskFlowChartRuntime, ITaskFlowChartStore } from "../TaskFlowChartStore";
import fs from 'fs';
import { message } from 'antd';


/**
 * @class 自定义模式业务
 */
export class CustomTaskStore implements ITaskFlowChartRuntime {
    taskId: string ='';

    /** 工作流业务 */
    taskWorkflowStore!: ITaskFlowChartStore;

    /** 工作流Store管理 */
    taskFlowChart!: TaskFlowChart;

    /** 是否新任务 */
    isNewTask: boolean = false;

    /** 当前步骤 */
    @observable currentNode!: ActionNode;
    /**
    * 记录上一次Key
    */
    @observable preNodeKey: string = '';

    constructor(taskId?: string) {
        if (!taskId || taskId.length == 0) {
            this.isNewTask = true;
            this.taskId = 'new_task';
        }
        else {
            this.isNewTask = false;
            this.taskId = taskId;
        }
        this.taskFlowChart = new TaskFlowChart(this);
        this.taskWorkflowStore = new TaskFlowChartStore(this.taskFlowChart);
    }


        /**
     * 初始化业务模型
     */
    @action
    initStore = async (): Promise<void> => {
        await this.initTask();
        
    }

       /**
     * 初始化任务
     */
    @action
    initTask = async (): Promise<void> => {
        this.taskWorkflowStore.init();
        // if (this.isNewTask) {
        //      this.task = this.createTask();
        // }
        // else {
        //     this.task = await this.getTaskInfo();
        //     this.taskGroupId = this.task!.taskGroupId;
        // }
        // this.taskName = this.task!.taskName;
        // this.taskId = this.task!.taskId;
        return Promise.resolve();
    }

    



    /*******
     * 实现和工作流相关接口      begin 
     */

    //点击流程图上节点
    @action
    onClickNodeHandler = async (current: ActionNode): Promise<void> => {
        let n = this.taskWorkflowStore.getNodeByKey(current.key);
        console.log('---onClickNodeHandler----',n);
        if (this.preNodeKey === current.key) return;
        this.currentNode = n ;
        this.preNodeKey = current.key
    }

    //删除流程图上的节点
    @action
    onDeleteNodeHander = async (current: ActionNode): Promise<void> => {

    }


    
    //删除流程图上的节点
    @action
    onClickAppendNode = async (): Promise<void> => {
        this.taskWorkflowStore.appendNode(ActionNodeType.ExtractData)
    }

}