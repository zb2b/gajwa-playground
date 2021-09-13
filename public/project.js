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
const hitarea = [];
let player;
const game = new Phaser.Game(config);
function preload ()
{
    this.load.spritesheet('idle', 'image/idle.png', {frameWidth: 28, frameHeight: 33, endFrame: 10 });
}
const gameManager = {status: 'ready'};
function create () {
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
const Axis = { x: 0, y: 0 };
function update () {
}