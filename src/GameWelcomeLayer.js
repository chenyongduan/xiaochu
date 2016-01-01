// 游戏欢迎视图
var GameWelcomeLayer = cc.Layer.extend({
    // 实现欢迎视图的初始化方法
    init:function () {
        // 调用父类的初始化方法(每个继承自Layer的子类都要调用该方法)
        this._super();
        // 获取窗体大小，以便控件布局
        var size = cc.director.getWinSize();
        // 添加背景图片
        var spriteBg = cc.Sprite.create(res.StartDitu);
        spriteBg.setAnchorPoint(0.5, 0.5);
        spriteBg.setPosition(size.width / 2, size.height / 2);
        this.addChild(spriteBg, 0);

        // 添加LOGO图片
        var logoSprite = cc.Sprite.create(res.StartLogo);
        logoSprite.setPosition(size.width / 2, size.height / 1.2);
        this.addChild(logoSprite, 5);

		// 添加开始菜单按钮
        var itemStartGame = cc.MenuItemImage.create(res.StartBtnPlay,
            res.StartBtnPlay2, this.menuCallBack, this);
        itemStartGame.setPosition(size.width / 2, size.height / 6);
        var menu = cc.Menu.create(itemStartGame);
        menu.setPosition(0, 0);		// 这里设置位置貌似没什么用处
        this.addChild(menu);
    },
    
    // 实现菜单的回调方法
    menuCallBack:function(sender){
    	// 播放单击按钮的音效
        cc.audioEngine.playEffect(EFFECT_BUTTON_CHICK);
        
        // 设置游戏模式
        gGameMode = eGameMode.Challenge;
        //gGameMode = eGameMode.Timer;
        
        // 创建游戏主界面对象
        var nextLayer = new GamePatternMatrix;
        nextLayer.init();
        var nextScene = cc.Scene.create();
        nextScene.addChild(nextLayer);
        
        // 切换到游戏主视图界面
        cc.director.runScene(new cc.TransitionRotoZoom(1, nextScene));	// 从上到下切换场景
    }
});

var GameWelcomeScene = cc.Scene.extend({
    onEnter:function () {
    	// 调用父类的初始化方法
        this._super();
        
        // 初始化成绩数据管理对象
        gScoreData.initData();

        // 创建游戏欢迎视图对象
        var layer = new GameWelcomeLayer();
        this.addChild(layer);
        layer.init();

        // 设置声音参数
        cc.audioEngine.setMusicVolume(1.0);
        cc.audioEngine.setEffectsVolume(1.0);
//        if(0){
//        	// 播放背景音乐(有点吵，所以给屏蔽掉了)
//	        cc.audioEngine.playMusic(MUSIC_BACKGROUND, true);
//        }
    }
});
