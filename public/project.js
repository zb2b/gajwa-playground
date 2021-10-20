var font = new FontFaceObserver('dgm');

font.load().then(function () {
    document.documentElement.className += " fonts-loaded";
});

var config = {
    type: Phaser.AUTO,
    width: 400,
    height: 800,
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
function preload ()
{
    this.load.spritesheet('idle', 'image/idle.png', {frameWidth: 28, frameHeight: 33, endFrame: 10 });
    this.load.json('line', 'data/line.json');
}
const gameManager = {status: 'ready'};
function create () {
    function playerActions() {
        const hitarea = [];
        let player;
        let idleConfig = {
            key: 'idle',
            frames: this.anims.generateFrameNumbers('idle'),
            frameRate: 8,
            repeat: -1
        };
        this.anims.create(idleConfig);
        player = this.physics.add.sprite(0, 0, 'idle').play('idle');
        player.scale = 2;
        player.body.setSize(28, 33).setOffset(0, 0);
        player.setOrigin(0);
        hitarea[0] = this.add.rectangle(100, 400, 200, 800, 0x00ffff, 0.5);
        hitarea[1] = this.add.rectangle(300, 400, 200, 800, 0xffff00, 0.5);
        hitarea[0].setInteractive().on('pointerdown', ()=>{
            player.setVelocityX(-100);
        });
        hitarea[1].setInteractive().on('pointerdown', ()=>{
            player.setVelocityX(100);
        });
        hitarea[0].setInteractive().on('pointerout', ()=>{
            player.setVelocityX(0);
        });
        hitarea[1].setInteractive().on('pointerout', ()=>{
            player.setVelocityX(0);
        });
        hitarea[0].setInteractive().on('pointerup', ()=>{
            player.setVelocityX(0);
        });
        hitarea[1].setInteractive().on('pointerup', ()=>{
            player.setVelocityX(0);
        });
    }

    line = this.cache.json.get('line').story.line[0];
    console.log(line);

    ui.startgame = this.add.text(0, 0, 'Start Game', fontConfig);
    ui.startgame.x = 200;
    ui.startgame.y = 400;
    ui.startgame.setOrigin(0.5);
    ui.startgame.setInteractive();
    ui.startgame.on('pointerup', function () {
        gameStatus = 'level-0';
        console.log(gameStatus);
        ui.startgame.setVisible(false);
    });
}
function update () {
}