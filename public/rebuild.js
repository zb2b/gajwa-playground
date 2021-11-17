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
const object = {};
// TODO 설정
const path = new Map();
const moveTargets = {
    player: {x: 0, y: 0},
    dom: {x: 0, y: 0},
    engineer: {x: 0, y: 0}
};
const mainConfig = {
    debugMode : true,
    debugModeChapter: 2,
    
    playerMovable : false,
    domFollow: false,

    // 이동 후 바라볼 오브젝트
    lookAt: {player: null, dom: null, engineer: null},
    moveFinishedEvent: {player: null, dom: null, engineer: null},
    pathCount: { player: 0, dom: 0, engineer: 0 },

    // ui 설정
    titleFadeOut : null,

    // game 설정
    seedNum : 0,
    pcTimerPushed : false,
    pcTimer : 0,
    pcCrackCount : 0,
    clear : [false, false, false, false, false],
    reward: [0, 0, 0, 0, 0],
    bridgeSelection: 0,
    bridgeAnswer : [1, 2, 5, 7, 8],
    bridgeFail : [0, 3, 4, 6, 9]
}
const timer = {};
const event = {};
const maps = {};
const ui = {};
const line = {};
const debug = {};
const status = {
    scene: 'title',
    index: 0,
    chapterIdx: 0,
    taskIdx: 0
};

function preload() {
    // TODO 프리로드
    // data
    this.load.json('text', 'data/text.json');
    // tile
    this.load.tilemapTiledJSON("map", "map/newmap.json");
    this.load.image("tileset", "map/set.png");
    // sprites
    this.load.aseprite('character', 'image/character.png', 'image/character.json');
    this.load.atlas('obj', 'image/obj.png', 'image/obj.json');
    // UI
    this.load.image('transition', 'image/transition0.png');
    this.load.image('nineslice', 'image/nineslice.png');
    this.load.image('nineslice-task', 'image/nineslice-task.png');
    this.load.spritesheet('mark', 'image/mark.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });
    this.load.image("pc", "image/pc.png");
    this.load.spritesheet('pc-err', 'image/pc-err.png', { frameWidth: 96, frameHeight: 80, endFrame: 5 });
    this.load.spritesheet('bridge', 'image/bridge.png', { frameWidth: 32, frameHeight: 32, endFrame: 9 });
    this.load.atlas('keyboard', 'image/keyboard.png', 'image/keyboard.json');
    // plugins
    this.load.plugin('rexninepatchplugin', 'rexninepatchplugin.min.js', true);
    // particle
    this.load.atlas("leaf", "image/leaf.png", 'image/leaf.json');
}
function create() {
    setLines(this);
    setAnimations(this);
    createGraphics(this);
    createUIObjects(this);
    createCharacters(this);
    createObjects(this);
    createParticles(this);
    buildMap(this);
    setLayer(this);
    this.input.on('pointerup', pointer => {
        if(!mainConfig.playerMovable) return;
        mainConfig.pathCount.player = 1;
        path.set('player', maps.navMesh.findPath(mainObject.player, { x: pointer.x, y: pointer.y }));
        if(path.get('player') === null || path.get('player').length < 1) return;
        moveCharacter('player');
        //path_log();
    });
}
function update() {
    // TODO 업데이트 프레임
    let dis = {
        player: Phaser.Math.Distance.Between(mainObject.player.x, mainObject.player.y, moveTargets.player.x, moveTargets.player.y),
        dom: Phaser.Math.Distance.Between(mainObject.dom.x, mainObject.dom.y, moveTargets.dom.x, moveTargets.dom.y),
        engineer: Phaser.Math.Distance.Between(mainObject.engineer.x, mainObject.engineer.y, moveTargets.engineer.x, moveTargets.engineer.y),

        each: Phaser.Math.Distance.Between(mainObject.player.x, mainObject.player.y, mainObject.dom.x, mainObject.dom.y),
    }
    if (mainObject.player.body.speed > 0){
        if (dis.player < 4){
            // 목적지 도착시 플레이어 정지
            let playerPath = path.get('player');
            if(playerPath === null || playerPath.length < 1 || playerPath.length === mainConfig.pathCount.player + 1) {
                mainObject.player.body.reset(mainObject.player.x, mainObject.player.y);
                if(mainObject.player.anims.currentAnim.key !== 'player-stand') mainObject.player.play('player-stand');
                moveFinished(mainObject.player);
            }
            // 다음 경로로 변경
            else {
                mainConfig.pathCount.player++;
                moveCharacter('player');
            }
        }
        // 플레이어와 멀때 따라가기 경로
        if(dis.each > 80 && mainConfig.domFollow){
            moveToPoint('dom', mainObject.player.x, mainObject.player.y, true);
        }
    }
    if (mainObject.dom.body.speed > 0){
        if (dis.dom < 4){
            // 목적지 도착시 정지
            if(path.get('dom') === null || path.get('dom').length < 1 || path.get('dom').length === mainConfig.pathCount.dom + 1) {
                mainObject.dom.body.reset(mainObject.dom.x, mainObject.dom.y);
                if(mainObject.dom.anims.currentAnim.key !== 'dom-stand') mainObject.dom.play('dom-stand');
                moveFinished(mainObject.dom);
            }
            // 다음 경로로 변경
            else {
                mainConfig.pathCount.dom++;
                moveCharacter('dom');
            }
        }
        // 플레이어와 가까울때 정지
        else if(dis.each < 40 && mainConfig.domFollow){
            mainObject.dom.body.reset(mainObject.dom.x, mainObject.dom.y);
            if(mainObject.dom.anims.currentAnim.key !== 'dom-stand') mainObject.dom.play('dom-stand');

        }
    }
    if (mainObject.engineer.body.speed > 0){
        if (dis.engineer < 4){
            // 목적지 도착시 정지
            if(path.get('engineer') === null || path.get('engineer').length < 1 || path.get('engineer').length === mainConfig.pathCount.engineer + 1) {
                mainObject.engineer.body.reset(mainObject.engineer.x, mainObject.engineer.y);
                if(mainObject.engineer.anims.currentAnim.key !== 'engineer-stand') mainObject.engineer.play('engineer-stand');
                moveFinished(mainObject.engineer);
            }
            // 다음 경로로 변경
            else {
                mainConfig.pathCount.engineer++;
                moveCharacter('engineer');
            }
        }
    }
    // 레이어 순서 정렬
    mainObject.group.list.sort(function(a, b) {
        return a.y > b.y ? 1 : -1;
    });
    if(mainConfig.pcTimerPushed && !mainConfig.clear[0]) mainConfig.pcTimer++;
    if(mainConfig.pcTimer > 140) {
        mainConfig.pcTimerPushed = false;
        mainConfig.pcTimer = 0;
        pcShutDown('power');
    }
}

// TODO 오브젝트 생성
function buildMap(scene) {
    // 타일맵 생성 <br>
    // 네비메쉬 : maps.navMesh <br>
    // 벽 레이어 : maps.wallLayer
    maps.tilemap = scene.add.tilemap("map");
    maps.tileset = maps.tilemap.addTilesetImage("tileset", "tileset");
    maps.tilemap.createLayer("bg", maps.tileset);
    maps.wallLayer = [];
    maps.objectLayer = [];

    for (let i = 0; i < 3; i++) {
        maps.wallLayer[i] = maps.tilemap.createLayer("display" + i, maps.tileset).setVisible(false);
        maps.objectLayer[i] = maps.tilemap.getObjectLayer(i.toString());
    }
    maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[0], 12.5);
}
function createCharacters(scene) {
    // 메인 캐릭터 생성 <br>
    // 플레이어 오브젝트 : mainObject.player
    mainConfig.anims = scene.anims.createFromAseprite('character');
    let chracterData = scene.cache.json.get('character').meta.frameTags;
    for (let i = 0; i < chracterData.length; i++) {
        if(chracterData[i].repeat === undefined) mainConfig.anims[i].repeat = -1;
        else mainConfig.anims[i].repeat = chracterData[i].repeat;
        if(chracterData[i].frameRate === undefined) mainConfig.anims[i].frameRate = 2;
        else mainConfig.anims[i].frameRate = chracterData[i].frameRate;
    }

    mainObject.player = scene.physics.add.sprite(display.centerW, 180)
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('player-stand');
    mainObject.dom = scene.physics.add.sprite(display.centerW - 60, 180)
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('dom-stand').setVisible(false);
    mainObject.engineer = scene.physics.add.sprite(display.centerW, display.centerH + 80)
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('engineer-stand').setVisible(false);
    mainObject.man = scene.physics.add.sprite(display.centerW + 92, display.centerH - 16).play('man-stand')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).setFlipX(true).setVisible(false);
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
    ui.white = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0xffffff);
    ui.background = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000);
    ui.dark = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000).setVisible(false);
    ui.title = scene.add.sprite(display.centerW, 180, 'obj', 'title').setOrigin(0.5).setScale(2);
    ui.largeText = scene.add.text(display.centerW, display.centerH, '', fontConfig)
        .setAlign('center').setOrigin(0.5).setVisible(false);
    ui.mark = scene.add.sprite(display.centerW - 60, 180, 'mark').play('mark')
        .setOrigin(0.5, 1).setScale(2).setVisible(false);

    ui.next = scene.add.rectangle(display.centerW, display.height - 30, display.width, 60, 0x00ff00).setVisible(false);
    scene.physics.add.existing(ui.next);

    // 미니게임 창 생성
    ui.gameGroup = scene.add.container();
    ui.gameBackground = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000);
    ui.gameTransitionUp = scene.add.sprite(display.centerW, 0, 'transition').setOrigin(0.5, 1).setFlipY(true).setScale(2);
    ui.gameTransitionDown = scene.add.sprite(display.centerW, display.height, 'transition').setOrigin(0.5, 0).setScale(2);
    ui.pc = scene.add.sprite(display.centerW, display.centerH, 'pc').setOrigin(0.5).setScale(2);
    ui.pcOff = scene.add.rectangle(display.centerW, display.centerH - 137, 188, 158, 0xffffff).setVisible(false);
    ui.pcErr = scene.add.sprite(display.centerW, display.centerH - 136).play('pc-err').setOrigin(0.5).setScale(2);
    ui.pcDown = scene.add.sprite(display.centerW, display.centerH - 136, 'keyboard', 'down').setOrigin(0.5).setScale(2).setVisible(false);
    ui.pcCrack = scene.add.sprite(display.centerW - 62, display.centerH + 60, 'keyboard', 'crack0').setOrigin(1).setScale(2).setVisible(false);
    ui.pcBreak = scene.add.rectangle(display.centerW - 16, display.centerH + 48, 210, 100, 0x0000f00, 0).setInteractive().on('pointerup', pointer => {
        createParts(pointer.x, pointer.y, RandomPlusMinus() * 200, -100 + Math.random() * -400);
    });
    ui.pcPw = scene.add.container();
    ui.pcPwList = [];
    ui.pcInfo = '';
    for (let i = 0; i < 4; i++) {
        ui.pcPwList[i] = scene.add.text(92.5 + i * 36, 168, '*', fontConfig).setFontSize(48).setVisible(false);
    }
    ui.pcPw.add(ui.pcPwList);
    ui.keyboard = scene.add.container();
    function setKeyboard() {
        let keys = [];
        let pos = {x: 0, y: 0};
        for (let i = 0; i < 14; i++) {
            let index = null;
            if(i === 10){
                index = 'enter-';
                pos.x = 238;
                pos.y = 514;
            }
            else if(i === 11){
                index = 'esc-';
                pos.x = 38;
                pos.y = 482;
            }
            else if(i === 12){
                index = 'danger-';
                pos.x = 38;
                pos.y = 540;
            }
            else if(i === 13){
                index = 'power-';
                pos.x = 254;
                pos.y = 340;
            }
            else{
                index = i;
                pos.x = 38 + (i * 20);
                pos.y = 510;
            }
            keys[i] = scene.add.sprite(pos.x, pos.y, 'keyboard', index + 't').setScale(2).setInteractive();
            keys[i].on('pointerdown', function () {
                this.setTexture('keyboard', index + 'f');
                if(index === 'power-') {
                    mainConfig.pcTimerPushed = true;
                    mainConfig.pcTimer = 0;
                }
            });
            keys[i].on('pointerup', function () {
                this.setTexture('keyboard', index + 't');
                keyboardAction(index);
                if(index === 'power-') mainConfig.pcTimerPushed = false;
            });
            keys[i].on('pointerout', function () {
                this.setTexture('keyboard', index + 't');
                if(index === 'power-') mainConfig.pcTimerPushed = false;
            });
        }
        ui.keyboard.add(keys);
        }
    setKeyboard();

    // 클릭 효과 생성
    ui.pcParts = scene.physics.add.group({
        visible: false,
        active: false,
        frameQuantity: 10,
        maxSize: 10
    });
    ui.effectGroup = scene.add.container();
    ui.bottom = scene.add.rectangle(display.centerW, display.height + 80, 4000, 10, 0x000000, 0);
    scene.physics.add.overlap(ui.bottom, ui.pcParts, disableParts, null, this);
    scene.physics.add.existing(ui.bottom);
    ui.effectGroup.add(ui.bottom);
    function disableParts(bottom, parts) {
        // 떨어진 나사 제거
        parts.disableBody(true, true);
    }
    // 스테이지 별 미니게임 씬 오브젝트 추가
    // 징검다리 생성
    ui.bridges = [];
    let bridgeR = 1;
    for (let i = 0; i < 10; i++) {
        let h = 68;
        let side = 0;
        let line = 0;
        if(i % 2 === 0) {
            bridgeR *= -1;
            line += h * (i / 2);
            side = bridgeR * 16;
        }
        else {
            line += h * (i / 2) - h * 0.5;
            side = bridgeR * 16 - 48;
        }
        ui.bridges[i] = scene.add.sprite(display.centerW + side,
            160 + line, 'bridge').setScale(2).setOrigin(0.5, 0);
    }
    ui.gameScene = [];
    ui.gameScene[0] = scene.add.container().add([ui.pc, ui.pcCrack, ui.keyboard, ui.pcErr, ui.pcPw, ui.pcDown, ui.pcOff, ui.pcBreak]);
    ui.gameScene[1] = scene.add.container();
    ui.bridges.forEach(function (bridge, index) {
        ui.gameScene[1].add(bridge);
        bridge.on('pointerup', function () {
            selectBridge(index, bridge);
        });
    });

    ui.gameGroup.add([ui.gameBackground, ui.gameTransitionDown, ui.gameTransitionUp]).setVisible(false);
    // 게임 씬 배열만큼 게임그룹에 추가
    ui.gameScene.forEach(scenes => {
        ui.gameGroup.add(scenes);
    });

    ui.dialogGroup = scene.add.container();
    ui.dialogBox = scene.add.rexNinePatch({
        x: display.centerW, y: display.height - 10,
        width: (display.width - 20) * 0.5, height: 180 * 0.5,
        key: 'nineslice',
        columns: [8, undefined, 8],
        rows: [8, undefined, 8],
    }).setOrigin(0.5, 1).setScale(2);
    ui.dialog = scene.add.text(30, display.height - 160, '', fontConfig).setFontSize(16).setLineSpacing(4);
    ui.dialogGroup.add([ui.dialogBox, ui.dialog]).setVisible(false);
    ui.taskGroup = scene.add.container();
    ui.task = scene.add.text(42, 34, '', fontConfig).setFontSize(16).setLineSpacing(4);
    ui.taskBox = scene.add.rexNinePatch({
        x: display.centerW, y: 64,
        width: (display.width - 20) * 0.5, height: 32,
        key: 'nineslice-task',
        columns: [15, undefined, 15],
        rows: [0, undefined, 0],
    }).setOrigin(0.5, 1).setScale(2);
    ui.taskGroup.add([ui.taskBox, ui.task]);
    ui.taskGroup.y = -64;
    ui.rewardBox = scene.add.rexNinePatch({
        x: 0, y: 0,
        width: 120, height: 32,
        key: 'nineslice',
        columns: [8, undefined, 8],
        rows: [8, undefined, 8],
    }).setOrigin(0).setScale(2);
    ui.rewardMsg = scene.add.text(120, 32, '', fontConfig).setFontSize(16).setOrigin(0.5).setLineSpacing(4);
    ui.rewardGroup = scene.add.container().setPosition(160 - 120, 320 - 40).setVisible(false);
    ui.rewardGroup.add([ui.rewardBox, ui.rewardMsg]);

    ui.skip.on('pointerup', function () {
        skip();
    });
}
function setTask(visible) {
    let scene = game.scene.scenes[0];
    let pos;
    let ease;
    if (visible){
        pos = 0;
        ease = Phaser.Math.Easing.Quintic.Out;
        ui.task.text = line.task[status.chapterIdx][status.taskIdx];
        status.taskIdx++;
    }
    else {
        ease = Phaser.Math.Easing.Quintic.In;
        pos = -64;
    }

    scene.tweens.add({
        targets: ui.taskGroup,
        y: pos,
        duration: 1200,
        ease: ease
    });
}
function createParticles(scene) {
    // 파티클 생성
    let emitZone = new Phaser.Geom.Rectangle(-200, -600, 200, 1200);
    mainObject.particles = scene.add.particles('obj', 'particle');
    let emitter = mainObject.particles.createEmitter({
        x: 0,
        y: 0,
        speed: 80,
        gravityX: 120,
        gravityY: 120,
        lifespan: 6000,
        quantity: 0.5,
        scale: 2,
        emitZone: { source: emitZone }
    });
    let titlezone = new Phaser.Geom.Rectangle(0, -60, display.width, 10);

    mainObject.TitleParticle = scene.add.particles('leaf');
    mainObject.TitleEmitter = mainObject.TitleParticle.createEmitter({
        frame: [ '0', '1', '2', '3'],
        x: 0,
        y: 0,
        speed: 60,
        gravityX: 0,
        gravityY: 60,
        lifespan: 6000,
        quantity: 1,
        frequency: 400,
        scale: 2,
        rotate: { start: 0, end: 360, ease: 'Back.easeOut' },
        emitZone: { source: titlezone }
    });
}
function createObjects(scene) {
    // 기타 오브젝트 생성
    object.list = [];
    object.list[0] = scene.add.sprite(0, 336, 'obj', 'rock').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[1] = scene.add.sprite(display.width - 80, 368, 'obj', 'rock').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[2] = scene.add.sprite(96, 368, 'obj', 'pc').setScale(2).setOrigin(0, 1).setVisible(false);

}
function setLayer(scene) {
    // TODO 레이어 및 그룹 오브젝트 생성
    mainObject.layer = scene.add.layer();

    mainObject.group = scene.add.container();
    mainObject.group.add([mainObject.player, mainObject.dom, mainObject.engineer, mainObject.man]);
    mainObject.group.add(object.list);

    ui.group = scene.add.container();
    ui.group.add([ui.background, ui.mark, ui.next, ui.gameGroup, ui.dialogGroup, ui.rewardGroup, ui.taskGroup, ui.largeText, ui.white, ui.title, ui.dark, ui.skip]);

    // 레이어 정렬
    mainObject.layer.add(mainObject.group);
    mainObject.layer.add(mainObject.particles);
    mainObject.layer.add(ui.group);
    mainObject.layer.add(ui.effectGroup);
    mainObject.layer.add(mainObject.TitleParticle);
}
function setAnimations(scene) {
    // TODO 애니메이션 추가
    scene.anims.create({
        key: 'mark',
        frames: scene.anims.generateFrameNumbers('mark', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'pc-err',
        frames: scene.anims.generateFrameNumbers('pc-err', { start: 0, end: 5, first: 0 }),
        frameRate: 24,
        repeat: -1
    });
    scene.anims.create({
        key: 'bridge',
        frames: scene.anims.generateFrameNumbers('bridge', { start: 0, end: 9, first: 0 }),
        frameRate: 24
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
    let speed = 160;
    if(character === 'engineer') speed = 80;
    moveTargets[character].x = path.get(character)[mainConfig.pathCount[character]].x;
    moveTargets[character].y = path.get(character)[mainConfig.pathCount[character]].y;
    if(mainObject[character].anims.currentAnim.key !== character + '-run') mainObject[character].play(character + '-run');
    mainObject[character].setFlipX(mainObject[character].x - moveTargets[character].x > 0);
    Move(mainObject[character], moveTargets[character], speed);
}
function moveToPoint(character, x, y, withPath){
    if(character === 'player'){
        mainConfig.playerMovable = false;
    }
    mainConfig.pathCount[character] = 1;
    let newPath = (withPath) ? maps.navMesh.findPath(mainObject[character], { x: x, y: y }) : [{ x: mainObject[character].x, y: mainObject[character].y }, { x: x, y: y }];
    path.set(character, newPath);
    if(path.get(character) === null || path.get(character).length < 1) return;
    moveCharacter(character);
}
function path_log() {
    debug.graphics.clear();
    if(path.get('player') === null) {
        return;
    }
    let line = new Phaser.Curves.Path(mainObject.player.x, mainObject.player.y);
    for (let i = 0; i < path.get('player').length; i++)
    {
        line.lineTo(path.get('player')[i].x, path.get('player')[i].y);
        debug.graphics.fillRect(path.get('player')[i].x - 4, path.get('player')[i].y - 4, 8, 8);
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
    eventByIndex();
    if(txt === undefined) return;
    game.scene.scenes[0].time.removeEvent(event.type);
    const length = txt.length
    // 타이핑 도중에 재실행
    if(event.typing === true){
        event.typing = false;
        object.text = txt;
        status.index++;
    }
    else {
        object.text = '';
        let i = 0;
        event.type = game.scene.scenes[0].time.addEvent({
            callback: () => {
                object.text += txt[i]
                ++i
                if(i < length){
                    event.typing = true;
                }
                else {
                    // 타이핑이 끝나고 실행
                    event.typing = false;
                    object.text = txt;
                    status.index++;
                }
            },
            repeat: length - 1,
            delay: speed
        })
    }
}
function keyboardAction(key) {
    if(mainConfig.clear[0]) return;
    if(key < 10){
        if(ui.pcInfo.length === 4) return;
        ui.pcInfo += '' + key;
        ui.pcDown.setVisible(false);
    }
    if(key === 'esc-'){
        ui.pcInfo = '';
        ui.pcDown.setVisible(false);
    }
    if(key === 'danger-'){
        ui.pcInfo = '';
        ui.pcDown.setVisible(true);
    }
    if(key === 'enter-'){
        if(ui.pcDown.visible === true){
            pcShutDown('danger');
        }
        else {
            if(ui.pcInfo.length === 4){
                if(ui.pcInfo === '1234'){
                    pcShutDown('1234');
                }
                else if(ui.pcInfo === '0000'){
                    pcShutDown('0000');
                }
                else {
                    for (let i = 0; i < 4; i++) {
                        shakeObject(ui.pcPw, 10, 10, 240);
                        setTimeout(function () {
                            ui.pcInfo = '';
                            for (let i = 0; i < 4; i++) {
                                ui.pcPwList[i].setVisible(false);
                            }
                        }, 420);
                    }
                }
            }
        }
    }
    for (let i = 0; i < 4; i++) {
        ui.pcPwList[i].setVisible(false);
    }
    for (let i = 0; i < ui.pcInfo.length; i++) {
        ui.pcPwList[i].setVisible(true);
    }
}
function pcShutDown(way) {
    const newline = new Map();
    newline.set('1234', "[폰 왈도 노이만 3세]\n어떻게 비밀번호를 알아냈지?!\n천재가 분명해! 자네..")
        .set('0000', "[폰 왈도 노이만 3세]\n초기화 패스워드 0000이라..자네..\n나랑 일해볼 생각 없나..?")
        .set('power', "[폰 왈도 노이만 3세]\n파워를 직접적으로 차단한다라..\n자네.. 컴퓨터를 좀 아는군?")
        .set('danger', "[폰 왈도 노이만 3세]\n그 버튼은 무서워서 단 한번도\n못 눌러봤는데.. 대담한 친구로군..")
        .set('break', "[폰 왈도 노이만 3세]\n아니..커..컴퓨터가..\n과격한 친구로군.. 어쨋든 오작동은\n멈췄으니.. 성공했다고 봐야겠어.");
    const reward = new Map();
    // 씨앗 리워드 결정
    reward.set('1234', 3)
        .set('0000', 4)
        .set('power', 5)
        .set('danger', 1)
        .set('break', 2);
    mainConfig.reward[0] = reward.get(way);
    line.story[1][14] = newline.get(way);
    let scene = game.scene.scenes[0];
    mainConfig.clear[0] = true;
    ui.pcOff.setVisible(true);
    scene.tweens.addCounter({
        from: 255,
        to: 0,
        duration: 1800,
        ease: Phaser.Math.Easing.Quintic.In,
        onUpdate: function (tween)
        {
            const value = Math.floor(tween.getValue());
            ui.pcOff.setFillStyle(Phaser.Display.Color.GetColor(value, value, value));
        },
        onComplete: function () {
            console.log('pc shut down');
            setTask(false);
            scene.tweens.add({
                targets: ui.gameGroup,
                y: -800,
                duration: 1600,
                ease: Phaser.Math.Easing.Quintic.In,
                onComplete: function () {
                    ui.gameGroup.setVisible(false);
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                    dialog();
                }
            });
        }
    });
}
function setReward(bool, count) {
    if(bool){
        setTimeout(() => ui.skip.setVisible(true), 400);
        ui.rewardGroup.setVisible(true);
        ui.rewardMsg.text = '씨앗을 ' + count + '개 받았다!'
        mainConfig.seedNum += count;
    }
    else ui.rewardGroup.setVisible(false);
}
function setGameScenes() {
    if(status.chapterIdx < 1) return;
    for (let i = 0; i < ui.gameScene.length; i++) {
        ui.gameScene[i].setVisible(false);
    }
    ui.gameScene[status.chapterIdx - 1].setVisible(true);
}
function createParts(x, y, vx, vy) {
    // pc 부수기
    if(mainConfig.clear[0]) return;
    mainConfig.pcCrackCount++;
    if(mainConfig.pcCrackCount === 10) ui.pcCrack.setVisible(true);
    else if(mainConfig.pcCrackCount > 20 && mainConfig.pcCrackCount < 30){
        ui.pcCrack.setTexture('keyboard', 'crack1').setOrigin(1);
    }
    else if(mainConfig.pcCrackCount > 30){
        pcShutDown('break');
        return;
    }
    let part =  ui.pcParts.get();
    if (!part) return;
    ui.effectGroup.add(part);
    let r = Math.random();
    if(r > 0 && 0.25 < r) part.setTexture('keyboard', 'parts0');
    else if(r > 0.25 && 0.5 < r) part.setTexture('keyboard', 'parts1');
    else if(r > 0.5 && 0.75 < r) part.setTexture('keyboard', 'parts2');
    else part.setTexture('keyboard', 'parts3');
    part
        .setOrigin(0.5)
        .setScale(2)
        .setGravityY(0)
        .setGravityY(800)
        .enableBody(true, x, y, true, true)
        .setVelocity(vx, vy)
        .setAngularVelocity(400);

}
function selectBridge(index, bridge) {
    if(Math.floor(index / 2) !== mainConfig.bridgeSelection) return;
    if(index === mainConfig.bridgeAnswer[mainConfig.bridgeSelection]){
        // 생존
        console.log('success');
        ui.bridges[mainConfig.bridgeFail[mainConfig.bridgeSelection]].play('bridge');
    }
    else {
        console.log('failed');
        bridge.play('bridge');
    }
    ui.bridges[mainConfig.bridgeAnswer[mainConfig.bridgeSelection]].disableInteractive();
    ui.bridges[mainConfig.bridgeFail[mainConfig.bridgeSelection]].disableInteractive();
    mainConfig.bridgeSelection++;
    const number = {
        1: '두 번째' ,
        2: '세 번째' ,
        3: '네 번째' ,
        4: '마지막 '
    }
    if(mainConfig.bridgeSelection < 5){
        ui.task.text = number[mainConfig.bridgeSelection] + " 다리를 선택하자";
    }

}

// TODO 이벤트 메서드
function skip() {
    if(status.scene === 'title'){
        if(mainConfig.debugMode){
            mainObject.TitleEmitter.stop();
            mainObject.TitleEmitter.setVisible(false);
            ui.title.setVisible(false);
            ui.white.setVisible(false);
            chapterTitle(mainConfig.debugMode);
            ui.background.setVisible(false);
            ui.dark.setVisible(true);
            return;
        }
        status.scene = 'opening';
        mainObject.TitleEmitter.setGravityX(2000);
        mainObject.TitleEmitter.stop();
        game.scene.scenes[0].tweens.add({
            targets: ui.title,
            y: -120,
            duration: 800,
            ease: Phaser.Math.Easing.Quintic.In,
            onComplete: function () {
            }
        });
        game.scene.scenes[0].tweens.add({
            targets: ui.white,
            y: -display.height,
            duration: 1200,
            ease: Phaser.Math.Easing.Quintic.In,
            onComplete: function () {
                ui.largeText.setVisible(true);
                ui.largeText.text = line.opening[status.index];
                shakeObject(ui.largeText, 20, 20, 240);
                status.index++;
            }
        });
    }
    else if(status.scene === 'opening'){
        // 마지막 줄에서 챕터 씬으로 전환
        if(line.opening[status.index] === undefined) {
            if(mainConfig.titleFadeOut !== null) return;
            chapterTitle(mainConfig.debugMode);
        }
        else {
            ui.largeText.text = line.opening[status.index];
            shakeObject(ui.largeText, 20, 20, 240);
            status.index++;
        }
    }
    else if(status.scene === 'chapter'){
        if(ui.rewardGroup.visible === true){
            setReward(false, null);
            ui.dialogGroup.setVisible(true);
        }
        dialog();
    }
}
function dialog() {
    if(line.story[status.chapterIdx][status.index] === '*close*'){
        mainObject.dom.play('dom-stand');
        event.typing = false;
        ui.dialogGroup.setVisible(false);
        ui.skip.setVisible(false);
        eventByIndex();
        status.index++;
    }
    else {
        typewriteText(ui.dialog, line.story[status.chapterIdx][status.index], 60);
    }
}
function eventByIndex(){
    let chapter = status.chapterIdx;
    let index = status.index;
    let scene = game.scene.scenes[0];

    if(chapter === 0){
        if(index === 4){
            mainObject.player.play('player-seek');
        }
        if(index === 6){
            setTask(true);
            mainObject.player.play('player-stand');
            let markOn = setTimeout(function () {
                if(mainObject.dom.visible) {
                    clearTimeout(markOn);
                    markOn = undefined;
                    return;
                }
                ui.mark.setVisible(true);
            }, 3200);
            setTimeout(() => mainConfig.playerMovable = true, 0);
            let col = scene.physics.add.overlap(mainObject.player, mainObject.dom, function () {
                col.active = false;
                ui.mark.setVisible(false);
                setVisibleObjects(true, [mainObject.dom, ui.skip, ui.dialogGroup]);
                moveToPoint('player', mainObject.dom.x + 60, mainObject.dom.y, true);
                mainConfig.lookAt.player = mainObject.dom;
                mainConfig.lookAt.dom = mainObject.player;
                dialog();
                mainObject.dom.play('dom-talk');
                setTask(false);
            }, null, this);
        }
        if(index === 12){
            setTask(true);
            setTimeout(() => mainConfig.playerMovable = true, 20);
            moveToPoint('dom', display.centerW, display.centerH + 80);
            mainConfig.moveFinishedEvent.player = function () {
                let col = scene.physics.add.overlap(mainObject.player, mainObject.dom, function () {
                    col.active = false;
                    setTask(false);
                    setVisibleObjects(true, [ui.skip, ui.dialogGroup]);
                    mainConfig.playerMovable = false;
                    mainConfig.lookAt.player = mainObject.dom;
                    mainConfig.lookAt.dom = mainObject.player;
                    moveToPoint('player', mainObject.dom.x - 60, mainObject.dom.y, true);
                    dialog();
                    mainObject.dom.play('dom-talk');
                }, null, this);
            }
        }
        if(index === 19){
            // 다음 스테이지로
            setTask(true);
            setTimeout(() => mainConfig.playerMovable = true, 0);
            setTimeout(() => mainConfig.domFollow = true, 0);
            let col = scene.physics.add.overlap(mainObject.player, ui.next, function () {
                setTask(false);
                console.log('to next stage');
                status.chapterIdx++;
                col.active = false;
                mainConfig.domFollow = false;
                ui.dark.setVisible(true).setAlpha(0);
                moveToPoint('player', display.centerW, display.height + 180, false);
                moveToPoint('dom', display.centerW, display.height + 180, false);
                scene.tweens.add({
                    targets: ui.dark,
                    alpha: 1,
                    duration: 2000,
                    onComplete: () => chapterTitle(mainConfig.debugMode)
                });
            }, null, this);
        }
    }
    if(chapter === 1) {
        if (index === 3) {
            setTask(true);
            moveEnable();
            let col = scene.physics.add.overlap(mainObject.player, mainObject.engineer, function () {
                col.active = false;
                setTask(false);
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.engineer;
                mainConfig.lookAt.engineer = mainObject.player;
                moveToPoint('player', mainObject.engineer.x + 60, mainObject.engineer.y, true);
                moveToPoint('dom', mainObject.engineer.x - 60, mainObject.engineer.y, true);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
                mainObject.engineer.play('engineer-talk');
            }, null, this);
        }
        else if (index === 7) {
            mainObject.engineer.play('engineer-stand');
        }
        else if (index === 8) {
            mainObject.engineer.play('engineer-talk');
        }
        else if (index === 13){
            setTask(true);
            ui.gameGroup.y = 600;
            ui.gameGroup.setVisible(true);
            scene.tweens.add({
                targets: ui.gameGroup,
                y: 0,
                duration: 2000,
                ease: Phaser.Math.Easing.Quintic.Out
            });
        }
        else if (index === 16){
            mainObject.engineer.play('engineer-stand');
            setTimeout(function () {
                setReward(true, mainConfig.reward[0]);
            }, 400);
        }
        else if (index === 17) mainObject.engineer.play('engineer-talk');
        else if (index === 19){
            // 다음 스테이지로
            setTask(true);
            moveToPoint('engineer', 70, display.centerH + 40, true);
            mainConfig.moveFinishedEvent.engineer = function () {
                mainObject.engineer.play('engineer-type');
                mainObject.engineer.setFlipX(false);
            };
            moveEnable();
            let col = scene.physics.add.overlap(mainObject.player, ui.next, function () {
                setTask(false);
                console.log('to next stage');
                status.chapterIdx++;
                col.active = false;
                mainConfig.domFollow = false;
                ui.dark.setVisible(true).setAlpha(0);
                moveToPoint('player', display.centerW, display.height + 180, false);
                moveToPoint('dom', display.centerW, display.height + 180, false);
                scene.tweens.add({
                    targets: ui.dark,
                    alpha: 1,
                    duration: 2000,
                    onComplete: () => chapterTitle(mainConfig.debugMode)
                });
            });
        }
    }
    if(chapter === 2) {
        if (index === 4) {
            setTask(true);
            moveEnable();
            let col = scene.physics.add.overlap(mainObject.player, mainObject.man, function () {
                col.active = false;
                setTask(false);
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.man;
                mainConfig.lookAt.man = mainObject.player;
                mainConfig.lookAt.dom = mainObject.man;
                moveToPoint('player', mainObject.man.x + 44, mainObject.man.y + 32, true);
                moveToPoint('dom', mainObject.man.x + 44, mainObject.man.y - 32, true);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
                mainObject.man.play('man-talk');
            }, null, this);
        }
        else if (index === 11) {
            mainObject.man.play('man-stand');
            mainObject.man.setFlipX(true);
            ui.bridges.forEach(function (bridge) {
                bridge.setInteractive();
            });
            setTask(true);
        }
    }
}
function moveEnable() {
    setTimeout(function () {
        mainObject.dom.play('dom-stand');
        mainObject.player.play('player-stand');
        mainConfig.playerMovable = true;
        mainConfig.domFollow = true;
    }, 0);
}
function setVisibleObjects(bool, arr) {
    // 배열 오브젝트 모두 setVisible 실행
    for (let i = 0; i < arr.length; i++) {
        arr[i].setVisible(bool);
    }
}
function moveFinished(character) {
    // 이동 완료 후 바라보기
    let name = '';
    if(character === mainObject.player){
        name = 'player';
    }
    else if(character === mainObject.dom){
        name = 'dom';
    }
    else if(character === mainObject.engineer){
        name = 'engineer';
    }
    if(mainConfig.moveFinishedEvent[name] !== null) {
        mainConfig.moveFinishedEvent[name]();
        mainConfig.moveFinishedEvent[name] = null;
    }
    if(mainConfig.playerMovable) return;
    for(value in mainConfig.lookAt){
        if(mainConfig.lookAt[value] !== null) {
            mainObject[value].setFlipX(mainObject[value].x - mainConfig.lookAt[value].x > 0);
        }
    }
}

// TODO 씬 제어
function chapterTitle(skip) {
    ui.background.setVisible(true);
    ui.dark.setVisible(false);
    if(skip) {
        // 디버그 씬 스킵
        if(mainConfig.debugMode) {
            status.chapterIdx = mainConfig.debugModeChapter;
            if(mainConfig.debugModeChapter !== 0){
                mainObject.dom.setVisible(true);
                mainObject.particles.setVisible(false);
            }
        }
        chapterStart(status.chapterIdx);
        return;
    }
    let scene = game.scene.scenes[0];
    ui.largeText.setAlpha(0);
    ui.largeText.setVisible(true);
    ui.largeText.text = line.chapter[status.chapterIdx];
    mainConfig.titleFadeOut = scene.tweens.add({
        targets: ui.largeText,
        alpha: 1,
        duration: 2400,
        yoyo: true,
        ease: Phaser.Math.Easing.Elastic.InOut,
        onComplete: () => chapterStart(status.chapterIdx)
    });

    function chapterStart(chapterIdx) {
        ui.background.setVisible(false);
        ui.dark.setVisible(true);
        let scene = game.scene.scenes[0];
        setGameScenes();
        mainConfig.titleFadeOut = null;
        status.scene = 'chapter';
        status.index = 0;
        status.taskIdx = 0;
        console.log(status.scene, status.chapterIdx);
        game.scene.scenes[0].tweens.add({
            targets: ui.dark,
            alpha: 0,
            duration: 1200,
            onComplete: () => ui.dark.setVisible(false)
        });
        ui.largeText.setVisible(false);
        if(chapterIdx === 0){
            setVisibleObjects(true, [maps.wallLayer[0], object.list[0], object.list[1]]);
            zoomOut(mainConfig.debugMode);
            function zoomOut(on) {
                if(on){
                    ui.dialogGroup.setVisible(true);
                    dialog();
                    ui.skip.setInteractive();
                }
                else {
                    ui.skip.disableInteractive();
                    ui.cam.zoom = 4;
                    ui.cam.pan(mainObject.player.x, mainObject.player.y - 32, 1);
                    setTimeout(function () {
                        ui.cam.pan(display.centerW, display.centerH, 2800, Phaser.Math.Easing.Quintic.InOut, true);
                        ui.cam.zoomTo(1, 2800, Phaser.Math.Easing.Quintic.InOut);
                        ui.cam.on(Phaser.Cameras.Scene2D.Events.ZOOM_COMPLETE, () => {
                            ui.dialogGroup.setVisible(true);
                            dialog();
                            ui.skip.setInteractive();
                        });
                    }, 400);
                }
            }
        }
        else if(chapterIdx === 1){
            ui.skip.setVisible(false);
            maps.navMesh.destroy();
            maps.wallLayer[0].setVisible(false);
            maps.wallLayer[1].setVisible(true);
            maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[1], 12.5);
            setVisibleObjects(false, [object.list[0], object.list[1]]);
            object.list[2].setVisible(true);
            mainObject.particles.setVisible(false);
            mainObject.engineer.setVisible(true);
            mainObject.player.x = mainObject.dom.x = display.centerW;
            mainObject.player.y = mainObject.dom.y = -80;

            moveToPoint('player', display.centerW + 30, 100, false);
            moveToPoint('dom', display.centerW - 30, 100, false);
            mainConfig.moveFinishedEvent.player = function () {
                mainConfig.lookAt.player = mainObject.dom;
                mainConfig.lookAt.dom = mainObject.player;
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
            }
            mainConfig.moveFinishedEvent.dom = function () {
                mainObject.dom.play('dom-talk');
            }
        }
        else if(chapterIdx === 2){
            maps.navMesh.destroy();
            ui.gameBackground.setVisible(false);
            ui.gameGroup.setVisible(true);
            ui.gameGroup.y = 0;
            setVisibleObjects(false, [ui.skip, object.list[2], maps.wallLayer[1], mainObject.engineer]);
            setVisibleObjects(true, [maps.wallLayer[2], mainObject.man]);
            maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[2], 12.5);
            mainObject.player.x = mainObject.dom.x = display.centerW - 120;
            mainObject.player.y = mainObject.dom.y = -80;
            moveToPoint('player', display.centerW + 30, 136, false);
            moveToPoint('dom', display.centerW - 30, 136, false);
            mainConfig.moveFinishedEvent.player = function () {
                mainConfig.lookAt.player = mainObject.dom;
                mainConfig.lookAt.dom = mainObject.player;
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
            }
            mainConfig.moveFinishedEvent.dom = function () {
                mainObject.dom.play('dom-talk');
            }
        }
    }
}