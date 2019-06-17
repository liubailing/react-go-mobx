import { observable, action } from "mobx";
import { FlowChartStore, FlowChartNode, IFlowChartStore } from '../components/FlowChart/FCStore';
import { FCNodeModel, FCLinkModel, FCDiagramType, FCNodeType, FCNodeExtendsType, getFCDiagramType, NodeEventType, NodeEvent } from '../components/FlowChart/FCEntities';
// import { DiagramSetting } from '../components/FlowChart/FCSettings';



const guideNodeGRoupCategories = [FCDiagramType.LoopGroup, FCDiagramType.ConditionSwitch, FCDiagramType.ConditionGroup];

/**
 * 工作流上 激活的节点
 */
export class ActionNode extends FlowChartNode {
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
export interface ITaskFlowChartRuntime extends IFlowChartStore { }

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
     * 追加一个节点 到一个节点上
     * @param type 
     * @param data 
     * @param parent 
     * @param selected 
     */
    appendNodeToNode(type: string, nodeKey: string, _data?: any, _selected?: boolean): string;

    /**
     * 删除某一节点
     */
    deleteNodeByKey(key: string): void;

    /**
     * 重绘
     */
    render(): void;
}


export class TaskFlowChart extends FlowChartStore { }


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
     * 追加一个节点 到一个组
     * @param type 
     * @param data 
     * @param parent 
     * @param selected 
     */
    @action
    appendNode(type: string, data?: any, group?: string, _selected?: boolean): string {
        if (!group) group = '';

        //得到最后一条线
        let lastLink = this.store.getLastLink(group);

        //初始化数据
        this.store.draggingNodeType = type as FCNodeType;
        let ev: NodeEvent = { eType: NodeEventType.DragFCNode2Link, toLink: lastLink };

        //追加节点
        this.store.addNodeBy_DragFCNode2Link_Handler(ev);

        let lastKey = this.store.getLastFCNodeKey(group);

        //是否需要存储数据
        if (data) {
            this.saveNodeData(lastKey, data)
        }

        //返回追加的key
        return lastKey;

    }

    /**
     * 追加一个节点 到一个节点上
     * @param type 
     * @param data 
     * @param parent 
     * @param selected 
     */
    @action
    appendNodeToNode(type: string, nodeKey: string, _data?: any, _selected?: boolean): string {

        //得到点
        let node = this.store.getFCNode(nodeKey);
        if (node) {
            //初始化数据
            this.store.draggingNodeType = type as FCNodeType;
            let ev: NodeEvent = { eType: NodeEventType.DragFCNode2Node, toNode: node };

            //追加节点
            this.store.addNodeBy_DragFCNode2Node_Handler(ev);

            //返回点
            return this.store.getNodeKeyByFromKey(nodeKey);
        }

        //返回追加的key
        return '';

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
        let keys = this.store.getFCNodesByGroup(parentId);
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

        let n = this.store.getFirstFCNodeKey(parentId);
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
        this.store.model = this.store.deleteNodeByKey({ ...this.store.model }, key);
    }


    /**
     * 
     */
    render(): void {
        this.store.diagram.layoutDiagram(true);
    }

    /**
     * 得到一个点  及其点所对应的数据
     */
    private getNode = (key: string): ActionNode => {
        if (!!key) {
            var res = new ActionNode();
            let node = this.store.model.nodeDataArray.find(x => x.key === key);
            if (!!node) {

                if (!!node.group) res.parentKey = node.group;
                else res.parentKey = "root";

                if (node.category && guideNodeGRoupCategories.includes(node.category)) {
                    let childNNodes: string[] = [];
                    this.store.model.nodeDataArray.map(x => {
                        if (x.group === node!.key && x.category !== FCDiagramType.WFGuideNode) childNNodes.push(x.key);
                    });

                    // 就一个点时候
                    if (childNNodes.length <= 1) {
                        res.childKeys = childNNodes;
                    } else {
                        res.childKeys = this.store.getFCNodesByGroup(node!.key);
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


}



export default TaskFlowChartStore;