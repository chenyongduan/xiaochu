
// 消除水果的连续数量，必须大于等于该值才允许消除
var MATRIX_CONTINUOUS = 3;

// 行列总数
var MATRIX_ROW_MAX = 7;
var MATRIX_COL_MAX = 7;

var gPatternsFallTime = 0.4;		// 水果下落的时间
var gPatternsSwapTime = 0.17;		// 两个水果交换的时间
var gPatternsClearTime = 0.5;		// 水果消除的时间
var gInitMatrixDelayTime = 0.7;		// 初始化矩阵的时间

// 游戏主界面类
var GamePatternMatrix = cc.Layer.extend({
    //mPatternBgBatchNode:null,		// 没用到
    mPatternBatchNode:null,		// 用于批量产生精灵节点
    m_nMatrixRow:0,				// 行
    m_nMatrixCol:0,				// 列
    m_nFreezeProbability:0,		// 冰冻精灵的几率
    m_nBombProbability:0,		// 炸弹精灵的几率
    m_nStoneProbability:0,		// 石头精灵的几率
    mPatternTypeMax:0,			// 水果精灵类型的总数：本例中为7种类型
    mPatternsSpr:null,			// 水果精灵矩阵数组，存储所有的水果精灵
    mPatternsPos:null,			// 水果精灵坐标点的矩阵数组
    mPromptTimerTally:0,		// 提示计时器
    mTimerTally:0,				// 计时器
    //mProgressSpr:null,			// 进度条精灵
    //mVisibleRect:null,			// 用于进度条更新显示的矩形区域
    //mPromptMarkSpr:null,		// 提示精灵
   // mCheckMarkSpr:null,
    mFirstCheckPattern:null,
    mSecondCheckPattern:null,
    mDestroyFrames:null,		// 水果销毁的动画对象
    mExplodeFrames:null,		// 水果爆炸的动画对象
    mDestroyBatchTally:0,		// 
    mTimeTotal:0,
    mPatternRequire:0,
    mPatternClearTally:0,
    mGameScore:0,
    mUpdateLogic:true,
    mMultipleTimer:0.0,
    mScoreMultiple:1,
    mScoreLabel:null,
    mPromptPattern:null,
    mListener1:null,			// 自定义事件：MSG_CHECK_PATTERN
    mListener2:null,			// 自定义事件：MSG_SWAP_PATTERN
	
	// 初始化方法
    init:function () {
    	// 调用父类的初始化方法
        this._super();
        
        // 初始化属性值
        this.mTimeTotal = 60;	//60;		// 游戏时间限制
        this.mPatternRequire = 100;
        this.setTag(111);		// 定义当前场景的tag，便于在游戏结果界面中获取这个场景，并移除这个场景的事件处理
        
        this.initView();

		// 初始化游戏当前进度显示
        this.initProgressWithGameMode();

		// 接收自定义事件：MSG_CHECK_PATTERN
        var target = this;
        this.mListener1 = cc.EventListener.create({
            event: cc.EventListener.CUSTOM,
            eventName: MSG_CHECK_PATTERN,
            callback: function(event){
                // 处理MSG_CHECK_PATTERN事件通知
                var pPattern = event.getUserData();
                target.onCheckPattern(pPattern);
            }
        });
        cc.eventManager.addListener(this.mListener1, 1);

        // 接收自定义事件：MSG_SWAP_PATTERN
        this.mListener2 = cc.EventListener.create({
            event: cc.EventListener.CUSTOM,
            eventName: MSG_SWAP_PATTERN,
            callback: function(event){
                var pPattern = event.getUserData();
                target.onSwapTwoPattern(pPattern);
            }
        });
        cc.eventManager.addListener(this.mListener2, 1);

		// 创建水果矩阵数据，及水果坐标的矩阵数组，初始值为null
        this.mPatternsPos = this.createIntArray(MATRIX_ROW_MAX, MATRIX_COL_MAX, null);
        this.mPatternsSpr = this.createIntArray(MATRIX_ROW_MAX, MATRIX_COL_MAX, null);

		// 稍延迟片刻后，执行初始化矩阵操作（initMatrix）
        this.runAction(cc.sequence(cc.delayTime(gInitMatrixDelayTime), cc.callFunc(this.initMatrix,this )));
    } ,

    initView:function(){
        // 获取当前窗体大小，便于布局控件
        var size = cc.director.getWinSize();

        // 设置背景图片
        var bgSprite = cc.Sprite.create(res.PlayDitu);
        bgSprite.setAnchorPoint(0.5, 0.5);
        bgSprite.setPosition(size.width / 2, size.height / 2);
        this.addChild(bgSprite, 0);

        //棋盘
        var qipanSprite = cc.Sprite.create(res.PlayQipan);
        qipanSprite.setAnchorPoint(0.5, 0.5);
        qipanSprite.setPosition(size.width / 2, size.height / 2.3);
        this.addChild(qipanSprite, 5);
        this.mPatternBatchNode = qipanSprite;

        //上边
        var shangbianSprite = cc.Sprite.create(res.PlayShangbian);
        shangbianSprite.setAnchorPoint(0.5, 1);
        shangbianSprite.setPosition(size.width / 2, size.height);
        this.addChild(shangbianSprite, 0);

        for(var i = 1;i <= 4;i++){
            //底座
            var ditaiSprite = cc.Sprite.create(res.PlayDitai);
            ditaiSprite.setAnchorPoint(0.5, 0);
            ditaiSprite.setPosition(size.width/5*i, 0);
            this.addChild(ditaiSprite, 1);
        }

        // 添加道具
//        var daoju1 = cc.MenuItemImage.create(res.DaojuFuyi,
//            res.DaojuFuyi, this.menuCallBack1, this);
//        var daoju2 = cc.MenuItemImage.create(res.DaojuHuoqiu,
//            res.DaojuHuoqiu, this.menuCallBack2, this);
//        var daoju3 = cc.MenuItemImage.create(res.DaojuQuanzhang,
//            res.DaojuQuanzhang, this.menuCallBack3, this);
//        var daoju4 = cc.MenuItemImage.create(res.DaojuXiongzhen,
//            res.DaojuXiongzhen, this.menuCallBack4, this);

        var self = this
        //道具
        var daojuSprite = cc.Sprite.create(res.DaojuFuyi);
        daojuSprite.setAnchorPoint(0.5, 0);
        daojuSprite.setPosition(size.width/5, 60);
        this.addChild(daojuSprite, 5);

        // 设置触摸的侦听事件，以便让水果精灵响应触摸操作
        var touchListener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,	// 单次点击
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var target = event.getCurrentTarget();
                var daojuSprite = cc.Sprite.create(res.DaojuFuyi);
                daojuSprite.setAnchorPoint(0.5, 0);
                daojuSprite.setPosition(target.getPosition());
                self.addChild(daojuSprite, 5);
                daojuSprite.setName("daojufuyi");
                return true;
            },
            onTouchMoved: function (touch, event) {
                var target = event.getCurrentTarget();
                var fuyiSprite = self.getChildByName("daojufuyi");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
            },
            onTouchEnded: function (touch, event) {
                var target = event.getCurrentTarget();

                var fuyiSprite = self.getChildByName("daojufuyi");
                if(fuyiSprite != undefined){
                    cc.log(cc.rectIntersectsRect(self.mPatternBatchNode.getBoundingBox(),fuyiSprite.getBoundingBox()));
                    fuyiSprite.removeFromParent();
                }
            }
        });

        // 添加到事件管理器中去
        cc.eventManager.addListener(touchListener, daojuSprite);

        //道具
        var daojuSprite = cc.Sprite.create(res.DaojuHuoqiu);
        daojuSprite.setAnchorPoint(0.5, 0);
        daojuSprite.setPosition(size.width/5*2, 60);
        this.addChild(daojuSprite, 5);

        // 设置触摸的侦听事件，以便让水果精灵响应触摸操作
        var touchListener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,	// 单次点击
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var target = event.getCurrentTarget();
                var daojuSprite = cc.Sprite.create(res.DaojuHuoqiu);
                daojuSprite.setAnchorPoint(0.5, 0);
                daojuSprite.setPosition(target.getPosition());
                self.addChild(daojuSprite, 5);
                daojuSprite.setName("DaojuHuoqiu");
                return true;
            },
            onTouchMoved: function (touch, event) {
                var target = event.getCurrentTarget();
                var fuyiSprite = self.getChildByName("DaojuHuoqiu");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
            },
            onTouchEnded: function (touch, event) {
                var target = event.getCurrentTarget();

                var fuyiSprite = self.getChildByName("DaojuHuoqiu");
                if(fuyiSprite != undefined){
                    cc.log(cc.rectIntersectsRect(self.mPatternBatchNode.getBoundingBox(),fuyiSprite.getBoundingBox()));
                    fuyiSprite.removeFromParent();
                }
            }
        });

        // 添加到事件管理器中去
        cc.eventManager.addListener(touchListener, daojuSprite);

        //道具
        var daojuSprite3 = cc.Sprite.create(res.DaojuQuanzhang);
        daojuSprite3.setAnchorPoint(0.5, 0);
        daojuSprite3.setPosition(size.width/5*3, 60);
        this.addChild(daojuSprite3, 5);

        // 设置触摸的侦听事件，以便让水果精灵响应触摸操作
        var touchListener3 = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,	// 单次点击
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var target = event.getCurrentTarget();
                var daojuSprite = cc.Sprite.create(res.DaojuQuanzhang);
                daojuSprite.setAnchorPoint(0.5, 0);
                daojuSprite.setPosition(target.getPosition());
                self.addChild(daojuSprite, 5);
                daojuSprite.setName("DaojuQuanzhang");
                return true;
            },
            onTouchMoved: function (touch, event) {
                var target = event.getCurrentTarget();
                var fuyiSprite = self.getChildByName("DaojuQuanzhang");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
            },
            onTouchEnded: function (touch, event) {
                var target = event.getCurrentTarget();

                var fuyiSprite = self.getChildByName("DaojuQuanzhang");
                if(fuyiSprite != undefined){
                    cc.log(cc.rectIntersectsRect(self.mPatternBatchNode.getBoundingBox(),fuyiSprite.getBoundingBox()));
                    fuyiSprite.removeFromParent();
                }
            }
        });

        // 添加到事件管理器中去
        cc.eventManager.addListener(touchListener3, daojuSprite3);

        //道具
        var daojuSprite4 = cc.Sprite.create(res.DaojuXiongzhen);
        daojuSprite4.setAnchorPoint(0.5, 0);
        daojuSprite4.setPosition(size.width/5*4, 60);
        this.addChild(daojuSprite4, 5);

        // 设置触摸的侦听事件，以便让水果精灵响应触摸操作
        var touchListener4 = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,	// 单次点击
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var target = event.getCurrentTarget();
                var daojuSprite = cc.Sprite.create(res.DaojuXiongzhen);
                daojuSprite.setAnchorPoint(0.5, 0);
                daojuSprite.setPosition(target.getPosition());
                self.addChild(daojuSprite, 5);
                daojuSprite.setName("DaojuXiongzhen");
                cc.log("xiongzhang")
                return true;
            },
            onTouchMoved: function (touch, event) {
                var target = event.getCurrentTarget();
                var fuyiSprite = self.getChildByName("DaojuXiongzhen");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
            },
            onTouchEnded: function (touch, event) {
                var target = event.getCurrentTarget();

                var fuyiSprite = self.getChildByName("DaojuXiongzhen");
                if(fuyiSprite != undefined){
                    cc.log(cc.rectIntersectsRect(self.mPatternBatchNode.getBoundingBox(),fuyiSprite.getBoundingBox()));
                    fuyiSprite.removeFromParent();
                }
            }
        });

        // 添加到事件管理器中去
        cc.eventManager.addListener(touchListener4, daojuSprite4);

        //下边
        var xiabianSprite = cc.Sprite.create(res.PlayShangbian);
        xiabianSprite.setAnchorPoint(0.5, 0);
        xiabianSprite.setPosition(size.width / 2, 0);
        this.addChild(xiabianSprite, 0);

        //火把1
        var huoSprite1 = cc.Sprite.create(res.PlayHuo);
        huoSprite1.setAnchorPoint(0.5, 0);
        huoSprite1.setPosition(huoSprite1.getContentSize().width/2, xiabianSprite.getContentSize().height);
        this.addChild(huoSprite1, 1);

        //火把2
        var huoSprite2 = cc.Sprite.create(res.PlayHuo);
        huoSprite2.setAnchorPoint(0.5, 0);
        huoSprite2.setPosition(size.width - huoSprite2.getContentSize().width/2, xiabianSprite.getContentSize().height);
        this.addChild(huoSprite2, 1);

        //头像1
        var txSprite1 = cc.Sprite.create(res.PlayTouxiang1);
        txSprite1.setAnchorPoint(0.5, 1);
        txSprite1.setPosition(size.width/2, size.height - 40);
        this.addChild(txSprite1, 1);

        //头像2
        var txSprite2 = cc.Sprite.create(res.PlayTouxiang2);
        txSprite2.setAnchorPoint(0, 1);
        txSprite2.setPosition(size.width/2 - txSprite1.getContentSize().width/2 + 40, size.height - 50);
        this.addChild(txSprite2, 1);

        //分数底框
        var fenshudiSprite = cc.Sprite.create(res.PlayFenshudi);
        fenshudiSprite.setAnchorPoint(0, 1);
        fenshudiSprite.setPosition(size.width/2, size.height - fenshudiSprite.getContentSize().height*1.8);
        this.addChild(fenshudiSprite, 1);

        //分数
        var fenshuSprite = cc.Sprite.create(res.PlayFenshu);
        fenshuSprite.setAnchorPoint(0, 0.5);
        fenshuSprite.setPosition(10, fenshudiSprite.getContentSize().height/2);
        fenshudiSprite.addChild(fenshuSprite, 1);

        this.mScoreLabel = cc.LabelTTF.create("0", "Courier", 30);
        this.mScoreLabel.setAnchorPoint(0, 0.5);
        this.mScoreLabel.setPosition(fenshudiSprite.getContentSize().width/2.5, fenshudiSprite.getContentSize().height/2);
        this.mScoreLabel.setColor(cc.color(255, 255, 0));
        fenshudiSprite.addChild(this.mScoreLabel);

    },
    // 实现菜单的回调方法
    menuCallBack1:function(sender){

    },
    // 实现菜单的回调方法
    menuCallBack2:function(sender){

    },
    // 实现菜单的回调方法
    menuCallBack3:function(sender){

    },
    // 实现菜单的回调方法
    menuCallBack4:function(sender){

    },
    // 移除注册的事件处理（主要是在游戏结果界面调用，避免再次进入游戏界面时，重复注册事件）
    clearMsgListener:function(){
    	// v2x使用“cc.NotificationCenter.removeObserver(this, MSG_CHECK_PATTERN);”，v3x使用事件管理器来管理事件
        cc.eventManager.removeListener(this.mListener1);
        cc.eventManager.removeListener(this.mListener2);
    },
    
    // 初始化矩阵数组
    initMatrix:function(){
        this.mPatternTypeMax = 8;		// 水果类型总数
        this.m_nFreezeProbability = 3;	// 冰冻水果的几率
        this.m_nStoneProbability = 3;	// 石头水果的几率
        this.m_nBombProbability = 6;	// 炸弹水果的几率

        this.m_nMatrixRow = MATRIX_ROW_MAX;			// 行
        this.m_nMatrixCol = MATRIX_COL_MAX;			// 列
		
		// 获取窗体大小，以便于控件定位
		var size = this.mPatternBatchNode.getContentSize()
		
		// 创建一个水果精灵的背景图片，并获取背景图片的大小
		var patternBgW = 45;
		var patternBgH = 45;
		
        // 计算每个精灵的间隔距离
        var space = this.mPatternBatchNode.getContentSize().width/8.2;
		// 计算x、y坐标的基准坐标点
        var baseX = this.mPatternBatchNode.getContentSize().width/7.5;
        var baseY = this.mPatternBatchNode.getContentSize().height/7.5;

        // 开始初始化水果背景块矩阵，并渲染每个矩阵节点
        for (var row = 0; row < this.m_nMatrixRow; row++)
        {
            for (var col = 0; col < this.m_nMatrixCol; col++)
            {
            	// 计算当前水果精灵的坐标点位置
                this.mPatternsPos[row][col] = cc.p(baseX + col*space, baseY+ row*space);
            }
        }

		// 添加并初始化水果矩阵
        for (var row = 0; row < this.m_nMatrixRow; row++)
        {
            for (var col = 0; col < this.m_nMatrixCol; col++)
            {
                this.addOnePattern(row,col);
            }
        }
		
		// 启动提示计时器
        this.schedule(this.updateTimerForPrompt, 1);
        
        // 启动检测矩阵计时器
        this.runAction(cc.sequence(cc.delayTime(gPatternsFallTime + 0.1), cc.callFunc(this.detectionMatrix, this)));
    } ,
    
    // 添加一个水果精灵节点
    addOnePattern:function(row, col){
    	// 按照设定的几率值，随机产生水果精灵的类型及扩展属性值
        var temp = 0 | (Math.random() * 10000);
        var prob = temp%100;
        var attr = ePatternExtraAttr.Normal;
        if ( this.m_nFreezeProbability != 0  && prob < this.m_nFreezeProbability )
            attr = ePatternExtraAttr.Freeze;
        else if (row != 0 && this.m_nStoneProbability != 0  && prob < this.m_nFreezeProbability + this.m_nStoneProbability )
            attr = ePatternExtraAttr.Stone;
        else if ( this.m_nBombProbability != 0  && prob < this.m_nFreezeProbability + this.m_nStoneProbability + this.m_nBombProbability )
            attr = ePatternExtraAttr.Bomb;
		
		// 生成水果类型
        var patternType = 1 | (temp % this.mPatternTypeMax);
		
		// 创建一个水果精灵对象，并移动到当前行列位置
        this.mPatternsSpr[row][col] = new GamePatternSprite();
        this.mPatternsSpr[row][col].init(patternType, attr);
        this.mPatternsSpr[row][col].setAnchorPoint(0.5,0.5);
        this.mPatternsSpr[row][col].m_nRowIndex = row;
        this.mPatternsSpr[row][col].m_nColIndex = col;
        this.mPatternsSpr[row][col].setPosition(this.mPatternsPos[row][col].x, this.mPatternsPos[row][col].y + 250.0);		// 初始位置在高出，用moveTo方法落到当前行列位置
        this.mPatternsSpr[row][col].moveTo(gPatternsFallTime, this.mPatternsPos[row][col]);
		
		// 添加当前节点
        this.mPatternBatchNode.addChild(this.mPatternsSpr[row][col],5);
    },
    
    // 初始化进度条控件
    initProgressWithGameMode:function(){
    	var size = cc.director.getWinSize();

    },

    // 初始化销毁和爆炸的动画帧图片数组
    initArrayFrames:function(){

    },
    
    // 排除死局：检查水果矩阵中是否已经没有可以移动的了，如果没有了，则重置一下水果矩阵的排列逻辑
    excludeDeadlock:function(){
    	// 判断是否有解决方案了
        if (this.isHasSolution() == false)
        {
        	// 没有解决方案了
            if (gGameMode == eGameMode.Timer)
            {
            	// 时间模式下，重置整个水果矩阵的布局
                for (var row = 0; row < this.m_nMatrixRow; row ++)
                {
                    for (var col = 0; col < this.m_nMatrixCol; col ++){
                    	// 移除当前位置的水果，并重新添加一个新的水果（新的水果类型等可能就会发生变化了）
	                    this.mPatternBatchNode.removeChild(this.mPatternsSpr[row][col],true);
	                    this.addOnePattern(row,col);
	                }
                }
                // 再次检测一下矩阵，如果新布局是死局，还需要继续重置，但这个几率是非常低的
                this.runAction(cc.sequence(cc.delayTime(gPatternsFallTime+0.1), cc.callFunc(this.detectionMatrix, this)));
            }
            else
            {
            	// 挑战模式下，如果没有解决方案了，则退出游戏，显示游戏结果界面
                this.onExit();
                this.showGameResult(false);
            }
        }
    },
    
    // 检查被点击的水果的状态（在接收到MSG_CHECK_PATTERN事件时被调用）
    onCheckPattern:function(pPattern){
    	//console.info("IN GamePatternMatrix::onCheckPattern\n");
    	
        if ( pPattern != null){
            this.mPromptTimerTally = 0;		// 重置提示计时器时间
            //this.mPromptMarkSpr.setPosition(-1000.0,-1000.0);	// 重置提示精灵位置

            if (this.mFirstCheckPattern === null){
            	// 如果还没有水果被选中，则设置mFirstCheckPattern为被选择的水果
                this.mFirstCheckPattern = pPattern;
                //this.mCheckMarkSpr.setPosition(this.mPatternsPos[this.mFirstCheckPattern.m_nRowIndex][this.mFirstCheckPattern.m_nColIndex]);
                
            }else{
            	// 如果已经有水果被选中了，设置mSecondCheckPattern为第二个被选择的水果
                this.mSecondCheckPattern = pPattern;
                if (this.mSecondCheckPattern === this.mFirstCheckPattern)
                {
                	// 两次点击了同一个水果精灵
                    this.mSecondCheckPattern = null;
                    return;
                }
				
				// 判断两个水果精灵是否是挨着的
                var isAdjacent = false;
                if (this.mFirstCheckPattern.m_nRowIndex == this.mSecondCheckPattern.m_nRowIndex)
                {
                    if (this.mFirstCheckPattern.m_nColIndex>0 &&
                        this.mFirstCheckPattern.m_nColIndex-1 == this.mSecondCheckPattern.m_nColIndex)
                        isAdjacent = true;
                    else if (this.mFirstCheckPattern.m_nColIndex+1<this.m_nMatrixCol &&
                        this.mFirstCheckPattern.m_nColIndex+1 == this.mSecondCheckPattern.m_nColIndex)
                        isAdjacent = true;
                }
                else if (this.mFirstCheckPattern.m_nColIndex == this.mSecondCheckPattern.m_nColIndex)
                {
                    if(this.mFirstCheckPattern.m_nRowIndex>0 &&
                        this.mFirstCheckPattern.m_nRowIndex-1 == this.mSecondCheckPattern.m_nRowIndex)
                        isAdjacent = true;
                    else if(this.mFirstCheckPattern.m_nRowIndex+1<this.m_nMatrixRow &&
                        this.mFirstCheckPattern.m_nRowIndex+1 == this.mSecondCheckPattern.m_nRowIndex)
                        isAdjacent = true;
                }

                if (isAdjacent){
                	// 是挨着的，交换这两个水果精灵
                   // this.mCheckMarkSpr.setPosition(-1000.0,-1000.0);
                    this.swapTwoPattern(this.mFirstCheckPattern,this.mSecondCheckPattern,false);
                    this.mFirstCheckPattern = null;
                    this.mSecondCheckPattern = null;
                }else{
                	// 不挨着，使新点击的水果精灵呈被选中状态
                    //this.mCheckMarkSpr.setPosition(this.mPatternsPos[this.mSecondCheckPattern.m_nRowIndex][this.mSecondCheckPattern.m_nColIndex]);
                    this.mFirstCheckPattern = this.mSecondCheckPattern;
                    this.mSecondCheckPattern = null;
                }
            }
        }
    },
    
    // 交换两个水果精灵的事件处理方法（在接收到MSG_SWAP_PATTERN事件时被调用）
    onSwapTwoPattern:function(pPattern){
        if (pPattern)
        {
            pPattern.setColor(cc.color(255,255,255));
            var pFirstCheckPattern = pPattern;	// 临时变量，用于交换
            if (this.mFirstCheckPattern === pFirstCheckPattern){
            	// 是同一个水果，取消掉被选择的状态
                this.mFirstCheckPattern = null;
               // this.mCheckMarkSpr.setPosition(-1000.0,-1000.0);
            }

            if(pFirstCheckPattern.g_ePatternStatus != ePatternStatus.Normal)
                return;		// 只交换普通状态的水果
			
			// 重置提示的时间及提示精灵的位置
            this.mPromptTimerTally = 0;
            //this.mPromptMarkSpr.setPosition(-1000.0,-1000.0);
			
			// 开始处理交换操作
            var pSecondCheckPattern = null;
            switch(pFirstCheckPattern.m_eSwapDirection){
            	// 根据水果的交换方向，决定跟哪个位置的水果来交换对象（交换水果对象，不是位置）
                case eSwapDirection.Left:
                    if (pFirstCheckPattern.m_nColIndex > 0)
                        pSecondCheckPattern = this.mPatternsSpr[pFirstCheckPattern.m_nRowIndex][pFirstCheckPattern.m_nColIndex-1];
                    break;
                case eSwapDirection.Right:
                    if (pFirstCheckPattern.m_nColIndex+1 < this.m_nMatrixCol)
                        pSecondCheckPattern = this.mPatternsSpr[pFirstCheckPattern.m_nRowIndex][pFirstCheckPattern.m_nColIndex+1];
                    break;
                case eSwapDirection.Up:
                    if (pFirstCheckPattern.m_nRowIndex+1 < this.m_nMatrixRow)
                        pSecondCheckPattern = this.mPatternsSpr[pFirstCheckPattern.m_nRowIndex+1][pFirstCheckPattern.m_nColIndex];
                    break;
                case eSwapDirection.Down:
                    if (pFirstCheckPattern.m_nRowIndex > 0)
                        pSecondCheckPattern = this.mPatternsSpr[pFirstCheckPattern.m_nRowIndex-1][pFirstCheckPattern.m_nColIndex];
                    break;
                default :
                    this.mFirstCheckPattern = null;
                    this.mSecondCheckPattern = null;
                    break;
            }

            if (pSecondCheckPattern && pSecondCheckPattern.g_ePatternStatus==ePatternStatus.Normal){
                if (this.mFirstCheckPattern == pSecondCheckPattern){
                    this.mFirstCheckPattern = null;
                    //this.mCheckMarkSpr.setPosition(-1000.0,-1000.0);
                }
                // 交换位置
                this.swapTwoPattern(pFirstCheckPattern,pSecondCheckPattern,false);
            }
        }
    },
    
    // 交换两个水果精灵的位置
    swapTwoPattern:function(firstPattern, secondPattern, isRecover){
    	// 计算交换的位置数据
        var fpRow,fpCol,spRow,spCol;
        fpRow = firstPattern.m_nRowIndex;
        fpCol = firstPattern.m_nColIndex;
        spRow = secondPattern.m_nRowIndex;
        spCol = secondPattern.m_nColIndex;

        firstPattern.g_pSwapPattern = secondPattern;
        secondPattern.g_pSwapPattern = firstPattern;

        firstPattern.g_bIsRecover = isRecover;
        secondPattern.g_bIsRecover = isRecover;

        firstPattern.swapTo(gPatternsSwapTime,this.mPatternsPos[spRow][spCol]);
        secondPattern.swapTo(gPatternsSwapTime,this.mPatternsPos[fpRow][fpCol]);

        firstPattern.m_nRowIndex = spRow;
        firstPattern.m_nColIndex = spCol;
        secondPattern.m_nRowIndex = fpRow;
        secondPattern.m_nColIndex = fpCol;

        this.mPatternsSpr[fpRow][fpCol] = secondPattern;
        this.mPatternsSpr[spRow][spCol] = firstPattern;
		
		// 开始交换动画
        this.runAction(cc.sequence(cc.delayTime(gPatternsSwapTime), cc.callFunc(this.onSwapFinish,this,firstPattern)));
    },
    
    // 水果交换动画执行完毕
    onSwapFinish:function( pnode,  pPattern){
        var pfPattern = pPattern;
        var psPattern = pfPattern.g_pSwapPattern;
        pfPattern.g_ePatternStatus = ePatternStatus.Normal;
        psPattern.g_ePatternStatus = ePatternStatus.Normal;

        if (pfPattern.g_bIsRecover){
            this.onClearFinish(null,null);
        }else{
            var	matrixMark = this.createIntArray(this.m_nMatrixRow,this.m_nMatrixCol,0);//[[]];

            if (this.getResultByPoint(pfPattern.m_nRowIndex,pfPattern.m_nColIndex,matrixMark) |
                this.getResultByPoint(psPattern.m_nRowIndex,psPattern.m_nColIndex,matrixMark))
                // 消除掉相同的水果
                this.clearSomePatterns(matrixMark);
            else{
                this.swapTwoPattern(pfPattern,psPattern,true);
                cc.audioEngine.playEffect(EFFECT_PATTERN_UN_SWAP);
            }
        }
    },
    
    // 消除掉相同的水果
    clearSomePatterns:function(matrixMark){
        var tally = 0;
        this.mDestroyBatchTally++;

        for (var row=0; row<this.m_nMatrixRow; row++)
        {
            for (var col=0; col<this.m_nMatrixCol; col++)
            {
                if(this.mPatternsSpr[row][col] == null || this.mPatternsSpr[row][col].g_ePatternStatus!=ePatternStatus.Normal)
                    continue;

                switch(matrixMark[row][col]){
                    case 1:
                        this.mPatternsSpr[row][col].destroyPattern(this.mDestroyFrames);
                        this.mPatternsSpr[row][col].g_nRemoveBatchIndex = this.mDestroyBatchTally;
                        tally++;
                        break;
                    case 2:
                        this.mPatternsSpr[row][col].removeFreeze();
                        break;
                    case 3:
                        this.mPatternsSpr[row][col].explodePattern(this.mExplodeFrames);
                        this.mPatternsSpr[row][col].g_nRemoveBatchIndex = this.mDestroyBatchTally;
                        tally++;
                        break;
                    default:
                        break;
                }
            }
        }

        if (tally != 0){
            this.updateScore(tally);
            this.updateProgress();
            if(this.mMultipleTimer > 0.0)
                this.mScoreMultiple++;
            this.mMultipleTimer = 3.0;
        }

        this.runAction(cc.sequence(cc.delayTime(gPatternsClearTime),cc.callFunc(this.onClearFinish.bind(this),this,this.mDestroyBatchTally)));

        return tally;
    } ,
    
    // 消除结束以后的处理操作：从内存中移除被消除的节点
    onClearFinish:function(pnode,  removeIndex){
        var removeBatchIndex = removeIndex;
        var row,col;
        for ( col=0; col<this.m_nMatrixCol && removeBatchIndex; col++)
        {
            for ( row=0; row<this.m_nMatrixRow; row++)
            {
                if (this.mPatternsSpr[row][col] && this.mPatternsSpr[row][col].g_nRemoveBatchIndex==removeBatchIndex)
                {
                    this.mPatternBatchNode.removeChild(this.mPatternsSpr[row][col],true);
                    this.mPatternsSpr[row][col] = null;
                }
            }
        }
        for ( col=0; col<this.m_nMatrixCol; col++)
        {
            for ( row=0; row<this.m_nMatrixRow; row++)
            {
                if (row==0 && this.mPatternsSpr[row][col] && this.mPatternsSpr[row][col].m_eExtraAttr==ePatternExtraAttr.Stone)
                {
                    this.mPatternsSpr[row][col].runAction(cc.Sequence.create(cc.MoveBy.create(gPatternsFallTime,cc.p(0.0,-400.0)),
                    cc.CallFunc.create(this.removeNode.bind(this),this)));
                    this.mPatternsSpr[row][col] = null;
                }

                if (this.mPatternsSpr[row][col] == null)
                {
                    var notnull_r = -1;
                    for (var n = row+1;n<this.m_nMatrixRow;n++)
                    {
                        if (this.mPatternsSpr[n][col] != null)
                        {
                            if (row==0 && this.mPatternsSpr[n][col].m_eExtraAttr == ePatternExtraAttr.Stone)
                            {
                                this.mPatternsSpr[n][col].runAction(cc.Sequence.create(cc.MoveBy.create(gPatternsFallTime,cc.p(0.0,-400.0)),
                                cc.CallFunc.create(this.removeNode.bind(this),this)));
                                this.mPatternsSpr[n][col] = null;
                            }
                            else
                            {
                                notnull_r = n;
                                break;
                            }
                        }
                    }

                    if (notnull_r != -1)
                    {
                        if (this.mPatternsSpr[notnull_r][col].g_ePatternStatus != ePatternStatus.Normal)
                        {
                            row = this.m_nMatrixRow;
                            break;
                        }

                        if(this.mPatternsSpr[notnull_r][col] == this.mFirstCheckPattern){
                            //this.mCheckMarkSpr.setPosition(-100.0,-100.0);
                            this.mFirstCheckPattern = null;
                        }

                        this.mPatternsSpr[notnull_r][col].moveTo((notnull_r-row)*0.1,this.mPatternsPos[row][col]);
                        this.mPatternsSpr[row][col] = this.mPatternsSpr[notnull_r][col];
                        this.mPatternsSpr[row][col].m_nRowIndex = row;
                        this.mPatternsSpr[row][col].m_nColIndex = col;
                        this.mPatternsSpr[notnull_r][col] = null;
                    }
                }
            }
        }

        for ( col=0; col<this.m_nMatrixCol; col++)
        {
            for ( row = this.m_nMatrixRow-1; row>=0; row--){
            if (this.mPatternsSpr[row][col] == null)
                this.addOnePattern(row,col);
            else
                break;
            }
        }

        this.runAction(cc.sequence(cc.delayTime(0.65), cc.callFunc(this.detectionMatrix.bind(this),this)));
    } ,
    
    // 移除指定节点
    removeNode:function(child){
        this.mPatternBatchNode.removeChild(child,true);
    },
    
    // 创建一个矩阵数组，并设置为默认值
    createIntArray:function(arow,acol,defValue){
        var arr = [];
        for (var row=0; row<arow; row++ )
        {
            arr[row] = [];
            for (var col=0; col<acol; col++){
                arr[row][col] = defValue;
            }
        }
        return arr;
    },
    
    // 检测水果矩阵是否有需要消除的水果
    detectionMatrix:function(){
        if(!this.mUpdateLogic)
            return;
        
        // 获取所有可以消除的水果的矩阵
        var matrixMark = this.createIntArray(this.m_nMatrixRow,this.m_nMatrixCol,0);
        for (var col=0; col<this.m_nMatrixCol; col++)
        {
            for (var row=0; row<this.m_nMatrixRow; row++)
                this.getResultByPoint(row,col,matrixMark);
        }
		
		// 消除掉可以消除的水果矩阵
        if (this.clearSomePatterns(matrixMark) == 0){
            var bRet = true;
            for (var col=0; col<this.m_nMatrixCol && bRet; col++)
            {
                for (var row=0; row<this.m_nMatrixRow && bRet; row++)
                {
                    if (this.mPatternsSpr[row][col]==null || this.mPatternsSpr[row][col].g_ePatternStatus!=ePatternStatus.Normal)
                        bRet = false;
                }
            }
            if (bRet)
                this.excludeDeadlock();		// 排除掉死局：如果有死局，则重置水果矩阵，直到没有死局为止
        }
    },
    
    // 更新提示的计时器
    updateTimerForPrompt:function(dt){
        this.mPromptTimerTally += dt;
        if (this.mMultipleTimer > 0.0)
            this.mMultipleTimer -= dt;
        else{
            this.mMultipleTimer = 0.0;
            this.mScoreMultiple = 1;
        }

        if (gGameMode == eGameMode.Timer)
        {
            this.mTimerTally += dt;
            this.updateProgress();
        }

        if (this.mPromptTimerTally >= 10.0)
        {
            var bRet = true;
            for (var col=0; col<this.m_nMatrixCol && bRet; col++)
            {
                for (var row=0; row<this.m_nMatrixRow && bRet; row++)
                {
                    if (this.mPatternsSpr[row][col]==null || this.mPatternsSpr[row][col].g_ePatternStatus!=ePatternStatus.Normal)
                        bRet = false;
                }
            }

            if (bRet){
                this.mPromptTimerTally = 0;
                this.isHasSolution();
                //this.mPromptMarkSpr.setPosition(this.mPromptPattern.getPosition());
                this.mPromptPattern = null;
            }
        }
    },
    
    // 更新当前成绩
    updateScore:function(patternTally){
        if(!this.mUpdateLogic)
            return;
        this.mPatternClearTally += patternTally;
        this.mGameScore += patternTally*100*this.mScoreMultiple;       
        this.mScoreLabel.setString(this.mGameScore);
    },
    
    // 更新当前进度
    updateProgress:function(){
        if(!this.mUpdateLogic)
            return;

        switch(gGameMode){
            case eGameMode.Challenge:
            {
                var penergyPercent = this.mPatternClearTally/this.mPatternRequire;

                if (penergyPercent > 1.0)
                    penergyPercent = 1.0;
                else if(penergyPercent <0.0)
                    penergyPercent = 0.0;
                var vh = 326*penergyPercent;
                //this.mVisibleRect = cc.rect(0,326-vh,18,vh);
                //this.mProgressSpr.setTextureRect(this.mVisibleRect);

                if (penergyPercent == 1.0)
                    this.showGameResult(true);
                break;
            }
            case eGameMode.Timer:
            {
                var penergyPercent = 0.0;
                penergyPercent = (this.mTimeTotal-this.mTimerTally)/this.mTimeTotal;

                if (penergyPercent > 1.0)
                    penergyPercent = 1.0;
                else if(penergyPercent <0.0)
                    penergyPercent = 0.0;
                var vw = 257*penergyPercent;
                //this.mVisibleRect= cc.rect(0,0,vw,19);
                //this.mProgressSpr.setTextureRect(this.mVisibleRect);

                if (penergyPercent == 0.0)
                {
                    if(this.mPatternClearTally >= this.mPatternRequire)
                        this.showGameResult(true);
                    else
                        this.showGameResult(false);
                }
                break;
            }
        }
    },
    
    // 停止游戏逻辑
    stopGameLogic:function(){
        this.unscheduleAllCallbacks();
        this.mUpdateLogic = false;
    } ,
    
    // 显示游戏结果
    showGameResult:function(isPass){
        this.stopGameLogic();
        var resultLayer = new GameResultLayer();
        resultLayer.init();
        resultLayer.initResultData(this.mGameScore,this.mPatternRequire*100*3,gScoreData.bestScore,isPass);
        this.onExit();
        gScoreData.setLastScore(this.mGameScore);

        if(isPass)
            cc.audioEngine.playEffect(EFFECT_GAME_WIN);
        else
           cc.audioEngine.playEffect(EFFECT_GAME_FAIL);

        cc.director.getRunningScene().addChild(resultLayer,99);
    } ,
    
    // 获取可以被消除的水果矩阵
    getResultByPoint:function( row,  col, matrixMark){
        if(this.mPatternsSpr[row][col] == null)
            return false;

        var targetType = this.mPatternsSpr[row][col].m_ePatternType;
        if(targetType == -1 || this.mPatternsSpr[row][col].g_ePatternStatus != ePatternStatus.Normal)
            return false;

        var bRet = false;
        var count = 1;
        var start = col;
        var end = col;

        var i = col-1;
        while (i >= 0)
        {
            if (this.mPatternsSpr[row][i] && this.mPatternsSpr[row][i].g_ePatternStatus==ePatternStatus.Normal
                && this.mPatternsSpr[row][i].m_ePatternType == targetType){
                count++;
                start = i;
            }
            else
                break;
            i--;
        }

        i = col+1;
        while (i < this.m_nMatrixCol)
        {
            if (this.mPatternsSpr[row][i] && this.mPatternsSpr[row][i].g_ePatternStatus==ePatternStatus.Normal &&
                this.mPatternsSpr[row][i].m_ePatternType == targetType)
            {
                count++;
                end = i;
            }
            else
                break;
            i++;
        }

        if (count >= MATRIX_CONTINUOUS)
        {
            for (i = start; i <= end; i++)
            {
                switch(this.mPatternsSpr[row][i].m_eExtraAttr){
                    case ePatternExtraAttr.Bomb:
                    {
                        matrixMark[row][i] = 3;
                        if(i > 0){
                            matrixMark[row][i-1] = 3;
                            if(row > 0){
                                matrixMark[row-1][i-1] = 3;
                                matrixMark[row-1][i] = 3;
                            }
                            if(row+1 < this.m_nMatrixRow){
                                matrixMark[row+1][i-1] = 3;
                                matrixMark[row+1][i] = 3;
                            }
                        }

                        if(i+1 < this.m_nMatrixCol){
                            matrixMark[row][i+1] = 3;
                            if(row > 0)
                                matrixMark[row-1][i+1] = 3;
                            if(row+1 < this.m_nMatrixRow)
                                matrixMark[row+1][i+1] = 3;
                        }
                        break;
                    }
                    case ePatternExtraAttr.Freeze:
                        if(matrixMark[row][i] != 3)
                            matrixMark[row][i] = 2;
                        break;
                    default:
                        if(matrixMark[row][i] == 0)
                            matrixMark[row][i] = 1;
                        break;
                }
            }
            bRet = true;
        }
        // Vertical
        count = 1;
        start = row;
        i = row-1;
        while (i >= 0)
        {
            if (this.mPatternsSpr[i][col] && this.mPatternsSpr[i][col].g_ePatternStatus==ePatternStatus.Normal &&
                this.mPatternsSpr[i][col].m_ePatternType == targetType){
                count++;
                start = i;
            }
            else
                break;
            i--;
        }

        end = row;
        i = row+1;
        while (i < this.m_nMatrixRow)
        {
            if (this.mPatternsSpr[i][col] && this.mPatternsSpr[i][col].g_ePatternStatus==ePatternStatus.Normal &&
                this.mPatternsSpr[i][col].m_ePatternType == targetType){
                count++;
                end = i;
            }
            else
                break;
            i++;
        }

        if (count >= MATRIX_CONTINUOUS)
        {
            for (i = start; i <= end; i++)
            {
                switch(this.mPatternsSpr[i][col].m_eExtraAttr){
                    case ePatternExtraAttr.Bomb:
                    {
                        matrixMark[i][col] = 3;
                        if(col > 0){
                            matrixMark[i][col-1] = 3;
                            if(i > 0){
                                matrixMark[i-1][col-1] = 3;
                                matrixMark[i-1][col] = 3;
                            }
                            if(i+1 < this.m_nMatrixRow){
                                matrixMark[i+1][col-1] = 3;
                                matrixMark[i+1][col] = 3;
                            }
                        }

                        if(col+1 < this.m_nMatrixCol){
                            matrixMark[i][col+1] = 3;
                            if(i > 0)
                                matrixMark[i-1][col+1] = 3;
                            if(i+1 < this.m_nMatrixRow)
                                matrixMark[i+1][col+1] = 3;
                        }
                        break;
                    }
                    case ePatternExtraAttr.Freeze:
                        if(matrixMark[i][col] != 3)
                            matrixMark[i][col] = 2;
                        break;
                    default:
                        if(matrixMark[i][col] == 0)
                            matrixMark[i][col] = 1;
                        break;
                }
            }
            bRet = true;
        }

        return bRet;
    } ,
    
    // 判断当前水果矩阵是否是死局了
    isHasSolution:function(){
        var targetType = 0;

        for (var row=0; row<this.m_nMatrixRow; row++)
        {
            for (var col=0; col<this.m_nMatrixCol-1; col++)
            {
                if (this.mPatternsSpr[row][col].m_eExtraAttr != ePatternExtraAttr.Stone)
                {
                    targetType = this.mPatternsSpr[row][col].m_ePatternType;
                    if (targetType == this.mPatternsSpr[row][col+1].m_ePatternType)
                    {
                        //  *
                        //**
                        //  *
                        if ( row>0 && col+2<this.m_nMatrixCol && this.mPatternsSpr[row-1][col+2].m_ePatternType == targetType){
                            if(this.mPatternsSpr[row][col+2].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col+2];
                                return true;
                            }
                            if(this.mPatternsSpr[row-1][col+2].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row-1][col+2];
                                return true;
                            }
                        }

                        if ( row+1<this.m_nMatrixRow && col+2<this.m_nMatrixCol && this.mPatternsSpr[row+1][col+2].m_ePatternType == targetType ){
                            if(this.mPatternsSpr[row][col+2].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col+2];
                                return true;
                            }
                            if(this.mPatternsSpr[row+1][col+2].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row+1][col+2];
                                return true;
                            }
                        }

                        //*
                        // **
                        //*
                        if (row>0 && col>0 && this.mPatternsSpr[row-1][col-1].m_ePatternType == targetType )
                        {
                            if(this.mPatternsSpr[row][col-1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col-1];
                                return true;
                            }
                            if(this.mPatternsSpr[row-1][col-1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row-1][col-1];
                                return true;
                            }
                        }
                        if (row+1<this.m_nMatrixRow && col>0 && this.mPatternsSpr[row+1][col-1].m_ePatternType == targetType )
                        {
                            if(this.mPatternsSpr[row][col-1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col-1];
                                return true;
                            }
                            if(this.mPatternsSpr[row+1][col-1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row+1][col-1];
                                return true;
                            }
                        }

                        //*-**-*
                        if (col - 2 >= 0 && this.mPatternsSpr[row][col-2].m_ePatternType == targetType )
                        {
                            if(this.mPatternsSpr[row][col-2].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col-2];
                                return true;
                            }
                            if(this.mPatternsSpr[row][col-1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col-1];
                                return true;
                            }
                        }
                        if (col + 3 < this.m_nMatrixCol && this.mPatternsSpr[row][col+3].m_ePatternType == targetType )
                        {
                            if(this.mPatternsSpr[row][col+3].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col+3];
                                return true;
                            }
                            if(this.mPatternsSpr[row][col+2].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col+2];
                                return true;
                            }
                        }
                    }
                }
            }

            // x x |  x
            //  x  | x x
            for (var col = 0; col < this.m_nMatrixCol - 2; col++)
            {
                if (this.mPatternsSpr[row][col].m_eExtraAttr != ePatternExtraAttr.Stone){
                    targetType = this.mPatternsSpr[row][col].m_ePatternType;
                    if (targetType == this.mPatternsSpr[row][col+2].m_ePatternType)
                    {
                        if ( row>0 && targetType == this.mPatternsSpr[row-1][col+1].m_ePatternType )
                        {
                            if(this.mPatternsSpr[row-1][col+1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row-1][col+1];
                                return true;
                            }
                            if(this.mPatternsSpr[row][col+1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col+1];
                                return true;
                            }
                        }
                        if ( row+1<this.m_nMatrixRow && targetType == this.mPatternsSpr[row+1][col+1].m_ePatternType )
                        {
                            if(this.mPatternsSpr[row+1][col+1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row+1][col+1];
                                return true;
                            }
                            if(this.mPatternsSpr[row][col+1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row][col+1];
                                return true;
                            }
                        }
                    }
                }
            }
        }

        //------------------------------------------------------------------------------------------------------------------------
        for (var col = 0; col < this.m_nMatrixCol; col++)
        {
            for (var row = 0; row < this.m_nMatrixRow - 1; row++)
            {
                targetType = this.mPatternsSpr[row][col].m_ePatternType;
                if (this.mPatternsSpr[row][col].m_eExtraAttr != ePatternExtraAttr.Stone && targetType == this.mPatternsSpr[row+1][col].m_ePatternType){
                    // ? ?	
                    //  x
                    //  x
                    if (col>0 && row+2<this.m_nMatrixRow && this.mPatternsSpr[row+2][col-1].m_ePatternType == targetType )
                    {
                        if(this.mPatternsSpr[row+2][col-1].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row+2][col-1];
                            return true;
                        }
                        if(this.mPatternsSpr[row+2][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row+2][col];
                            return true;
                        }
                    }
                    if (col+1<this.m_nMatrixCol && row+2<this.m_nMatrixRow && this.mPatternsSpr[row+2][col+1].m_ePatternType == targetType )
                    {
                        if(this.mPatternsSpr[row+2][col+1].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row+2][col+1];
                            return true;
                        }
                        if(this.mPatternsSpr[row+2][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row+2][col];
                            return true;
                        }
                    }

                    //  x
                    //  x
                    // ? ?
                    if (col>0 && row>0 && this.mPatternsSpr[row-1][col-1].m_ePatternType == targetType )
                    {
                        if(this.mPatternsSpr[row-1][col-1].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row-1][col-1];
                            return true;
                        }
                        if(this.mPatternsSpr[row-1][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row-1][col];
                            return true;
                        }
                    }
                    if (col+1<this.m_nMatrixCol && row>0 && this.mPatternsSpr[row-1][col+1].m_ePatternType == targetType )
                    {
                        if(this.mPatternsSpr[row-1][col+1].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row-1][col+1];
                            return true;
                        }
                        if(this.mPatternsSpr[row-1][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row-1][col];
                            return true;
                        }
                    }

                    //* ** *
                    if (row - 2 >= 0 && this.mPatternsSpr[row-2][col].m_ePatternType == targetType )
                    {
                        if(this.mPatternsSpr[row-2][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row-2][col];
                            return true;
                        }
                        if(this.mPatternsSpr[row-1][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row-1][col];
                            return true;
                        }
                    }
                    if (row + 3 < this.m_nMatrixRow && this.mPatternsSpr[row+3][col].m_ePatternType == targetType )
                    {
                        if(this.mPatternsSpr[row+3][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row+3][col];
                            return true;
                        }
                        if(this.mPatternsSpr[row+2][col].m_bSwapEnable)
                        {
                            this.mPromptPattern = this.mPatternsSpr[row+2][col];
                            return true;
                        }
                    }
                }
            }

            //  x | x
            // x  |  x
            //  x | x
            for (var row = 0; row < this.m_nMatrixRow - 2; row++)
            {
                if (this.mPatternsSpr[row][col].m_eExtraAttr != ePatternExtraAttr.Stone)
                {
                    targetType = this.mPatternsSpr[row][col].m_ePatternType;
                    if (targetType == this.mPatternsSpr[row+2][col].m_ePatternType)
                    {
                        if (col>0 && targetType == this.mPatternsSpr[row+1][col-1].m_ePatternType )
                        {
                            if(this.mPatternsSpr[row+1][col-1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row+1][col-1];
                                return true;
                            }
                            if(this.mPatternsSpr[row+1][col].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row+1][col];
                                return true;
                            }
                        }
                        if (col+1<this.m_nMatrixCol && targetType == this.mPatternsSpr[row+1][col+1].m_ePatternType )
                        {
                            if(this.mPatternsSpr[row+1][col+1].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row+1][col+1];
                                return true;
                            }
                            if(this.mPatternsSpr[row+1][col].m_bSwapEnable)
                            {
                                this.mPromptPattern = this.mPatternsSpr[row+1][col];
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }
});