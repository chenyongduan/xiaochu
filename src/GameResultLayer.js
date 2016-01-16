var GameResult_ChickMenu = "GameResult_ChickMenu";

var eGameResultMenuTag = {
    Continue :1,
    Restart:2,
    Quit:3
};

var SCORE_MAX = 9999999;

var GameResultLayer = cc.LayerColor.extend({
    mGameScore:0,
    mStarScores:null,
    mIsSucceed:true,
    mIgnoreTouch:false,
    mStarSprites:null,

    init:function () {
    	this._super(cc.color(0,0,0,128));

        this.mStarSprites = [];
		
        var size = cc.director.getWinSize();

        // 添加重新开始菜单
        var itemRestart =cc.MenuItemImage.create(res.ResultBtnRestart1, res.ResultBtnRestart2, this.menuCallBack, this);
        itemRestart.setTag(eGameResultMenuTag.Restart);
        itemRestart.setPosition(size.width / 2, size.height / 10 * 3.5);

        var resultMenu = cc.Menu.create(itemRestart);
        resultMenu.setPosition(0,0);
        resultMenu.setScale(1.2);
        this.addChild(resultMenu);
    },
    initResultData:function( gameScore, referenceScore, recordScore, isSucceed){
        if(gameScore > SCORE_MAX)
            gameScore = SCORE_MAX;
        else if(gameScore < 0)
            gameScore = 0;

        this.mGameScore = gameScore;

        this.mIsSucceed = isSucceed;

        for (var starIndex=0; starIndex<3; starIndex++){
                this.showStar(starIndex);
        }
    },
    showStar:function(starIndex){
    	var size = cc.director.getWinSize();
    	
        this.mStarSprites[starIndex] = cc.Sprite.create(res.ResultStar);
        this.mStarSprites[starIndex].setScale(0.1);

        switch(starIndex){
            case 0:
                this.mStarSprites[starIndex].setPosition(size.width / 4, size.height / 10 * 6);
                break;
            case 1:
                this.mStarSprites[starIndex].setPosition(size.width / 2, size.height / 10 * 6);
                break;
            case 2:
                this.mStarSprites[starIndex].setPosition(size.width / 4 * 3, size.height / 10 * 6);
                break;
        }
        this.addChild(this.mStarSprites[starIndex]);

        this.mStarSprites[starIndex].runAction(cc.ScaleTo.create(0.7,1.0,1.0));
        this.mStarSprites[starIndex].runAction(cc.RotateBy.create(0.7,720.0));
    },
    menuCallBack:function(sender){
        if (this.mIgnoreTouch == false){
            this.mIgnoreTouch = true;
            switch(sender.getTag()){
                case eGameResultMenuTag.Restart:
                    var nextScene = cc.Scene.create();
                    var nextLayer = new GamePatternMatrix();
                    nextLayer.init();
                    nextScene.addChild(nextLayer);
                    var matrixLayer = cc.director.getRunningScene().getChildByTag(111);
                    matrixLayer.clearMsgListener();
                    cc.director.runScene(new cc.TransitionFade(1, nextScene));
                    break;
            }
        }
    }
});
