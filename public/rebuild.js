console.log("%c@ MYZY.SPACE 2021 POWERED BY MYZY_", "color: #00ff00; font-weight: 900; font-size: 1em; background-color: black; padding: 1rem");
const font = new FontFaceObserver('dgm').load();
const display = {width : 320, height: 640, centerW : 160, centerH: 320 };
const fontConfig = {font: '32px "dgm"', color: '#fff'};
const config = {
    type: Phaser.AUTO,
    width: display.width,
    height: display.height,
    physics: {
        default: 'arcade',
        arcade: {
            //debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    parent: 'canvas',
    pixelArt: true,
    plugins: {
        scene: [
            {
                key: "PhaserNavMeshPlugin", // Key to store the plugin class under in cache
                plugin: PhaserNavMeshPlugin, // Class that constructs plugins
                mapping: "navMeshPlugin", // Property mapping to use for the scene, e.g. this.navMeshPlugin
                start: true
            },
        ]
    }
};
const game = new Phaser.Game(config);
const mainObject = {
    player : 'main player',
    dom : 'dom'
};
const mainConfig = {
    playerTarget : {x: 0, y: 0},
    playerCount : 0,
    playerPath : [],
    playerMovable : false,

    domTarget : {x: 0, y: 0},
    domCount : 0,
    domPath : [],
    domFollow: false
}
const timer = {};
const maps = {};
const ui = {};
const line = {};
const debug = {};
const status = {
    scene: 'title',
    index: 0,
    chapterIdx: 0
};

function preload() {
    // data
    this.load.json('text', 'data/text.json');
    // tile
    this.load.tilemapTiledJSON("map", "map/newmap.json");
    this.load.image("tileset", "map/set.png");
    // sprites
    this.load.spritesheet('player', 'image/player.png', { frameWidth: 32, frameHeight: 32, endFrame: 7 });
    this.load.spritesheet('dom', 'image/dom.png', { frameWidth: 32, frameHeight: 32, endFrame: 7 });
}
function create() {
    setLines(this);
    setAnimations(this);
    createGraphics(this);
    createUIObjects(this);
    createCharacters(this);
    buildMap(this);
    setLayer(this);
    this.input.on('pointerup', pointer => {
        mainConfig.playerCount = 1;
        mainConfig.playerPath = maps.navMesh.findPath(mainObject.player, { x: pointer.x, y: pointer.y });
        if(mainConfig.playerPath === null || mainConfig.playerPath.length < 1) return;
        moveCharacter(mainObject.player);
        //path_log();
    });
}
function update() {
    let dis = {
        player: Phaser.Math.Distance.Between(mainObject.player.x, mainObject.player.y, mainConfig.playerTarget.x, mainConfig.playerTarget.y),
        dom: Phaser.Math.Distance.Between(mainObject.dom.x, mainObject.dom.y, mainConfig.domTarget.x, mainConfig.domTarget.y),
        each: Phaser.Math.Distance.Between(mainObject.player.x, mainObject.player.y, mainObject.dom.x, mainObject.dom.y),
    }
    
    if (mainObject.player.body.speed > 0){
        if (dis.player < 4){
            if(mainConfig.playerPath === null || mainConfig.playerPath.length < 1 || mainConfig.playerPath.length === mainConfig.playerCount + 1) {
                mainObject.player.body.reset(mainObject.player.x, mainObject.player.y);
                if(mainObject.player.anims.currentAnim.key !== 'player-stand') mainObject.player.play('player-stand');
            }
            else {
                mainConfig.playerCount++;
                moveCharacter(mainObject.player);
            }
        }
        if(dis.each > 80){
            mainConfig.domCount = 1;
            mainConfig.domPath = maps.navMesh.findPath(mainObject.dom, { x: mainObject.player.x, y: mainObject.player.y });
            moveCharacter(mainObject.dom);
        }
    }
    if (mainObject.dom.body.speed > 0){
        if (dis.dom < 4){
            if(mainConfig.domPath === null || mainConfig.domPath.length < 1 || mainConfig.domPath.length === mainConfig.domCount + 1) {
                mainObject.dom.body.reset(mainObject.dom.x, mainObject.dom.y);
                if(mainObject.dom.anims.currentAnim.key !== 'dom-stand') mainObject.dom.play('dom-stand');
            }
            else {
                mainConfig.domCount++;
                moveCharacter(mainObject.dom);
            }

        }
        else if(dis.each < 40){
            mainObject.dom.body.reset(mainObject.dom.x, mainObject.dom.y);
            if(mainObject.dom.anims.currentAnim.key !== 'dom-stand') mainObject.dom.play('dom-stand');
        }
    }
    // 레이어 순서 정렬
    mainObject.group.list.sort(function(a, b) {
        return a.y > b.y ? 1 : -1;
    });

}

// TODO 오브젝트 생성
function buildMap(scene) {
    // 타일맵 생성 <br>
    // 네비메쉬 : maps.navMesh <br>
    // 벽 레이어 : maps.wallLayer
    maps.tilemap = scene.add.tilemap("map");
    maps.tileset = maps.tilemap.addTilesetImage("tileset", "tileset");
    maps.tilemap.createStaticLayer("bg", maps.tileset);
    maps.wallLayer = maps.tilemap.createLayer("walls", maps.tileset);
    maps.objectLayer = maps.tilemap.getObjectLayer("navmesh");
    maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer, 12.5);
}
function createCharacters(scene) {
    // 메인 캐릭터 생성 <br>
    // 플레이어 오브젝트 : mainObject.player
    mainObject.player = scene.physics.add.sprite(display.centerW, 180, 'player')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('player-stand');
    mainObject.dom = scene.physics.add.sprite(display.centerW - 60, 180, 'dom')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('dom-stand');
}
function createGraphics(scene) {
    // TODO 그래픽 생성
    // 디버그 그래픽
    debug.graphics = scene.add.graphics();
    debug.graphics.lineStyle(1, 0x00ff00, 1);
    debug.graphics.fillStyle( 0xff0000, 1);
}
function createUIObjects(scene) {
    // TODO UI 오브젝트 생성
    ui.cam = scene.cameras.main;
    ui.skip = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x00ff00, 0)
        .setInteractive();
    ui.background = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000);
    ui.title = scene.add.text(display.centerW, display.centerH, 'SHADOW OF MYZY', fontConfig)
        .setAlign('center').setOrigin(0.5);
    ui.largeText = scene.add.text(display.centerW, display.centerH, '', fontConfig)
        .setAlign('center').setOrigin(0.5).setVisible(false);
    
    ui.skip.on('pointerup', function () {
        skip();
    });
}
function setLayer(scene) {
    // TODO 레이어 및 그룹 오브젝트 생성
    mainObject.layer = scene.add.layer();

    mainObject.group = scene.add.container();
    mainObject.group.add([mainObject.player, mainObject.dom]);

    ui.group = scene.add.container();
    ui.group.add([ui.background, ui.largeText, ui.title, ui.skip]);

    // 레이어 정렬
    mainObject.layer.add(mainObject.group);
    mainObject.layer.add(ui.group);
}
function setAnimations(scene) {
    // TODO 애니메이션 추가
    scene.anims.create({
        key: 'player-stand',
        frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'player-seek',
        frames: scene.anims.generateFrameNumbers('player', { start: 2, end: 3, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'player-run',
        frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 7, first: 0 }),
        frameRate: 8,
        repeat: -1
    });

    scene.anims.create({
        key: 'dom-stand',
        frames: scene.anims.generateFrameNumbers('dom', { start: 0, end: 3, first: 0 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: 'dom-run',
        frames: scene.anims.generateFrameNumbers('dom', { start: 4, end: 7, first: 0 }),
        frameRate: 8,
        repeat: -1
    });
}
function setLines(scene) {
    // TODO 텍스트 데이터 생성 및 정리
    let jsonText = scene.cache.json.get('text');
    line.chapter = jsonText.chapter;
    line.task = jsonText.task;
    line.opening = jsonText.opening;
    line.story = jsonText.story;
    console.log(line);
}
// TODO 동작 메서드
function Move(character, target, speed) {
    game.scene.scenes[0].physics.moveToObject(character, target, speed);
}
function moveCharacter(character) {
    if(character === mainObject.player && mainConfig.playerMovable){
        mainConfig.playerTarget.x = mainConfig.playerPath[mainConfig.playerCount].x;
        mainConfig.playerTarget.y = mainConfig.playerPath[mainConfig.playerCount].y;
        if(character.anims.currentAnim.key !== 'player-run') character.play('player-run');
        mainObject.player.setFlipX(mainObject.player.x - mainConfig.playerTarget.x > 0);
        Move(mainObject.player, mainConfig.playerTarget, 160);
    }
    else if(character === mainObject.dom && mainConfig.domFollow){
        mainConfig.domTarget.x = mainConfig.domPath[mainConfig.domCount].x;
        mainConfig.domTarget.y = mainConfig.domPath[mainConfig.domCount].y;
        if(character.anims.currentAnim.key !== 'dom-run') character.play('dom-run');
        mainObject.dom.setFlipX(mainObject.dom.x - mainConfig.domTarget.x > 0);
        Move(mainObject.dom, mainConfig.domTarget, 160);
    }
}
function path_log() {
    debug.graphics.clear();
    if(mainConfig.playerPath === null) {
        return;
    }
    let line = new Phaser.Curves.Path(mainObject.player.x, mainObject.player.y);
    for (let i = 0; i < mainConfig.playerPath.length; i++)
    {
        line.lineTo(mainConfig.playerPath[i].x, mainConfig.playerPath[i].y);
        debug.graphics.fillRect(mainConfig.playerPath[i].x - 4, mainConfig.playerPath[i].y - 4, 8, 8);
    }
    debug.graphics.lineStyle(1, 0xff0000, 1);
    line.draw(debug.graphics);
}
function RandomPlusMinus() {
    return (Math.random() > 0.5) ? 1 : -1;
}
function RandomizePos(obj, x, y, min, max) {
    obj.x = x + min + Math.random() * max * RandomPlusMinus();
    obj.y = y + min + Math.random() * max * RandomPlusMinus();
}
function shakeObject(obj, max, speed, time) {
    if(timer.shaker !== undefined) return;
    const x = obj.x;
    const y = obj.y;
    setTimeout(()=> {
        clearTimeout(timer.shaker);
        timer.shaker = undefined;
        obj.x = x;
        obj.y = y;
    }, time);
    repeat();
    function repeat() {
        RandomizePos(obj, x, y, 0, max);
        timer.shaker = setTimeout(repeat, speed);
    }
}
function typewriteText(object, txt, speed) {
    const length = txt.length
    let i = 0
    game.scene.scenes[0].time.addEvent({
        callback: () => {
            object.text += txt[i]
            ++i
        },
        repeat: length - 1,
        delay: speed
    })
}

// TODO 이벤트 메서드
function skip() {
    if(status.scene === 'title'){
        status.scene = 'opening';
        ui.title.setVisible(false);
        ui.largeText.setVisible(true);
        ui.largeText.text = line.opening[status.index];
        shakeObject(ui.largeText, 20, 20, 240);
        status.index++;
    }
    else if(status.scene === 'opening'){
        if(line.opening[status.index] === undefined) {
            status.scene = 'chapter';
            status.index = 0;
            status.chapterIdx = 1;

            ui.group.setVisible(false);
            mainConfig.playerMovable = true;
            mainConfig.domFollow = true;
            function zoomOut() {
                ui.cam.zoom = 4;
                ui.cam.pan(mainObject.player.x, mainObject.player.y - 32, 1);
                setTimeout(() => ui.cam.pan(display.centerW, display.centerH, 2800, Phaser.Math.Easing.Quintic.InOut, true), 200);
                ui.cam.zoomTo(1, 3000, Phaser.Math.Easing.Quintic.InOut);
            }
        }
        else {
            ui.largeText.text = line.opening[status.index];
            shakeObject(ui.largeText, 20, 20, 240);
            status.index++;
        }
    }
    else if(status.scene === 'chapter'){

    }
}
