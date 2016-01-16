// 自定义事件通知的标识
var MSG_CHECK_PATTERN = "MSG_CHECK_PATTERN";
var MSG_SWAP_PATTERN = "MSG_SWAP_PATTERN";

// 两个水果交换的方向
var eSwapDirection = {"Up":0,"Down":1,"Left":2,"Right":3};

// 水果精灵的扩展属性：普通、炸弹、冰冻、石头
var ePatternExtraAttr = {"Normal":0,"Bomb":1,"Freeze":2,"Stone":3,"Time":4,"Seal":5,"Double":6};

// 水果的状态：普通、移动、销毁、爆炸
var ePatternStatus = {"Normal":0,"Move":1,"Destroy":2,"Explode":3};

var ePatternImg = new Array();
ePatternImg[1] = res.YansuDangao;
ePatternImg[2] = res.YansuPutaojiu;
ePatternImg[3] = res.YansuJuanxincai;
ePatternImg[4] = res.YansuNailao;
ePatternImg[5] = res.YansuNiupai;

// 水果精灵类
var GamePatternSprite = cc.Sprite.extend({
    m_ePatternType:-1,	// 水果类型，本例中有5个类型
    m_eExtraAttr:ePatternExtraAttr.Normal,	// 扩展属性：0普通、1炸弹、2冰冻、3石头
    m_eSwapDirection:eSwapDirection.Up,		// 交换的方向
    m_nRowIndex:0,		// 水果所在的行索引
    m_nColIndex:0,		// 水果所在的列索引
    m_extraTypeSpr:null,	// 显示扩展类型的精灵，如：炸弹、冰冻、石头
    m_bSwapEnable:true,		// 是否允许主动交换(只有Normal类型的才允许主动交换，其余的只能被动交换)
    // 在外部引用的属性
    g_pSwapPattern:null,	// 用于交换两个位置的水果
    g_nRemoveBatchIndex:0,	// 批量消除的索引值
    g_nMoveBatchIndex:0,	// 批量移动的索引值
    g_bIsRecover:false,		// 标记是否为准备交换状态
    g_ePatternStatus:ePatternStatus.Normal,		// 标记水果状态
	
	// 实现初始化方法，由调用者来决定类型及扩展属性值
    init:function (type, extraAttr) {
    	// 照例，要调用父类的方法
        this._super();

        this.m_eExtraAttr = extraAttr;

        if(this.m_eExtraAttr != ePatternExtraAttr.Normal)
            this.m_ePatternType = -1;
        else
            this.m_ePatternType = type;
        
        // 设置水果类型，共7种类型的水果
        switch (this.m_eExtraAttr)
        {
        	// 如果是炸弹或冰冻，则扩展类型精灵是显示在水果纸上的
            case ePatternExtraAttr.Bomb:
            {
                this.initWithFile(res.YansuXuedai);
                this.m_bSwapEnable = false;
                break;
            }
            case ePatternExtraAttr.Double:
            {
                this.initWithFile(res.YansuDasuan);
                this.m_bSwapEnable = false;
                break;
            }
            case ePatternExtraAttr.Seal:{
                this.initWithFile(res.YansuShizijia);
                this.m_bSwapEnable = false;
                break;
            }
            case ePatternExtraAttr.Time:{
                this.initWithFile(res.YansuXianglian)
                this.m_bSwapEnable = false;
                break;
            }
            default:
                this.initWithFile(ePatternImg[type]);
                break;
        }

        // 设置触摸的侦听事件，以便让水果精灵响应触摸操作
        var touchListener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,	// 单次点击
            swallowTouches: true,
            // 分别调用自定义方法
            onTouchBegan: function (touch, event) {
            	var target = event.getCurrentTarget();
		        return target.onPatternTouchBegan(touch, event);
            },
            onTouchMoved: function (touch, event) {
            	var target = event.getCurrentTarget();
            	target.onPatternTouchMoved(touch, event);
            },
            onTouchEnded: function (touch, event) {
            	var target = event.getCurrentTarget();
            	target.onPatternTouchEnded(touch, event);
            }
        });
        
		// 添加到事件管理器中去
        cc.eventManager.addListener(touchListener, this);
    },
    setPatternAttr: function (eExtraAttr) {
        this.m_eExtraAttr = eExtraAttr;
        switch (this.m_eExtraAttr)
        {
            case ePatternExtraAttr.Stone:
            {
                this.setColor(cc.color(255,0,0));
                this.m_bSwapEnable = false;
                break;
            }
            case ePatternExtraAttr.Freeze:
            {
                this.setColor(cc.color(0,255,0));
                this.m_bSwapEnable = false;
                break;
            }
            default:
                break;
        }

        // 如果扩展类型精灵不为null，则将其添加进来
//        if (this.m_extraTypeSpr != null){
//            var size = this.getContentSize();
//            this.m_extraTypeSpr.setPosition(size.width/2,size.height/2);
//            this.addChild(this.m_extraTypeSpr);
//        }
    },
    // 显示销毁水果精灵的动画效果及音效
    destroyPattern:function(){
    	// 先标记为销毁状态
        this.g_ePatternStatus = ePatternStatus.Destroy;

		// 显示渐隐效果
        this.runAction(cc.FadeOut.create(0.3));
        
        // 播放清除音效
        //cc.audioEngine.playEffect(EFFECT_PATTERN_CLEAR);
    },
    // 显示爆炸水果精灵的动画效果及音效
    explodePattern:function(){
    	// 先标记为爆炸状态
        this.g_ePatternStatus = ePatternStatus.Explode;

		// 显示渐隐效果
        this.runAction(cc.FadeOut.create(0.3));
        
        // 播放爆炸音效
        //cc.audioEngine.playEffect(EFFECT_PATTERN_BOMB);
    },
    // 移除冰冻属性，变为普通属性
    removeFreeze:function(){
        if (this.m_eExtraAttr == ePatternExtraAttr.Freeze)
        {
        	// 设置为普通属性，允许主动交换，去掉扩展属性精灵
            this.m_eExtraAttr = ePatternExtraAttr.Normal;
            this.m_bSwapEnable = true;
            if(this.m_extraTypeSpr != null) {
                this.removeChild(this.m_extraTypeSpr, true);
                this.m_extraTypeSpr = null;
            }
        }
    } ,
    // 移动水果精灵位置
    moveTo:function( duration, position){
        if (this.g_ePatternStatus == ePatternStatus.Normal)
        {
            this.g_ePatternStatus = ePatternStatus.Move;
            var action = cc.sequence(cc.moveTo(duration,position),cc.callFunc(this.onMoveEnd.bind(this),this));
            this.runAction(action);
        }
    },
    // 交换水果的位置，执行的也是移动操作
    swapTo:function(duration, position){
        if (this.g_ePatternStatus === ePatternStatus.Normal)
        {
            this.g_ePatternStatus = ePatternStatus.Move;
            this.runAction(cc.moveTo(duration,cc.p(position.x,position.y)));
        }else{

        }
    },
    // 处理水果精灵的点击、拖拽事件
    onPatternTouchBegan: function (touch, event) {
    	var target = event.getCurrentTarget();
        var locationInNode = target.convertToNodeSpace(touch.getLocation());
        var s = target.getContentSize();
        var rect = cc.rect(0, 0, s.width, s.height);

        if (this.m_bSwapEnable && this.g_ePatternStatus==ePatternStatus.Normal && cc.rectContainsPoint(rect, locationInNode)){
        	// 如果当前水果精灵允许交换，并且为普通状态（不是销毁、爆炸等状态），并且点击范围在这个水果精灵范围内
            if (this.m_eExtraAttr == ePatternExtraAttr.Normal || this.m_eExtraAttr == ePatternExtraAttr.Bomb)
            {
            	// 如果扩展属性为普通的或炸弹的（冰冻和石头不允许点击及移动）
                this.m_bHandleTouch = true;
                var event = new cc.EventCustom(MSG_CHECK_PATTERN);
	            event.setUserData(this);
	            cc.eventManager.dispatchEvent(event);
                return true;
            }
        }
        
        return false;
    },
    onPatternTouchMoved: function (touch, event) {
        if (this.m_bHandleTouch && this.g_ePatternStatus === ePatternStatus.Normal){
        	// 如果指定了按下操作，并且水果状态为普通状态（“===”操作符用于保证类型匹配等），则判断拖拽状态
        	
        	// 获取当前点击位置及上次位置，用于判断拖拽方向
            var curTouchPos = this.getParent().convertToNodeSpace(touch.getLocation());
            var lx = curTouchPos.x -  this.getPositionX();
            var ly = curTouchPos.y -  this.getPositionY();

            if (lx > 45){
            	// 向右
                this.m_bHandleTouch = false;
                if (ly > lx)
                    this.m_eSwapDirection = eSwapDirection.Up;			// 向上
                else if (ly + lx < 0)
                    this.m_eSwapDirection = eSwapDirection.Down;		// 向下
                else
                    this.m_eSwapDirection = eSwapDirection.Right;		// 向右
                    
                // 通知调用者交换水果位置
                var event = new cc.EventCustom(MSG_SWAP_PATTERN);
	            event.setUserData(this);
	            cc.eventManager.dispatchEvent(event);

            }else if (lx < -45){
            	// 向左
                this.m_bHandleTouch = false;
                if (ly < lx)
                    this.m_eSwapDirection = eSwapDirection.Down;		// 向下
                else if(ly + lx > 0)
                    this.m_eSwapDirection = eSwapDirection.Up;			// 向上
                else
                    this.m_eSwapDirection = eSwapDirection.Left;		// 向左
                
                var event = new cc.EventCustom(MSG_SWAP_PATTERN);
	            event.setUserData(this);
	            cc.eventManager.dispatchEvent(event);

            }else if (ly > 45){
            	// 向上
                this.m_bHandleTouch = false;
                this.m_eSwapDirection = eSwapDirection.Up;
                
                var event = new cc.EventCustom(MSG_SWAP_PATTERN);
	            event.setUserData(this);
	            cc.eventManager.dispatchEvent(event);

            }else if (ly < -45){
            	// 向下
                this.m_bHandleTouch = false;
                this.m_eSwapDirection = eSwapDirection.Down;
                
                var event = new cc.EventCustom(MSG_SWAP_PATTERN);
	            event.setUserData(this);
	            cc.eventManager.dispatchEvent(event);
            }
        }
    },
    onPatternTouchEnded: function (touch, event) {

    },
    // 水果移动动画结束的回调操作
    onMoveEnd:function(){
        this.g_ePatternStatus = ePatternStatus.Normal;
    },
    onEnter:function () {
        this._super();
    },
    onExit:function () {
        this._super();
    }
});
