
import { observable, computed, action, toJS } from "mobx";
import TaskFlowChartStore, { TaskFlowChart, ActionNode, ActionNodeType, ITaskFlowChartRuntime, ITaskFlowChartStore } from "../TaskFlowChartStore";
import { FCNodeType } from "../../components/FlowChart/FlowChartSetting";


/**
 * @class 自定义模式业务
 */
export class CustomTaskStore implements ITaskFlowChartRuntime {

    
    //点击流程图上节点
    @action
    onClickNodeHandler = async (current: ActionNode): Promise<void> => {
        let n = this.taskWorkflowStore.getNodeByKey(current.key);
        console.log('---onClickNodeHandler----',n);
    }

    //删除流程图上的节点
    @action
    onDeleteNodeHander = async (current: ActionNode): Promise<void> => {
    }


    taskId: string ='';

    @observable curCount:number = 0;

    /** 工作流业务 */
    taskWorkflowStore!: ITaskFlowChartStore;

    /** 工作流Store管理 */
    taskFlowChart!: TaskFlowChart;

    /** 操作记录 */
    @observable actionLogs :string[]=[];

    constructor(taskId?: string) {      
        this.taskFlowChart = new TaskFlowChart(this);
        this.taskWorkflowStore = new TaskFlowChartStore(this.taskFlowChart);
    }


    /**
     * 初始化业务模型
     */
    @action
    initStore = async (): Promise<void> => {
        this.taskWorkflowStore.init();        
    }

    @action
    onClickAddHandler=()=>{
        this.curCount =   this.curCount+ 1;
        console.log('计数', this.curCount);
    }


    //初始化
    onClickInitFlowChart= async (isDefault:boolean): Promise<void> => {
        //this.taskWorkflowStore.appendNode(ActionNodeType.ExtractData,{},pId);
        let nodes =  [
            { key: 'Begin', label: '起始', wfType: FCNodeType.Start as string, group: '', isGroup: false },
            { key: 'node1', label: '打开网页', wfType: FCNodeType.OpenWeb as string, group: '', isGroup: false },
            { key: 'test', label: '测试节点', wfType: FCNodeType.OpenWeb as string, group: '', isGroup: false },
            { key: 'node456', label: '循环网页', wfType: FCNodeType.OpenWeb as string, group: 'loop', isGroup: false },
            { key: 'loop', label: '循环', wfType: FCNodeType.Loop as string, group: '', isGroup: true },
            { key: 'cond', label: '条件', wfType: FCNodeType.Condition as string, group: '', isGroup: true },
            { key: 'cond1', label: '分支1', wfType: FCNodeType.ConditionSwitch as string, group: 'cond', isGroup: true },
            { key: 'guide1', label: '将要执行的流程拖放在此', wfType: FCNodeType.WFGuideNode  as string, group: 'cond1', isGroup: false },
            { key: 'cond2', label: '分支2', wfType: FCNodeType.ConditionSwitch as string, group: 'cond', isGroup: true },
            { key: 'data', label: '提取数据', wfType: FCNodeType.Data as string, group: 'cond2', isGroup: false },
            { key: 'End', label: '', wfType: FCNodeType.End as string, group: '', isGroup: false }
        ];
        let  links = [
            { from: 'Begin', to: 'node1', group: '', isCondition: false },
            { from: 'node1', to: 'cond', group: '', isCondition: false },
            { from: 'cond', to: 'loop', group: '', isCondition: false },
            { from: 'loop', to: 'End', group: '', isCondition: false },
            { from: 'cond1', to: 'cond2', group: 'cond', isCondition: true }
        ]
        if(isDefault){
            this.taskWorkflowStore.init();
            this.logs(`初始化`);
        }else{
            this.taskWorkflowStore.init(nodes,links);
            this.logs(`预设值`);
        }
       
    }


      //删除流程图上的节点
      @action
      onClickDeleteNodeHandler = async (key:string): Promise<void> => {
          //this.taskWorkflowStore.appendNode(ActionNodeType.ExtractData,{},pId);
          this.taskWorkflowStore.deleteNodeByKey(key);
          this.logs(`删除key:${key}`);
      }

      
    //追加节点
    @action
    onClickAppendNode = async (pId?:string): Promise<void> => {
       let key =  this.taskWorkflowStore.appendNode(ActionNodeType.ExtractData,{},pId);
    //    console.log(key);      
       this.logs(`追加key:${key}`);
    }

    //得到第一个节点
    @action 
    onClickGetFirstNode= async (pId?:string): Promise<void> => {
      let node =  this.taskWorkflowStore.getFirstNode(pId)
    //   console.log('---getFirstNode----',node);
      this.logs(`key:${node.key},type:${node.type}`);
    }

    @action
    logs=(str:string)=>{
        this.actionLogs.unshift(str);
        console.log(`logs--`,toJS(this.actionLogs));
        //document.getElementById("divResult")!.innerHTML= document.getElementById("divResult")!.innerHTML+ str+'<br />';
    }

}