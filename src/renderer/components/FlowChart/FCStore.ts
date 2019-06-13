import { observable, action } from "mobx";
import go, { Diagram } from 'gojs';
import { DiagramModel } from 'react-gojs';
import { ITaskFlowChartRuntime } from '../../stores/TaskFlowChartStore';
import { FCNodeModel, FCLinkModel, FCDiagramType, NodeEventType, NodeEvent, FCNodeType, FcNode, FCNodeExtendsType } from './FCEntities';
import { DiagramSetting } from './FCSettings'

/**
 * 工作流上 激活的节点
 */
export class FlowChartNode {
    key: string = '';  // 对应一个activeID
    type: string = ''; // 节点类型
}

/**
 * 工作流程对外事件接口, 外部想要捕捉事件必须实现以下方法
 */
export interface IFlowChartStore {
    /**
     * 点击节点后将会触发的操作
     * @param current
     */
    onClickNodeHandler(current: FlowChartNode): void;

    /**
     * 删除节点
     */
    onDeleteNodeHander(current: FlowChartNode, model: any): void;
}


/**
 * 工作流 store 管理
 */
export class FlowChartStore {

    //private actionView: ITaskWorkflowActionView;
    private actionWorkflow: ITaskFlowChartRuntime;
    constructor(actionWorkflow: ITaskFlowChartRuntime) {
        this.actionWorkflow = actionWorkflow;
    }

    //private isGroupArr: FCNodeType[] = [FCNodeType.Condition, FCNodeType.Loop];

    //@observable drager: DragNodeEvent | null = null;
    @observable diagram: Diagram = new go.Diagram();
    @observable model: DiagramModel<FCNodeModel, FCLinkModel> = { nodeDataArray: [], linkDataArray: [] };
    @observable selectedNodeKeys: string[] = [];
    @observable currKey: string = '';
    @observable linkHightlight: boolean = false;
    @observable draggingNodeType: FCNodeType | null = null;


    /**
     * 选中节点
     */
    @action
    onNodeSelectionHandler = (key: string, isSelect: boolean): void => {
        if (isSelect) {
            this.currKey = key;
            let node: FCNodeModel | undefined = this.model.nodeDataArray.find(x => x.key == key);
            if (node && node.key)
                this.actionWorkflow.onClickNodeHandler({ key: node.key, type: node.wfType });
        }
    }

    /**
     * 左侧 拖拽节点  开始
     */
    @action
    onDragStartFCNodeHandler = (dragerType:FCNodeType): void => {
        let m = { ...this.model };
        m.linkDataArray.map(x => { x.opacity = 1; return x });
        this.model = m;
        this.linkHightlight = true;
        this.draggingNodeType = dragerType;
    }

    /**
     * 左侧 拖拽节点  结束
     */
    @action
    onDragEndFCNodeHandler = (): void => {
        this.linkHightlight = false;
        this.resetHightlightState()
    }

    /**
     * 流程图内 拖拽选中节点 开始 
     */
    @action
    onDragStartNodeHandler = (): void => {
        let m = { ...this.model };
        m.linkDataArray.map(x => {
            if (x.from == this.currKey || x.to == this.currKey) {
                x.opacity = 0;
            }
            else x.opacity = 1;
            return x;
        });
        this.model = m;

        this.linkHightlight = true;
    }

    /**
     * 流程图内 拖拽选中节点 结束 
     */
    @action
    onDragEndNodeHandler = (): void => {
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
        this.draggingNodeType = null;
    }

    /**
     * drop 压在node 后添加 node
     * @param state
     * @param payload
     */
    @action
    addNodeAfterDropNodeHandler = (_ev: NodeEvent, _isOnly: boolean = true, _data?: any): string => {
        console.log('--test--', this.appendNodeByNodeEvent(_ev));
        return '';

        // if (!ev.toNode || !ev.toNode.key) {
        //     return '';
        // }

        // if (ev.toNode.category === FCDiagramType.ConditionGroup) {
        //     console.log('条件组不支持拖放流程');
        //     return '';
        // }

        // if (isOnly) {
        //     if (ev.toNode.category === FCDiagramType.ConditionSwitch || ev.toNode.category === FCDiagramType.LoopGroup) {
        //         if (this.model.nodeDataArray.findIndex(x => x.group === ev.toNode!.key) > -1) {
        //             console.log('条件分支,循环 只能支持一个流程');
        //             return '';
        //         }
        //     }
        // }
       

        // let node: FCNodeModel | null = null;
        // let nodeAdd: boolean = false;
        // let linkAction: boolean = true;
        // let nodes_Con: FCNodeModel[] = [];
        // let links_Con: FCLinkModel[] = [];

        // // 1、锁定节点
        // // 1.1 如果是新节点
        // if (!this.isDragging) {
        //     return '';
        // }

        // node = this.getOneNode(this.drager.type, this.drager.name, ev.toNode.group);
        // // if (ev.eType === NodeEventType.Drag2Group) {
        // //     node.group = ev.toNode.key;
        // //     linkAction = false;
        // // }

        // if (this.isGroupArr.includes(this.drager.type)) {
        //     node.isGroup = true;
        //     if (this.drager.type === FCNodeType.Condition) {
        //         node.hasChild = true;
        //         // 1.2,如果是条件， 默认生成两个子条件
        //         let n: FCNodeModel;
        //         for (let i = 0; i < 2; i++) {
        //             n = this.getOneNode(FCNodeExtendsType.Branch, this.drager.name, node.key);
        //             // 1.2.1, 如果是子条件， 默认添加提示文本
        //             nodes_Con = [...nodes_Con, ...[n, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, n.key)]]
        //         }
        //         links_Con.push({
        //             ...this.getLink(nodes_Con[0].key, nodes_Con[2].key, nodes_Con[2].group, true)
        //         });
        //     } else if (this.drager.type === FCNodeType.Loop) {
        //         // 1.3,如果是循环， 默认生成两个字条件
        //         nodes_Con = [...nodes_Con, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, node.key)]
        //     }
        // } else {
        //     node = { ...node, ...{ data: _data } }
        // }
        // nodeAdd = true;

        // if (node!.key == '' || node == null) return '';

        // let oldLink: FCLinkModel;
        // let linkToRemoveIndex = -1;
        // const linksToAdd: FCLinkModel[] = [];
        // linkToRemoveIndex = this.model.linkDataArray.findIndex(x => x.from === ev.toNode!.key);
        // if (linkAction) {
        //     // 2、找出要移除的线
        //     if (linkToRemoveIndex > -1) {
        //         oldLink = this.model.linkDataArray[linkToRemoveIndex];
        //     }

        //     // 3、新增的两条线
        //     if (linkToRemoveIndex > -1) {
        //         linksToAdd.push(this.getLink(oldLink!.from, node!.key, oldLink!.group, false));
        //         linksToAdd.push(this.getLink(node!.key, oldLink!.to, oldLink!.group, false));
        //     } else {
        //         linksToAdd.push(this.getLink(ev.toNode!.key, node!.key, ev.toNode!.group, false));
        //     }
        // }

        // let m = { ...this.model };
        // // 4、压在提示文本上 ，删除提示文本
        // // if (ev.toNode.category == FCDiagramType.WFGuideNode) {
        // //     m = this.deleteOneNodeByKey(m, ev.toNode.key)
        // // }

        // m = {
        //     ...m,
        //     nodeDataArray: nodeAdd
        //         ? [...m.nodeDataArray, ...nodes_Con, node]
        //         : [...m.nodeDataArray, ...nodes_Con],
        //     linkDataArray:
        //         linkAction && linkToRemoveIndex > -1
        //             ? [
        //                 ...m.linkDataArray.slice(0, linkToRemoveIndex),
        //                 ...m.linkDataArray.slice(linkToRemoveIndex + 1),
        //                 ...linksToAdd,
        //                 ...links_Con
        //             ]
        //             : [...m.linkDataArray, ...linksToAdd, ...links_Con]
        // };

        // this.model = m;
        // this.resetHightlightState();
        // return node!.key;
    };

    /**
     * 移动 drop 压在link 后添加 node
     * @param NodeEvent
     */
    @action
    moveNodeAfterDropLinkHandler = (_ev: NodeEvent): void => {
        // if (!ev.toLink || !ev.toLink.from) {
        //     return;
        // }


        // if (ev.toLink.from === this.currKey || ev.toLink.to === this.currKey) return;



        // // 1、修改节点分组
        // for (let index = 0; index < this.model.nodeDataArray.length; index++) {
        //     const element = this.model.nodeDataArray[index];
        //     if (element.key === this.currKey) {
        //         //1、1 条件分支不可拖动
        //         if (element.category && element.category === FCDiagramType.ConditionSwitch)
        //             return;
        //         this.model.nodeDataArray[index].group = ev.toLink!.group;
        //         break;
        //     }
        // }


        // // 2、被压的线要移除(过滤掉被压的线条)
        // let fLineInd = -1;
        // let tLineInd = -1;
        // // let rmoveLineIndex = -1;
        // let links: FCLinkModel[] = []

        // // let fLine: FCLinkModel;        
        // // let tLine: FCLinkModel;
        // this.model.linkDataArray.map((x, ind) => {
        //     if (x.to === this.currKey) {
        //         fLineInd = ind;
        //     } else if (x.from === this.currKey) {
        //         tLineInd = ind;
        //     } else if (x.from === ev.toLink!.from && x.to === ev.toLink!.to) {
        //         // rmoveLineIndex = ind;
        //     } else {
        //         links.push(x);
        //     }
        // })


        // // 3、新增的两条线
        // const linksToAdd: FCLinkModel[] = [];

        // linksToAdd.push(this.getLink(ev.toLink.from, this.currKey, ev.toLink.group, false));
        // linksToAdd.push(this.getLink(this.currKey, ev.toLink.to, ev.toLink.group, false));
        // if (fLineInd > -1 && tLineInd > -1) {
        //     // 3、新增的1条线
        //     linksToAdd.push(this.getLink(this.model.linkDataArray[fLineInd].from, this.model.linkDataArray[tLineInd].to, this.model.linkDataArray[tLineInd].group, false));
        // }
        // // linkToRemoveIndex = this.model.linkDataArray.findIndex(
        // //     link => link.from === ev.toLink!.from && link.to === ev.toLink!.to
        // // );

        // let m = { ...this.model };

        // m = {
        //     ...m,
        //     linkDataArray: [...links, ...linksToAdd]
        // };

        // this.model = m;
        // this.resetHightlightState();
    };


    /**
     * drop 压在link 后添加 node
     * @param NodeEvent
     */
    @action
    addNodeAfterDropLinkHandler = (_ev: NodeEvent): void => {
        // if (!ev.toLink || !ev.toLink.from) {
        //     return;
        // }

        // let node: FCNodeModel;
        // let nodeAdd: boolean = false;

        // let nodes_Con: FCNodeModel[] = [];
        // let links_Con: FCLinkModel[] = [];


        // // 1.1 如果是新节点
        // if (!this.drager) {
        //     return;
        // }

        // // 1、锁定节点
        // node = this.getOneNode(this.drager.type, this.drager.name, ev.toLink.group);
        // if (this.isGroupArr.includes(this.drager.type)) {
        //     node.isGroup = true;
        //     if (this.drager.type === FCNodeType.Condition) {
        //         node.hasChild = true;
        //         // 1.2 默认生成两个字条件
        //         let n: FCNodeModel;
        //         for (let i = 0; i < 2; i++) {
        //             n = this.getOneNode(FCNodeExtendsType.Branch, this.drager.name, node.key);
        //             nodes_Con = [...nodes_Con, ...[n, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, n.key)]]
        //         }
        //         links_Con.push({
        //             ...this.getLink(nodes_Con[0].key, nodes_Con[2].key, nodes_Con[2].group, true)
        //         });
        //     } else if (this.drager.type === FCNodeType.Loop) {
        //         nodes_Con = [...nodes_Con, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, node.key)]
        //     }
        // }
        // nodeAdd = true

        // // 2、被压的线要移除
        // let linkToRemoveIndex = -1;
        // // 3、新增的两条线
        // const linksToAdd: FCLinkModel[] = [];

        // linksToAdd.push(this.getLink(ev.toLink.from, node.key, ev.toLink.group, false));
        // linksToAdd.push(this.getLink(node.key, ev.toLink.to, ev.toLink.group, false));
        // linkToRemoveIndex = this.model.linkDataArray.findIndex(
        //     link => link.from === ev.toLink!.from && link.to === ev.toLink!.to
        // );

        // let m = { ...this.model };

        // m = {
        //     ...m,
        //     nodeDataArray: nodeAdd
        //         ? [...m.nodeDataArray, ...nodes_Con, node]
        //         : [...m.nodeDataArray, ...nodes_Con],
        //     linkDataArray:
        //         linkToRemoveIndex > -1
        //             ? [
        //                 ...m.linkDataArray.slice(0, linkToRemoveIndex),
        //                 ...m.linkDataArray.slice(linkToRemoveIndex + 1),
        //                 ...linksToAdd,
        //                 ...links_Con
        //             ]
        //             : [...m.linkDataArray, ...linksToAdd, ...links_Con]
        // };

        // this.model = m;
        // this.resetHightlightState();
    };


    /**
     * 添加相同节点
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

            let node = this.getOneNode(FCNodeExtendsType.Branch, ev.toNode.label, ev.toNode.group);
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
                x.category = FCDiagramType.WFGuideLink;
            });



            this.model = {
                ...this.model,
                nodeDataArray: [...this.model.nodeDataArray, node, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, node.key)],
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

            var node = this.getOneNode(FCNodeExtendsType.Branch, `${ev.toNode.label}`, ev.toNode.group);

            var m = { ...this.model };
            if (ev.eType === NodeEventType.AddPrvNode && ind > 0) {
                m.nodeDataArray.splice(ind, 0, node);
            }

            if (ev.eType === NodeEventType.AddNextNode) {
                m.nodeDataArray.splice(ind + 1, 0, node);
            }

            this.model = {
                ...m,
                nodeDataArray: [...m.nodeDataArray, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, node.key)]
            };
        }
    };


    /**
     * 添加节点
     * @param state
     * @param ev
     */
    @action
    addNodeToParnetHandler = (node: FcNode, parentKey: string): string => {

        var newnode = this.getOneNode(node.fcType, node.name, parentKey);

        var m = { ...this.model };

        this.model = {
            ...m,
            nodeDataArray: [...m.nodeDataArray, newnode]
        };

        return newnode.key;

    };

    @action
    onRemoveSelectedNodeHandler = (): void => {
       
        //console.log('//TODO 去删除选中节点', this.currKey);
        let m = this.deleteNodeByKey(this.model, this.currKey);
        this.model = { ...m };
        this.currKey = '';
    };


    //得到一条线
    private getLink = (from: string, to: string, group: string, isCondition: boolean): FCLinkModel => {
        if (!from || from === to) return { from: '', to: '', group: '', isCondition: false };
        return {
            from: from,
            to: to,
            group: group,
            isCondition: isCondition,
            category: isCondition ? FCDiagramType.WFGuideLink : FCDiagramType.WFLink,
            opacity: 0
        };
    };


    /**
     * 得到一个节点
     */
    getOneNode = (wfType: FCNodeType | FCNodeExtendsType, name: string, group: string = ''): FCNodeModel => {
        let fcNode = new FcNode(wfType);
        return {
            wfType: wfType,
            group: group,
            label: name || fcNode.name,

            key: this.getRandomKey(),
            category: fcNode.FCDiagramType,
            isGroup: fcNode.isGroup,
            hasChild: false,
            opacity: 0,
        };
    };


    /**
     * 得到一个Key
     */
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
     * 追加一个节点后
     * 返回一个需要新增的点和线 
     */
    private appendNodeByNodeEvent = (ev: NodeEvent): DiagramModel<FCNodeModel, FCLinkModel> => {
        let d ={nodeDataArray:[],linkDataArray:[]};

        switch (ev.eType as NodeEventType) {
            case NodeEventType.Drag2Node:
                if(!ev.toNode) return d;
                    //node = this.getOneNode(ev.toNode.group);
                break;
        
            default:
                break;
        }  

        // 1.1 如果是新节点
        if (!ev) {
            return d;
        }

      
        // if (ev.eType === NodeEventType.Drag2Group) {
        //     node.group = ev.toNode.key;
        //     linkAction = false;
        // }

        // if (this.isGroupArr.includes(this.drager.type)) {
        //     node.isGroup = true;
        //     if (this.drager.type === FCNodeType.Condition) {
        //         node.hasChild = true;
        //         // 1.2,如果是条件， 默认生成两个子条件
        //         let n: FCNodeModel;
        //         for (let i = 0; i < 2; i++) {
        //             n = this.getOneNode(FCNodeExtendsType.Branch, this.drager.name, node.key);
        //             // 1.2.1, 如果是子条件， 默认添加提示文本
        //             nodes_Con = [...nodes_Con, ...[n, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, n.key)]]
        //         }
        //         links_Con.push({
        //             ...this.getLink(nodes_Con[0].key, nodes_Con[2].key, nodes_Con[2].group, true)
        //         });
        //     } else if (this.drager.type === FCNodeType.Loop) {
        //         // 1.3,如果是循环， 默认生成两个字条件
        //         nodes_Con = [...nodes_Con, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, node.key)]
        //     }
        // } else {
        //     node = { ...node, ...{ data: _data } }
        // }
        // nodeAdd = true;

        // if (node!.key == '' || node == null) return '';

        // let oldLink: FCLinkModel;
        // let linkToRemoveIndex = -1;
        // const linksToAdd: FCLinkModel[] = [];
        // linkToRemoveIndex = this.model.linkDataArray.findIndex(x => x.from === ev.toNode!.key);
        // if (linkAction) {
        //     // 2、找出要移除的线
        //     if (linkToRemoveIndex > -1) {
        //         oldLink = this.model.linkDataArray[linkToRemoveIndex];
        //     }

        //     // 3、新增的两条线
        //     if (linkToRemoveIndex > -1) {
        //         linksToAdd.push(this.getLink(oldLink!.from, node!.key, oldLink!.group, false));
        //         linksToAdd.push(this.getLink(node!.key, oldLink!.to, oldLink!.group, false));
        //     } else {
        //         linksToAdd.push(this.getLink(ev.toNode!.key, node!.key, ev.toNode!.group, false));
        //     }
        // }

        return d;      
    }

    /**
     * 删除一个点
     */
    // private deleteOneNodeByKey = (model: DiagramModel<FCNodeModel, FCLinkModel>, key: string): DiagramModel<FCNodeModel, FCLinkModel> => {

    //     //找到要删除的节点
    //     const nodeToRemoveIndex = model.nodeDataArray.findIndex(node => node.key === key);
    //     if (nodeToRemoveIndex === -1) {
    //         return model;
    //     }

    //     const curNode = model.nodeDataArray[nodeToRemoveIndex];
    //     // 删除该点对应的 关系线
    //     const removeLinks = model.linkDataArray.filter(x => {
    //         return x.from == key || x.to == key
    //     });

    //     if (removeLinks && removeLinks.length > 0) {
    //         removeLinks.forEach(curLink => {
    //             const linkToRemoveIndex = model.linkDataArray.findIndex(
    //                 link => link.from === curLink.from && link.to === curLink.to
    //             );
    //             if (linkToRemoveIndex > 1) {

    //                 model.linkDataArray = [
    //                     ...model.linkDataArray.slice(0, linkToRemoveIndex),
    //                     ...model.linkDataArray.slice(linkToRemoveIndex + 1)
    //                 ]
    //             }
    //         });
    //     }

    //     // 在组内删除的最后一个点，应该给回提示
    //     let nodeAdd: FCNodeModel[] = [];
    //     if (curNode.group !== "" && model.nodeDataArray.findIndex(node => node.key === curNode.group) < 0) {
    //         //增加一个提示节点
    //         nodeAdd = [...nodeAdd, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, curNode.group)]
    //     }


    //     return {
    //         ...model,
    //         nodeDataArray: [
    //             ...model.nodeDataArray.slice(0, nodeToRemoveIndex),
    //             ...model.nodeDataArray.slice(nodeToRemoveIndex + 1),
    //             ...nodeAdd
    //         ]
    //     };

    // }



    /**
    * 删除某一个节点
    */
    @action
    deleteNodeByKey(model: DiagramModel<FCNodeModel, FCLinkModel>, key: string): DiagramModel<FCNodeModel, FCLinkModel> {
        //1、找到要删除的节点
        const nodeToRemoveIndex = model.nodeDataArray.findIndex(node => node.key === key);
        const curNode = { ...model.nodeDataArray[nodeToRemoveIndex] };
        if (nodeToRemoveIndex === -1) {
            return model;
        } else {
            model.nodeDataArray = [
                ...model.nodeDataArray.slice(0, nodeToRemoveIndex),
                ...model.nodeDataArray.slice(nodeToRemoveIndex + 1)
            ]
        }

        let fromByCurNode = -1;
        let toByCurNode = -1;
        let newLink: FCLinkModel | undefined = undefined;
        //2、找到要删除该点对应的关系线
        const removeLinks = model.linkDataArray.filter((x, ind) => {
            if (x.from == key) fromByCurNode = ind;
            if (x.to == key) toByCurNode = ind;
            return x.from == key || x.to == key
        });

        //3、判断是否需要新增一条线
        if (fromByCurNode > -1 && toByCurNode > -1) {
            newLink = { ...model.linkDataArray[fromByCurNode] };
            newLink.from = model.linkDataArray[toByCurNode].from;
            //3.1 新增一条线
            model.linkDataArray.push(newLink);
        }

        //4、删除该点之前的两条线
        if (removeLinks && removeLinks.length > 0) {

            removeLinks.forEach(curLink => {
                const linkToRemoveIndex = model.linkDataArray.findIndex(
                    link => link.from === curLink.from && link.to === curLink.to
                );
                if (linkToRemoveIndex > -1) {
                    model.linkDataArray = [
                        ...model.linkDataArray.slice(0, linkToRemoveIndex),
                        ...model.linkDataArray.slice(linkToRemoveIndex + 1)
                    ]
                }
            });
        }


        //5、如果是组，则需要删除组内的所有元素
        let delKeys: Set<string> = new Set<string>();
        delKeys.add(curNode.key);
        //console.log(`----delKey-------`,toJS(curNode.key))
        if (curNode.isGroup) {
            //5.1递归删除点、线
            do {
                delKeys.forEach(x => {
                    let newNodes: FCNodeModel[] = [];
                    for (let index = 0; index < model.nodeDataArray.length; index++) {
                        const element = model.nodeDataArray[index];
                        if (element.group != x) {
                            newNodes.push(element);
                        } else {
                            // console.log(`----delKey-------`,toJS(curNode.key))
                            if (element.isGroup) {
                                delKeys.add(element.key); //递归做下一步循环
                            }
                        }
                    }

                    let newLinks: FCLinkModel[] = [];
                    for (let index = 0; index < model.linkDataArray.length; index++) {
                        const element = model.linkDataArray[index];
                        if (x !== element.group) {
                            newLinks.push(element);
                        }

                    }

                    delKeys.delete(x);
                    model.nodeDataArray = [...newNodes];
                    model.linkDataArray = [...newLinks];
                });


            } while (delKeys.size > 0);


        }


        //6、如果是删除组内删除的最后一个点，应该给回提示
        let nodeAdd: FCNodeModel[] = [];
        if (curNode.group !== "" && model.nodeDataArray.findIndex(node => node.key === curNode.group) < 0) {
            //增加一个提示节点
            nodeAdd = [...nodeAdd, this.getOneNode(FCNodeExtendsType.WFGuideNode, DiagramSetting.groupTip, curNode.group)]
        }

        this.currKey = '';
        return model;
    }
}