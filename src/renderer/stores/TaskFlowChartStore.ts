import { observable, action } from "mobx";
import go, { Diagram } from 'gojs';
import { DiagramModel } from 'react-gojs';

import { DiagramSetting, DiagramState, FCNodeModel, FCLinkModel, DiagramCategory, NodeEventType, DragNodeEvent, NodeEvent, FCNodeType,FcNode } from '../components/FlowChart/FlowChartSetting';

/**
 * 工作流上 激活的节点
 */
export class ActionNode {
    key: string = '';  // 对应一个activeID
    type: string = ''; // 节点类型
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
export interface ITaskFlowChartRuntime {
    /**
     * 点击节点后将会触发的操作
     * @param current
     */
    onClickNodeHandler(current: ActionNode): void;

    /**
     * 删除节点
     */
    onDeleteNodeHander(current: ActionNode, model: any): void;
}

/**
 *  外部 操作 工作流 接口
 */
export interface ITaskFlowChartStore {

    /**
     * 得到第一个节点
     */
    getFirstNode(): ActionNode;

    /**
    * 得到第一个节点
    */
    getNodesByRoot(): ActionNode[];


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
}

/**
 * 工作流 store 管理
 */
export class TaskFlowChart {

    //private actionView: ITaskWorkflowActionView;
    private actionWorkflow: ITaskFlowChartRuntime;
    constructor(actionWorkflow: ITaskFlowChartRuntime) {
        this.actionWorkflow = actionWorkflow;
    }

    /** *******************************
     * 
     * 触发外部接口
     * 
     */


    // onClickNodeHandler = async (current: ActionNode): Promise<void> => {
    //     this.actionWorkflow.onClickNodeHandler(current);
    // }

    /** 
     * 
     * 触发外部接口
     * 
    *********************************/


    private isGroupArr: FCNodeType[] = [FCNodeType.Condition, FCNodeType.Loop];

    @observable drager: DragNodeEvent | null = null;
    @observable diagram: Diagram = new go.Diagram();
    @observable model: DiagramModel<FCNodeModel, FCLinkModel> = { nodeDataArray: [], linkDataArray: [] };
    @observable selectedNodeKeys: string[] = [];
    @observable currKey: string = '';
    @observable linkHightlight: boolean = false;


    @action
    onNodeSelectionHandler = (key: string, isSelect: boolean): void => {
        if (isSelect) {
            this.currKey = key;
            let node: FCNodeModel | undefined = this.model.nodeDataArray.find(x => x.key == key);
            if (node && node.key)
                this.actionWorkflow.onClickNodeHandler({ key: node.key, type: node.wfType, data: node.data, parentKey: node.group, childKeys: [''] });
        }
    }


    @action
    onDragStartFCNodeHandler = (ev: DragNodeEvent): void => {
        let m = { ...this.model };
        m.linkDataArray.map(x => { x.opacity = 1; return x });
        this.model = m;

        this.linkHightlight = true;
        this.drager = ev;
    }


    @action
    onDragEndFCNodeHandler = (): void => {
        this.linkHightlight = false;
        this.resetHightlightState()
    }


    /**
     * 重置状态
     */
    @action
    resetHightlightState = (): void => {

        let m = { ...this.model };

        m.linkDataArray.map(x => { x.opacity = 0; return x });

        this.model = m;
        this.drager = null;
    }


    /**
     * drop 压在node 后添加 node
     * @param state
     * @param payload
     */
    @action
    addNodeAfterDropNodeHandler = (ev: NodeEvent): void => {
        if (!ev.toNode || !ev.toNode.key) {
            return;
        }

        if (ev.toNode.category === DiagramCategory.ConditionGroup) {
            console.log('条件组不支持拖放流程');
            return;
        }


        if (ev.toNode.category === DiagramCategory.ConditionSwitch || ev.toNode.category === DiagramCategory.LoopGroup) {
            if (this.model.nodeDataArray.findIndex(x => x.group === ev.toNode!.key) > -1) {
                console.log('条件分支,循环 只能支持一个流程');
                return;
            }
        }

        let node: FCNodeModel | null = null;
        let nodeAdd: boolean = false;
        let linkAction: boolean = true;
        let nodes_Con: FCNodeModel[] = [];
        let links_Con: FCLinkModel[] = [];

        // 1、锁定节点
        switch (ev.eType) {
            case NodeEventType.Drag2Node:
            case NodeEventType.Drag2Group:
                // 1.1 如果是新节点
                if (!this.drager) {
                    return;
                }

                node = this.getOneNode(this.drager.type, this.drager.name, ev.toNode.group);
                if (ev.eType === NodeEventType.Drag2Group) {
                    node.group = ev.toNode.key;
                    linkAction = false;
                }

                if (this.isGroupArr.includes(this.drager.type)) {
                    node.isGroup = true;
                    if (this.drager.type === FCNodeType.Condition) {
                        node.hasChild = true;
                        // 1.2 默认生成两个字条件
                        let n: FCNodeModel;
                        for (let i = 0; i < 2; i++) {
                            n = this.getOneNode(FCNodeType.ConditionSwitch, this.drager.name, node.key, true);
                            nodes_Con = [...nodes_Con, ...[n, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, n.key, false)]]
                        }
                        links_Con.push({
                            ...this.getLink(nodes_Con[0].key, nodes_Con[2].key, nodes_Con[2].group, true)
                        });
                    } else if (this.drager.type === FCNodeType.Loop) {
                        nodes_Con = [...nodes_Con, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, node.key, false)]
                    }
                }
                nodeAdd = true;
                break;
            case NodeEventType.Move2Node:
            case NodeEventType.Move2Group:
                break;
            default:
                return;
        }

        if (node!.key == '' || node == null) return;

        let oldLink: FCLinkModel;
        let linkToRemoveIndex = -1;
        const linksToAdd: FCLinkModel[] = [];
        linkToRemoveIndex = this.model.linkDataArray.findIndex(x => x.from === ev.toNode!.key);
        if (linkAction) {
            if (linkToRemoveIndex > -1) {
                oldLink = this.model.linkDataArray[linkToRemoveIndex];
            }

            // 3、新增的两条线
            if (linkToRemoveIndex > -1) {
                linksToAdd.push(this.getLink(oldLink!.from, node!.key, oldLink!.group, false));
                linksToAdd.push(this.getLink(node!.key, oldLink!.to, oldLink!.group, false));
            } else {
                linksToAdd.push(this.getLink(ev.toNode!.key, node!.key, ev.toNode!.group, false));
            }
        }

        let m = { ...this.model };
        // 压在辅助点上
        if (ev.toNode.category == DiagramCategory.WFGuideNode) {
            m = this.deleteOneNodeByKey(m, ev.toNode.key)
        }

        m = {
            ...m,
            nodeDataArray: nodeAdd
                ? [...m.nodeDataArray, ...nodes_Con, node]
                : [...m.nodeDataArray, ...nodes_Con],
            linkDataArray:
                linkAction && linkToRemoveIndex > -1
                    ? [
                        ...m.linkDataArray.slice(0, linkToRemoveIndex),
                        ...m.linkDataArray.slice(linkToRemoveIndex + 1),
                        ...linksToAdd,
                        ...links_Con
                    ]
                    : [...m.linkDataArray, ...linksToAdd, ...links_Con]
        };

        this.model = m;
        this.resetHightlightState();
    };

    /**
     * 移动 drop 压在link 后添加 node
     * @param state
     * @param payload
     */
    @action
    moveNodeAfterDropLinkHandler = (ev: NodeEvent): void => {
        if (!ev.toLink || !ev.toLink.from) {
            return;
        }


        // 1、修改节点分组
        this.model.nodeDataArray.map(x => {
            if (x.key === this.currKey) {
                x.group = ev.toLink!.group;
            }
        })



        // 2、被压的线要移除(过滤掉被压的线条)
        let fLineInd = -1;
        let tLineInd = -1;
        let rmoveLineIndex = -1;
        let links: FCLinkModel[] = []

        // let fLine: FCLinkModel;        
        // let tLine: FCLinkModel;
        this.model.linkDataArray.map((x, ind) => {
            if (x.to === this.currKey) {
                fLineInd = ind;
            } else if (x.from === this.currKey) {
                tLineInd = ind;
            } else if (x.from === ev.toLink!.from && x.to === ev.toLink!.to) {
                rmoveLineIndex = ind;
            } else {
                links.push(x);
            }
        })


        // 3、新增的两条线
        const linksToAdd: FCLinkModel[] = [];

        linksToAdd.push(this.getLink(ev.toLink.from, this.currKey, ev.toLink.group, false));
        linksToAdd.push(this.getLink(this.currKey, ev.toLink.to, ev.toLink.group, false));
        if (fLineInd > -1 && tLineInd > -1) {
            // 3、新增的1条线
            linksToAdd.push(this.getLink(this.model.linkDataArray[fLineInd].from, this.model.linkDataArray[tLineInd].to, this.model.linkDataArray[tLineInd].group, false));
        }
        // linkToRemoveIndex = this.model.linkDataArray.findIndex(
        //     link => link.from === ev.toLink!.from && link.to === ev.toLink!.to
        // );

        let m = { ...this.model };

        m = {
            ...m,
            linkDataArray: [...links, ...linksToAdd]
        };

        this.model = m;
        this.resetHightlightState();
    };


    /**
     * drop 压在link 后添加 node
     * @param state
     * @param payload
     */
    @action
    addNodeAfterDropLinkHandler = (ev: NodeEvent): void => {
        if (!ev.toLink || !ev.toLink.from) {
            return;
        }

        let node: FCNodeModel;
        let nodeAdd: boolean = false;

        let nodes_Con: FCNodeModel[] = [];
        let links_Con: FCLinkModel[] = [];
        // 1、锁定节点
        switch (ev.eType) {
            case NodeEventType.Drag2Link:
                // 1.1 如果是新节点
                if (!this.drager) {
                    return;
                }
                node = this.getOneNode(this.drager.type, this.drager.name, ev.toLink.group);
                if (this.isGroupArr.includes(this.drager.type)) {
                    node.isGroup = true;
                    if (this.drager.type === FCNodeType.Condition) {
                        node.hasChild = true;
                        // 1.2 默认生成两个字条件
                        let n: FCNodeModel;
                        for (let i = 0; i < 2; i++) {
                            n = this.getOneNode(FCNodeType.ConditionSwitch, this.drager.name, node.key, true);
                            nodes_Con = [...nodes_Con, ...[n, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, n.key, false)]]
                        }
                        links_Con.push({
                            ...this.getLink(nodes_Con[0].key, nodes_Con[2].key, nodes_Con[2].group, true)
                        });
                    } else if (this.drager.type === FCNodeType.Loop) {
                        nodes_Con = [...nodes_Con, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, node.key, false)]
                    }
                }
                nodeAdd = true;
                break;
            case NodeEventType.Move2Link:
                // 1.2 如果是拖动已有节点
                const ind = this.model.nodeDataArray.findIndex(x => x.key === this.currKey);
                if (ind < 0) {
                    return;
                }
                node = this.model.nodeDataArray[ind];
                break;
            default:
                return;
        }

        // 2、被压的线要移除
        let linkToRemoveIndex = -1;
        // 3、新增的两条线
        const linksToAdd: FCLinkModel[] = [];

        linksToAdd.push(this.getLink(ev.toLink.from, node.key, ev.toLink.group, false));
        linksToAdd.push(this.getLink(node.key, ev.toLink.to, ev.toLink.group, false));
        linkToRemoveIndex = this.model.linkDataArray.findIndex(
            link => link.from === ev.toLink!.from && link.to === ev.toLink!.to
        );

        let m = { ...this.model };

        m = {
            ...m,
            nodeDataArray: nodeAdd
                ? [...m.nodeDataArray, ...nodes_Con, node]
                : [...m.nodeDataArray, ...nodes_Con],
            linkDataArray:
                linkToRemoveIndex > -1
                    ? [
                        ...m.linkDataArray.slice(0, linkToRemoveIndex),
                        ...m.linkDataArray.slice(linkToRemoveIndex + 1),
                        ...linksToAdd,
                        ...links_Con
                    ]
                    : [...m.linkDataArray, ...linksToAdd, ...links_Con]
        };

        this.model = m;
        this.resetHightlightState();
    };


    /**
     * 添加相同节点
     * @param state
     * @param ev
     */
    @action
    addNodeBySelfHandler = (ev: NodeEvent): void => {
        if (!ev.toNode || !ev.toNode.key) {
            return;
        }

        // 测试树形模式 和 grid 模式
        if (DiagramSetting.test) {
            let ind = -1;
            let oldline: FCLinkModel;
            let link_Add: FCLinkModel[] = [];

            let node = this.getOneNode(FCNodeType.ConditionSwitch, ev.toNode.label, ev.toNode.group, true);
            if (ev.eType === NodeEventType.AddPrvNode) {
                ind = this.model.linkDataArray.findIndex(x => x.to === ev.toNode!.key);
                if (ind < 0) {
                    link_Add.push(this.getLink(node.key, ev.toNode!.key, ev.toNode!.group, true));
                } else {
                    // oldline = this.model.linkDataArray[ind];
                    // link_Add = [this.getLink(oldline.from,node.key,ev.toNode!.group),this.getLink(node.key,oldline.to,ev.toNode!.group)]
                }
            } else {
                ind = this.model.linkDataArray.findIndex(x => x.from === ev.toNode!.key);
                if (ind < 0) {
                    link_Add.push(this.getLink(ev.toNode!.key, node.key, ev.toNode!.group, true));
                } else {
                }
            }

            if (ind > -1) {
                oldline = this.model.linkDataArray[ind];
                link_Add = [
                    this.getLink(oldline.from, node.key, ev.toNode!.group, true),
                    this.getLink(node.key, oldline.to, ev.toNode!.group, true)
                ];
            }

            link_Add.map(x => {
                x.category = DiagramCategory.WFGuideLink;
            });



            this.model = {
                ...this.model,
                nodeDataArray: [...this.model.nodeDataArray, node, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, node.key, false)],
                linkDataArray:
                    ind > -1
                        ? [
                            ...this.model.linkDataArray.slice(0, ind),
                            ...this.model.linkDataArray.slice(ind + 1),
                            ...link_Add
                        ]
                        : [...this.model.linkDataArray, ...link_Add]
            }
        } else {
            const ind = this.model.nodeDataArray.findIndex(x => x.key === ev.toNode!.key);
            if (ind < 0) {
                return;
            }

            var node = this.getOneNode(FCNodeType.ConditionSwitch, `${ev.toNode.label}`, ev.toNode.group, true);

            var m = { ...this.model };
            if (ev.eType === NodeEventType.AddPrvNode && ind > 0) {
                m.nodeDataArray.splice(ind, 0, node);
            }

            if (ev.eType === NodeEventType.AddNextNode) {
                m.nodeDataArray.splice(ind + 1, 0, node);
            }

            this.model = {
                ...m,
                nodeDataArray: [...m.nodeDataArray, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, node.key, false)]
            };
        }
    };


    /**
     * 删除节点
     */
    @action
    removeNodeHandler = (payload: NodeEvent): void => {
        if (payload.eType != NodeEventType.Delete) return;
        const nodeToRemoveIndex = this.model.nodeDataArray.findIndex(node => node.key === payload.key);
        if (nodeToRemoveIndex === -1) {
            return;
        }
        const curNode = this.model.nodeDataArray[nodeToRemoveIndex];
        // 在组内删除的最后一个点，应该给回提示
        let nodeAdd: FCNodeModel[] = [];
        if (curNode.group !== "" && payload.modelChanged!.nodeDataArray.filter(node => { return node.group === curNode.group }).length === 0) {
            //增加一个提示节点
            nodeAdd = [...nodeAdd, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, curNode.group, false)]
        }

        this.model = {
            ...this.model,
            nodeDataArray: [
                ...payload.modelChanged!.nodeDataArray,
                ...nodeAdd
            ],
            linkDataArray: payload.newLinks
                ? [...payload.modelChanged!.linkDataArray, ...payload.newLinks]
                : payload.modelChanged!.linkDataArray
        };
        this.currKey = '';
    };


    private getLink = (from: string, to: string, group: string, isCondition: boolean): FCLinkModel => {
        if (!from || from === to) return { from: '', to: '', group: '', isCondition: false };
        return {
            from: from,
            to: to,
            group: group,
            isCondition: isCondition,
            category: isCondition ? DiagramCategory.WFGuideLink : DiagramCategory.WFLink,
            opacity: 0
        };
    };

    /**
     * 
     * @param wfType 得到分类
     */
    getCategoryByType(wfType: FCNodeType): string {
        var cate = DiagramCategory.FCNode;
        switch (wfType) {
            case FCNodeType.Data:
            case FCNodeType.SubEnd:
            case FCNodeType.Input:
            case FCNodeType.LoopBreak:
            case FCNodeType.MouseClick:
            case FCNodeType.MouseHover:
            case FCNodeType.OpenWeb:
            case FCNodeType.Switch:
            case FCNodeType.Verify:
                cate = DiagramCategory.FCNode;
                break;
            case FCNodeType.ConditionSwitch:
                cate = DiagramCategory.ConditionSwitch;
                break;
            case FCNodeType.Loop:
                cate = DiagramCategory.LoopGroup;
                break;
            case FCNodeType.Condition:
                cate = DiagramCategory.ConditionGroup;
                break;
            case FCNodeType.Start:
                cate = DiagramCategory.Start;
                break;
            case FCNodeType.End:
                cate = DiagramCategory.End;
                break;
            case FCNodeType.WFGuideNode:
                cate = DiagramCategory.WFGuideNode;
                break;
            default:
                cate = DiagramCategory.FCNode;
                break;
        }

        return cate;
    }

    private getOneNode = (wfType: FCNodeType, payload: string, group: string = '', isGroup: boolean = false, isCond: boolean = false): FCNodeModel => {

        return {
            key: this.getRandomKey(),
            label: payload,
            wfType: wfType,
            group: group,
            isGroup: isGroup,
            hasChild: false,
            opacity: 0,
            category: this.getCategoryByType(wfType)
        };
    };


    private getRandomKey = (len: number = 8): string => {
        len = len < 1 ? 8 : len;
        let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'; /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        let maxPos = $chars.length;
        let pwd = '';
        for (let i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    };


    /**
     * 删除一个点
     */
    private deleteOneNodeByKey = (model: DiagramModel<FCNodeModel, FCLinkModel>, key: string): DiagramModel<FCNodeModel, FCLinkModel> => {

        //找到要删除的节点
        const nodeToRemoveIndex = model.nodeDataArray.findIndex(node => node.key === key);
        if (nodeToRemoveIndex === -1) {
            return model;
        }

        const curNode = model.nodeDataArray[nodeToRemoveIndex];
        // 删除该点对应的 关系线
        const removeLinks = model.linkDataArray.filter(x => {
            return x.from == key || x.to == key
        });

        if (removeLinks && removeLinks.length > 0) {
            removeLinks.forEach(curLink => {
                const linkToRemoveIndex = model.linkDataArray.findIndex(
                    link => link.from === curLink.from && link.to === curLink.to
                );
                if (linkToRemoveIndex > 1) {

                    model.linkDataArray = [
                        ...model.linkDataArray.slice(0, linkToRemoveIndex),
                        ...model.linkDataArray.slice(linkToRemoveIndex + 1)
                    ]
                }
            });
        }

        // 在组内删除的最后一个点，应该给回提示
        let nodeAdd: FCNodeModel[] = [];
        if (curNode.group !== "" && model.nodeDataArray.findIndex(node => node.key === curNode.group) < 0) {
            //增加一个提示节点
            nodeAdd = [...nodeAdd, this.getOneNode(FCNodeType.WFGuideNode, DiagramSetting.groupTip, curNode.group, false)]
        }


        return {
            ...model,
            nodeDataArray: [
                ...model.nodeDataArray.slice(0, nodeToRemoveIndex),
                ...model.nodeDataArray.slice(nodeToRemoveIndex + 1),
                ...nodeAdd
            ]
        };

    }
}



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
        let baseDate = false;

        if (baseDate) {
            if (!nodes || nodes.length < 0) {
                nodes = [
                    { key: 'Begin', label: '', wfType: FCNodeType.Start as string, group: '', isGroup: false },
                    { key: 'End', label: '', wfType: FCNodeType.End as string, group: '', isGroup: false }
                ];

            }

            if (!links || links.length < 0) {
                links = [
                    { from: 'Begin', to: 'End', group: '', isCondition: false }
                ]
            }
        } else {
            if (!nodes || nodes.length < 0) {
                nodes = [
                    { key: 'Begin', label: '起始', wfType: FCNodeType.Start as string, group: '', isGroup: false },
                    { key: 'node1', label: '打开网页', wfType: FCNodeType.OpenWeb as string, group: '', isGroup: false },
                    { key: 'test', label: '测试节点', wfType: FCNodeType.OpenWeb as string, group: '', isGroup: false },
                    { key: 'node456', label: '循环网页', wfType: FCNodeType.OpenWeb as string, group: 'loop', isGroup: false },
                    { key: 'loop', label: '循环', wfType: FCNodeType.Loop as string, group: '', isGroup: true },
                    { key: 'cond', label: '条件', wfType: FCNodeType.Condition as string, group: '', isGroup: true },
                    { key: 'cond1', label: '分支1', wfType: FCNodeType.ConditionSwitch as string, group: 'cond', isGroup: true },
                    { key: 'cond2', label: '分支2', wfType: FCNodeType.ConditionSwitch as string, group: 'cond', isGroup: true },
                    { key: 'data', label: '提取数据', wfType: FCNodeType.Data as string, group: 'cond2', isGroup: false },
                    { key: 'End', label: '', wfType: FCNodeType.End as string, group: '', isGroup: false }
                ];

            }

            if (!links || links.length < 0) {
                links = [
                    { from: 'Begin', to: 'node1', group: '', isCondition: false },
                    { from: 'node1', to: 'cond', group: '', isCondition: false },
                    { from: 'cond', to: 'loop', group: '', isCondition: false },
                    { from: 'loop', to: 'End', group: '', isCondition: false },
                    { from: 'cond1', to: 'cond2', group: 'cond', isCondition: true }
                ]
            }
        }

        nodes.map(x => {
            //this.tempData[x.key]= x.data;
            if (!x.data) x.data = {};
            x.category = this.store.getCategoryByType(x.wfType as FCNodeType);
        })


        links.map(x => {
            x.category = x.isCondition ? DiagramCategory.WFGuideLink : DiagramCategory.WFLink;
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
    appendNode(type: string, data?: any, parent?: string, selected?: boolean): string {
        
        let node = this.store.model.nodeDataArray.find(x => x.key === parent);
        //this.props.store.onDragStartFCNodeHandler({ type: this.props.type, name: this.state.title, event: event } as DragNodeEvent);
        let fcNode =  new FcNode(type as FCNodeType);
        this.store.drager = ({ type: fcNode.fcType, name: fcNode.name, event: {} } as DragNodeEvent)
        //this.props.store.onDragStartFCNodeHandler;
        if(!parent) parent = '';
        let link = this.getLastLink(parent);
        this.store.addNodeAfterDropLinkHandler({ eType: NodeEventType.Drag2Node, toLink: link });
        return ''
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
    private getFirstFCNode = (group: string): FCNodeModel|undefined => {
        let l = this.getFirstLink(group);
        if(l){
             // 找到起始线条              
             for (let index = 0; index <  this.store.model.nodeDataArray.length; index++) {
                const element =  this.store.model.nodeDataArray[index];
                if( l.from  === element.key)
                {
                    return element;
                    break;
                }
                
            }
        }

        return undefined;
    }

    /**
     * 得到最后一个点
     */
    private getLastFCNode = (group: string): FCNodeModel|undefined => {
        let l = this.getLastLink(group);
        if(l){
             // 找到起始线条              
             for (let index = 0; index <  this.store.model.nodeDataArray.length; index++) {
                const element =  this.store.model.nodeDataArray[index];
                if( l.to  === element.key)
                {
                    return element;
                    break;
                }
                
            }
        }

        return undefined;
    }

    /**
     * 得到第一条线
     */
    private getFirstLink= (group: string): FCLinkModel|undefined => {
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
        if(!f) {
            for (let index = 0; index <  this.store.model.linkDataArray.length; index++) {
                const element =  this.store.model.linkDataArray[index];
                if(f === element.from)
                {
                    return element;
                    break;
                }
                
            }
        } 
        return undefined;
    }

    /**
     * 得到最后条线
     */
    private getLastLink= (group: string):  FCLinkModel|undefined => {
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
        let t: string = '';
        for (let i = 0; i < tos.length; i++) {
            if (!forms.includes(tos[i])) {
                t = tos[i];
                break;
            }

        }

        if(!t) {
            for (let index = 0; index <  this.store.model.linkDataArray.length; index++) {
                const element =  this.store.model.linkDataArray[index];
                if(t === element.to)
                {
                    return element;
                    break;
                }                
            }
        } 
        return undefined;
    
    }

    private getNode = (key: string): ActionNode => {
        if (!!key) {
            var res = new ActionNode();
            let node = this.store.model.nodeDataArray.find(x => x.key === key);
            if (!!node) {
                //res.data = this.tempData[key];                
                // res.key = key;
                // res.data = node.data;
                // let plink = this.store.model.linkDataArray.find(x => x.to === key);
                // if (plink && plink.from != '') {
                //     let p = this.store.model.nodeDataArray.find(x => x.key == plink!.from);
                //     if (p) res.parentKey = p.key;
                // }  else if(node.group)  //如果没有 plink   用groupId当上级节点
                //  res.parentKey = node.group

                // let cLink = this.store.model.linkDataArray.find(x => x.from === key);
                // if (cLink && cLink.from != '') {
                //     let c = this.store.model.nodeDataArray.find(x => x.key == cLink!.from);
                //     if (c) res.childKeys = [c.key];
                // }

                if (!!node.group) res.parentKey = node.group;
                else res.parentKey = "root";

                if (node.category && [DiagramCategory.ConditionGroup, DiagramCategory.ConditionSwitch, DiagramCategory.LoopGroup].includes(node.category)) {
                    let childNNodes: string[] = [];
                    this.store.model.nodeDataArray.map(x => {
                        if (x.group === node!.key && x.category !== DiagramCategory.WFGuideNode) childNNodes.push(x.key);
                    });

                    // 就一个点时候
                    if (childNNodes.length <= 1) {
                        res.childKeys = childNNodes;
                    } else {
                        //找到组内所有的点和线
                        let links: FCLinkModel[] = [];
                        let forms: string[] = [];
                        let tos: string[] = [];
                        this.store.model.linkDataArray.map(x => {
                            if (x.group === node!.key) {
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
                            child.add(f);
                        }

                        res.childKeys = Array.from(child);
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
     * 得到第一个节点
     */
    getNodesByRoot(): ActionNode[] {
        return []
    }

    /**
     * 得到第一个节点
     */
    getFirstNode(): ActionNode {
        return new ActionNode;
    }

}

export default TaskFlowChartStore;

