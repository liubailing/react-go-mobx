import { observable, action } from "mobx";
import go, { Diagram } from 'gojs';
import { DiagramModel } from 'react-gojs';
import { ITaskFlowChartRuntime } from '../../stores/TaskFlowChartStore';
import { FCNodeModel, FCLinkModel, FCDiagramType, NodeEventType, NodeEvent, FCNodeType, FcNode, FCNodeExtendsType } from './FCEntities';

const guideNodeCategories = [FCDiagramType.WFGuideStart, FCDiagramType.WFGuideEnd, FCDiagramType.WFGuideSubOpen, FCDiagramType.WFGuideSubClose, FCDiagramType.WFGuideNode];

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
    onDragStartFCNodeHandler = (dragerType: FCNodeType): void => {
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

    @action
    onRemoveSelectedNodeHandler = (): void => {

        //console.log('//TODO 去删除选中节点', this.currKey);
        let m = this.deleteNodeByKey({ ...this.model }, this.currKey);
        this.model = { ...m };
        this.currKey = '';
    };


    //得到一条线
    private getLink = (from: string, to: string, group: string, isCondition: boolean = false): FCLinkModel => {
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
     * 通过拖动Node释放在node的方式  添加 Node
     * @param state
     * @param payload
     */
    @action
    addNodeBy_DragNode2Link_Handler = (ev: NodeEvent): void => {
        if (!ev.toLink || !ev.toLink.from) {
            return;
        }

        this.model = this.appendNodeByNodeEvent(ev.eType, ev.toLink);
        this.draggingNodeType = null;
    }

    /**
     * 通过拖动FCNode释放在node的方式  添加 Node
     * @param state
     * @param payload
     */
    @action
    addNodeBy_DragFCNode2Link_Handler = (ev: NodeEvent): void => {
        if (!ev.toLink || !ev.toLink.from) {
            return;
        }

        this.model = this.appendNodeByNodeEvent(ev.eType, ev.toLink);

        this.draggingNodeType = null;

    }

    /**
     * 拖动 FCNode释放在Link的方式  添加 Node
     * @param state
     * @param payload
     */
    @action
    addNodeBy_DragFCNode2Node_Handler = (ev: NodeEvent): void => {
        if (!ev.toNode || !ev.toNode.key) {
            return;
        }

        if (ev.toNode.category === FCDiagramType.ConditionGroup) {
            console.log('条件组不支持拖放流程');
            return;
        }

        if (ev.toNode.category === FCDiagramType.ConditionSwitch || ev.toNode.category === FCDiagramType.LoopGroup) {
            if (this.model.nodeDataArray.findIndex(x => x.group === ev.toNode!.key) > -1) {
                console.log('条件分支,循环 只能支持一个流程');
                return;
            }
        }


        this.model = this.appendNodeByNodeEvent(ev.eType, ev.toNode);
        this.draggingNodeType = null;
    }


    /**
      * 添加相同节点
      * @param ev
      */
    @action
    addNodeBy_AddCondtionBranch_Handler = (ev: NodeEvent): void => {
        if (!ev.toNode || !ev.toNode.key) {
            return;
        }

        //得到该点的位置
        let oldlinkIndex = -1;
        //要删除的线
        //let oldlinkIndex: FCLinkModel;
        let link_Add: FCLinkModel[] = [];
        let d = this.getDiagramDataByFCNodeType(FCNodeExtendsType.Branch, undefined, ev.toNode.group)
        let node = d.nodeDataArray[0];
        console.log(`addNodeBy_AddCondtionBranch_Handler`, d)

        if (ev.eType === NodeEventType.AddNodeToBefore) {
            oldlinkIndex = this.model.linkDataArray.findIndex(x => x.to === ev.toNode!.key);
            if (oldlinkIndex < 0) {
                //在最前面添加一分支
                link_Add.push(this.getLink(node.key, ev.toNode!.key, ev.toNode!.group, true));
            }
        } else if (ev.eType === NodeEventType.AddNodeToAfter) {
            oldlinkIndex = this.model.linkDataArray.findIndex(x => x.from === ev.toNode!.key);
            if (oldlinkIndex < 0) {
                //在最后面添加一分支
                link_Add.push(this.getLink(ev.toNode!.key, node.key, ev.toNode!.group, true));
            }
        }

        if (oldlinkIndex > -1) {
            //找到原来的线
            let oldlink = this.model.linkDataArray[oldlinkIndex];
            link_Add = [
                this.getLink(oldlink.from, node.key, ev.toNode!.group, true),
                this.getLink(node.key, oldlink.to, ev.toNode!.group, true)
            ];
        }


        this.model = {
            ...this.model,
            nodeDataArray: [...this.model.nodeDataArray, node, ...d.nodeDataArray],
            linkDataArray:
                oldlinkIndex > -1
                    ? [
                        ...this.model.linkDataArray.slice(0, oldlinkIndex),
                        ...this.model.linkDataArray.slice(oldlinkIndex + 1),
                        ...link_Add,
                        ...d.linkDataArray]
                    : [
                        ...this.model.linkDataArray,
                        ...link_Add,
                        ...d.linkDataArray]
        }


    };



    /**
     * 追加一个节点后
     * 返回一个需要新增的点和线
     */
    private appendNodeByNodeEvent = (eType: NodeEventType, toItem: FCLinkModel | FCNodeModel): DiagramModel<FCNodeModel, FCLinkModel> => {

        let _model = { ...this.model };
        let toLink: FCLinkModel | undefined = undefined;
        let toNode: FCNodeModel | undefined = undefined;

        let dragBeforeGroup: string = ''; //拖动前所在组
        if (dragBeforeGroup) { }


        let actNode: FCNodeModel | undefined = undefined;

        //检测数据完整、合理性， 
        switch (eType as NodeEventType) {
            case NodeEventType.DragFCNode2Node:
                //检测数据完整、合理性，
                toNode = toItem as FCNodeModel;
                if (!toNode.key) return _model;
                if (!this.draggingNodeType) return _model;
                //准备数据
                let fc = new FcNode(this.draggingNodeType);
                actNode = this.getOneNode(this.draggingNodeType, fc.name, toNode!.group);
                break;
            case NodeEventType.DragFCNode2Link:
                //检测数据完整、合理性，
                toLink = toItem as FCLinkModel;
                if (!toLink.from) return _model;
                if (!this.draggingNodeType) return _model;

                //准备数据
                let fc1 = new FcNode(this.draggingNodeType);
                actNode = this.getOneNode(this.draggingNodeType, fc1.name, toLink!.group);
                break;
            case NodeEventType.DragNode2Link:
                //检测数据完整、合理性，
                toLink = toItem as FCLinkModel;
                if (!toLink.from) return _model;
                actNode = _model.nodeDataArray.find(x => x.key == this.currKey);
                if (actNode == undefined || !actNode.key) return _model
                if (actNode.key === toLink.from || actNode.key === toLink.to) return _model
                if (actNode.category == FCDiagramType.ConditionSwitch) return _model;
                dragBeforeGroup = actNode.group;// 记录拖动前所在组
                //准备数据
                actNode.group = toLink.group;
                break;
            default:
                break;
        }

        //得不到当前点 退出
        if (actNode == undefined || !actNode.key) return _model;


        //得到被压的线
        let fromNodeKey: string = '';
        let isGuideLink = false; //是否是辅助线
        let actLink: FCLinkModel | undefined = undefined;
        switch (eType as NodeEventType) {
            case NodeEventType.DragFCNode2Node:
                fromNodeKey = toNode!.key;
                actLink = _model.linkDataArray.find(x => x.from == toNode!.key);
                break;
            case NodeEventType.DragNode2Link:
            case NodeEventType.DragFCNode2Link:
                fromNodeKey = toLink!.from;
                actLink = toLink;
                break;
        }

        let d: DiagramModel<FCNodeModel, FCLinkModel> = { nodeDataArray: [], linkDataArray: [] };
        //找到了线  新增两条线
        if (actLink !== undefined && !!actLink.from) {
            d.linkDataArray.push(this.getLink(fromNodeKey, actNode.key, actLink.group, isGuideLink));
            d.linkDataArray.push(this.getLink(actNode.key, actLink.to, actLink.group, isGuideLink));
        } else if (actLink == undefined) {
            //找到了线  增加一条线
            d.linkDataArray.push(this.getLink(fromNodeKey, actNode.key, actNode.group, isGuideLink));
        }


        let delLinkIndexs: Set<number> = new Set();
        let delNodeIndexs: Set<number> = new Set();
        //找到要 删除线
        switch (eType as NodeEventType) {
            case NodeEventType.DragFCNode2Node:
                let delLinkIndex = _model.linkDataArray.findIndex(x => x.from == toNode!.key);
                delLinkIndexs.add(delLinkIndex);
                break;
            case NodeEventType.DragFCNode2Link:
            case NodeEventType.DragNode2Link:
                let delLinkIndex2 = _model.linkDataArray.findIndex(x => x.from == toLink!.from);
                delLinkIndexs.add(delLinkIndex2);
                let delLinkIndex3 = _model.linkDataArray.findIndex(x => x.to == toLink!.to);
                delLinkIndexs.add(delLinkIndex3);
        }


        //移出项 需要去检测是否需要 添加 提示节点 guide 的group
        let checkAddGuidGroups: Set<string> = new Set();
        //移入新 需要去检测是否需要 删除 提示节点 guide 的group
        let checkRemoveGuidGroups: Set<string> = new Set();
        /**
         * 1、 处理新增该类型的点后 ，返回相应的点和线
         * 2、 删除该移动该点后  删掉以前的点和线的关系
         */
        switch (eType as NodeEventType) {
            case NodeEventType.DragFCNode2Node:
            case NodeEventType.DragFCNode2Link:
                // 1、处理新增该类型的点后 ，返回相应的点和线
                let n = this.getDiagramDataByFCNodeType(actNode.wfType as FCNodeType, actNode, actNode.group);
                d = {
                    nodeDataArray: [...d.nodeDataArray, ...n.nodeDataArray],
                    linkDataArray: [...d.linkDataArray, ...n.linkDataArray]
                }

                // 2、移入新 需要去检测是否需要 删除 提示节点 guide 的group判断要不要删除'提示'点
                if (!!actNode.group) {
                    let groupNode = _model.nodeDataArray.find(x => x.key == actNode!.group);
                    if (groupNode && (groupNode.category == FCDiagramType.LoopGroup || groupNode.category == FCDiagramType.ConditionSwitch)) {
                        checkRemoveGuidGroups.add(actNode!.group);

                    }
                }

                // if (!!actNode.group) {
                //     let groupNode = _model.nodeDataArray.find(x => x.key == actNode!.group);
                //     if (groupNode && (groupNode.category == FCDiagramType.LoopGroup || groupNode.category == FCDiagramType.ConditionSwitch)) {
                //         // let guideIndex = _model.nodeDataArray.findIndex(x => x.group == actNode!.group && x.category == FCDiagramType.WFGuideNode);
                //         // if (guideIndex > -1) {
                //         //     let gKey = _model.nodeDataArray[guideIndex].key;
                //         //     delNodeIndexs.add(guideIndex);//要删除的点
                //         //     let flinkIndex = _model.linkDataArray.findIndex(x => x.from == gKey);                           
                //         //     let tlinkIndex = _model.linkDataArray.findIndex(x => x.to == gKey);
                //         //     delLinkIndexs.add(tlinkIndex);//要删除的线
                //         //     delLinkIndexs.add(flinkIndex);//要删除的线


                //         //     //要新增的线
                //         //     let open:FCNodeModel|undefined =  _model.nodeDataArray.find(x => x.group == actNode!.group && x.category == FCDiagramType.WFGuideSubOpen)
                //         //     let close:FCNodeModel|undefined =  _model.nodeDataArray.find(x => x.group == actNode!.group && x.category == FCDiagramType.WFGuideSubClose)
                //         //     if(open) linksAdd.push(this.getLink(open.key,actNode!.key,actNode!.group));
                //         //     if(close) linksAdd.push(this.getLink(actNode!.key,close.key,actNode!.group));

                //         // }
                //     }
                // }
                break;
            case NodeEventType.DragNode2Link:

                // 1、删除以前的线
                let flinkIndex = _model.linkDataArray.findIndex(x => x.from == actNode!.key);
                let tlinkIndex = _model.linkDataArray.findIndex(x => x.to == actNode!.key);
                if (flinkIndex > -1) delLinkIndexs.add(flinkIndex);
                delLinkIndexs.add(tlinkIndex);
                if (flinkIndex > -1 && tlinkIndex > -1) {
                    // 1.1、新增一条新链接线
                    d = {
                        ...d,
                        linkDataArray: [...d.linkDataArray,
                        this.getLink(_model.linkDataArray[tlinkIndex].from, _model.linkDataArray[flinkIndex].to, _model.linkDataArray[flinkIndex].group)
                        ]
                    }
                }

                // 2、移入新 需要去检测是否需要 删除 提示节点 guide 的group判断要不要删除'提示'点
                if (!!actNode.group) {
                    let groupNode = _model.nodeDataArray.find(x => x.key == actNode!.group);
                    if (groupNode && (groupNode.category == FCDiagramType.LoopGroup || groupNode.category == FCDiagramType.ConditionSwitch)) {
                        checkRemoveGuidGroups.add(actNode!.group);

                    }
                }

                // 3、移出项 需要去检测是否需要 添加 提示节点 guide 的group                
                if (!!dragBeforeGroup) {
                    let dragGroupNode = _model.nodeDataArray.find(x => x.key == dragBeforeGroup);
                    if (dragGroupNode && (dragGroupNode.category == FCDiagramType.LoopGroup || dragGroupNode.category == FCDiagramType.ConditionSwitch)) {
                        checkAddGuidGroups.add(dragBeforeGroup);

                    }
                }



                // 2、 移入新 需要去检测是否需要 删除 提示节点 guide 的group判断要不要删除'提示'点
                // if (!!actNode.group) {
                //     let groupNode = _model.nodeDataArray.find(x => x.key == actNode!.group);
                //     if (groupNode && (groupNode.category == FCDiagramType.LoopGroup || groupNode.category == FCDiagramType.ConditionSwitch)) {
                //         // let guideIndex = _model.nodeDataArray.findIndex(x => x.group == actNode!.group && x.category == FCDiagramType.WFGuideNode);
                //         // if (guideIndex > -1) {
                //         //     let gKey = _model.nodeDataArray[guideIndex].key;
                //         //     delNodeIndexs.add(guideIndex);//要删除的点
                //         //     let flinkIndex = _model.linkDataArray.findIndex(x => x.from == gKey);                           
                //         //     let tlinkIndex = _model.linkDataArray.findIndex(x => x.to == gKey);
                //         //     delLinkIndexs.add(tlinkIndex);//要删除的线
                //         //     delLinkIndexs.add(flinkIndex);//要删除的线


                //         //     //要新增的线
                //         //     let open:FCNodeModel|undefined =  _model.nodeDataArray.find(x => x.group == actNode!.group && x.category == FCDiagramType.WFGuideSubOpen)
                //         //     let close:FCNodeModel|undefined =  _model.nodeDataArray.find(x => x.group == actNode!.group && x.category == FCDiagramType.WFGuideSubClose)
                //         //     if(open) linksAdd.push(this.getLink(open.key,actNode!.key,actNode!.group));
                //         //     if(close) linksAdd.push(this.getLink(actNode!.key,close.key,actNode!.group));

                //         // }
                //     }
                // }

                // let isDelateLinks: boolean = true;  //是否是要执行删除操作
                // //  移出后  判断要不要新增'提示'点
                // if (!!dragBeforeGroup) {

                //     let guideTypes: FCDiagramType[] = [FCDiagramType.WFGuideSubOpen, FCDiagramType.WFGuideSubClose, FCDiagramType.WFGuideNode];
                //     let dragGroupNode = _model.nodeDataArray.find(x => x.key == dragBeforeGroup);
                //     if (dragGroupNode && (dragGroupNode.category == FCDiagramType.LoopGroup || dragGroupNode.category == FCDiagramType.ConditionSwitch)) {

                //         let addGuide = true;
                //         for (let index = 0; index < _model.nodeDataArray.length; index++) {
                //             const x = _model.nodeDataArray[index];
                //             if (x.category && x.group == dragBeforeGroup && !guideTypes.includes(x.category) && x.key!==actNode.key) //不是向导点且除了操作点。
                //             {
                //                 debugger;
                //                 addGuide = false;
                //                 break;
                //             }
                //         }

                //         // 追加一个指引node，且改变线的指引（用新增的点替换移出的）
                //         if (addGuide) {
                //             let fc = new FcNode(FCNodeExtendsType.WFGuideNode);
                //             let guideNode = this.getOneNode(fc.fcType, fc.name, dragBeforeGroup);
                //             _model.linkDataArray[flinkIndex].from = guideNode.key; // 替换移除的点
                //             _model.linkDataArray[tlinkIndex].to = guideNode.key; // 替换移除的点

                //             d = {
                //                 ...d,
                //                 nodeDataArray: [...d.nodeDataArray, guideNode]
                //             }

                //             isDelateLinks = false;
                //         }

                //     }
                // }               

                // //正常的删除
                // if (isDelateLinks) {                  
                //     delLinkIndexs.add(flinkIndex);//要删除的线
                //     delLinkIndexs.add(tlinkIndex);//要删除的线
                //     if (flinkIndex > -1 && tlinkIndex > -1) {
                //         let nn =  this.getLink(_model.linkDataArray[tlinkIndex].from, _model.linkDataArray[flinkIndex].to, _model.linkDataArray[flinkIndex].group);
                //         //console.log(' 移出后判断要不要新增提示点被移除的gropupId：' , nn)
                //         d = {
                //             ...d,
                //             linkDataArray: [...d.linkDataArray, 
                //                 nn
                //             ]
                //         }
                //     }
                // }

                break;

        }





        let links: FCLinkModel[] = [];
        let nodes: FCNodeModel[] = [];
        //删除多余的线
        _model.linkDataArray.forEach((x, index) => {
            if (!delLinkIndexs.has(index)) links.push(x);
        })

        //删除该删除的点
        _model.nodeDataArray.forEach((x, index) => {
            if (!delNodeIndexs.has(index)) nodes.push(x);
        });

        //第一次数据融合
        _model = {
            nodeDataArray: [...nodes, ...d.nodeDataArray],
            linkDataArray: [...links, ...d.linkDataArray]
        }

        /**
         *  第二次数据修正
         */
        if (checkAddGuidGroups.size > 0 || checkRemoveGuidGroups.size > 0) {
            delLinkIndexs.clear();
            delNodeIndexs.clear();
            let newNodes: FCNodeModel[] = [];
            let newLinks: FCLinkModel[] = [];
            let guideTypes: FCDiagramType[] = [FCDiagramType.WFGuideSubOpen, FCDiagramType.WFGuideSubClose, FCDiagramType.WFGuideNode];
            //新增提示 node
            checkAddGuidGroups.forEach(groupKey => {
                let addGuide = true;
                for (let index = 0; index < _model.nodeDataArray.length; index++) {
                    const x = _model.nodeDataArray[index];
                    if (x.group == groupKey && x.category && !guideTypes.includes(x.category)) //不是向导点且除了操作点。
                    {
                        addGuide = false;
                        break;
                    }
                }

                if (addGuide) {
                    let fc = new FcNode(FCNodeExtendsType.WFGuideNode);
                    let flinkIndex = _model.linkDataArray.findIndex(x => x.group == groupKey);
                    let guideNode = this.getOneNode(fc.fcType, fc.name, dragBeforeGroup);//要新增的点移除的点

                    newNodes.push(guideNode);
                    if (flinkIndex > -1) {
                        delLinkIndexs.add(flinkIndex);//要删除的线                  
                        newLinks.push(this.getLink(_model.linkDataArray[flinkIndex].from, guideNode.key, _model.linkDataArray[flinkIndex].group));//新增的线
                        newLinks.push(this.getLink(guideNode.key, _model.linkDataArray[flinkIndex].to, _model.linkDataArray[flinkIndex].group));//新增的线
                    }
                }

            });

            //删除提示 node
            checkRemoveGuidGroups.forEach(groupKey => {
                //let groupNode = _model.nodeDataArray.find(x => x.key == groupKey);
                let guideIndex = _model.nodeDataArray.findIndex(x => x.group == groupKey && x.category == FCDiagramType.WFGuideNode);
                if (guideIndex > -1) {
                    let gKey = _model.nodeDataArray[guideIndex].key;
                    delNodeIndexs.add(guideIndex);//要删除的点
                    let flinkIndex = _model.linkDataArray.findIndex(x => x.from == gKey);
                    let tlinkIndex = _model.linkDataArray.findIndex(x => x.to == gKey);
                    delLinkIndexs.add(tlinkIndex);//要删除的线
                    delLinkIndexs.add(flinkIndex);//要删除的线
                    if (flinkIndex > -1 && tlinkIndex > -1)
                        newLinks.push(this.getLink(_model.linkDataArray[tlinkIndex].from, _model.linkDataArray[flinkIndex].to, _model.linkDataArray[flinkIndex].group));
                }

            });


            //删除多余的线
            _model.linkDataArray.forEach((x, index) => {
                if (!delLinkIndexs.has(index)) newLinks.push(x);
            })

            //删除该删除的点
            _model.nodeDataArray.forEach((x, index) => {
                if (!delNodeIndexs.has(index)) newNodes.push(x);
            });

            //第二次数据修正
            _model = {
                nodeDataArray: [...newNodes],
                linkDataArray: [...newLinks]
            }

        }


        // console.log('--links--', toJS(links));
        // console.log('--.d.linkDataArray--', toJS(d.linkDataArray));
        // console.log('--test--', delLinkIndexs, toJS(_model.linkDataArray));
        // console.log('--checkGroups--', toJS(checkAddGuidGroups),'------------',checkRemoveGuidGroups);
        return _model;
    }


    /**
     *  按一个类型 增加制定类型节点，返回一个组成该类型所需要的点、线
     *  @param fcType
     *  @param node
     *  @param group
     */
    private getDiagramDataByFCNodeType = (fcType: FCNodeType | FCNodeExtendsType, node?: FCNodeModel, group?: string): DiagramModel<FCNodeModel, FCLinkModel> => {
        let d: DiagramModel<FCNodeModel, FCLinkModel> = { nodeDataArray: [], linkDataArray: [] };

        let actNode: FCNodeModel | undefined = undefined;

        if (!group) group = '';
        if (node && node.key) {
            actNode = node;
        }
        else {
            let fc = new FcNode(fcType);
            actNode = this.getOneNode(fcType, fc.name, group);
        }

        if (!actNode) return d;

        switch (fcType) {
            case FCNodeType.Condition:
                actNode.isGroup = true;
                group = actNode.key;
                let branch1 = this.getDiagramDataByFCNodeType(FCNodeExtendsType.Branch, undefined, group);
                let branch2 = this.getDiagramDataByFCNodeType(FCNodeExtendsType.Branch, undefined, group);
                d = {
                    nodeDataArray: [actNode, ...branch1.nodeDataArray, ...branch2.nodeDataArray],
                    linkDataArray: [
                        ...branch1.linkDataArray,
                        ...branch2.linkDataArray,
                        this.getLink(branch1.nodeDataArray[0].key, branch2.nodeDataArray[0].key, group, true)
                    ]
                }
                break;
            case FCNodeType.Loop:
            case FCNodeExtendsType.Branch:
                actNode.isGroup = true;
                group = actNode.key;
                let fc = new FcNode(FCNodeExtendsType.SubOpen);
                let open = this.getOneNode(fc.fcType, fc.name, group);
                fc = new FcNode(FCNodeExtendsType.SubClose);
                let close = this.getOneNode(fc.fcType, fc.name, group);
                fc = new FcNode(FCNodeExtendsType.WFGuideNode);
                let guide = this.getOneNode(fc.fcType, fc.name, group);

                d = {
                    nodeDataArray: [actNode, open, guide, close],
                    linkDataArray: [this.getLink(open.key, guide.key, group), this.getLink(guide.key, close.key, group)]
                }
                break;
            default:
                d = {
                    ...d,
                    nodeDataArray: [actNode]
                }
                break;
        }

        return d;
    }


    /**
    * 删除某一个节点  以及循环删除该节点内的所有点、线
    */
    @action
    deleteNodeByKey(_model: DiagramModel<FCNodeModel, FCLinkModel>, key: string): DiagramModel<FCNodeModel, FCLinkModel> {

        //1、找到要删除的节点
        const nodeToRemoveIndex = _model.nodeDataArray.findIndex(node => node.key === key);
        if (nodeToRemoveIndex === -1) return _model;


        let delLinkIndexs: Set<number> = new Set<number>();
        let delNodeIndexs: Set<number> = new Set<number>();
        let addLinks: FCLinkModel[] = [];
        let checkAddGuidGroups: Set<string> = new Set<string>();
        //得到当前节点
        const curNode = { ..._model.nodeDataArray[nodeToRemoveIndex] };
        delNodeIndexs.add(nodeToRemoveIndex);

        let fromByCurNode = -1;
        let toByCurNode = -1;
        //2、找到要删除该点对应的关系线
        _model.linkDataArray.forEach((x, ind) => {
            if (x.from == key) {
                fromByCurNode = ind;
                delLinkIndexs.add(ind);
            }
            if (x.to == key) {
                toByCurNode = ind;
                delLinkIndexs.add(ind);
            }
        });



        //3、判断是否需要新增一条线
        if (fromByCurNode > -1 && toByCurNode > -1) {
            let newLink = { ..._model.linkDataArray[fromByCurNode] };
            newLink.from = _model.linkDataArray[toByCurNode].from;
            //3.1 新增一条线
            addLinks.push(newLink);
        }

        if (curNode.category && (curNode.category === FCDiagramType.LoopGroup || curNode.category === FCDiagramType.ConditionGroup || curNode.category === FCDiagramType.ConditionSwitch)) {
            //5、如果是组，则需要删除组内的所有元素
            let delKeys: Set<string> = new Set<string>();
            delKeys.add(curNode.key);
            //console.log(`----delKey-------`,toJS(curNode.key))
            if (curNode.isGroup) {
                //5.1递归删除点、线
                do {
                    delKeys.forEach(x => {
                        //let newNodes: FCNodeModel[] = [];
                        for (let index = 0; index < _model.nodeDataArray.length; index++) {
                            const element = _model.nodeDataArray[index];
                            if (element.group != x) {

                                //newNodes.push(element);
                            } else {
                                // console.log(`----delKey-------`,toJS(curNode.key))
                                delNodeIndexs.add(index);
                                if (element.isGroup) {
                                    delKeys.add(element.key); //递归做下一步循环
                                }
                            }
                        }

                        //let newLinks: FCLinkModel[] = [];
                        for (let index = 0; index < _model.linkDataArray.length; index++) {
                            const element = _model.linkDataArray[index];
                            if (x !== element.group) {

                                //newLinks.push(element);
                            } else {
                                delLinkIndexs.add(index);
                            }

                        }

                        delKeys.delete(x);
                        // model.nodeDataArray = [...newNodes];
                        // model.linkDataArray = [...newLinks];
                    });


                } while (delKeys.size > 0);

            }

        }

        let newNodes: FCNodeModel[] = [];
        let newLinks: FCLinkModel[] = [];

        _model.nodeDataArray.forEach((x, ind) => {
            if (!delNodeIndexs.has(ind)) newNodes.push(x);
        })

        _model.linkDataArray.forEach((x, ind) => {
            if (!delLinkIndexs.has(ind)) newLinks.push(x);
        })

        _model = {
            nodeDataArray: [...newNodes],
            linkDataArray: [...newLinks, ...addLinks]
        }


        /**
         *  第二次数据修正
         */
        if (!!curNode.group) {
            let groupNode = this.getFCNode(curNode.group);
            if (groupNode && groupNode.category && (groupNode.category === FCDiagramType.LoopGroup || groupNode.category === FCDiagramType.ConditionSwitch))
                checkAddGuidGroups.add(groupNode.key);
        }
        if (checkAddGuidGroups.size > 0) {
            delLinkIndexs.clear();
            delNodeIndexs.clear();
            newNodes = [];
            newLinks = [];
            //新增提示 node
            checkAddGuidGroups.forEach(groupKey => {

                let fc = new FcNode(FCNodeExtendsType.WFGuideNode);
                let flinkIndex = _model.linkDataArray.findIndex(x => x.group == groupKey);
                let guideNode = this.getOneNode(fc.fcType, fc.name, groupKey);//要新增的点

                newNodes.push(guideNode);
                if (flinkIndex > -1) {
                    delLinkIndexs.add(flinkIndex);//要删除的线                  
                    newLinks.push(this.getLink(_model.linkDataArray[flinkIndex].from, guideNode.key, _model.linkDataArray[flinkIndex].group));//新增的线
                    newLinks.push(this.getLink(guideNode.key, _model.linkDataArray[flinkIndex].to, _model.linkDataArray[flinkIndex].group));//新增的线
                }

            });



            //删除多余的线
            _model.linkDataArray.forEach((x, index) => {
                if (!delLinkIndexs.has(index)) newLinks.push(x);
            })

            //删除该删除的点
            _model.nodeDataArray.forEach((x, index) => {
                if (!delNodeIndexs.has(index)) newNodes.push(x);
            });

            //第二次数据修正
            _model = {
                nodeDataArray: [...newNodes],
                linkDataArray: [...newLinks]
            }

        }


        //1、找到要删除的节点
        const nodeToRemoveIndex1 = _model.nodeDataArray.findIndex(node => node.key === key);
        if (nodeToRemoveIndex1 > -1) {
            return _model = {
                ..._model,
                nodeDataArray: [..._model.nodeDataArray.slice(0, nodeToRemoveIndex1), ..._model.nodeDataArray.slice(nodeToRemoveIndex1 + 1)]
            };
        }

        this.currKey = '';
        return _model;
    }







    /***************************************************************************
     **********  辅助方法  *************
     **************************************************************************/

    /**
     * 得到第一个操作点，(向导点除外)
     */
    getFirstFCNodeKey = (group: string): string => {
        //找到第一条
        let firstLink = this.getFirstLink(group);
        if (firstLink) {
            //确定这点不是 向导点
            let fNode = this.model.nodeDataArray.find(x => x.key == firstLink!.to && x.category && !guideNodeCategories.includes(x.category));
            if (fNode && fNode.key) return fNode.key;
        }

        return '';
    }

    /**
     * 得到最后一个点，(向导点除外)
     */
    getLastFCNodeKey = (group: string): string => {
        //找到最后
        let lastLink = this.getLastLink(group);
        if (lastLink) {
            //确定这点不是 向导点
            let lNode = this.model.nodeDataArray.find(x => x.key == lastLink!.from && x.category && !guideNodeCategories.includes(x.category));
            if (lNode && lNode.key) return lNode.key;
        }

        return '';
    }

    /**
     * 得到第一条线
     */
    getFirstLink = (group: string): FCLinkModel | undefined => {
        if (!group || group == 'root') group = '';
        //找到起始节点
        let startNode = this.model.nodeDataArray.find(x => x.group == group && (x.category == FCDiagramType.WFGuideStart || x.category == FCDiagramType.WFGuideSubOpen));

        if (startNode && startNode.key) {
            //找到第一条
            let firstLink = this.model.linkDataArray.find(x => x.from == startNode!.key);
            if (firstLink && firstLink.to) {
                return firstLink;
            }
        }

        return undefined;
    }

    /**
     * 得到最后条线
     */
    getLastLink = (group: string): FCLinkModel | undefined => {
        if (!group || group == 'root') group = '';
        // 找到最后节点
        let endNode = this.model.nodeDataArray.find(x => x.group == group && (x.category == FCDiagramType.WFGuideEnd || x.category == FCDiagramType.WFGuideSubClose));

        if (endNode && endNode.key) {
            // 找到最后线
            let lastLink = this.model.linkDataArray.find(x => x.to == endNode!.key);
            if (lastLink && lastLink.to) {
                return lastLink;
            }
        }

        return undefined;

    }

    /**
     * 得到一个点  及其点所对应的数据
     */
    getFCNode = (key: string): FCNodeModel | undefined => {
        if (!!key) {
            //确定这点不是 向导点
            let fNode = this.model.nodeDataArray.find(x => x.key == key && x.category && !guideNodeCategories.includes(x.category));
            if (fNode && fNode.key) return fNode;
        }
        return undefined
    }


    /**
     * 得到一个点  及其点所对应的数据
     */
    getNodeKeyByFromKey = (fromKey: string): string => {
        if (!!fromKey) {
            //确定这点不是 向导点
            let flink = this.model.linkDataArray.find(x => x.from == fromKey);
            if (flink && flink.to) {
                let node = this.getFCNode(flink.to);
                if (node) return node.key;
            }
        }
        return ''
    }




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
     * 得到当前组的字节点，并按顺序排好
     */
    getFCNodesByGroup = (group: string): string[] => {
        let f = this.getFirstFCNodeKey(group);
        if (!!f) {
            let keys: string[] = [f];
            while (!!f) {
                f = this.getNodeKeyByFromKey(keys[keys.length - 1]);
                if (!!f) keys.push(f);
            }
            return keys;
        }

        return [];
    }

}