import React, { Component } from 'react';
import go from 'gojs';
import { observer } from "mobx-react";
import { FCNodeModel, FCLinkModel, FCDiagramType, NodeEventType, NodeEvent } from './FCEntities';
import { DiagramColors } from './FCSettings';
import { TaskFlowChart } from '../../stores/TaskFlowChartStore';
import FlowChartDiagram from './FlowChartDiagram'
import './FlowChartDroper.less';


export interface WFDroperState {
    title: '',
    src: ''
}


export interface WFDroperProps {
    store: TaskFlowChart,

}

let oldLink: any;
let oldGroup: any;
let oldNode: any;
const groups = [FCDiagramType.LoopGroup, FCDiagramType.ConditionGroup, FCDiagramType.ConditionSwitch];

const ClearDragerWithout = (str: string) => {
    if (str !== 'l' && oldLink instanceof go.Link) {
        var node = (oldLink as any).part;
        if (node && node.category == FCDiagramType.WFLink && node.diagram) {
            node.diagram.startTransaction('Change color');

            let btn = node.findObject('btn_add');
            if (btn) {
                btn.fill = DiagramColors.link_icon_bg;
            }
            node.diagram.commitTransaction('Change color');
        }
        oldLink = null;
    }

    if (str !== 'g' && oldGroup instanceof go.Group) {
        let node = (oldGroup as any).part;
        if (groups.includes(node.category)) {
            // node.diagram.startTransaction("Change color");

            // let shape = node.findObject("group_Body");
            // if (shape)  shape.fill =DiagramColors.group_bg;

            // let top = node.findObject("group_Top");
            // if (top) top.background =DiagramColors.group_bg;

            // let title = node.findObject("group_Title");
            // if (title) title.stroke =DiagramColors.group_font;

            // node.diagram.commitTransaction("Change color");

            oldGroup = null;
        }
    }

    if (str !== 'n' && oldNode instanceof go.Node) {
        let node = (oldNode as any).part;
        if (node.category == FCDiagramType.FCNode) {
            node.diagram.startTransaction('Change color');

            let shape = node.findObject('node_Body');
            if (shape) shape.fill = DiagramColors.backgroud;

            node.diagram.commitTransaction('Change color');
        }
        oldNode = null;
    }
};

@observer
class WFDroper extends Component<WFDroperProps, WFDroperState> {
    constructor(props: WFDroperProps) {
        super(props);

        this.state = {
            title: '',
            src: ''
        }
    }


    render() {
        return (
            <div
                className="divFCDiagram"
                style={{ backgroundColor: DiagramColors.diagram_bg }}
                onDragEnter={(event: any) => {

                    if (!this.props.store.draggingNodeType) {
                        event.preventDefault();
                        return;
                    }

                    event.target.style.backgroundColor = DiagramColors.diagram_drag_bg;
                    //console.log('-------------------onDragEnter ----------------');
                }}
                onDragLeave={(event: any) => {
                    if (!this.props.store.draggingNodeType) {
                        event.preventDefault();
                        return;
                    }
                    event.target.style.backgroundColor = DiagramColors.diagram_bg;
                    //console.log('-------------------onDragLeave ----------------');
                }}
                // onMouseMove={(event: any) => {
                //     event.preventDefault();

                //     if (!this.props.store.draggingNodeType) return;
                //     console.log('-------------------onMouseMove ----------------');
                // }}
                onDragOver={(event: any) => {
                    event.preventDefault();
                    if (!this.props.store.draggingNodeType) {
                        return;
                    }

                    event.target.style.backgroundColor = DiagramColors.diagram_drag_bg;
                    const myDiagram = this.props.store.diagram;
                    let pixelratio = myDiagram.computePixelRatio();

                    // Dragging onto a Diagram
                    if (event && event.clientX) {
                        var can = event.target;
                        // var pixelratio = window.devicePixelRatio;
                        // if the target is not the canvas, we may have trouble, so just quit:
                        if (!(can instanceof HTMLCanvasElement)) return;
                        var bbox = can.getBoundingClientRect();
                        var bbw = bbox.width;
                        if (bbw === 0) bbw = 0.001;
                        var bbh = bbox.height;
                        if (bbh === 0) bbh = 0.001;
                        var mx = event.clientX - bbox.left * (can.width / pixelratio / bbw);
                        var my = event.clientY - bbox.top * (can.height / pixelratio / bbh);
                        var point = myDiagram.transformViewToDoc(new go.Point(mx, my));
                        var curnode: any = myDiagram.findPartAt(point, true);

                        if (curnode && curnode.part) {
                            if (curnode instanceof go.Link) {
                                var node = (curnode as any).part;
                                if (node.category === FCDiagramType.WFLink) {
                                    node.diagram.startTransaction('Highlighted');

                                    let btn = node.findObject('btn_add');
                                    if (btn) {
                                        btn.fill = DiagramColors.link_highlight;
                                    }

                                    node.diagram.commitTransaction('Highlighted');

                                    oldLink = curnode;
                                    ClearDragerWithout('l');
                                }
                            } else if (curnode instanceof go.Group) {

                                var node = (curnode as any).part;
                                if (groups.includes(node.category)) {

                                    oldGroup = curnode;
                                    ClearDragerWithout('g');
                                }
                            } else if (curnode instanceof go.Node) {

                                let node = (curnode as any).part;
                                if (node.category === FCDiagramType.FCNode) {
                                    node.diagram.startTransaction('Change color');

                                    let nbody = node.findObject('node_Body');
                                    if (nbody) nbody.fill = DiagramColors.highlight;

                                    node.diagram.commitTransaction('Change color');
                                    oldNode = curnode;
                                    ClearDragerWithout('n');
                                }
                            }
                        } else {
                            ClearDragerWithout('');
                        }
                    }
                }}
                onDrop={(event: any) => {
                    event.preventDefault();
                    if (!this.props.store.draggingNodeType) return;

                    event.target.style.backgroundColor = '';
                    const myDiagram = this.props.store.diagram;
                    let pixelratio = myDiagram.computePixelRatio();
                    // prevent default action
                    // (open as link for some elements in some browsers)
                    event.preventDefault();
                    // Dragging onto a Diagram
                    if (event && event.clientX) {
                        var can = event.target;
                        // var pixelratio = window.devicePixelRatio;
                        // if the target is not the canvas, we may have trouble, so just quit:
                        if (!(can instanceof HTMLCanvasElement)) return;
                        var bbox = can.getBoundingClientRect();
                        var bbw = bbox.width;
                        if (bbw === 0) bbw = 0.001;
                        var bbh = bbox.height;
                        if (bbh === 0) bbh = 0.001;
                        var mx = event.clientX - bbox.left * (can.width / pixelratio / bbw);
                        var my = event.clientY - bbox.top * (can.height / pixelratio / bbh);
                        var point = myDiagram.transformViewToDoc(new go.Point(mx, my));
                        var curnode: any = myDiagram.findPartAt(point, true);


                        if (curnode && curnode.part) {
                            if (curnode instanceof go.Link) {
                                let ev: NodeEvent = { eType: NodeEventType.DragFCNode2Link, toLink: curnode.part!.data as FCLinkModel }
                                //this.props.store.addNodeAfterDropLinkHandler(ev);
                                this.props.store.addNodeBy_DragFCNode2Link_Handler(ev);


                                //console.log(' wfDroper  on Link')
                            } else if (curnode instanceof go.Group) {
                                //console.log(' wfDroper Group ');
                            } else if (curnode instanceof go.Node) {
                                let ev: NodeEvent = { eType: NodeEventType.DragFCNode2Node, toNode: curnode.part!.data as FCNodeModel }
                                this.props.store.addNodeBy_DragFCNode2Node_Handler(ev);
                                //console.log('wfDroper Node');
                            } else {
                            }
                        }

                        ClearDragerWithout('');
                        this.props.store.onDragEndFCNodeHandler();
                    }
                }}
            >
                <FlowChartDiagram store={this.props.store} />
            </div>
        );
    }
};

export default WFDroper;