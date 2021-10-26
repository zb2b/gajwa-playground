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
let gameStatus = 'title';
let line;
const ui = {};
const timer = { shaker: null };
function preload ()
{
    this.load.json('line', 'data/line.json');
}
const gameManager = {status: 'ready'};
function create () {

    line = this.cache.json.get('line').story.line[0];
    console.log(line);
    ui.startgame = this.add.text(0, 0, 'Start Game', fontConfig);
    InitObject(ui.startgame, display.width * 0.5, display.height * 0.5, 0.5, true);
    ui.startgame.on('pointerup', function () {
        gameStatus = 'level-0';
        console.log(gameStatus);
        game.scene.scenes[0].tweens.add({
            targets: ui.startgame,
            alpha: 0,
            duration: 800,
        });
        setTimeout(()=> {
            this.setVisible(false);
            ui.lines[0].setVisible(true);
            ShakeObject(ui.lines[0], 20, 20, 240);

        }, 1200);
        //ShakeObject(ui.startgame, 20, 20, 240);
    });
    ui.lines = [];
    ui.lines.push(this.add.text(0, 0, line[0], fontConfig).setVisible(false));
    InitObject(ui.lines[0], display.width * 0.5, display.height * 0.5, 0.5,5, false);
    if(gameStatus === 'level-0') console.log('log');

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