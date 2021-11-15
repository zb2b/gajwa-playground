/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!***************************!*\
  !*** ./public/rebuild.js ***!
  \***************************/
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
const mainConfig = {
    debugMode : true,

    playerTarget : {x: 0, y: 0},
    playerCount : 0,
    playerPath : [],
    playerMovable : false,
    // 이동 후 바라볼 오브젝트
    lookAt: {player: null, dom: null, engineer: null},
    moveFinishedEvent: {player: null, dom: null, engineer: null},

    domTarget : {x: 0, y: 0},
    domCount : 0,
    domPath : [],
    domFollow: false,

    // ui 설정
    titleFadeOut : null,

    // game 설정
    pcTimerPushed : false,
    pcTimer : 0
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
    this.load.image('nineslice', 'image/nineslice.png');
    this.load.image('nineslice-task', 'image/nineslice-task.png');
    this.load.spritesheet('mark', 'image/mark.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });
    this.load.image("pc", "image/pc.png");
    this.load.spritesheet('pc-err', 'image/pc-err.png', { frameWidth: 96, frameHeight: 80, endFrame: 5 });
    this.load.atlas('keyboard', 'image/keyboard.png', 'image/keyboard.json');
    // plugins
    this.load.plugin('rexninepatchplugin', 'rexninepatchplugin.min.js', true);
    // particle
    this.load.image('particle', 'image/particle.png');
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
            // 목적지 도착시 플레이어 정지
            if(mainConfig.playerPath === null || mainConfig.playerPath.length < 1 || mainConfig.playerPath.length === mainConfig.playerCount + 1) {
                mainObject.player.body.reset(mainObject.player.x, mainObject.player.y);
                if(mainObject.player.anims.currentAnim.key !== 'player-stand') mainObject.player.play('player-stand');
                moveFinished(mainObject.player);
            }
            // 다음 경로로 변경
            else {
                mainConfig.playerCount++;
                moveCharacter(mainObject.player);
            }
        }
        // 플레이어와 멀때 따라가기 경로
        if(dis.each > 80 && mainConfig.domFollow){
            moveToPoint(mainObject.dom, mainObject.player.x, mainObject.player.y, true);
        }
    }
    if (mainObject.dom.body.speed > 0){
        if (dis.dom < 4){
            // 목적지 도착시 정지
            if(mainConfig.domPath === null || mainConfig.domPath.length < 1 || mainConfig.domPath.length === mainConfig.domCount + 1) {
                mainObject.dom.body.reset(mainObject.dom.x, mainObject.dom.y);
                if(mainObject.dom.anims.currentAnim.key !== 'dom-stand') mainObject.dom.play('dom-stand');
                moveFinished(mainObject.dom);
            }
            // 다음 경로로 변경
            else {
                mainConfig.domCount++;
                moveCharacter(mainObject.dom);
            }
        }
        // 플레이어와 가까울때 정지
        else if(dis.each < 40 && mainConfig.domFollow){
            mainObject.dom.body.reset(mainObject.dom.x, mainObject.dom.y);
            if(mainObject.dom.anims.currentAnim.key !== 'dom-stand') mainObject.dom.play('dom-stand');

        }
    }
    // 레이어 순서 정렬
    mainObject.group.list.sort(function(a, b) {
        return a.y > b.y ? 1 : -1;
    });
    if(mainConfig.pcTimerPushed) mainConfig.pcTimer++;
    if(mainConfig.pcTimer > 140) {
        mainConfig.pcTimerPushed = false;
        mainConfig.pcTimer = 0;
        pcShutDown();
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
    maps.wallLayer[0] = maps.tilemap.createLayer("display0", maps.tileset).setVisible(true);
    maps.wallLayer[1] = maps.tilemap.createLayer("display1", maps.tileset).setVisible(false);

    maps.objectLayer = [];
    maps.objectLayer[0] = maps.tilemap.getObjectLayer("0");
    maps.objectLayer[1] = maps.tilemap.getObjectLayer("1");

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
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('en-stand').setVisible(false);
    mainObject.man = scene.physics.add.sprite(display.centerW + 80, 180).play('man-stand')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).setVisible(false);
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
    ui.title = scene.add.sprite(display.centerW, 180, 'obj', 'title').setOrigin(0.5).setScale(2);
    ui.largeText = scene.add.text(display.centerW, display.centerH, '', fontConfig)
        .setAlign('center').setOrigin(0.5).setVisible(false);
    ui.mark = scene.add.sprite(display.centerW - 60, 180, 'mark').play('mark')
        .setOrigin(0.5, 1).setScale(2).setVisible(false);

    ui.next = scene.add.rectangle(display.centerW, display.height - 30, display.width, 60, 0x00ff00).setVisible(false);
    scene.physics.add.existing(ui.next);

    ui.gameGroup = scene.add.container();
    ui.gameBackground = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000);
    ui.pc = scene.add.sprite(display.centerW, display.centerH, 'pc').setOrigin(0.5).setScale(2);
    ui.pcOff = scene.add.rectangle(display.centerW, display.centerH - 137, 188, 158, 0xffffff).setVisible(false);
    ui.pcErr = scene.add.sprite(display.centerW, display.centerH - 136).play('pc-err').setOrigin(0.5).setScale(2);
    ui.pcDown = scene.add.sprite(display.centerW, display.centerH - 136, 'keyboard', 'down').setOrigin(0.5).setScale(2).setVisible(false);
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
    ui.gameGroup.add([ui.gameBackground, ui.pc, ui.keyboard, ui.pcErr, ui.pcPw, ui.pcDown, ui.pcOff]).setVisible(true);

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

    ui.skip.on('pointerup', function () {
        skip();
    });
}
function setTask(visible) {
    let scene = game.scene.scenes[0];
    let pos = 0;
    let ease = null;
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
    mainObject.particles = scene.add.particles('particle');
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
    object.list[0] = scene.add.sprite(0, 336, 'obj', 'rock').setScale(2).setOrigin(0, 1);
    object.list[1] = scene.add.sprite(display.width - 80, 368, 'obj', 'rock').setScale(2).setOrigin(0, 1);
    object.list[2] = scene.add.sprite(96, 368, 'obj', 'pc').setScale(2).setOrigin(0, 1).setVisible(false);

}
function setLayer(scene) {
    // TODO 레이어 및 그룹 오브젝트 생성
    mainObject.layer = scene.add.layer();

    mainObject.group = scene.add.container();
    mainObject.group.add([mainObject.player, mainObject.dom, mainObject.engineer, mainObject.man]);
    mainObject.group.add(object.list);

    ui.group = scene.add.container();
    ui.group.add([ui.background, ui.mark, ui.next, ui.gameGroup, ui.dialogGroup, ui.taskGroup, ui.largeText, ui.white, ui.title, ui.skip]);

    // 레이어 정렬
    mainObject.layer.add(mainObject.group);
    mainObject.layer.add(mainObject.particles);
    mainObject.layer.add(ui.group);
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
    if(character === mainObject.player){
        mainConfig.playerTarget.x = mainConfig.playerPath[mainConfig.playerCount].x;
        mainConfig.playerTarget.y = mainConfig.playerPath[mainConfig.playerCount].y;
        if(character.anims.currentAnim.key !== 'player-run') character.play('player-run');
        mainObject.player.setFlipX(mainObject.player.x - mainConfig.playerTarget.x > 0);
        Move(mainObject.player, mainConfig.playerTarget, 160);
    }
    else if(character === mainObject.dom){
        mainConfig.domTarget.x = mainConfig.domPath[mainConfig.domCount].x;
        mainConfig.domTarget.y = mainConfig.domPath[mainConfig.domCount].y;
        if(character.anims.currentAnim.key !== 'dom-run') character.play('dom-run');
        mainObject.dom.setFlipX(mainObject.dom.x - mainConfig.domTarget.x > 0);
        Move(mainObject.dom, mainConfig.domTarget, 160);
    }
}
function moveToPoint(character, x, y, withPath){
    if(character === mainObject.player){
        mainConfig.playerMovable = false;
        mainConfig.playerCount = 1;
        mainConfig.playerPath = (withPath) ? maps.navMesh.findPath(mainObject.player, { x: x, y: y }) : [{ x: mainObject.player.x, y: mainObject.player.y }, { x: x, y: y }];
        if(mainConfig.playerPath === null || mainConfig.playerPath.length < 1) return;
        moveCharacter(mainObject.player);
    }
    else if(character === mainObject.dom){
        mainConfig.domCount = 1;
        mainConfig.domPath = (withPath) ? maps.navMesh.findPath(mainObject.dom, { x: x, y: y }) : [{ x: mainObject.dom.x, y: mainObject.dom.y }, { x: x, y: y }];
        if(mainConfig.domPath === null || mainConfig.domPath.length < 1) return;
        moveCharacter(mainObject.dom);
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
            pcShutDown();
        }
        else {
            if(ui.pcInfo === '1234'){
                pcShutDown();
            }
            else if(ui.pcInfo === '0000'){
                pcShutDown();
            }
        }
    }
    for (let i = 0; i < 4; i++) {
        ui.pcPwList[i].setVisible(false);
    }
    for (let i = 0; i < ui.pcInfo.length; i++) {
        ui.pcPwList[i].setVisible(true);
    }
    console.log(ui.pcInfo);
}
function pcShutDown() {
    ui.pcOff.setVisible(true);
    game.scene.scenes[0].tweens.addCounter({
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
            console.log('pc shut down')
        }
    });
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
                moveToPoint(mainObject.player, mainObject.dom.x + 60, mainObject.dom.y, true);
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
            moveToPoint(mainObject.dom, display.centerW, display.centerH + 80);
            mainConfig.moveFinishedEvent.player = function () {
                let col = scene.physics.add.overlap(mainObject.player, mainObject.dom, function () {
                    col.active = false;
                    setTask(false);
                    setVisibleObjects(true, [ui.skip, ui.dialogGroup]);
                    mainConfig.playerMovable = false;
                    mainConfig.lookAt.player = mainObject.dom;
                    mainConfig.lookAt.dom = mainObject.player;
                    moveToPoint(mainObject.player, mainObject.dom.x - 60, mainObject.dom.y, true);
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
                ui.background.setVisible(true).setAlpha(0);
                moveToPoint(mainObject.player, display.centerW, display.height + 180, false);
                moveToPoint(mainObject.dom, display.centerW, display.height + 180, false);
                scene.tweens.add({
                    targets: ui.background,
                    alpha: 1,
                    duration: 2000,
                    onComplete: () => chapterTitle(mainConfig.debugMode)
                });
            }, null, this);
        }
    }
    if(chapter === 1) {
        if (index === 3) {
            setTimeout(function () {
                setTask(true);
                mainObject.dom.play('dom-stand');
                mainConfig.playerMovable = true;
                mainConfig.domFollow = true;
            }, 0);
            let col = scene.physics.add.overlap(mainObject.player, mainObject.engineer, function () {
                col.active = false;
                setTask(false);
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.engineer;
                mainConfig.lookAt.engineer = mainObject.player;
                moveToPoint(mainObject.player, mainObject.engineer.x + 60, mainObject.engineer.y, true);
                moveToPoint(mainObject.dom, mainObject.engineer.x - 60, mainObject.engineer.y, true);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
                mainObject.engineer.play('en-talk');
            }, null, this);
        }
        else if (index === 7) {
            mainObject.engineer.play('en-stand');
        }
        else if (index === 8) {
            mainObject.engineer.play('en-talk');
        }
        else if (index === 13){
            setTask(true);
            ui.gameGroup.setVisible(true);
        }
    }
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
    if(skip) {
        status.chapterIdx = 1;
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
        let scene = game.scene.scenes[0];
        mainConfig.titleFadeOut = null;
        status.scene = 'chapter';
        status.index = 0;
        status.taskIdx = 0;
        console.log(status.scene, status.chapterIdx);
        game.scene.scenes[0].tweens.add({
            targets: ui.background,
            alpha: 0,
            duration: 1200,
            onComplete: () => ui.background.setVisible(false)
        });
        ui.largeText.setVisible(false);
        if(chapterIdx === 0){
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
            mainObject.dom.setVisible(true);
            maps.wallLayer[0].setVisible(false);
            maps.wallLayer[1].setVisible(true);
            maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[1], 12.5);
            setVisibleObjects(false, [object.list[0], object.list[1]]);
            object.list[2].setVisible(true);

            mainObject.particles.setVisible(false);
            mainObject.engineer.setVisible(true);
            mainObject.player.x = mainObject.dom.x = display.centerW;
            mainObject.player.y = mainObject.dom.y = -80;

            moveToPoint(mainObject.player, display.centerW + 30, 100, false);
            moveToPoint(mainObject.dom, display.centerW - 30, 100, false);
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
/******/ })()
;
//# sourceMappingURL=app.js.map