// import { Diagram } from 'gojs';
import { BaseNodeModel, LinkModel } from 'react-gojs';

/**
 * 得到节点展示的类型
 * @param fcType 
 */
export const getFCDiagramType = (fcType: FCNodeType | FCNodeExtendsType): FCDiagramType => {
    let cate = FCDiagramType.FCNode
    switch (fcType) {
        case FCNodeType.ExtractData:
        case FCNodeType.SubEnd:
        case FCNodeType.EnterText:
        case FCNodeType.LoopBreak:
        case FCNodeType.MouseOver:
        case FCNodeType.Click:
        case FCNodeType.Navigate:
        case FCNodeType.SwitchCombo:
        case FCNodeType.EnterCapacha:
            cate = FCDiagramType.FCNode;
            break;
        case FCNodeExtendsType.Branch:
            cate = FCDiagramType.ConditionSwitch;
            break;
        case FCNodeType.Loop:
            cate = FCDiagramType.LoopGroup;
            break;
        case FCNodeType.Condition:
            cate = FCDiagramType.ConditionGroup;
            break;
        case FCNodeExtendsType.Start:
            cate = FCDiagramType.Start;
            break;
        case FCNodeExtendsType.End:
            cate = FCDiagramType.End;
            break;
        case FCNodeExtendsType.WFGuideNode:
            cate = FCDiagramType.WFGuideNode;
            break;
        default:
            cate = FCDiagramType.FCNode;
            break;
    }


    return cate;
}

export class FcNode {
    constructor(type: FCNodeType | FCNodeExtendsType) {
        this.fcType = type;
        let title = '';
        let src = '';
        let isGroup=false;
        switch (type as string) {
            case FCNodeType.Condition:
                title = '判断条件';
                src = 'condition';
                isGroup =true;
                break;
            case FCNodeType.ExtractData:
                title = '提取数据';
                src = 'data';
                break;
            case FCNodeType.SubEnd:
                title = '结束流程';
                src = 'subend';
                break;
            case FCNodeType.EnterText:
                title = '输入文字';
                src = 'input';
                break;
            case FCNodeType.Loop:
                title = '循环';
                src = 'loop';
                isGroup =true;
                break;
            case FCNodeType.LoopBreak:
                title = '结束循环';
                src = 'loopbreak';
                break;
            case FCNodeType.Click:
                title = '点击元素';
                src = 'mouseclick';
                break;
            case FCNodeType.MouseOver:
                title = '移动鼠标到元素上';
                src = 'mousehover';
                break;
            case FCNodeType.Navigate:
                title = '打开网页';
                src = 'openweb';
                break;
            case FCNodeType.SwitchCombo:
                title = '切换下拉选项';
                src = 'switch';
                break;
            case FCNodeType.EnterCapacha:
                title = '识别验证码';
                src = 'verify';
                break;
            case FCNodeExtendsType.Branch:
                isGroup =true;
                break;
            default:
                break;
        }

        this.name = title;
        this.src = src;
        this.isGroup = isGroup;
    }

    fcType: FCNodeType | FCNodeExtendsType = FCNodeType.ExtractData;
    name: string = '';
    src: string = '';
    isGroup:boolean=false;
    get FCDiagramType() {
        return getFCDiagramType(this.fcType);
    };

}

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
    category?: FCDiagramType; // 图形分类      对应 FCDiagramType     FCNode | LoopGroup | ConditionGroup | Condition | Start | End
    opacity?: number; //
}

/**
 * 连线对应的属性
 */
export interface FCLinkModel extends LinkModel {
    from: string; // 连线起始点
    to: string; // 连线结束点

    group: string; // 所在分组
    isCondition: boolean; //是否是在条件分支的连线  这个比较特殊 ****

    //以下属性不用管
    category?: FCDiagramType; // 图形分类      对应 FCDiagramType 里面的    WFLink | WFGuideLink
    fromSpot?: string;
    toSpot?: string;
    opacity?: 0 | 1;
}


/**
 * 左侧拖拽相关
 */
export interface DragNodeEvent {
    type: FCNodeType;
    name: string;
    // tslint:disable-next-line: no-any
    //event: any;
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
    // newNodeToLink?: false;
    newLinks?: FCLinkModel[];
    // modelChanged?: DiagramModel<FCNodeModel, FCLinkModel>
}



/**
 * Node 相关操作类型
 */
export enum NodeEventType {
    // Add = 'Add_new',
    // Selected = 'Select_node',
    //Delete = 'Delete_node',
    // Rename = 'Reset_name',
    Drag2Node = 'Drag_to_node',
    Drag2Group = 'Drag_to_group',
    Drag2Link = 'Drag_to_link',
    // Move2Node = 'Move_to_node',
    // Move2Group = 'Move_to_group',
    // Move2Link = 'Move_to_link',
    // LinkHightLight = 'Link_HightLight',
    // LinkNomal = 'Link_Normal',
    AddPrvNode = 'Add_Prv_Node',
    AddNextNode = 'Add_Next_Node',
    // HightLightLink = 'HightLight_Link',
    // HightLightNode = 'HightLight_Node',
    // HightLightGroup = 'HightLight_group',
    // HightLightCondition = 'HightLight_Condition'
}



/**
 * 操作节点类型
 */
export enum FCNodeType {
    //打开网页
    Navigate = 'NavigateAction',

    //点击元素
    Click = 'ClickAction',

    //提取数据
    ExtractData = 'ExtractDataAction',

    //输入文字
    EnterText = 'EnterTextAction',

    //识别验证码
    EnterCapacha = 'EnterCapachaAction',

     //切换下拉选项
     SwitchCombo = 'SwitchCombo2Action',

    //判断条件
    Condition = 'ConditionAction',
    
    //循环
    Loop = 'LoopAction',

    //移动鼠标到元素上
    MouseOver = 'MouseOverAction',

    //结束循环
    LoopBreak = 'LoopEnd',

    //某个流程结束
    SubEnd = 'Subend'
}


/**
 * 相关设置和类
 */
export enum FCNodeExtendsType {
    /**
     * 起始
     */
    Start = 'start',
    /**
     * 结束
     */
    End = 'end',
  
    /**
     * 判断条件 分支
     */
    Branch = 'conditon_branch',

    /**
     * 辅助点, 某个流程 仅在构图时候使用
     */
    WFGuideNode = 'wfgridenode'
}

/**
 * 图形分类
 */
export enum FCDiagramType {
    //节点
    FCNode = 'FCNode',
    // 线
    WFLink = 'WFLink',
    // 循环分组
    LoopGroup = 'LoopGroup',
    // 条件组
    ConditionGroup = 'ConditionGroup',
    // 条件
    ConditionSwitch = 'ConditionSwitch',
    // 起始
    Start = 'Start',
    // 结束
    End = 'End',

    //循环起点
    WFGuideLoopStart = 'WFGuideLoopStart',
    //循环重点
    WFGuideLoopEnd = 'WFGuideLoopEnd',
    // 辅助线
    WFGuideLink = 'WFGuideLink',
    // 辅助点  支线流程的起始节点
    WFGuideNode = 'SubStart'
};

