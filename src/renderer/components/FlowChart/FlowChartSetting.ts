import go, { Diagram } from 'gojs';
import { BaseNodeModel, DiagramModel, LinkModel } from 'react-gojs';

/**
 * 
 * 相关设置和类
 * 
 */
 
//节点类型
export enum FCNodeType {
    /**
     * 起始
     */
    Start = 'start',
    /**
     * 结束
     */
    End = 'end',

    /**
     * 打开网页
     */
    OpenWeb = 'NavigateAction',
    /**
     * 点击元素
     */
    MouseClick = 'ClickAction',
    /**
     * 提取数据
     */
    Data = 'ExtractDataAction',
    /**
     * 输入文字
     */
    Input = 'EnterTextAction',
    /**
     * 识别验证码
     */
    Verify = 'EnterCapachaAction',
    /**
     * 切换下拉选项
     */
    Switch = 'SwitchCombo2Action',
    /**
     * 判断条件
     */
    Condition = 'ConditionAction',
    /**
     * 判断条件 分支
     */
    ConditionSwitch = 'BranchAction',
    /**
     * 循环
     */
    Loop = 'LoopAction',
    /**
     * 移动鼠标到元素上
     */
    MouseHover = 'MouseOverAction',
    /**
     * 结束循环
     */
    LoopBreak = 'loopend',
    /**
     * 某个流程结束
     */
    SubEnd= 'subend',
    /**
     * 辅助点, 某个流程 仅在构图时候使用
     */
    WFGuideNode = 'wfgridenode'
}

export const colors = {
    start: '#69BE70',
    end: '#E06969',

    font: '#fff',
    border: '#6383BC',
    backgroud: '#6383BC',
    highlight: '#5685d6',

    group_font: '#555',
    group_border: '#EBEEF5',
    group_bg: '#EBEEF5',
    group_panel_bg: '#fff',
    group_highlight: '#5685d6',
    group_highlight_font: '#fff',

    icon_bg: '#6383BC',
    icon: '#fff',

    link: '#9EA3AF',
    link_icon: '#fff',
    link_icon_bg: '#BFC5D3',
    link_highlight: '#5685d6',

    tip: '#ddd',
    transparent: 'transparent'
};

export const DiagramSetting = {
    font: '14px Sans-Serif',
    groupFont: '14px Sans-Serif',
    tipFont: 'bold 14px Sans-Serif',
    groupTip: '将要执行的流程拖放在此处',
    groupTipFont: '14px Sans-Serif',
    moveNode: true,
    moveLoop: false,
    moveCond: false,
    moveCondBranch: false,
    renameable: false,
    padding: 2,
    layerSpacing: 30,
    startWidth: 20,
    startInWidth: 10,
    endWidth: 20,
    endInWidth: 10,
    iconWidth: 14,
    iconInWidth: 7,
    linkIconWidth: 16,
    linkIconInWidth: 8,
    nodeWith: 120,
    nodeHeight: 25,
    groupWith: 160,
    ConditionWidth: 140,    
    groupHeight: 0,
    linkOpacity: 0,
    spotOpacity: 0,
    test: true
};

const isGroupArr: FCNodeType[] = [FCNodeType.Condition, FCNodeType.Loop];

/**
 * store 管理数据
 */
export interface DiagramState {
    // tslint:disable-next-line: no-any
    drager: DragNodeEvent | null;
    diagram: Diagram;
    model: DiagramModel<FCNodeModel, FCLinkModel>;
    selectedNodeKeys: string[];
    currKey: string;
    // hightNode: NodeEvent | null;
    // isHight: boolean;
    // height: number;
}

/**
 * 图形分类
 */
export const DiagramCategory = {
    //节点
    FCNode: 'FCNode',
    // 线
    WFLink: 'WFLink',
    // 循环分组
    LoopGroup: 'LoopGroup',
    // 条件组
    ConditionGroup: 'ConditionGroup',
    // 条件
    ConditionSwitch: 'ConditionSwitch',
    // 起始
    Start: 'Start',
    // 结束
    End: 'End',
    // 辅助线
    WFGuideLink: 'WFGuideLink',
    // 辅助点  支线流程的起始节点
    WFGuideNode: 'SubStart'
};

/**
 * 图形节点属性
 */
export interface FCNodeModel extends BaseNodeModel {
    key: string; //唯一标识ID

    label: string; //步骤名称
    group: string; // 所在分组
    wfType: string; // 节点  类型  FCNodeType
    isGroup: boolean; // 是否是组

    hasChild?: boolean; // 是否有子步骤    当 isGroup == true ,必须给 hasChild赋值
    data?: any; // 对应的配置属性  交互使用的数据

    //以下属性不用管
    category?: string; // 图形分类      对应 DiagramCategory     FCNode | LoopGroup | ConditionGroup | Condition | Start | End
    opacity?: number; //
}

/**
 * 连线对应的属性
 */
export interface FCLinkModel extends LinkModel {
    from: string; // 连线起始点
    to: string; // 连线结束点

    group: string; // 所在分组
    isCondition:boolean; //是否是在条件分支的连线  这个比较特殊 ****

    //以下属性不用管
    category?: string; // 图形分类      对应 DiagramCategory 里面的    WFLink | WFGuideLink
    fromSpot?: string;
    toSpot?: string;
    opacity?:0|1;
}


/**
 * 左侧拖拽相关
 */
export interface DragNodeEvent {
    type: FCNodeType;
    name: string;
    // tslint:disable-next-line: no-any
    event: any;
}

/**
 * Node 相关操作类型
 */
export enum NodeEventType {
    Add = 'Add_new',
    Selected = 'Select_node',
    Delete = 'Delete_node',
    Rename = 'Reset_name',
    Drag2Node = 'Drag_to_node',
    Drag2Group = 'Drag_to_group',
    Drag2Link = 'Drag_to_link',
    Move2Node = 'Move_to_node',
    Move2Group = 'Move_to_group',
    Move2Link = 'Move_to_link',
    LinkHightLight = 'Link_HightLight',
    LinkNomal = 'Link_Normal',
    AddPrvNode = 'Add_Prv_Node',
    AddNextNode = 'Add_Next_Node',
    HightLightLink = 'HightLight_Link',
    HightLightNode = 'HightLight_Node',
    HightLightGroup = 'HightLight_group',
    HightLightCondition = 'HightLight_Condition'
}

/**
 * node 操作事件-相关参数
 */
export interface NodeEvent {
    eType: NodeEventType;
    name?: string;
    key?: string;
    toKey?: string;
    toLink?: FCLinkModel;
    toNode?: FCNodeModel;
    newNodeToLink?: false;
    newLinks?: FCLinkModel[];
    modelChanged?: DiagramModel<FCNodeModel, FCLinkModel>
}


/**
 * 左侧拖拽相关
 */
export interface DragNodeEvent {
    type: FCNodeType;
    name: string;
    // tslint:disable-next-line: no-any
    event: any;
}

/**
 * node 操作事件-相关参数
 */
export interface NodeEvent {
    eType: NodeEventType;
    name?: string;
    key?: string;
    toKey?: string;
    toLink?: FCLinkModel;
    toNode?: FCNodeModel;
    newNodeToLink?: false;
    newLinks?: FCLinkModel[];
    modelChanged?: DiagramModel<FCNodeModel, FCLinkModel>
}
