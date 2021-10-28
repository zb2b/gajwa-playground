var font = new FontFaceObserver('dgm');
font.load().then(function () {
    document.documentElement.className += " fonts-loaded";
});
const display = {width : 360, height: 680};
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
let line = [];
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

    line = this.cache.json.get('line').story.line[0];
    console.log(line);

    ui.startgame = this.add.text(0, 0, 'Start Game', fontConfig);
    InitObject(ui.startgame, display.width * 0.5, display.height * 0.5, 0.5, true);
    ui.startgame.on('pointerup', function () {
        this.disableInteractive();
        game.scene.scenes[0].tweens.add({
            targets: ui.startgame,
            alpha: 0,
            duration: 800,
        });
        setTimeout(()=> {
            // 1200 뒤에 스토리 시작
            gameStatus.chapter = 'story';
        }, 1200);
    });
    ui.lines = [];
    ui.lines.push(this.add.text(0, 0, line[0], fontConfig).setVisible(false));
    InitObject(ui.lines[0], display.width * 0.5, display.height * 0.5, 0.5,5, true);
    ui.lines[0].setAlign('center');
    ui.lines[0].on('pointerup', function () {
        gameStatus.idx++;
        this.text = line[gameStatus.idx];
        ShakeObject(this, 20, 20, 240);
        if(gameStatus.idx >= line.length) {
            gameStatus.chapter = 'chapter-1';
            gameStatus.idx = 0;
        }
    });
}
function story() {
    // TODO: 스토리 시작
    console.log('스토리 시작');
    ui.lines[0].setVisible(true);
    ShakeObject(ui.lines[0], 20, 20, 240);
}
function chapter(chapterNum) {
    // TODO: 챕터 시작
    console.log('챕터', chapterNum, '시작');
    ui.lines[0].setVisible(false);
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
    var x = obj.x;
    var y = obj.y;
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