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
    const player = this.physics.add.sprite(0, 0, 'idle').play('idle');
    player.scale = 2;
    player.body.setSize(28, 33).setOffset(0, 0);
    player.setOrigin(0);
}
function update () {

}