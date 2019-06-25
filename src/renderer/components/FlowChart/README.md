[在线示例](http://47.110.49.33:3088/) 

# 参考代码 

``` javascript

    //初始化业务模型
    @action
    initStore = async (): Promise<void> => {
        this.taskWorkflowStore.init();
    }

    //重新渲染流程图 
    onClickRender = async (): Promise<void> => {
        this.taskWorkflowStore.render();
    }

    //得到全部数据
    onClickGetAll = async (): Promise<void> => {
        let a = this.taskWorkflowStore.getAll();
        console.log('得到全部数据', a);
    }
    
    //初始化
    onClickInitFlowChart = async (isDefault: boolean): Promise<void> => {

        let node: ActionNode = {
            key: 'root', type: 'root', childKeys: [], childs: [
                { key: 'node1', type: ActionNodeType.EnterText as string, data: { tip: '这是一个node1存值' } },
                {
                    key: 'cond', type: ActionNodeType.Condition as string, childs: [
                        {
                            key: 'branch1-1', type: ActionNodeType.Branch as string, childs: [
                                { key: 'data11-1', type: ActionNodeType.ExtractData as string }
                            ]
                        },
                        {
                            key: 'branch1-2', type: ActionNodeType.Branch as string, childs: [
                                { key: 'data12-1', type: ActionNodeType.ExtractData as string },
                                { key: 'data12-2', type: ActionNodeType.ExtractData as string }
                            ]
                        },
                        {
                            key: 'branch1-3', type: ActionNodeType.Branch as string
                        }
                    ]
                },
                {
                    key: 'loop', type: ActionNodeType.Loop as string, parentKey: "root", childs: [
                        { key: 'data1', type: ActionNodeType.ExtractData as string },
                    ], data: { tip: '这是一个loop存值' }
                },
                { key: 'data', type: ActionNodeType.ExtractData as string, parentKey: "root" }

            ]
        }

        if (isDefault) {
            this.taskWorkflowStore.init();
            this.logs(`初始化`);
        } else {
            this.taskWorkflowStore.init(node);
            this.logs(`预设值`);
        }

    }

    //选中的节点
    @action
    onClickSelectNodeHandler = async (key: string): Promise<void> => {
        if (!key) {
            let node = this.taskWorkflowStore.getFirstNode();
            if (node && node.key) key = node.key;
        }
        this.taskWorkflowStore.setSetlectedBykey(key);
        this.logs(`选中key:${key}`);
    }


    //删除流程图上的节点
    @action
    onClickDeleteNodeHandler = async (key: string): Promise<void> => {
        this.taskWorkflowStore.deleteNodeByKey(key);
        this.logs(`删除key:${key}`);
    }

    //追加节点
    @action
    onClickAppendNode = async (pId?: string): Promise<void> => {
        let key = this.taskWorkflowStore.appendNode(ActionNodeType.ExtractData, {}, pId);
        this.logs(`追加key:${key}`);
    }

    //追加节点
    @action
    onClickAppendBranchNode = async (pId: string): Promise<void> => {
        let key = this.taskWorkflowStore.appendNodeToNode(ActionNodeType.ExtractData, pId);
        this.logs(`追加key:${key}`);
    }

    //追加节点
    @action
    onClickAppendNodeByType = async (type: ActionNodeType, pId?: string): Promise<void> => {
        this.currKey = this.taskWorkflowStore.appendNode(type, { data: 'test.data' }, pId);
        this.logs(`追加key:${this.currKey}`);
    }

    //追加节点
    @action
    onClickAppendNodeToNodeByType = async (type: ActionNodeType): Promise<void> => {
        this.currKey = this.taskWorkflowStore.appendNodeToNode(type, this.currKey, { data: 'test.data' });
        this.logs(`追加key:${this.currKey}`);
    }

    //得到第一个节点
    @action
    onClickGetFirstNode = async (pId?: string): Promise<void> => {
        let node = this.taskWorkflowStore.getFirstNode(pId)
        this.logs(`key:${node.key},type:${node.type}`);
    }

    //得到第一个节点
    @action
    onClickSaveData = async (key: string): Promise<void> => {
        let node = this.taskWorkflowStore.getFirstNode();
        if (node.key) {

        }

        this.taskWorkflowStore.saveNodeData(key || node.key, {
            tip: "这是刚刚刚存放的一数据" + (new Date).toString(),
        })

        this.logs(`key:${node.key},type:${node.type}`);
    }

    //得到第一个节点
    @action
    onClickGetData = async (key: string): Promise<void> => {
        let node = this.taskWorkflowStore.getFirstNode()

        let node1 = this.taskWorkflowStore.getNodeByKey(key || node.key);
        alert(node1.data.tip);
    }

    @action
    logs = (str: string) => {
        this.actionLogs.unshift(str);
    }


```
 