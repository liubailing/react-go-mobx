// import { Diagram } from 'gojs';
import { BaseNodeModel, LinkModel } from 'react-gojs';

export class FCModelUpdateData {
    addNodes: FCNodeModel[] = [];
    addLinks: FCNodeModel[] = [];
    deleteLinkIndex: Set<number> = new Set();
    deleteNodeIndex: Set<number> = new Set();
}


/**
 * 得到节点展示的类型
 * @param fcType 
 */
export const getFCDiagramType = (fcType: string): FCDiagramType => {
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
        case FCNodeType.Branch:
            cate = FCDiagramType.ConditionSwitch;
            break;
        case FCNodeType.Loop:
            cate = FCDiagramType.LoopGroup;
            break;
        case FCNodeType.Condition:
            cate = FCDiagramType.ConditionGroup;
            break;
        case FCNodeType.Start:
            cate = FCDiagramType.WFGuideStart;
            break;
        case FCNodeType.End:
            cate = FCDiagramType.WFGuideEnd;
            break;
        case FCNodeType.WFGuideNode:
            cate = FCDiagramType.WFGuideNode;
            break;
        case FCNodeType.SubOpen:
            cate = FCDiagramType.WFGuideSubOpen;
            break;
        case FCNodeType.SubClose:
            cate = FCDiagramType.WFGuideSubClose;
            break;
        default:
            cate = FCDiagramType.WFGuideSubClose;
            break;
    }


    return cate;
}

export class FcNode {
    constructor(type: FCNodeType | string) {
        this.fcType = type;
        let title = '';
        let src = '';
        let isGroup = false;
        switch (type as string) {
            case FCNodeType.Condition:
                title = '判断条件';
                src = 'condition';
                isGroup = true;
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
                isGroup = true;
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
            case FCNodeType.Branch:
                title = '条件分支';
                isGroup = true;
                break;
            case FCNodeType.WFGuideNode:
                title = '将要执行的流程拖放在此';
                break;
            default:
                break;
        }

        this.name = title;
        this.src = src;
        this.isGroup = isGroup;
    }

    fcType: FCNodeType | string = FCNodeType.ExtractData;
    name: string = '';
    src: string = '';
    isGroup: boolean = false;
    get FCDiagramType(): FCDiagramType {
        return getFCDiagramType(this.fcType);
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
    }

    get nodeModel(): FCNodeModel {
        let n: FCNodeModel = {
            type: this.fcType,
            group: '',
            label: this.name,

            key: this.getRandomKey(),
            diagramType: this.FCDiagramType,
            isGroup: this.isGroup,
            // hasChild: false,
            opacity: 0,
        };
        n.category = n.diagramType;
        return n;
    };

}

/**
 * 图形节点属性
 */
export interface FCNodeModel extends BaseNodeModel {
    key: string; //唯一标识ID

    label: string; //步骤名称
    group: string; // 所在分组
    type: string; // 节点  类型  FCNodeType
    isGroup: boolean; // 是否是组  

    // hasChild?: boolean; // 是否有子步骤    当 isGroup == true ,必须给 hasChild赋值
    // data?: any; // 对应的配置属性  交互使用的数据

    //以下属性不用管
    diagramType?: FCDiagramType; // 图形分类      对应 FCDiagramType     FCNode | LoopGroup | ConditionGroup | Condition | Start | End
    opacity?: number; //
    category?: string; // 节点  类型  FCNodeType
}

/**
 * 连线对应的属性
 */
export interface FCLinkModel extends LinkModel {
    from: string; // 连线起始点
    to: string; // 连线结束点
    group: string; // 所在分组

    //以下属性不用管
    diagramType?: FCDiagramType; // 图形分类      对应 FCDiagramType 里面的    WFLink | WFGuideLink
    category?: string;
    opacity?: 0 | 1;
}


// /**
//  * 左侧拖拽相关
//  */
// export interface DragNodeEvent {
//     type: FCNodeType;
//     name: string;
//     // tslint:disable-next-line: no-any
//     //event: any;
// }


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
    // Drag2Node = 'Drag_to_node',
    // Drag2Group = 'Drag_to_group',
    //Drag2Link = 'Drag_to_link',

    DragNode2Link = 'dragNode_to_link',
    DragFCNode2Node = 'dragFCNode_to_node',
    DragFCNode2Link = 'dragFCNode_to_link',

    AddNodeToBefore = 'addNode_to_before',
    AddNodeToAfter = 'addNode_to_after',
    // Move2Node = 'Move_to_node',
    // Move2Group = 'Move_to_group',
    // Move2Link = 'Move_to_link',
    // LinkHightLight = 'Link_HightLight',
    // LinkNomal = 'Link_Normal',
    // AddPrvNode = 'Add_Prv_Node',
    // AddNextNode = 'Add_Next_Node',
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
    SubEnd = 'Subend',


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
    Branch = 'BranchAction',

    /**
     * 开启(循坏分支，条件分支)
     */
    SubOpen = 'WFGuide_SubBegin',

    /**
    *关闭(循坏分支，条件分支)
    */
    SubClose = 'WFGuide_SubEnd',

    /**
     * 辅助点, 某个流程 仅在构图时候使用
     */
    WFGuideNode = 'wfgridenode'
}


/**
 * 相关设置和类
 */
// export enum FCNodeType {
//     /**
//      * 起始
//      */
//     Start = 'start',
//     /**
//      * 结束
//      */
//     End = 'end',

//     /**
//      * 判断条件 分支
//      */
//     Branch = 'conditon_branch',

//     //开启(循坏分支，条件分支)
//     SubOpen = 'WFGuide_SubBegin',
//     //关闭(循坏分支，条件分支)
//     SubClose = 'WFGuide_SubEnd',

//     /**
//      * 辅助点, 某个流程 仅在构图时候使用
//      */
//     WFGuideNode = 'wfgridenode'
// }

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
    WFGuideStart = 'WFGuide_Start',
    // 结束
    WFGuideEnd = 'WFGuide_End',

    //开启(循坏分支，条件分支)
    WFGuideSubOpen = 'WFGuide_SubOpen',
    //关闭(循坏分支，条件分支)
    WFGuideSubClose = 'WFGuide_SubClose',
    // 辅助线
    WFGuideLink = 'WFGuideLink',
    // 辅助点  支线流程的起始节点
    WFGuideNode = 'WFGuideNode'
};

