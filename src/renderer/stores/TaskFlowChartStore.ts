import { observable, action } from "mobx";
import { FlowChartStore, FlowChartNode, IFlowChartStore } from '../components/FlowChart/FCStore';
import { FCNodeModel, FCLinkModel, FCDiagramType, FCNodeType, getFCDiagramType, NodeEventType, NodeEvent } from '../components/FlowChart/FCEntities';
import { DiagramModel } from 'react-gojs';
// import { Diagram } from 'gojs';
// import { DiagramSetting } from '../components/FlowChart/FCSettings';



const guideNodeGRoupCategories = [FCDiagramType.LoopGroup, FCDiagramType.ConditionSwitch, FCDiagramType.ConditionGroup];

/**
 * 工作流上 激活的节点
 */
export class ActionNode extends FlowChartNode {
    parentKey?: string = ''; //父节点
    childKeys?: string[] = [];
    data?: any = {};      // 当前节点的数据
    parent?: ActionNode | undefined = undefined; //父节点
    childs?: ActionNode[] = [];
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
    init(node?: ActionNode): void;

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

    @observable private storeData = {};
    // @observable private tempData:any={};
    constructor(props: TaskFlowChart) {
        this.store = props;
    }



    //初始化数据
    private initData(parent: ActionNode, childs?: ActionNode[]): DiagramModel<FCNodeModel, FCLinkModel> {
        let d: DiagramModel<FCNodeModel, FCLinkModel> = { nodeDataArray: [], linkDataArray: [] };

        let links: FCLinkModel[] = [];
        let nodes: FCNodeModel[] = [];

        if (!childs || childs.length < 1) {
            let loopStart = this.store.getFCNodeModel(FCNodeType.SubOpen);
            loopStart.group = parent.key;
            let loopEnd = this.store.getFCNodeModel(FCNodeType.SubClose);
            loopEnd.group = parent.key;
            let guide = this.store.getFCNodeModel(FCNodeType.WFGuideNode);
            guide.group = parent.key;

            links.push(this.store.getFCLinkModel(loopStart.key, guide.key, parent.key));
            links.push(this.store.getFCLinkModel(guide.key, loopEnd.key, parent.key));
            nodes.push(loopStart);
            nodes.push(loopEnd);
            nodes.push(guide);


            return {
                nodeDataArray: [...d.nodeDataArray, ...nodes],
                linkDataArray: [...d.linkDataArray, ...links]
            };
        };


        childs.forEach((x, i) => {
            if (i == 0 || i == childs.length) {
            } else {
                links.push(this.store.getFCLinkModel(childs[i - 1].key, childs[i].key, parent.key, parent.type == ActionNodeType.Condition));
            }
            nodes.push(this.getFCNodeModel(x, parent.key));

            switch (x.type) {
                case ActionNodeType.Condition:
                case ActionNodeType.Loop:
                case ActionNodeType.Branch:
                    //如果有子集                 
                    let c = this.initData(x, x.childs);
                    d = {
                        nodeDataArray: [...d.nodeDataArray, ...c.nodeDataArray],
                        linkDataArray: [...d.linkDataArray, ...c.linkDataArray]
                    };
                    break;
                default:
                    break
            }





            this.storeData[x.key] = x.data;
        })


        switch (parent.type) {
            case ActionNodeType.Condition:
                break;
            case ActionNodeType.Branch:
            // let branchStart = this.store.getFCNodeModel(FCNodeType.SubOpen);
            // branchStart.group = parent.key;
            // let branchEnd = this.store.getFCNodeModel(FCNodeType.SubClose);
            // branchEnd.group = parent.key;
            // links.push(this.store.getFCLinkModel(branchStart.key, nodes[0].key, parent.key));
            // links.push(this.store.getFCLinkModel(nodes[nodes.length - 1].key, branchEnd.key, parent.key));
            // nodes.push(branchStart);
            // nodes.push(branchEnd);
            // break;
            case ActionNodeType.Loop:
                let loopStart = this.store.getFCNodeModel(FCNodeType.SubOpen);
                loopStart.group = parent.key;
                let loopEnd = this.store.getFCNodeModel(FCNodeType.SubClose);
                loopEnd.group = parent.key;
                links.push(this.store.getFCLinkModel(loopStart.key, nodes[0].key, parent.key));
                links.push(this.store.getFCLinkModel(nodes[nodes.length - 1].key, loopEnd.key, parent.key));
                nodes.push(loopStart);
                nodes.push(loopEnd);
                break
            default:
                let start = this.store.getFCNodeModel(FCNodeType.Start);
                let end = this.store.getFCNodeModel(FCNodeType.End);
                links.push(this.store.getFCLinkModel(start.key, nodes[0].key, parent.key));
                links.push(this.store.getFCLinkModel(nodes[nodes.length - 1].key, end.key, parent.key));
                nodes.push(start);
                nodes.push(end);
                break;

        }

        return {
            nodeDataArray: [...d.nodeDataArray, ...nodes],
            linkDataArray: [...d.linkDataArray, ...links]
        };
    }

    private getFCNodeModel(node: ActionNode, parentkey: string): FCNodeModel {
        let f = this.store.getFCNodeModel(node.type);
        let n: FCNodeModel = {
            type: node.type,
            group: '',
            label: f.label,
            key: node.key,
            diagramType: f.diagramType,
            isGroup: f.isGroup
        };
        n.category = n.diagramType;
        return { ...n, ...{ group: parentkey } };
    }

    // private getFCNodeModel(fcType: string): FCNodeModel {
    //     let node = { key: 'Begin', label: '', type: '', group: '', isGroup: false };

    //     switch (fcType) {
    //         case ActionNodeType.Branch:
    //             node.type = FCDiagramType.ConditionSwitch;
    //             break;
    //         case ActionNodeType.Loop:
    //             node.type = FCDiagramType.LoopGroup;
    //             break;
    //         case ActionNodeType.Condition:
    //             node.type = FCDiagramType.ConditionGroup;
    //             break;
    //         default:
    //             node.type = FCDiagramType.FCNode;
    //             break;
    //     }

    //     return node;
    // }



    /**
    * 初始化
    * @param node 
    */
    @action
    init(node?: ActionNode) {
        let nodes: FCNodeModel[] = [];
        let links: FCLinkModel[] = [];
        if (!node || !node.childs || node.childs.length < 1) {
            let start = this.store.getFCNodeModel(FCNodeType.Start);
            let end = this.store.getFCNodeModel(FCNodeType.End);
            nodes = [
                start,
                end
            ];
            links = [
                this.store.getFCLinkModel(start.key, end.key, end.group)
            ];

            if (!!node && node.childs && node.childs.length > 0) {

            }


            nodes.map(x => {
                x.diagramType = getFCDiagramType(x.type as FCNodeType);
            });

        } else {
            let d = this.initData(node, node.childs);
            links = d.linkDataArray;
            nodes = d.nodeDataArray;
        }

        // links.map(x => {
        //     x.diagramType = x.isCondition ? FCDiagramType.WFGuideLink : FCDiagramType.WFLink;
        // })

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
        if (!group) group = 'root';
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
     * 得到所有节点  转换成直观的树形
     */
    @action
    getAll(): ActionNode {
        debugger;
        let keys = this.store.getFCNodeKeysByGroup("root");
        let res = { key: 'root', type: 'root', parentKey: '', childKeys: keys, childs: this.getFCNodes(keys) } as ActionNode;
        return res;
    }

    /**
     * 得到当前组的字节点，并按顺序排好
     */
    private getFCNodes = (keys: string[]): ActionNode[] => {

        let a: ActionNode[] = [];
        let n: ActionNode | undefined = undefined;

        keys.forEach(x => {
            n = this.getNode(x);
            if (!!n && !!n.key && n.childKeys && n.childKeys.length > 0) {
                n.childs = this.getFCNodes(n.childKeys)
            }
            a.push(n);
        });

        return a;
    }


    /**
     * 保存某一个节点的 data 数据
     * @param key 
     * @param data 
     */
    @action
    saveNodeData(key: string, data: any) {
        // let node: FCNodeModel | undefined = this.store.model.nodeDataArray.find(x => x.key == key);
        // if (node) {
        //     node.data = data;
        //     // this.store.model = {
        //     //     ...this.store.model,
        //     //     nodeDataArray: [...this.store.model.nodeDataArray, node]
        //     // }
        // }
        this.storeData[key] = data;
        //this.tempData[key]= data;
        return true

    }



    /**
     * 得到某一节点
     * @param key 
     */
    getNodeByKey(key: string): ActionNode {
        let node = this.getNode(key);
        return { ...node, ...{ data: this.storeData[key] } };
    }


    /**
     * 得到某一类型节点
     * @param key 
     */
    getNodesByType(type: ActionNodeType): ActionNode[] {
        let arr: ActionNode[] = [];
        this.store.model.nodeDataArray.map(x => {
            if (x.type == type as string) {
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
        let keys = this.store.getFCNodeKeysByGroup(parentId);
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

                if (node.diagramType && guideNodeGRoupCategories.includes(node.diagramType)) {
                    if (node.diagramType === FCDiagramType.ConditionGroup)
                        res.childKeys = this.store.getFCNodeKeysByGroup2(node!.key);
                    else
                        res.childKeys = this.store.getFCNodeKeysByGroup(node!.key);
                    // let childNNodes: string[] = [];
                    // this.store.model.nodeDataArray.map(x => {
                    //     if (x.group === node!.key && x.diagramType !== FCDiagramType.WFGuideNode) childNNodes.push(x.key);
                    // });

                    // // 就一个点时候
                    // if (childNNodes.length <= 1) {
                    //     res.childKeys = childNNodes;
                    // } else {

                    // }
                } else {
                    res.childKeys = [];
                }

            }
            if (node && node.type)
                return { ...res, ...node, ...{ type: node!.type } };
            else
                return { ...res, ...node };
        }
        return { key: '', type: '', parentKey: '', childKeys: [], data: null }
    }

}



export default TaskFlowChartStore;