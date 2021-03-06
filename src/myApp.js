var MyLayer = cc.Layer.extend({
    helloLabel:null,
    sprite:null,

    init:function () {
        this._super();


        var size = cc.director.getWinSize();

        // add a "close" icon to exit the progress. it's an autorelease object
        var closeItem = cc.MenuItemImage.create(
            s_CloseNormal,
            s_CloseSelected,
            function () {
                cc.log("close");
            },this);
        closeItem.setAnchorPoint(0.5, 0.5);

        var menu = cc.Menu.create(closeItem);
        menu.setPosition(0, 0);
        this.addChild(menu, 1);
        closeItem.setPosition(size.width - 20, 20);

        /////////////////////////////
        // 3. add your codes below...
        // add a label shows "Hello World"
        // create and initialize a label
        this.helloLabel = cc.LabelTTF.create("FruitAttack", "Impact", 38);
        // position the label on the center of the screen
        this.helloLabel.setPosition(size.width / 2, size.height - 40);
        // add the label as a child to this layer
        this.addChild(this.helloLabel, 5);

        // add "Helloworld" splash screen"
        this.sprite = cc.Sprite.create(s_HelloWorld);
        this.sprite.setAnchorPoint(0.5, 0.5);
        this.sprite.setPosition(size.width / 2, size.height / 2);
        this.sprite.setScale(size.height/this.sprite.getContentSize().height);
        
        if(0){
	        // 测试一些效果
	        this.sprite.setScale(0.5);
	        this.sprite.setRotation(180);
	        var rotateToA = cc.RotateTo.create(2, 0);
			var scaleToA = cc.ScaleTo.create(2, 1, 1);
			this.sprite.runAction(rotateToA);
	        this.sprite.runAction(cc.Sequence.create(rotateToA, scaleToA));
        }
        
        
        this.addChild(this.sprite, 0);
    }
});

var MyScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        
        //gScoreData.initData();

        //var spriteFrameCache = cc.SpriteFrameCache.getInstance();
        //spriteFrameCache.addSpriteFrames("res/baseResource.plist","res/baseResource.png");
        
        var layer = new MyLayer();
        this.addChild(layer);
        layer.init();
        
        //gSharedEngine.setMusicVolume(1);
        //gSharedEngine.setEffectsVolume(1);
        //gSharedEngine.playMusic(MUSIC_BACKGROUND,true);
    }
});
