// 消除水果的连续数量，必须大于等于该值才允许消除
var MATRIX_CONTINUOUS = 3;

// 行列总数
var MATRIX_ROW_MAX = 7; //行数
var MATRIX_COL_MAX = 7; //列数
var PATTERN_TYPE_MAX_COUNT = 5; //最大类型个数
var GAME_PLAY_TIME = 90; //时间

var gPatternsFallTime = 0.4;		// 水果下落的时间
var gPatternsSwapTime = 0.17;		// 两个水果交换的时间

// 游戏主界面类
var GamePatternMatrix = cc.Layer.extend({
    mPatternBatchNode:null,		// 用于批量产生精灵节点
    mPatternsSpr:null,			// 水果精灵矩阵数组，存储所有的水果精灵
    mPatternsPos:null,			// 水果精灵坐标点的矩阵数组
    mProgressSpr:null,			// 进度条精灵
    mSelectImg:null,       //选中的图片
    mFirstCheckPattern:null,
    mSecondCheckPattern:null,
    mDestroyBatchTally:0,
    mTimeTotal:0,
    mGameScore:0,
    mUpdateLogic:true,
    mScoreLabel:null,
    mPromptPattern:null,
    mListener1:null,			// 自定义事件：MSG_CHECK_PATTERN
    mListener2:null,			// 自定义事件：MSG_SWAP_PATTERN
	
	// 初始化方法
    init:function ( ) {
    	// 调用父类的初始化方法
        this._super();

        // 初始化属性值
        this.mTimeTotal = GAME_PLAY_TIME;	// 游戏时间限制
        this.setTag(111);		// 定义当前场景的tag，便于在游戏结果界面中获取这个场景，并移除这个场景的事件处理

        this.initView();

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
        this.runAction(cc.sequence(cc.delayTime(0.7), cc.callFunc(this.initMatrix,this )));
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

        var self = this;
        //道具
        var daojuSprite = cc.Sprite.create(res.DaojuFuyi);
        daojuSprite.setAnchorPoint(0.5,0.5);
        daojuSprite.setPosition(size.width/5, size.height/9.5);
        this.addChild(daojuSprite, 5);

        //道具
        var daojuSprite2 = cc.Sprite.create(res.DaojuHuoqiu);
        daojuSprite2.setAnchorPoint(0.5, 0.5);
        daojuSprite2.setPosition(size.width/5*2, size.height/9.5);
        this.addChild(daojuSprite2, 5);

        //道具
        var daojuSprite3 = cc.Sprite.create(res.DaojuQuanzhang);
        daojuSprite3.setAnchorPoint(0.5, 0.5);
        daojuSprite3.setPosition(size.width/5*3, size.height/9.5);
        this.addChild(daojuSprite3, 5);

        //道具
        var daojuSprite4 = cc.Sprite.create(res.DaojuXiongzhen);
        daojuSprite4.setAnchorPoint(0.5, 0.5);
        daojuSprite4.setPosition(size.width/5*4, size.height/9.5);
        this.addChild(daojuSprite4, 5);

        // 设置触摸的侦听事件，以便让水果精灵响应触摸操作
        var touchListener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,	// 单次点击
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var strImg = "";
                var strName = "";
                var objSprite;
                if(cc.rectContainsPoint(daojuSprite.getBoundingBox(),touch.getLocation())) {
                    objSprite = daojuSprite;
                    strImg = res.DaojuFuyi;
                    strName = "daojufuyi";
                }
                else if(cc.rectContainsPoint(daojuSprite2.getBoundingBox(),touch.getLocation())){
                    objSprite = daojuSprite2;
                    strImg = res.DaojuHuoqiu;
                    strName = "daojuhuoqiu";
                }
                else if(cc.rectContainsPoint(daojuSprite3.getBoundingBox(),touch.getLocation())){
                    objSprite = daojuSprite3;
                    strImg = res.DaojuQuanzhang;
                    strName = "daojuquanzhang";
                }
                else if(cc.rectContainsPoint(daojuSprite4.getBoundingBox(),touch.getLocation())) {
                    objSprite = daojuSprite4;
                    strImg = res.DaojuXiongzhen;
                    strName = "daojuxiongzhen";
                }
                else{
                    return false;
                }

                var daojuSpriteTmp = cc.Sprite.create(strImg);
                daojuSpriteTmp.setAnchorPoint(0.5,0.5);
                daojuSpriteTmp.setPosition(objSprite.getPosition());
                self.addChild(daojuSpriteTmp, 5);
                daojuSpriteTmp.setName(strName);

                return true;
            },
            onTouchMoved: function (touch, event) {
                var fuyiSprite = self.getChildByName("daojufuyi");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
                var fuyiSprite = self.getChildByName("daojuhuoqiu");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
                var fuyiSprite = self.getChildByName("daojuquanzhang");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
                var fuyiSprite = self.getChildByName("daojuxiongzhen");
                if(fuyiSprite != undefined){
                    fuyiSprite.setPosition(touch.getLocation());
                }
            },
            onTouchEnded: function (touch, event) {
                var fuyiSprite = self.getChildByName("daojufuyi");
                if(fuyiSprite != undefined){
                    var curRect = fuyiSprite.getBoundingBox();
                    curRect.width = 30;
                    curRect.height = 30;
                    var curTouch = self.mPatternBatchNode.convertToNodeSpace(cc.p(curRect.x,curRect.y));
                    curRect.x = curTouch.x;
                    curRect.y = curTouch.y;
                    for (var row = 0; row < MATRIX_ROW_MAX; row++)
                    {
                        for (var col = 0; col < MATRIX_COL_MAX; col++){

                            if(cc.rectIntersectsRect(self.mPatternsSpr[row][col].getBoundingBox(),curRect)) {

                            }
                        }
                    }
                    fuyiSprite.removeFromParent();
                }
                var fuyiSprite = self.getChildByName("daojuhuoqiu");
                if(fuyiSprite != undefined){
                    cc.log(cc.rectIntersectsRect(self.mPatternBatchNode.getBoundingBox(),fuyiSprite.getBoundingBox()));
                    fuyiSprite.removeFromParent();
                }
                var fuyiSprite = self.getChildByName("daojuquanzhang");
                if(fuyiSprite != undefined){
                    cc.log(cc.rectIntersectsRect(self.mPatternBatchNode.getBoundingBox(),fuyiSprite.getBoundingBox()));
                    fuyiSprite.removeFromParent();
                }
                var fuyiSprite = self.getChildByName("daojuxiongzhen");
                if(fuyiSprite != undefined){
                    cc.log(cc.rectIntersectsRect(self.mPatternBatchNode.getBoundingBox(),fuyiSprite.getBoundingBox()));
                    fuyiSprite.removeFromParent();
                }
            },
            onTouchCancelled:function (touch,evengt){
                var fuyiSprite = self.getChildByName("daojufuyi");
                if(fuyiSprite != undefined){
                    fuyiSprite.removeFromParent();
                }
                var fuyiSprite = self.getChildByName("daojuhuoqiu");
                if(fuyiSprite != undefined){
                    fuyiSprite.removeFromParent();
                }
                var fuyiSprite = self.getChildByName("daojuquanzhang");
                if(fuyiSprite != undefined){
                    fuyiSprite.removeFromParent();
                }
                var fuyiSprite = self.getChildByName("daojuxiongzhen");
                if(fuyiSprite != undefined){
                    fuyiSprite.removeFromParent();
                }
            }
        });

        // 添加到事件管理器中去
        cc.eventManager.addListener(touchListener, this);

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

        this.mProgressSpr = new cc.ProgressTimer(new cc.Sprite(res.PlayJindutiao));
        this.mProgressSpr.type = cc.ProgressTimer.TYPE_BAR;
        this.mProgressSpr.midPoint = cc.p(0, 0);
        this.mProgressSpr.barChangeRate = cc.p(1, 0);
        this.mProgressSpr.setPosition(size.width/2, size.height/1.3);
        this.mProgressSpr.setPercentage(100);
        this.addChild(this.mProgressSpr,1);

        //创建选中图片
        this.mSelectImg = cc.Sprite.create(res.YansuXuanzhong);
        this.mSelectImg.setAnchorPoint(0.5, 0.5);
        this.mSelectImg.setVisible(false)
        this.mPatternBatchNode.addChild(this.mSelectImg, 0);
    },
    // 移除注册的事件处理（主要是在游戏结果界面调用，避免再次进入游戏界面时，重复注册事件）
    clearMsgListener:function(){
        cc.eventManager.removeListener(this.mListener1);
        cc.eventManager.removeListener(this.mListener2);
        cc.eventManager.removeListener(this);
    },
    // 初始化矩阵数组
    initMatrix:function(){
        // 计算每个精灵的间隔距离
        var space = this.mPatternBatchNode.getContentSize().width/8.2;
		// 计算x、y坐标的基准坐标点
        var baseX = this.mPatternBatchNode.getContentSize().width/7.5;
        var baseY = this.mPatternBatchNode.getContentSize().height/7.5;
        // 开始初始化水果背景块矩阵，并渲染每个矩阵节点
        for (var row = 0; row < MATRIX_ROW_MAX; row++)
        {
            for (var col = 0; col < MATRIX_COL_MAX; col++)
            {
            	// 计算当前水果精灵的坐标点位置
                this.mPatternsPos[row][col] = cc.p(baseX + col*space, baseY+ row*space);
            }
        }
		// 添加并初始化水果矩阵
        for (var row = 0; row < MATRIX_ROW_MAX; row++)
        {
            for (var col = 0; col < MATRIX_COL_MAX; col++)
            {
                this.addOnePattern(row,col,false);
            }
        }
		
		// 启动提示计时器
        this.schedule(this.updateTimerForPrompt, 1);
        
        // 启动检测矩阵计时器
        this.runAction(cc.sequence(cc.delayTime(gPatternsFallTime + 0.1), cc.callFunc(this.detectionMatrix, this)));
    } ,
    checkSamePattern:function(row, col){
        if((col - 1 >= 0) && (col - 2 >= 0) && this.mPatternsSpr[row][col - 1] != null && this.mPatternsSpr[row][col - 2] != null ){
            if(this.mPatternsSpr[row][col - 1].m_ePatternType == this.mPatternsSpr[row][col].m_ePatternType &&
                this.mPatternsSpr[row][col - 2].m_ePatternType == this.mPatternsSpr[row][col].m_ePatternType){
                    var patternType = this.mPatternsSpr[row][col].m_ePatternType + 1;
                    if (patternType > PATTERN_TYPE_MAX_COUNT){
                        patternType = 1;
                    }
                    this.mPatternsSpr[row][col].m_ePatternType = patternType
            }
        }

        if((row - 1 >= 0) && (row - 2 >= 0) && this.mPatternsSpr[row - 1][col] != null && this.mPatternsSpr[row - 2][col] != null ){
            if(this.mPatternsSpr[row - 1][col].m_ePatternType == this.mPatternsSpr[row][col].m_ePatternType &&
                this.mPatternsSpr[row - 2][col].m_ePatternType == this.mPatternsSpr[row][col].m_ePatternType){
                    var patternType = this.mPatternsSpr[row][col].m_ePatternType + 1;
                    if (patternType > PATTERN_TYPE_MAX_COUNT){
                        patternType = 1;
                    }
                    this.mPatternsSpr[row][col].m_ePatternType = patternType
            }
        }
    },
    // 添加一个水果精灵节点
    addOnePattern:function(row, col,bSame){
        var SealProbability = 1;	// 封印的几率
        var TimeProbability = 1;	// 减少过关时间的几率
        var DoubleProbability = 1;	// 消除两次的几率
        var BombProbability = 1;	// 炸弹的几率
    	// 按照设定的几率值，随机产生水果精灵的类型及扩展属性值
        var temp = 0 | (Math.random() * 10000);
        var prob = temp%100;
        // 生成水果类型
        var attr = ePatternExtraAttr.Normal;

        if ( SealProbability != 0  && prob < SealProbability )
            attr = ePatternExtraAttr.Seal;
        else if (row != 0 && TimeProbability != 0  && prob < SealProbability + TimeProbability )
            attr = ePatternExtraAttr.Time;
        else if ( DoubleProbability != 0  && prob < SealProbability + TimeProbability + DoubleProbability )
            attr = ePatternExtraAttr.Double;
        else if ( BombProbability != 0  && prob < SealProbability + TimeProbability + DoubleProbability + BombProbability )
            attr = ePatternExtraAttr.Bomb;

        var patternType = parseInt((Math.random()*5)+1);
        this.mPatternsSpr[row][col] = new GamePatternSprite();
        this.mPatternsSpr[row][col].m_eExtraAttr = attr;
        this.mPatternsSpr[row][col].m_ePatternType = patternType;

        if(bSame == false && attr == ePatternExtraAttr.Normal) {
            this.checkSamePattern(row,col);
        }

		// 创建一个水果精灵对象，并移动到当前行列位置
        this.mPatternsSpr[row][col].init(this.mPatternsSpr[row][col].m_ePatternType, attr);
        this.mPatternsSpr[row][col].setAnchorPoint(0.5,0.5);
        this.mPatternsSpr[row][col].m_nRowIndex = row;
        this.mPatternsSpr[row][col].m_nColIndex = col;
        this.mPatternsSpr[row][col].setPosition(this.mPatternsPos[row][col].x, this.mPatternsPos[row][col].y + 250.0);		// 初始位置在高出，用moveTo方法落到当前行列位置
        this.mPatternsSpr[row][col].moveTo(gPatternsFallTime, this.mPatternsPos[row][col]);
		
		// 添加当前节点
        this.mPatternBatchNode.addChild(this.mPatternsSpr[row][col],5);
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
                for (var row = 0; row < MATRIX_ROW_MAX; row ++)
                {
                    for (var col = 0; col < MATRIX_COL_MAX; col ++){
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
        if ( pPattern != null){
//            pPattern.stopAllActions();
//            pPattern.setScale(1);
            this.mSelectImg.setVisible(false);
            if (this.mFirstCheckPattern === null){
            	// 如果还没有水果被选中，则设置mFirstCheckPattern为被选择的水果
                this.mFirstCheckPattern = pPattern;
                this.mSelectImg.setPosition(pPattern.getPosition());
                this.mSelectImg.setVisible(true);
            }else{
            	// 如果已经有水果被选中了，设置mSecondCheckPattern为第二个被选择的水果
                this.mSecondCheckPattern = pPattern;
                if (this.mSecondCheckPattern === this.mFirstCheckPattern)
                {
                	// 两次点击了同一个水果精灵
                    this.mSecondCheckPattern = null;
                    this.mSelectImg.setPosition(pPattern.getPosition());
                    this.mSelectImg.setVisible(true);
                    return;
                }
				
				// 判断两个水果精灵是否是挨着的
                var isAdjacent = false;
                if (this.mFirstCheckPattern.m_nRowIndex == this.mSecondCheckPattern.m_nRowIndex)
                {
                    if (this.mFirstCheckPattern.m_nColIndex>0 &&
                        this.mFirstCheckPattern.m_nColIndex-1 == this.mSecondCheckPattern.m_nColIndex)
                        isAdjacent = true;
                    else if (this.mFirstCheckPattern.m_nColIndex+1<MATRIX_COL_MAX &&
                        this.mFirstCheckPattern.m_nColIndex+1 == this.mSecondCheckPattern.m_nColIndex)
                        isAdjacent = true;
                }
                else if (this.mFirstCheckPattern.m_nColIndex == this.mSecondCheckPattern.m_nColIndex)
                {
                    if(this.mFirstCheckPattern.m_nRowIndex>0 &&
                        this.mFirstCheckPattern.m_nRowIndex-1 == this.mSecondCheckPattern.m_nRowIndex)
                        isAdjacent = true;
                    else if(this.mFirstCheckPattern.m_nRowIndex+1<MATRIX_ROW_MAX &&
                        this.mFirstCheckPattern.m_nRowIndex+1 == this.mSecondCheckPattern.m_nRowIndex)
                        isAdjacent = true;
                }
                this.mSelectImg.setVisible(false);
                if (isAdjacent){
                	// 是挨着的，交换这两个水果精灵
                    this.swapTwoPattern(this.mFirstCheckPattern,this.mSecondCheckPattern,false);
                    this.mFirstCheckPattern = null;
                    this.mSecondCheckPattern = null;
                }else{
                	// 不挨着，使新点击的水果精灵呈被选中状态
                    this.mSelectImg.setPosition(this.mSecondCheckPattern.getPosition());
                    this.mSelectImg.setVisible(true);
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

            var pFirstCheckPattern = pPattern;	// 临时变量，用于交换
            if (this.mFirstCheckPattern === pFirstCheckPattern){
            	// 是同一个水果，取消掉被选择的状态
                this.mFirstCheckPattern = null;
            }

            if(pFirstCheckPattern.g_ePatternStatus != ePatternStatus.Normal)
                return;		// 只交换普通状态的水果

			// 开始处理交换操作
            var pSecondCheckPattern = null;
            switch(pFirstCheckPattern.m_eSwapDirection){
            	// 根据水果的交换方向，决定跟哪个位置的水果来交换对象（交换水果对象，不是位置）
                case eSwapDirection.Left:
                    if (pFirstCheckPattern.m_nColIndex > 0)
                        pSecondCheckPattern = this.mPatternsSpr[pFirstCheckPattern.m_nRowIndex][pFirstCheckPattern.m_nColIndex-1];
                    break;
                case eSwapDirection.Right:
                    if (pFirstCheckPattern.m_nColIndex+1 < MATRIX_COL_MAX)
                        pSecondCheckPattern = this.mPatternsSpr[pFirstCheckPattern.m_nRowIndex][pFirstCheckPattern.m_nColIndex+1];
                    break;
                case eSwapDirection.Up:
                    if (pFirstCheckPattern.m_nRowIndex+1 < MATRIX_ROW_MAX)
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

            if (pSecondCheckPattern && pSecondCheckPattern.m_eExtraAttr == ePatternExtraAttr.Stone){
                return
            }

            if (pSecondCheckPattern && pSecondCheckPattern.g_ePatternStatus == ePatternStatus.Normal){
                if (this.mFirstCheckPattern == pSecondCheckPattern){
                    this.mFirstCheckPattern = null;
                }
                this.mSelectImg.setVisible(false);
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
            var	matrixMark = this.createIntArray(MATRIX_ROW_MAX,MATRIX_COL_MAX,0);
            if (this.getResultByPoint(pfPattern.m_nRowIndex,pfPattern.m_nColIndex,matrixMark) |
                this.getResultByPoint(psPattern.m_nRowIndex,psPattern.m_nColIndex,matrixMark))
                // 消除掉相同的水果
                this.clearSomePatterns(matrixMark);
            else{
                this.swapTwoPattern(pfPattern,psPattern,true);
            }
        }
    },
    // 消除掉相同的水果
    clearSomePatterns:function(matrixMark){
        var tally = 0;
        this.mDestroyBatchTally++;

        for (var row=0; row<MATRIX_ROW_MAX; row++)
        {
            for (var col=0; col<MATRIX_COL_MAX; col++)
            {
                if(this.mPatternsSpr[row][col] == null || this.mPatternsSpr[row][col].g_ePatternStatus!=ePatternStatus.Normal)
                    continue;

                switch(matrixMark[row][col]){
                    case 1:
                        this.mPatternsSpr[row][col].destroyPattern();
                        this.mPatternsSpr[row][col].g_nRemoveBatchIndex = this.mDestroyBatchTally;
                        tally++;
                        break;
                    case 2:
                        this.mPatternsSpr[row][col].removeFreeze();
                        break;
                    case 3:
                        this.mPatternsSpr[row][col].explodePattern();
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
        }

        this.runAction(cc.sequence(cc.delayTime(0.5),cc.callFunc(this.onClearFinish.bind(this),this,this.mDestroyBatchTally)));

        return tally;
    } ,
    // 消除结束以后的处理操作：从内存中移除被消除的节点
    onClearFinish:function(pnode,  removeIndex){
        var removeBatchIndex = removeIndex;
        var row,col;
        for ( col=0; col<MATRIX_COL_MAX && removeBatchIndex; col++)
        {
            for ( row=0; row<MATRIX_ROW_MAX; row++)
            {
                if (this.mPatternsSpr[row][col] && this.mPatternsSpr[row][col].g_nRemoveBatchIndex==removeBatchIndex)
                {
                    this.mPatternBatchNode.removeChild(this.mPatternsSpr[row][col],true);
                    this.mPatternsSpr[row][col] = null;
                }
            }
        }
        for ( col=0; col<MATRIX_COL_MAX; col++)
        {
            for ( row=0; row<MATRIX_ROW_MAX; row++)
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
                    for (var n = row+1;n<MATRIX_ROW_MAX;n++)
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
                            row = MATRIX_ROW_MAX;
                            break;
                        }

                        if(this.mPatternsSpr[notnull_r][col] == this.mFirstCheckPattern){
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

        for ( col=0; col<MATRIX_COL_MAX; col++)
        {
            for ( row = MATRIX_ROW_MAX-1; row>=0; row--){
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
        var matrixMark = this.createIntArray(MATRIX_ROW_MAX,MATRIX_COL_MAX,0);
        for (var col=0; col<MATRIX_COL_MAX; col++)
        {
            for (var row=0; row<MATRIX_ROW_MAX; row++)
                this.getResultByPoint(row,col,matrixMark);
        }
		
		// 消除掉可以消除的水果矩阵
        if (this.clearSomePatterns(matrixMark) == 0){
            var bRet = true;
            for (var col=0; col<MATRIX_COL_MAX && bRet; col++)
            {
                for (var row=0; row<MATRIX_ROW_MAX && bRet; row++)
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
        if(!this.mUpdateLogic)
            return;
        if (gGameMode == eGameMode.Timer)
        {
            this.mTimeTotal -= dt;
            if(this.mTimeTotal < 0){
                this.mTimeTotal = 0;
            }
            this.mProgressSpr.setPercentage(this.mTimeTotal/GAME_PLAY_TIME*100);
            if(this.mTimeTotal <= 0){
                this.showGameResult(false);
            }
        }
    },
    // 更新当前成绩
    updateScore:function(patternTally){
        if(!this.mUpdateLogic)
            return;
        this.mGameScore += patternTally*100;
        this.mScoreLabel.setString(this.mGameScore);
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
        resultLayer.initResultData(this.mGameScore,this.mGameScore,gScoreData.bestScore,isPass);
        this.onExit();
        gScoreData.setLastScore(this.mGameScore);

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

        var i = col - 1;
        while (i >= 0)
        {
            if (this.mPatternsSpr[row][i] && this.mPatternsSpr[row][i].g_ePatternStatus == ePatternStatus.Normal
                && this.mPatternsSpr[row][i].m_ePatternType == targetType){
                count++;
                start = i;
            }
            else
                break;
            i--;
        }

        i = col+1;
        while (i < MATRIX_COL_MAX)
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
                            if(row+1 < MATRIX_ROW_MAX){
                                matrixMark[row+1][i-1] = 3;
                                matrixMark[row+1][i] = 3;
                            }
                        }

                        if(i+1 < MATRIX_COL_MAX){
                            matrixMark[row][i+1] = 3;
                            if(row > 0)
                                matrixMark[row-1][i+1] = 3;
                            if(row+1 < MATRIX_ROW_MAX)
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
        while (i < MATRIX_ROW_MAX)
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
                            if(i+1 < MATRIX_ROW_MAX){
                                matrixMark[i+1][col-1] = 3;
                                matrixMark[i+1][col] = 3;
                            }
                        }

                        if(col+1 < MATRIX_COL_MAX){
                            matrixMark[i][col+1] = 3;
                            if(i > 0)
                                matrixMark[i-1][col+1] = 3;
                            if(i+1 < MATRIX_ROW_MAX)
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

        for (var row=0; row<MATRIX_ROW_MAX; row++)
        {
            for (var col=0; col<MATRIX_COL_MAX-1; col++)
            {
                if (this.mPatternsSpr[row][col].m_eExtraAttr != ePatternExtraAttr.Stone)
                {
                    targetType = this.mPatternsSpr[row][col].m_ePatternType;
                    if (targetType == this.mPatternsSpr[row][col+1].m_ePatternType)
                    {
                        //  *
                        //**
                        //  *
                        if ( row>0 && col+2<MATRIX_COL_MAX && this.mPatternsSpr[row-1][col+2].m_ePatternType == targetType){
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

                        if ( row+1<MATRIX_ROW_MAX && col+2<MATRIX_COL_MAX && this.mPatternsSpr[row+1][col+2].m_ePatternType == targetType ){
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
                        if (row+1<MATRIX_ROW_MAX && col>0 && this.mPatternsSpr[row+1][col-1].m_ePatternType == targetType )
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
                        if (col + 3 < MATRIX_COL_MAX && this.mPatternsSpr[row][col+3].m_ePatternType == targetType )
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
            for (var col = 0; col < MATRIX_COL_MAX - 2; col++)
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
                        if ( row+1<MATRIX_ROW_MAX && targetType == this.mPatternsSpr[row+1][col+1].m_ePatternType )
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
        for (var col = 0; col < MATRIX_COL_MAX; col++)
        {
            for (var row = 0; row < MATRIX_ROW_MAX - 1; row++)
            {
                targetType = this.mPatternsSpr[row][col].m_ePatternType;
                if (this.mPatternsSpr[row][col].m_eExtraAttr != ePatternExtraAttr.Stone && targetType == this.mPatternsSpr[row+1][col].m_ePatternType){
                    // ? ?	
                    //  x
                    //  x
                    if (col>0 && row+2<MATRIX_ROW_MAX && this.mPatternsSpr[row+2][col-1].m_ePatternType == targetType )
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
                    if (col+1<MATRIX_COL_MAX && row+2<MATRIX_ROW_MAX && this.mPatternsSpr[row+2][col+1].m_ePatternType == targetType )
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
                    if (col+1<MATRIX_COL_MAX && row>0 && this.mPatternsSpr[row-1][col+1].m_ePatternType == targetType )
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
                    if (row + 3 < MATRIX_ROW_MAX && this.mPatternsSpr[row+3][col].m_ePatternType == targetType )
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
            for (var row = 0; row < MATRIX_ROW_MAX - 2; row++)
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
                        if (col+1<MATRIX_COL_MAX && targetType == this.mPatternsSpr[row+1][col+1].m_ePatternType )
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
