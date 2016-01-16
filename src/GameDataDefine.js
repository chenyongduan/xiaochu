var eGameMode = {
    Challenge:0,
    Timer:1,
    Count:2
};

var gGameMode = eGameMode.Challenge;

var gScoreData = {lastScore:0,bestScore:0};

gScoreData.setLastScore = function(score){
    this.lastScore = score;

    if (score > this.bestScore)
    {
        this.bestScore = score;
        cc.sys.localStorage.setItem('bestScore',this.bestScore);
    }
    cc.sys.localStorage.setItem('lastScore',this.lastScore);
};

gScoreData.initData = function(){
    if( cc.sys.localStorage.getItem('gameData') == null){
        cc.sys.localStorage.setItem('bestScore','0');
        cc.sys.localStorage.setItem('lastScore','0');

        cc.sys.localStorage.setItem('gameData',33) ;
        return;
    }

    this.bestScore = parseInt(cc.sys.localStorage.getItem('bestScore'));
};

