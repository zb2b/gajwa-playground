var font = new FontFaceObserver('dgm');
font.load().then(function () {
    document.documentElement.className += " fonts-loaded";
});
const display = {width : 360, height: 680};
function device(){
    let varUA = navigator.userAgent.toLowerCase(); //userAgent 값 얻기

    if ( varUA.indexOf('android') > -1) {
        return "안드로이드";
    } else if ( varUA.indexOf("iphone") > -1||varUA.indexOf("ipad") > -1||varUA.indexOf("ipod") > -1 ) {
        return "아이폰";
    } else if ( varUA.indexOf("mac") > -1) {
        return "맥";
    } else if ( varUA.indexOf("windows") > -1) {
        return "컴퓨터";
    } else {
        return "기계";
    }
}

const config = {
    type: Phaser.AUTO,
    width: display.width,
    height: display.height,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    parent: 'canvas',
    pixelArt: true
};
const fontConfig = {font: '32px "dgm"', color: '#fff'};
const game = new Phaser.Game(config);
// TODO: 게임 상태 변경
let gameStatus = {
    Chapter: 'load',
    Index: 0,
    get chapter(){
        return this.Chapter;
    },
    set chapter(value) {
        this.Chapter = value;
        if(value === 'story') story();
        else if(value.split("-")[0] === 'chapter') chapter(value.split("-")[1]);
        myLog.text = this.Chapter + "-" + this.Index;
    },
    get idx(){
        return this.Index;
    },
    set idx(value) {
        this.Index = value;
        myLog.text = this.Chapter + "-" + this.Index;
    },
};
let myLog = {text: null};
const chapterTitle = [];
const line = { story: [], chapter: [] };
const ui = {};
const timer = { shaker: null };
function preload ()
{
    this.load.json('line', 'data/line.json');
}
const gameManager = {status: 'ready'};
function create () {
    gameStatus.chapter = 'main';
    gameStatus.idx = 0;
    // TODO: LOG TEXT
    myLog = this.add.text(8, 8, 'main-0', fontConfig).setFontSize(16);

    // TODO: JSON LINES TO ARRAY
    let lineJson = this.cache.json.get('line');
    for (let l = 0; l < lineJson.chapter.length; l++) {
        chapterTitle.push(lineJson.chapter[l]);
    }
    // line Json 첫번째 배열: 챕터별 라인, 두번째 배열: 라인 당 개별 대사
    line.story = lineJson.line.story;
    console.log(line);

    ui.startgame = this.add.text(0, 0, 'Start Game', fontConfig);
    InitObject(ui.startgame, display.width * 0.5, display.height * 0.5, 0.5, true);
    ui.startgame.on('pointerup', function () {
        this.disableInteractive();
        game.scene.scenes[0].tweens.add({
            targets: ui.startgame,
            alpha: 0,
            duration: 800,
            onComplete: () => gameStatus.chapter = 'story'
        });
    });
    // TODO: 스토리 시작 메인 텍스트 설정
    ui.mainText = this.add.text(0, 0, line.story[0][0], fontConfig).setVisible(false).setAlign('center');
    InitObject(ui.mainText, display.width * 0.5, display.height * 0.5, 0.5,true);
    ui.mainText.on('pointerup', function () {
        gameStatus.idx++;
        this.text = line.story[0][gameStatus.idx];
        ShakeObject(this, 20, 20, 240);
        if(gameStatus.idx >= line.story[0].length) {
            gameStatus.chapter = 'chapter-1';
            gameStatus.idx = 0;
        }
    });
    // TODO: 챕터 타이틀 텍스트 설정
    ui.chapterText = this.add.text(0, 0, chapterTitle[0], fontConfig).setVisible(false).setAlign('center');
    InitObject(ui.chapterText, display.width * 0.5, display.height * 0.5, 0.5,true);

    // TODO: 메인 대화창 텍스트 설정
    ui.talkText = this.add.text(0, 0, line.story[1][0], fontConfig).setVisible(true).setAlign('left').setFontSize(16);
    InitObject(ui.talkText, 20, display.height - 40, 0,true);
}
function story() {
    // TODO: 스토리 시작
    console.log('스토리 시작');
    ui.mainText.setVisible(true);
    ShakeObject(ui.mainText, 20, 20, 240);
}
function chapter(chapterNum) {
    // TODO: 챕터 시작
    console.log('챕터', chapterNum, '시작');
    ui.mainText.setVisible(false);
    ui.chapterText.setVisible(true);
    ui.chapterText.alpha = 0;
    game.scene.scenes[0].tweens.add({
        targets: ui.chapterText,
        alpha: 1,
        duration: 2000,
        yoyo: true,
        ease: Phaser.Math.Easing.Elastic.InOut,
        onComplete: startChapter
    });
    function startChapter() {
        gameStatus.idx++;

    }
}

function update () {

}
function InitObject(obj, x, y, origin, setInteractive) {
    obj.x = x;
    obj.y = y;
    obj.setOrigin(origin);
    if(setInteractive) obj.setInteractive();
}
function RandomPlusMinus() {
    return (Math.random() > 0.5) ? 1 : -1;
}
function RandomizePos(obj, x, y, min, max) {
    obj.x = x + min + Math.random() * max * RandomPlusMinus();
    obj.y = y + min + Math.random() * max * RandomPlusMinus();
}
function ShakeObject(obj, max, speed, time) {
    if(timer.shaker !== null) return;
    const x = obj.x;
    const y = obj.y;
    setTimeout(()=> {
        clearTimeout(timer.shaker);
        timer.shaker = null;
        obj.x = x;
        obj.y = y;
    }, time);
    repeat();
    function repeat() {
        RandomizePos(obj, x, y, 0, max);
        timer.shaker = setTimeout(repeat, speed);
    }
}