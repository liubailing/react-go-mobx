
import { observable, action, toJS } from "mobx";
import TaskFlowChartStore, { TaskFlowChart, ActionNode, ActionNodeType, ITaskFlowChartRuntime, ITaskFlowChartStore } from "../TaskFlowChartStore";
import { FCNodeType,FCNodeExtendsType } from "../../components/FlowChart/FCEntities";


/**
 * @class 自定义模式业务
 */
export class CustomTaskStore implements ITaskFlowChartRuntime {

    
    //点击流程图上节点
    @action
    onClickNodeHandler = async (_current: ActionNode): Promise<void> => {
        // let n = this.taskWorkflowStore.getNodeByKey(current.key);
        //console.log('---onClickNodeHandler----',n);
    }

    //删除流程图上的节点
    @action
    onDeleteNodeHander = async (_current: ActionNode): Promise<void> => {
    }


    taskId: string ='';
    @observable currKey:string ='';

    @observable curCount:number = 0;

    /** 工作流业务 */
    taskWorkflowStore!: ITaskFlowChartStore;

    /** 工作流Store管理 */
    taskFlowChart!: TaskFlowChart;

    /** 操作记录 */
    @observable actionLogs :string[]=[];

    constructor(_taskId?: string) {      
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

    onClickRender = async (): Promise<void> => {
        this.taskWorkflowStore.render();
    }
    //初始化
    onClickInitFlowChart= async (isDefault:boolean): Promise<void> => {
        //this.taskWorkflowStore.appendNode(ActionNodeType.ExtractData,{},pId);
        let nodes =  [
            { key: 'Begin', label: '起始', wfType: FCNodeExtendsType.Start as string, group: '', isGroup: false },
            { key: 'node1', label: '打开网页', wfType: FCNodeType.Navigate as string, group: '', isGroup: false },
            { key: 'test', label: '测试节点', wfType: FCNodeType.Navigate as string, group: '', isGroup: false },         

            { key: 'cond', label: '条件', wfType: FCNodeType.Condition as string, group: '', isGroup: true },
            { key: 'cond1', label: '分支1', wfType: FCNodeExtendsType.Branch as string, group: 'cond', isGroup: true },

            { key: 'open1', label: '', wfType: FCNodeExtendsType.SubOpen  as string, group: 'cond1', isGroup: false },
            { key: 'guide1', label: '将要执行的流程拖放在此', wfType: FCNodeExtendsType.WFGuideNode  as string, group: 'cond1', isGroup: false },
            { key: 'close1', label: '', wfType: FCNodeExtendsType.SubClose  as string, group: 'cond1', isGroup: false },
            
            { key: 'cond2', label: '分支2', wfType: FCNodeExtendsType.Branch as string, group: 'cond', isGroup: true },

            { key: 'loop', label: '循环', wfType: FCNodeType.Loop as string, group: '', isGroup: true },
            { key: 'open3', label: '', wfType: FCNodeExtendsType.SubOpen  as string, group: 'loop', isGroup: false },
            { key: 'node456', label: '循环网页', wfType: FCNodeType.Navigate as string, group: 'loop', isGroup: false },
            { key: 'close3', label: '', wfType: FCNodeExtendsType.SubClose  as string, group: 'loop', isGroup: false },

            { key: 'open2', label: '', wfType: FCNodeExtendsType.SubOpen  as string, group: 'cond2', isGroup: false },
            { key: 'data', label: '提取数据', wfType: FCNodeType.ExtractData as string, group: 'cond2', isGroup: false },
            { key: 'close2', label: '', wfType: FCNodeExtendsType.SubClose  as string, group: 'cond2', isGroup: false },
         
            { key: 'End', label: '', wfType: FCNodeExtendsType.End as string, group: '', isGroup: false }
        ];
        let  links = [
            { from: 'Begin', to: 'node1', group: '', isCondition: false },
            { from: 'node1', to: 'cond', group: '', isCondition: false },           
            
            { from: 'cond', to: 'loop', group: '', isCondition: false },            
            { from: 'open1', to: 'guide1', group: 'cond1', isCondition: false },
            { from: 'guide1', to: 'close1', group: 'cond1', isCondition: false },
            { from: 'open2', to: 'data', group: 'cond2', isCondition: false },
            { from: 'data', to: 'close2', group: 'cond2', isCondition: false }, 
            { from: 'cond1', to: 'cond2', group: 'cond', isCondition: true },

            { from: 'loop', to: 'End', group: '', isCondition: false },
            { from: 'open3', to: 'node456', group: 'loop', isCondition: false },
            { from: 'node456', to: 'close3', group: 'loop', isCondition: false }
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

    //追加节点
    @action
    onClickAppendNodeByType = async (type: ActionNodeType ,pId?:string): Promise<void> => {
        this.currKey =  this.taskWorkflowStore.appendNode(type,{data:'test.data'},pId);

    //    console.log(key);      
        this.logs(`追加key:${this.currKey}`);
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