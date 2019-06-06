import React, { Component } from 'react';
import go, { Diagram, ToolManager, GraphObject } from 'gojs';
import { ModelChangeEvent, GojsDiagram, ModelChangeEventType } from 'react-gojs';
import { observer } from "mobx-react";
import { action } from 'mobx';
import { DiagramSetting, DiagramState, FCNodeModel, FCLinkModel, DiagramCategory, NodeEventType, DragNodeEvent, NodeEvent, FCNodeType, colors } from './FlowChartSetting';

import {TaskFlowChart} from '../../stores/TaskFlowChartStore';
import './FlowChartDiagram.less';

export interface FlowChartDiagramState {

}

export interface FlowChartDiagramProps {
    store: TaskFlowChart,

}

let myDiagram: Diagram;
let linksToAdd: FCLinkModel[] = [];

@observer
class FlowChartDiagram extends Component<FlowChartDiagramProps, FlowChartDiagramState> {
    constructor(props: any) {
        super(props);
        this.state = {

        }

        this.createDiagram = this.createDiagram.bind(this);
        //this.onTextEdited = this.onTextEdited.bind(this);
        //this.onModelChangeHandler = this.onModelChangeHandler.bind(this);
        this.mouseEnterHandler = this.mouseEnterHandler.bind(this);
        this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this);
        this.mouseDropHandler = this.mouseDropHandler.bind(this);
        this.mouseDragEnterHandler = this.mouseDragEnterHandler.bind(this);
        this.mouseDragLeaveHandler = this.mouseDragLeaveHandler.bind(this); 
        //this.getLinkPlusLineHighlightedopacity  = this.getLinkPlusLineHighlightedopacity.bind(this);
    }

    @action
    onModelChangeHandler = (event: ModelChangeEvent<FCNodeModel, FCLinkModel>) => {
        //if (myDiagram.findNodeForKey(4)) myDiagram.findNodeForKey(4)!.isSelected = true;
        switch (event.eventType) {
            case ModelChangeEventType.Remove:
                if (event.nodeData) {
                    this.props.store.removeNodeHandler({ eType: NodeEventType.Delete, key: event.nodeData.key, newLinks: linksToAdd, modelChanged: event.model })
                }
                if (event.linkData) {
                    //dispatch(removeLink(event.linkData));
                }
                break;
            default:
                break;
        }
    }

    
    render() {
        return (
            <GojsDiagram
                diagramId={'divDiagram'+(new Date().getTime())}
                className="divDiagram"               
                model={this.props.store.model}
                createDiagram={this.createDiagram}
                onModelChange={this.onModelChangeHandler}
            />
        );
    }


    @action
    private createDiagram(diagramId: string): Diagram {
        console.log(`-----------------------`,this.props.store.model )
        // go.Shape.defineFigureGenerator("TriangleDown", function (shape, w, h) {  // predefined in 2.0
        //     return new go.Geometry()
        //         .add(new go.PathFigure(0, 0)
        //             .add(new go.PathSegment(go.PathSegment.Line, w, 0))
        //             .add(new go.PathSegment(go.PathSegment.Line, 0.5 * w, h).close()))
        //         .setSpots(0.25, 0, 0.75, 0.5);
        // });


        // go.Shape.defineFigureGenerator("TriangleUp", function (shape, w, h) {  // predefined in 2.0
        //     return new go.Geometry()
        //         .add(new go.PathFigure(w, h)
        //             .add(new go.PathSegment(go.PathSegment.Line, 0, h))
        //             .add(new go.PathSegment(go.PathSegment.Line, 0.5 * w, 0).close()))
        //         .setSpots(0.25, 0.5, 0.75, 0);
        // });




        go.GraphObject.defineBuilder('SubGraphExpanderButton', (args: any): go.Panel => {
            const button = /** @type {Panel} */ (
                go.GraphObject.make('Button',
                    { // set these values for the isSubGraphExpanded binding conversion
                        '_subGraphExpandedFigure': 'TriangleDown',
                        '_subGraphCollapsedFigure': 'TriangleRight'
                    },
                    go.GraphObject.make(go.Shape,  // the icon
                        {
                            name: 'btn_SubExpander',
                            figure: 'TriangleDown',  // default value for isSubGraphExpanded is true
                            stroke: "red",
                            fill: colors.group_font,
                            background: colors.group_bg,
                            strokeWidth: 0,
                            desiredSize: new go.Size(12, 12)
                        },
                        // bind the Shape.figure to the Group.isSubGraphExpanded value using this converter:
                        new go.Binding('figure', 'isSubGraphExpanded',
                            (exp: boolean, shape: go.Shape): string => {
                                const but = shape.panel;
                                return exp ? (but as any)['_subGraphExpandedFigure'] : (but as any)['_subGraphCollapsedFigure'];
                            }
                        ).ofObject()
                    )
                )
            ) as go.Panel;

            // subgraph expand/collapse behavior
            button.click = (e: go.InputEvent, btn: go.GraphObject): void => {
                let group = btn.part;
                if (group instanceof go.Adornment) group = group.adornedPart;
                if (!(group instanceof go.Group)) return;
                const diagram = group.diagram;
                if (diagram === null) return;
                const cmd = diagram.commandHandler;
                if (group.isSubGraphExpanded) {
                    if (!cmd.canCollapseSubGraph(group)) return;
                } else {
                    if (!cmd.canExpandSubGraph(group)) return;
                }
                e.handled = true;
                if (group.isSubGraphExpanded) {
                    cmd.collapseSubGraph(group);
                } else {
                    cmd.expandSubGraph(group);
                }
            };
            return button;
        });


        const _this = this;
        const $ = go.GraphObject.make;


        myDiagram = $(go.Diagram, diagramId, {
            'undoManager.isEnabled': true,
            contentAlignment: go.Spot.TopCenter,
            initialContentAlignment: go.Spot.RightCenter,
            layout: $(go.TreeLayout, {
                angle: 90,
                treeStyle: go.TreeLayout.StyleLayered,
                layerSpacing: DiagramSetting.layerSpacing,
                comparer: go.LayoutVertex.smartComparer
            }),
            //TextEdited: this.onTextEdited
        });

        myDiagram.toolManager.panningTool.isEnabled = false;
        myDiagram.toolManager.mouseWheelBehavior = ToolManager.WheelScroll;

        /**
         * 画线
         */
        const drawLink = () => {
            myDiagram.linkTemplateMap.add(
                DiagramCategory.WFLink,
                $(
                    go.Link,
                    {
                        mouseLeave: this.mouseLeaveHandler,
                        mouseEnter: this.mouseEnterHandler, 
                        
                        mouseDragEnter: this.mouseDragEnterHandler,
                        mouseDragLeave: this.mouseDragLeaveHandler,
                        mouseDrop: this.mouseDropHandler,
                        movable: false,
                        deletable: false
                    },
                    new go.Binding('location'),
                    $(go.Shape, {
                        name: 'link_Body',
                        stroke: colors.link,
                        strokeWidth: 1
                    }),

                    $(go.Shape, {
                        name: 'link_Arr',
                        toArrow: 'Standard',
                        scale: 1.2,
                        strokeWidth: 0,
                        fill: colors.link
                    }),
                    $(go.Shape, 'Rectangle', {
                        width: DiagramSetting.nodeWith / 2,
                        height: DiagramSetting.layerSpacing + 5,
                        opacity: DiagramSetting.linkOpacity,
                        fill: colors.link
                    }),
                    $(
                        go.Panel,
                        'Auto',
                        {
                            padding: new go.Margin(0, 0, 10, 0),
                            alignment: go.Spot.Top,
                            opacity: 0
                        },
                        //new go.Binding('opacity', 'opacity').ofObject(),
                        new go.Binding('opacity', 'isHighlighted', function (h) {
                            console.log('--getLinkPlusLineHighlightedopacity--' + _this.props.store.linkHightlight)
                            if (_this.props.store.linkHightlight) {
                                return 1;
                            }
                            return 0;
                        }).ofObject(),
                        $(go.Shape, 'Circle', {
                            name: 'btn_add',
                            width: DiagramSetting.linkIconWidth,
                            height: DiagramSetting.linkIconWidth,
                            fill: colors.link_icon_bg,
                            strokeWidth: 0
                        }),
                        $(go.Shape, 'PlusLine', {
                            width: DiagramSetting.linkIconInWidth,
                            height: DiagramSetting.linkIconInWidth,
                            fill: null,
                            stroke: colors.link_icon,
                            strokeWidth: 2
                        }),

                        // new go.Binding('fill', 'isHighlighted', this.getLinkPlusLineHighlightedColor).ofObject(), // binding source is Node.isHighlighted
                        // new go.Binding('stroke', 'isHighlighted', this.getLinkPlusLineHighlightedColor).ofObject(), // binding source is Node.isHighlighted
                        // new go.Binding('opacity', 'isHighlighted', this.getLinkPlusLineHighlightedopacity).ofObject() // binding source is Node.isHighlighted
                    )
                )
            );
        };

        // myDiagram.linkSelectionAdornmentTemplate = $(go.Adornment, "Auto",
        //     $(go.Shape, {
        //         fill: colors.drag_bg,
        //         stroke: null,
        //         strokeWidth: 1,
        //         strokeDashArray: [1, 1]
        //     }),
        //     $(go.Placeholder)
        // );

        //myDiagram.groupSelectionAdornmentTemplate 



        /**
         * 画节点
         */
        const drawNode = () => {
            myDiagram.nodeTemplateMap.add(
                DiagramCategory.FCNode,
                $(
                    go.Node,
                    'Auto',
                    {
                        mouseEnter: this.mouseEnterHandler,
                        mouseLeave: this.mouseLeaveHandler,
                        movable: DiagramSetting.moveNode,
                       
                        selectionChanged: (node: any) => {
                            //this.props.store.currKey = node.key as string;
                            console.log('-----------selectionChanged-----------',node)
                            this.props.store.onNodeSelectionHandler(node.key as string, node.isSelected as boolean);
                        },
                        padding: new go.Margin(DiagramSetting.padding, 0, DiagramSetting.padding, 0),
                        minSize: new go.Size(DiagramSetting.nodeWith, DiagramSetting.nodeHeight)
                    },
                    $(
                        go.Shape,
                        'RoundedRectangle',
                        {
                            name: 'node_Body',
                            strokeWidth: 1,
                            stroke: colors.transparent,
                            fill: colors.backgroud
                        }
                        //new go.Binding('fill', 'color'),
                        //new go.Binding('fill', 'isHighlighted', this.getHighlightedColor).ofObject() // binding source is Node.isHighlighted
                    ),
                    $(
                        go.TextBlock,
                        {
                            editable: DiagramSetting.renameable,
                            stroke: colors.font,
                            font: DiagramSetting.font
                        },
                        new go.Binding('text', 'label')
                    )
                )
            );
        };

        /**
        * 画节点
        */
        const drawNodeGuide = () => {
            myDiagram.nodeTemplateMap.add(
                DiagramCategory.WFGuideNode,
                $(
                    go.Node,
                    'Auto',
                    {
                        movable: false,
                        deletable: false
                    },
                    $(
                        go.Shape,
                        'RoundedRectangle',
                        {
                            strokeWidth: 0,
                            fill: colors.transparent
                        }
                        //new go.Binding('fill', 'color'),
                        //new go.Binding('fill', 'isHighlighted', this.getHighlightedColor).ofObject() // binding source is Node.isHighlighted
                    ),
                    $(
                        go.TextBlock,
                        {
                            editable: false,
                            stroke: colors.group_font,
                            isMultiline: true,
                            font: DiagramSetting.groupTipFont
                        },
                        new go.Binding('text', 'label')
                    )
                )
            );
        };

        // 划循环分组
        const drawGroupLoop = () => {
            myDiagram.groupTemplateMap.add(
                DiagramCategory.LoopGroup,
                $(
                    go.Group,
                    'Auto',
                    {
                        // define the group's internal layout
                        layout: $(go.TreeLayout, {
                            angle: 90,
                            arrangement: go.TreeLayout.ArrangementHorizontal,
                            layerSpacing: DiagramSetting.layerSpacing,
                            arrangementSpacing: new go.Size(30, 10)
                        }),

                        mouseEnter: this.mouseEnterHandler,
                        mouseLeave: this.mouseLeaveHandler,

                        movable: DiagramSetting.moveLoop,
                        padding: new go.Margin(DiagramSetting.padding, 0, DiagramSetting.padding, 0),
                        // the group begins unexpanded;
                        // upon expansion, a Diagram Listener will generate contents for the group
                        isSubGraphExpanded: true,
                        // when a group is expanded, if it contains no parts, generate a subGraph inside of it
                        selectionChanged: (node: any) => {
                            //this.props.store.currKey = node.key as string;
                            this.props.store.onNodeSelectionHandler(node.key as string, node.isSelected as boolean);
                        },
                        //subGraphExpandedChanged: function (group) { }
                    },

                    $(go.Shape, 'RoundedRectangle', {
                        name: 'group_Body',
                        stroke: colors.group_border,
                        strokeWidth: 0.1,
                        fill: colors.group_bg
                    }),
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            defaultAlignment: go.Spot.Left
                        },
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                name: 'group_Top',
                                padding: 5,
                                background: colors.group_bg
                            },
                            $('SubGraphExpanderButton', 'btn_expand', {
                                alignment: go.Spot.Center
                            }),

                            $(
                                go.TextBlock,
                                {
                                    name: 'group_Title',
                                    font: DiagramSetting.groupFont,
                                    editable: DiagramSetting.renameable,
                                    stroke: colors.group_font,
                                    margin: new go.Margin(0, 0, 0, 10)
                                },
                                new go.Binding('text', 'label').makeTwoWay()
                            )
                        ),
                        // create a placeholder to represent the area where the contents of the group are
                        $(go.Placeholder, {
                            background: colors.group_panel_bg,
                            padding: new go.Margin(10, 15),
                            alignment: go.Spot.TopLeft,
                            minSize: new go.Size(DiagramSetting.ConditionWidth, DiagramSetting.groupHeight)
                        })
                    ) // end Vertical Panel
                )
            ); // end Group
        };

        //条件线
        const drawLinkGuide = () => {
            myDiagram.linkTemplateMap.add(
                DiagramCategory.WFGuideLink,
                $(
                    go.Link,
                    {
                        opacity: DiagramSetting.linkOpacity
                    },
                    new go.Binding('fromSpot', 'fromSpot', go.Spot.parse),
                    new go.Binding('toSpot', 'toSpot', go.Spot.parse),
                    new go.Binding('direction'),
                    new go.Binding('extension'),
                    new go.Binding('inset'),
                    $(go.Shape, { stroke: 'gray' }, new go.Binding('stroke', 'color')),
                    $(
                        go.Shape,
                        { fromArrow: 'BackwardOpenTriangle', segmentIndex: 2, stroke: 'gray' },
                        new go.Binding('stroke', 'color')
                    ),
                    $(
                        go.Shape,
                        { toArrow: 'OpenTriangle', segmentIndex: -3, stroke: 'gray' },
                        new go.Binding('stroke', 'color')
                    ),
                    $(
                        go.TextBlock,
                        {
                            segmentIndex: 2,
                            segmentFraction: 0.5,
                            segmentOrientation: go.Link.OrientUpright,
                            alignmentFocus: go.Spot.Bottom,
                            stroke: 'gray',
                            font: '8pt sans-serif'
                        },
                        new go.Binding('text', '', showDistance).ofObject(),
                        new go.Binding('stroke', 'color')
                    )
                )
            );
        };

        // 条件分组
        const drawGroupCond = () => {
            myDiagram.groupTemplateMap.add(
                DiagramCategory.ConditionGroup,
                $(
                    go.Group,
                    'Auto',
                    {
                        // define the group's internal layout
                        layout: $(go.TreeLayout, {
                            angle: 0,
                            arrangement: go.TreeLayout.ArrangementHorizontal,
                            layerSpacing: DiagramSetting.layerSpacing
                        }),
                        //locationSpot: go.Spot.TopRight, // the location is the center of the Shape,
                        movable: DiagramSetting.moveCond,

                        mouseEnter: this.mouseEnterHandler,
                        mouseLeave: this.mouseLeaveHandler,
                        selectionChanged: (node: any) => {
                            //this.props.store.currKey = node.key as string;
                            this.props.store.onNodeSelectionHandler(node.key as string, node.isSelected as boolean);
                        },
                        // subGraphExpandedChanged: function (group) { }
                    },
                    $(go.Shape, 'RoundedRectangle', {
                        name: 'group_Body',
                        stroke: colors.group_border,
                        strokeWidth: 0.1,
                        fill: colors.group_bg
                    }),
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            defaultAlignment: go.Spot.Left
                        },
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                name: 'group_Top',
                                padding: 5,
                                background: colors.group_bg
                            },
                            $('SubGraphExpanderButton', {
                                alignment: go.Spot.Center
                            }),
                            $(
                                go.TextBlock,
                                {
                                    name: 'group_Title',
                                    font: DiagramSetting.groupFont,
                                    editable: DiagramSetting.renameable,
                                    stroke: colors.group_font,
                                    margin: new go.Margin(0, 0, 0, 10)
                                },
                                new go.Binding('text', 'label').makeTwoWay()
                            )
                        ),
                        // create a placeholder to represent the area where the contents of the group are
                        $(go.Placeholder, {
                            background: colors.group_panel_bg,
                            padding: new go.Margin(10, 15),
                            minSize: new go.Size(DiagramSetting.ConditionWidth, DiagramSetting.groupHeight)
                        })
                    ) // end Vertical Panel
                )
            ); // end Group
        };

        // 条件分组
        const drawGroupCond1 = () => {
            myDiagram.groupTemplateMap.add(
                DiagramCategory.ConditionGroup,
                $(
                    go.Group,
                    'Auto',
                    {
                        // define the group's internal layout
                        layout: $(go.GridLayout, {
                            sorting: go.TreeLayout.SortingAscending
                        }),

                        //locationSpot: go.Spot.TopRight, // the location is the center of the Shape,
                        mouseEnter: this.mouseEnterHandler,
                        mouseLeave: this.mouseLeaveHandler,

                        movable: DiagramSetting.moveCond,
                        selectionChanged: (node: any) => {
                            //this.props.store.currKey = node.key as string;
                            this.props.store.onNodeSelectionHandler(node.key as string, node.isSelected as boolean);
                        },
                        // the group begins unexpanded;
                        // upon expansion, a Diagram Listener will generate contents for the group
                        isSubGraphExpanded: true,
                        // when a group is expanded, if it contains no parts, generate a subGraph inside of it
                        //subGraphExpandedChanged: function (group) { }
                    },

                    $(go.Shape, 'RoundedRectangle', {
                        name: 'group_Body',
                        stroke: colors.group_border,
                        strokeWidth: 0.1,
                        fill: colors.group_bg
                    }),
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            defaultAlignment: go.Spot.Left
                        },
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                name: 'group_Top',
                                padding: 5,
                                background: colors.group_bg
                            },
                            $('SubGraphExpanderButton', {
                                alignment: go.Spot.Center
                            }),
                            $(
                                go.TextBlock,
                                {
                                    name: 'group_Title',
                                    font: DiagramSetting.groupFont,
                                    editable: DiagramSetting.renameable,
                                    stroke: colors.group_font,
                                    margin: new go.Margin(0, 0, 0, 10)
                                },
                                new go.Binding('text', 'label').makeTwoWay()
                            )
                        ),
                        // create a placeholder to represent the area where the contents of the group are
                        $(go.Placeholder, {
                            background: colors.group_panel_bg,
                            padding: new go.Margin(10, 15),
                            alignment: go.Spot.TopLeft,
                            minSize: new go.Size(DiagramSetting.ConditionWidth, DiagramSetting.groupHeight)
                        })
                    ) // end Vertical Panel
                )
            ); // end Group
        };

        //条件分支
        const drawGroupCondBranch = () => {
            myDiagram.groupTemplateMap.add(
                DiagramCategory.ConditionSwitch,
                $(
                    go.Group,
                    'Auto',
                    {
                        // define the group's internal layout
                        layout: $(go.TreeLayout, {
                            angle: 90,
                            layerSpacing: DiagramSetting.layerSpacing
                        }),
                        // locationSpot: go.Spot.Bottom,
                        // locationObjectName: 'HEADER',
                        // minLocation: new go.Point(0, 0),
                        // maxLocation: new go.Point(9999, 0),
                        // selectionObjectName: 'HEADER',
                        fromLinkable: false,
                        toLinkable: false,

                        mouseLeave: this.mouseLeaveHandler,
                        mouseEnter: this.mouseEnterHandler,
                        
                        // mouseDrop: this.mouseDropHandler,

                        selectionChanged: (node: any) => {
                            //this.props.store.currKey = node.key as string;
                            this.props.store.onNodeSelectionHandler(node.key as string, node.isSelected as boolean);
                        },

                        movable: DiagramSetting.moveCondBranch,

                        // the group begins unexpanded;
                        // upon expansion, a Diagram Listener will generate contents for the group
                        isSubGraphExpanded: true,
                        // when a group is expanded, if it contains no parts, generate a subGraph inside of it
                        subGraphExpandedChanged: function (group: any) {

                            if (group instanceof go.Adornment) group = group.adornedPart;
                            const cmd = myDiagram.commandHandler;
                            const lspot = group.part.findObject('left_Spot');
                            const rspot = group.part.findObject('right_Spot');
                            if (group.isSubGraphExpanded) {
                                lspot && (lspot.visible = true);
                                rspot && (rspot.visible = true);
                                cmd.collapseSubGraph(group);
                            } else {
                                cmd.expandSubGraph(group);
                                lspot && (lspot.visible = false);
                                rspot && (rspot.visible = false);
                            }

                        }
                    },
                    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
                    new go.Binding('height', 'height').makeTwoWay(),
                    $(go.Shape, 'RoundedRectangle', {
                        name: 'group_Body',
                        stroke: colors.group_border,
                        strokeWidth: 0.1,
                        fill: colors.group_bg
                    }),
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            defaultAlignment: go.Spot.Left
                        },
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                name: 'group_Top',
                                padding: 5,
                                background: colors.group_bg
                            },
                            $('SubGraphExpanderButton', {
                                alignment: go.Spot.Center,
                                background: colors.transparent
                            }),
                            $(
                                go.TextBlock,
                                {
                                    name: 'group_Title',
                                    font: DiagramSetting.groupFont,
                                    editable: DiagramSetting.renameable,
                                    stroke: colors.group_font,
                                    margin: new go.Margin(0, 0, 0, 10)
                                },
                                new go.Binding('text', 'label').makeTwoWay()
                            )
                        ),
                        // create a placeholder to represent the area where the contents of the group are
                        $(go.Placeholder, {
                            background: colors.group_panel_bg,
                            padding: new go.Margin(10, 15),
                            alignment: go.Spot.TopLeft,
                            height: 100,
                            minSize: new go.Size(DiagramSetting.ConditionWidth, DiagramSetting.groupHeight)
                        })
                    ), // end Vertical Panel

                    // input port
                    $(
                        go.Panel,
                        'Auto',
                        {
                            name: 'left_Spot',
                            alignment: go.Spot.Left,
                            margin: new go.Margin(20, 0, 0, 1),
                            fromLinkable: false,
                            toLinkable: false,
                            width: DiagramSetting.iconWidth,
                            height: DiagramSetting.iconWidth,
                            cursor: 'pointer',
                            opacity: DiagramSetting.spotOpacity,
                            click: (e: go.InputEvent, thisObj: GraphObject) => {
                                this.props.store.addNodeBySelfHandler({ eType: NodeEventType.AddPrvNode, toNode: thisObj.part!.data as FCNodeModel });
                            }
                        },

                        $(go.Shape, 'Circle', {
                            width: DiagramSetting.iconWidth,
                            height: DiagramSetting.iconWidth,
                            fill: colors.icon_bg,
                            stroke: colors.icon_bg,
                            strokeWidth: 1
                        }),
                        $(go.Shape, 'PlusLine', {
                            width: DiagramSetting.iconInWidth,
                            height: DiagramSetting.iconInWidth,
                            fill: null,
                            stroke: colors.icon,
                            strokeWidth: 1
                        })
                    ),
                    // output port
                    $(
                        go.Panel,
                        'Auto',
                        {
                            name: 'right_Spot',
                            alignment: go.Spot.Right,
                            margin: new go.Margin(20, 0, 0, 1),
                            toLinkable: false,
                            fromLinkable: false,
                            width: DiagramSetting.iconWidth,
                            height: DiagramSetting.iconWidth,
                            cursor: 'pointer',
                            opacity: DiagramSetting.spotOpacity,
                            click: (e: go.InputEvent, thisObj: GraphObject) => {
                                this.props.store.addNodeBySelfHandler({ eType: NodeEventType.AddNextNode, toNode: thisObj.part!.data as FCNodeModel });
                            }
                        },
                        $(go.Shape, 'Circle', {
                            width: DiagramSetting.iconWidth,
                            height: DiagramSetting.iconWidth,
                            fill: colors.icon_bg,
                            stroke: colors.icon_bg,
                            strokeWidth: 1
                        }),
                        $(go.Shape, 'PlusLine', {
                            width: DiagramSetting.iconInWidth,
                            height: DiagramSetting.iconInWidth,
                            fill: null,
                            stroke: colors.icon,
                            strokeWidth: 1
                        })
                    )
                )
            );
        };

        const drawStart_End = () => {
            /**
             * 起始点
             */
            myDiagram.nodeTemplateMap.add(
                DiagramCategory.Start,
                $(
                    go.Node,
                    'Panel',
                    {
                        margin: new go.Margin(25, 0, 0, 0),
                        padding: new go.Margin(5),
                        movable: false,
                        deletable: false,
                        // mouseDragEnter: this.mouseDragEnterHandler,
                        // mouseDragLeave: this.mouseDragLeaveHandler,
                        // mouseDrop: this.mouseDropHandler
                    },
                    $(
                        go.Panel,
                        'Auto',
                        $(go.Shape, 'Circle', {
                            minSize: new go.Size(DiagramSetting.startWidth, DiagramSetting.startWidth),
                            fill: null,
                            stroke: colors.start,
                            strokeWidth: 1
                        }),
                        $(go.Shape, 'TriangleRight', {
                            width: DiagramSetting.startInWidth,
                            height: DiagramSetting.startInWidth,
                            fill: colors.start,
                            strokeWidth: 0,
                            margin: new go.Margin(0, 0, 0, 2)
                        })
                    )
                )
            );

            /**
             * 结束点
             */
            myDiagram.nodeTemplateMap.add(
                DiagramCategory.End,
                $(
                    go.Node,
                    'Panel',
                    {
                        padding: new go.Margin(5, 2),
                        movable: false,
                        deletable: false
                    },
                    $(
                        go.Panel,
                        'Auto',
                        $(go.Shape, 'Circle', {
                            minSize: new go.Size(DiagramSetting.endWidth, DiagramSetting.endWidth),
                            fill: null,
                            stroke: colors.end,
                            strokeWidth: 1
                        }),
                        $(go.Shape, 'Rectangle', {
                            width: DiagramSetting.endInWidth,
                            height: DiagramSetting.endInWidth,
                            fill: colors.end,
                            strokeWidth: 0
                        })
                    )
                )
            );
        };

        drawNode();
        drawNodeGuide();
        drawLink();
        drawLinkGuide();
        DiagramSetting.test ? drawGroupCond() : drawGroupCond1();
        drawGroupCondBranch();
        drawGroupLoop();
        drawStart_End();

        //notice whenever the selection may have changed
        myDiagram.addDiagramListener('ChangedSelection', function (e: go.DiagramEvent) {
            //_this.props.onNodeSelectionHandler(node.key as string, node.isSelected as boolean);
        });

        myDiagram.commandHandler.doKeyDown = function () {
            var e = myDiagram.lastInput;
            linksToAdd = [];
            // The meta (Command) key substitutes for "control" for Mac commands
            var control = e.control || e.meta;
            var key = e.key;
            // Quit on any undo/redo key combination:
            if (control && (key === 'Z' || key === 'Y')) return;
            //将要删除
            if (key === 'Del' && _this.props.store.currKey) {
                // 这个节点 指向的
                const indOut = _this.props.store.model.linkDataArray.findIndex(link => link.from === _this.props.store.currKey);
                // 指向这个节点
                const indIn = _this.props.store.model.linkDataArray.findIndex(link => link.to === _this.props.store.currKey);

                //节点  中间节点 、 起始节点 、 终止节点
                if (indIn > -1 && indOut > -1) {
                    // 1、 中间节点
                    let f = _this.props.store.model.linkDataArray[indIn];
                    let t = _this.props.store.model.linkDataArray[indOut];
                    linksToAdd.push({
                        from: f.from,
                        to: t.to,
                        group: f.group,
                        category: f.category,
                        isCondition: false
                    });
                }
                _this.props.store.currKey = "";
            }
            //call base method with no arguments (default functionality)
            go.CommandHandler.prototype.doKeyDown.call(this);
        };

        function showDistance(link: any) {
            var numpts = link.pointsCount;
            if (numpts < 2) return '';
            var p0 = link.getPoint(0);
            var pn = link.getPoint(numpts - 1);
            var ang = link.direction;
            if (isNaN(ang)) return Math.floor(Math.sqrt(p0.distanceSquaredPoint(pn))) + '';
            var rad = (ang * Math.PI) / 180;
            return Math.floor(Math.abs(Math.cos(rad) * (p0.x - pn.x)) + Math.abs(Math.sin(rad) * (p0.y - pn.y))) + '';
        }

        this.props.store.diagram = myDiagram;


        // myDiagram.model.addChangedListener(function(e) {
        //     debugger;
        //     // do not display some uninteresting kinds of transaction notifications
        //     if (e.change === go.ChangedEvent.Transaction) {
        //       if (e.propertyName === "CommittingTransaction" || e.modelChange === "SourceChanged") return;
        //       // do not display any layout transactions
        //       if (e.oldValue === "Layout") return;
        //     }  // You will probably want to use e.isTransactionFinished instead
        //     // Add entries into the log
        //     var changes = e.toString();
        //     if (changes[0] !== "*") changes = "&nbsp;&nbsp;" + changes;

        //     window.console.log("  ",changes);
        //   }); // end model changed listener

        //   myDiagram.model.addChangedListener(function(e) {
        //     debugger;
        //     if (e.isTransactionFinished) {
        //       var tx = e.object;
        //       if (tx instanceof go.Transaction && window.console) {
        //         window.console.log(tx.toString());
        //         tx.changes.each(function(c) {
        //           if (c.model) window.console.log("  " + c.toString());
        //         });
        //       }
        //     }
        //   });
        //  // end init
        
        return myDiagram;
    }


    /**
   * 鼠标移上
   * @param e
   * @param obj
   */
    mouseEnterHandler = (e: go.InputEvent, obj: GraphObject): void => {
        // used by both the Button Binding and by the changeColor click function

        let node = (obj as any).part;
        if (node && node.diagram) {
            node.diagram.startTransaction('Change color');

            let lbody = node.findObject('link_Body');
            if (lbody) lbody.stroke = colors.link_highlight;

            let linkArr = node.findObject('link_Arr');
            if (linkArr) linkArr.fill = colors.link_highlight;

            let nbody = node.findObject('node_Body');
            if (nbody) nbody.fill = colors.highlight;

            let shape = node.findObject('group_Body');
            if (shape) shape.fill = colors.group_highlight;

            let top = node.findObject('group_Top');
            if (top) top.background = colors.group_highlight;

            let title = node.findObject('group_Title');
            if (title) title.stroke = colors.group_highlight_font;


            let btn_exp = node.findObject('btn_SubExpander');
            if (btn_exp) {
                btn_exp.fill = colors.group_highlight_font;
                btn_exp.background = colors.group_highlight;
                btn_exp.stroke = colors.group_highlight;
                btn_exp.strokeWidth = 0;
            }



            let btn = node.findObject('btn_add');
            if (btn) {
                btn.fill = colors.link_highlight;
            }


            let lspot = node.findObject('left_Spot');
            if (lspot) {
                lspot.opacity = 1;
            }
            let rspot = node.findObject('right_Spot');
            if (rspot) {
                rspot.opacity = 1;
            }

            node.diagram.commitTransaction('Change color');
        }
    }

    /**
     * 鼠标移开
     * @param e
     * @param obj
     */
    mouseLeaveHandler = (e: go.InputEvent, obj: GraphObject): void => {
        let node = (obj as any).part;
        if (node && node.diagram) {
            node.diagram.startTransaction('Change color');

            let lbody = node.findObject('link_Body');
            if (lbody) lbody.stroke = colors.link;

            let linkArr = node.findObject('link_Arr');
            if (linkArr) linkArr.fill = colors.link;

            let nbody = node.findObject('node_Body');
            if (nbody) nbody.fill = colors.backgroud;

            let shape = node.findObject('group_Body');
            if (shape) shape.fill = colors.group_bg;

            let top = node.findObject('group_Top');
            if (top) top.background = colors.group_bg;

            let title = node.findObject('group_Title');
            if (title) title.stroke = colors.group_font;


            let btn_exp = node.findObject('btn_SubExpander');
            if (btn_exp) {
                btn_exp.fill = colors.group_font;
                btn_exp.background = colors.group_bg;
                btn_exp.strokeWidth = 0;
            }


            let btn = node.findObject('btn_add');
            if (btn) {
                btn.fill = colors.link;
            }

            let lspot = node.findObject('left_Spot');
            if (lspot) {
                lspot.opacity = 0;
            }
            let rspot = node.findObject('right_Spot');
            if (rspot) {
                rspot.opacity = 0;
            }

            node.diagram.commitTransaction('Change color');
        }
    }

    /**
     * 鼠标 拖拽移上
     * @param e
     * @param obj
     */
    private mouseDragEnterHandler(e: go.InputEvent, obj: GraphObject): void {

       

     }

    /**
     * 鼠标 拖拽移开
     * @param e
     * @param obj
     */
    private mouseDragLeaveHandler(e: go.InputEvent, obj: GraphObject, obj1: GraphObject): void { 
        console.log("--mouseDragLeaveHandler--",e)
    }

    /**
     * 鼠标 拖拽
     * @param e
     * @param obj
     */
    private mouseDropHandler(e: go.InputEvent, obj: GraphObject): void {
         //console.log("--mouseDropHandler--",e);
         console.log("--mouseDropHandler--", this.props.store.diagram.commandHandler.canUndo()); ;
         this.props.store.diagram.commandHandler.undo();

        
            if (obj.part instanceof go.Link) {
                let ev: NodeEvent = { eType: NodeEventType.Drag2Link, toLink: obj.part!.data as FCLinkModel }
                //this.props.store.addNodeAfterDropLinkHandler(ev);
                console.log('---- mouseDropHandler ------ ',ev);
                console.log(' wfDroper  on Link')
            } else if (obj.part instanceof go.Group) {
                console.log(' wfDroper Group ');
            } else if (obj.part instanceof go.Node) {
                // let ev: NodeEvent = { eType: NodeEventType.Drag2Node, toNode: obj.part!.data as FCNodeModel }
                // this.props.store.addNodeAfterDropNodeHandler(ev);
                // console.log('wfDroper Node');
            } else {
            }
        
        // myDiagram.redraw();
        // if (obj && obj.part) {
        //     if (obj instanceof go.Link) {
        //         this.props.addNodeByDropLinkHandler({
        //             eType: NodeEventType.Move2Link,
        //             toLink: obj.part!.data as WFLinkModel
        //         });
        //     } else if (obj instanceof go.Group) {
        //         this.props.addNodeByDropNodeHandler({
        //             eType: NodeEventType.Move2Group,
        //             toNode: obj.part!.data as WFNodeModel
        //         });
        //     } else if (obj instanceof go.Node) {
        //         this.props.addNodeByDropNodeHandler({
        //             eType: NodeEventType.Move2Node,
        //             toNode: obj.part!.data as WFNodeModel
        //         });
        //     }
        // }
    }



    /**
     * 鼠标移开
     * @param e
     * @param obj
     */
    //@action
    // getLinkPlusLineHighlightedopacity = (): number => {
    //     console.log('--getLinkPlusLineHighlightedopacity--' + this.props.store.drager!.name)
    //     // if (this.props.store.drager && this.props.store.drager.name) {
    //     //     return 1;
    //     // }
    //     return 0.5;
    // };
}
export default FlowChartDiagram;