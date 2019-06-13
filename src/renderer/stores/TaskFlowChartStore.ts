import { observable, action } from "mobx";
import {FlowChartStore ,FlowChartNode,IFlowChartStore } from '../components/FlowChart/FCStore';
import {  FCNodeModel, FCLinkModel, FCDiagramType, NodeEventType, FCNodeType, FcNode, FCNodeExtendsType,getFCDiagramType } from '../components/FlowChart/FCEntities';
// import { DiagramSetting } from '../components/FlowChart/FCSettings';


const guideNodeKey = ['Begin', 'End']

/**
 * 工作流上 激活的节点
 */
export class ActionNode extends  FlowChartNode{
    parentKey: string = ''; //父节点
    childKeys: string[] = [];
    data?: any = {};      // 当前节点的数据
}

/**
 * 操作节点类型
 */
export enum ActionNodeType {
    Condition = 'ConditionAction',
    Branch = 'BranchAction',
    ExtractData = 'ExtractDataAction',
    Click = 'ClickAction',
    EnterCapacha = 'EnterCapachaAction',
    EnterText = 'EnterTextAction',
    Loop = 'LoopAction',
    MouseOver = 'MouseOverAction',
    Navigate = 'NavigateAction',
    SwitchCombo = 'SwitchCombo2Action'
}

/**
 * 工作流程对外事件接口, 外部想要捕捉事件必须实现以下方法
 */
export interface ITaskFlowChartRuntime  extends IFlowChartStore{}

/**
 *  外部 操作 工作流 接口
 */
export interface ITaskFlowChartStore {

    /**
     * 得到第一个节点
     */
    getFirstNode(parentId?: string): ActionNode;

    /**
    * 得到第一个节点
    */
    getNodesByRoot(parentId?: string): ActionNode[];

    /**
     * 初始化
     */
    init(nodes?: FCNodeModel[], links?: FCLinkModel[]): void;

    /**
     * 
     * @param key 
     */
    getAll(): any;

    /**
     * 得到某一个节点
     *  @param key 
     */
    getNodeByKey(key: string): ActionNode;

    /**
     * 根据类型得到节点上的数据
     * @param type : 节点类型
     */
    getNodesByType(type: string): ActionNode[];

    /***
     * 在节点上保存 设置信息
     *  @param key :  keyId
     *  @param data : any  对应的配置信息
     */
    saveNodeData(key: string, data: any): boolean;

    /**
    * 追加步骤
    * @param type 目标节点类型
    * @param data 目标节点附加属性
    * @param parent 父节点
    * @param selected 是否选中
    */
    appendNode(type: string, data?: any, parent?: string, selected?: boolean): string;

    /**
     * 删除某一节点
     */
    deleteNodeByKey(key: string): void;

    /**
     * 重绘
     */
    render(): void;
}


export class TaskFlowChart  extends FlowChartStore {}


/**************************************
 * 
 * 实现对外接口      begin
 * 
 */
class TaskFlowChartStore implements ITaskFlowChartStore {
    @observable private store: TaskFlowChart;
    // @observable private tempData:any={};
    constructor(props: TaskFlowChart) {
        this.store = props;
    }

    /**
    * 初始化
    * @param nodes 
    * @param links 
    */
    @action
    init(nodes?: FCNodeModel[], links?: FCLinkModel[]) {
      
        if (!nodes || nodes.length < 0) {
            nodes = [
                { key: 'Begin', label: '', wfType: FCNodeExtendsType.Start as string, group: '', isGroup: false },
                { key: 'End', label: '', wfType: FCNodeExtendsType.End as string, group: '', isGroup: false }
            ];

        }

        if (!links || links.length < 0) {
            links = [
                { from: 'Begin', to: 'End', group: '', isCondition: false }
            ]
        }        

        nodes.map(x => {
            //this.tempData[x.key]= x.data;
            if (!x.data) x.data = {};
            x.category = getFCDiagramType(x.wfType as FCNodeType);
        })


        links.map(x => {
            x.category = x.isCondition ? FCDiagramType.WFGuideLink : FCDiagramType.WFLink;
        })

        this.store.model = {
            linkDataArray: links,
            nodeDataArray: nodes
        }

    }

    /**
     * 追加一个节点
     * @param type 
     * @param data 
     * @param parent 
     * @param selected 
     */
    @action
    appendNode(type: string, _data?: any, parent?: string, _selected?: boolean): string {

        //let node = this.store.model.nodeDataArray.find(x => x.key === parent);
       
        if (!parent) parent = '';

        if(!!parent){
            let ind =  this.store.model.nodeDataArray.findIndex(x => x.key === parent); 
            if(ind<0){
                return '';
            } 
        }
       
        let parentKey = this.getLastFCNodeKey(parent); 
        let fcNode = new FcNode(type as FCNodeType);

        if(!!parentKey){
            let toNode = this.store.model.nodeDataArray.find(x => x.key === parentKey);   
            //this.store.drager = ({ type: fcNode.fcType, name: fcNode.name, event: {} } as DragNodeEvent)        
            let newKey =  this.store.addNodeAfterDropNodeHandler({ eType: NodeEventType.Drag2Node, toNode: toNode },false);
            //this.store.drager = null;
            return newKey;
        }else{
           //this.store.model.nodeDataArray.push({wftype: fcNode.fcType, name: fcNode.name});
           let newKey =  this.store.addNodeToParnetHandler(fcNode,parent);
           return newKey;
           
        }
    }

    /**
     * 得到所有节点
     */
    @action
    getAll(): any {
        return this.store.model;
    }

    /**
     * 保存某一个节点的 data 数据
     * @param key 
     * @param data 
     */
    @action
    saveNodeData(key: string, data: any) {
        let node: FCNodeModel | undefined = this.store.model.nodeDataArray.find(x => x.key == key);
        if (node) {
            node.data = data;
            // this.store.model = {
            //     ...this.store.model,
            //     nodeDataArray: [...this.store.model.nodeDataArray, node]
            // }
        }
        //this.tempData[key]= data;
        return true

    }

    /**
     * 得到第一个点
     */
    private getFirstFCNodeKey = (group: string): string => {
        let keys = this.getFCNodesByGroup(group);
        if (keys.length > 0) {
            if (guideNodeKey.includes(keys[0])) return keys[1];
            else return keys[0];
        }
        return '';
    }

    /**
     * 得到最后一个点
     */
    private getLastFCNodeKey = (group: string): string => {
        let keys = this.getFCNodesByGroup(group);
        if (keys.length > 0) {
            if (guideNodeKey.includes(keys[keys.length - 1])) return keys[keys.length - 2];
            else return keys[keys.length - 1];
        }
        return '';
    }

    // /**
    //  * 得到第一条线
    //  */
    // private _getFirstLink = (group: string): FCLinkModel | undefined => {
    //     //找到组内所有的点和线
    //     let links: FCLinkModel[] = [];
    //     let forms: string[] = [];
    //     let tos: string[] = [];
    //     this.store.model.linkDataArray.map(x => {
    //         if (x.group === group) {
    //             links.push(x);
    //             if (!guideNodeKey.includes(x.from) && !guideNodeKey.includes(x.to)) {
    //                 forms.push(x.from);
    //                 tos.push(x.to);
    //             }
    //         }
    //     });

    //     // 找到起始线条              
    //     let f: string = '';
    //     for (let i = 0; i < forms.length; i++) {
    //         if (!tos.includes(forms[i])) {
    //             f = forms[i];
    //             break;
    //         }
    //     }
    //     if (!!f) {
    //         for (let index = 0; index < this.store.model.linkDataArray.length; index++) {
    //             const element = this.store.model.linkDataArray[index];
    //             if (f === element.from) {
    //                 return element;
    //                 break;
    //             }

    //         }
    //     }
    //     return undefined;
    // }

    // /**
    //  * 得到最后条线
    //  */
    // private _getLastLink = (group: string): FCLinkModel | undefined => {
    //     //找到组内所有的点和线
    //     let links: FCLinkModel[] = [];
    //     let forms: string[] = [];
    //     let tos: string[] = [];
    //     this.store.model.linkDataArray.map(x => {
    //         if (x.group === group) {
    //             links.push(x);
    //             forms.push(x.from);
    //             tos.push(x.to);
    //         }
    //     });

    //     // 找到起始线条              
    //     let t: string = '';
    //     for (let i = 0; i < tos.length; i++) {
    //         if (!forms.includes(tos[i])) {
    //             t = tos[i];
    //             break;
    //         }

    //     }

    //     if (!t) {
    //         for (let index = 0; index < this.store.model.linkDataArray.length; index++) {
    //             const element = this.store.model.linkDataArray[index];
    //             if (t === element.to) {
    //                 return element;
    //                 break;
    //             }
    //         }
    //     }
    //     return undefined;

    // }

    private getNode = (key: string): ActionNode => {
        if (!!key) {
            var res = new ActionNode();
            let node = this.store.model.nodeDataArray.find(x => x.key === key);
            if (!!node) {

                if (!!node.group) res.parentKey = node.group;
                else res.parentKey = "root";

                if (node.category && [FCDiagramType.ConditionGroup, FCDiagramType.ConditionSwitch, FCDiagramType.LoopGroup].includes(node.category)) {
                    let childNNodes: string[] = [];
                    this.store.model.nodeDataArray.map(x => {
                        if (x.group === node!.key && x.category !== FCDiagramType.WFGuideNode) childNNodes.push(x.key);
                    });

                    // 就一个点时候
                    if (childNNodes.length <= 1) {
                        res.childKeys = childNNodes;
                    } else {
                        res.childKeys = this.getFCNodesByGroup(node!.key);
                    }
                } else {
                    res.childKeys = [];
                }

            }
            if (node && node.wfType)
                return { ...res, ...node, ...{ type: node!.wfType } };
            else
                return { ...res, ...node };
        }
        return { key: '', type: '', parentKey: '', childKeys: [], data: null }
    }

    /**
     * 得到当前组的字节点，并按顺序排好
     */
    private getFCNodesByGroup = (group: string): string[] => {
        //找到组内所有的点和线
        let links: FCLinkModel[] = [];
        let forms: string[] = [];
        let tos: string[] = [];
        this.store.model.linkDataArray.map(x => {
            if (x.group === group) {
                links.push(x);
                forms.push(x.from);
                tos.push(x.to);
            }
        });

        // 找到起始线条              
        let f: string = '';
        for (let i = 0; i < forms.length; i++) {
            if (!tos.includes(forms[i])) {
                f = forms[i];
                break;
            }

        }

        let child: Set<string> = new Set();
        //如果大于0 则表示有多个点
        if (links.length > 0) {
            do {

                for (let i = 0; i < links.length; i++) {
                    if (links[i].from === f) {
                        child.add(links[i].from);
                        child.add(links[i].to);
                        f = links[i].to;
                        break;
                    }

                }

            } while (forms.includes(f))
        } else {
            for (let i = 0; i < this.store.model.nodeDataArray.length; i++) {
                if (this.store.model.nodeDataArray[i].group === group)
                {
                    child.add(this.store.model.nodeDataArray[i].key);
                    break;
                }
            }
        }

        return Array.from(child);
    }

    /**
     * 得到某一节点
     * @param key 
     */
    getNodeByKey(key: string): ActionNode {
        return this.getNode(key);
    }


    /**
     * 得到某一类型节点
     * @param key 
     */
    getNodesByType(type: ActionNodeType): ActionNode[] {
        let arr: ActionNode[] = [];
        this.store.model.nodeDataArray.map(x => {
            if (x.wfType == type as string) {
                arr.push(this.getNode(x.key));
            }
        })

        return arr;
    }

    /**
     * 得到当前组所有的节点
     */
    getNodesByRoot(parentId?: string): ActionNode[] {
        if (!parentId) parentId = '';
        let keys = this.getFCNodesByGroup(parentId);
        let nodes: ActionNode[] = [];
        keys.map(x => {
            nodes.push(this.getNodeByKey(x));
        })

        return nodes;
    }

    /**
     * 得到第一个节点
     */
    getFirstNode(parentId?: string): ActionNode {
        if (!parentId) parentId = '';

        let n = this.getFirstFCNodeKey(parentId);
        if (!!n) {
            return this.getNodeByKey(n);
        }

        return new ActionNode;
    }

    /**
     * 删除某一个节点
     */
    @action
    deleteNodeByKey(key: string): void {
        this.store.model =  this.store.deleteNodeByKey({...this.store.model },key);
    }


    /**
     * 
     */
    render():void{
        this.store.diagram.layoutDiagram(true);
    }

}



export default TaskFlowChartStore;