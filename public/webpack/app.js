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
    debugMode : false,

    playerTarget : {x: 0, y: 0},
    playerCount : 0,
    playerPath : [],
    playerMovable : false,
    // 이동 후 바라볼 오브젝트
    lookAt: null,
    moveFinishedEvent: null,

    domTarget : {x: 0, y: 0},
    domCount : 0,
    domPath : [],
    domFollow: false,

    // ui 설정
    titleFadeOut : null
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
    chapterIdx: 0
};

function preload() {
    // TODO 프리로드
    // data
    this.load.json('text', 'data/text.json');
    // tile
    this.load.tilemapTiledJSON("map", "map/newmap.json");
    this.load.image("tileset", "map/set.png");
    // sprites
    this.load.image("title", "image/title.png");
    this.load.spritesheet('player', 'image/player.png', { frameWidth: 32, frameHeight: 32, endFrame: 7 });
    this.load.spritesheet('dom', 'image/dom.png', { frameWidth: 32, frameHeight: 32, endFrame: 7 });
    this.load.spritesheet('engineer', 'image/engineer.png', { frameWidth: 32, frameHeight: 32, endFrame: 7 });
    this.load.image("rock", "image/rock.png");
    // UI
    this.load.image('nineslice', 'image/nineslice.png');
    this.load.spritesheet('mark', 'image/mark.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });

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
}

// TODO 오브젝트 생성
function buildMap(scene) {
    // 타일맵 생성 <br>
    // 네비메쉬 : maps.navMesh <br>
    // 벽 레이어 : maps.wallLayer
    maps.tilemap = scene.add.tilemap("map");
    maps.tileset = maps.tilemap.addTilesetImage("tileset", "tileset");
    maps.tilemap.createLayer("bg", maps.tileset);
    maps.wallLayer = maps.tilemap.createLayer("walls", maps.tileset).setVisible(false);
    maps.objectLayer = maps.tilemap.getObjectLayer("navmesh");
    maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer, 12.5);
}
function createCharacters(scene) {
    // 메인 캐릭터 생성 <br>
    // 플레이어 오브젝트 : mainObject.player
    mainObject.player = scene.physics.add.sprite(display.centerW, 180, 'player')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('player-stand');
    mainObject.dom = scene.physics.add.sprite(display.centerW - 60, 180, 'dom')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('dom-stand').setVisible(false);
    mainObject.engineer = scene.physics.add.sprite(display.centerW, display.centerH + 80, 'engineer')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('en-stand').setVisible(false);
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
    ui.title = scene.add.sprite(display.centerW, 180, 'title').setOrigin(0.5).setScale(2);
    ui.largeText = scene.add.text(display.centerW, display.centerH, '', fontConfig)
        .setAlign('center').setOrigin(0.5).setVisible(false);
    ui.mark = scene.add.sprite(display.centerW - 60, 180, 'mark').play('mark')
        .setOrigin(0.5, 1).setScale(2).setVisible(false);

    ui.next = scene.add.rectangle(display.centerW, display.height - 30, display.width, 60, 0x00ff00).setVisible(false);
    scene.physics.add.existing(ui.next);

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
    
    ui.skip.on('pointerup', function () {
        skip();
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
    object.rock = [];
    object.rock[0] = scene.add.sprite(0, display.centerH + 52, 'rock').setScale(2);
    object.rock[1] = scene.add.sprite(display.width, display.centerH + 52, 'rock').setScale(2);
}
function setLayer(scene) {
    // TODO 레이어 및 그룹 오브젝트 생성
    mainObject.layer = scene.add.layer();

    mainObject.group = scene.add.container();
    mainObject.group.add([object.rock[0], object.rock[1], mainObject.player, mainObject.dom, mainObject.engineer]);

    ui.group = scene.add.container();
    ui.group.add([ui.background, ui.mark, ui.next, ui.dialogGroup, ui.largeText, ui.white, ui.title, ui.skip]);

    // 레이어 정렬
    mainObject.layer.add(mainObject.group);
    mainObject.layer.add(mainObject.particles);
    mainObject.layer.add(ui.group);
    mainObject.layer.add(mainObject.TitleParticle);
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
        frames: scene.anims.generateFrameNumbers('dom', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'dom-blink',
        frames: scene.anims.generateFrameNumbers('dom', { start: 2, end: 3, first: 2 }),
        frameRate: 8
    });
    scene.anims.create({
        key: 'dom-talk',
        frames: scene.anims.generateFrameNumbers('dom', { start: 4, end: 5, first: 4 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: 'dom-run',
        frames: scene.anims.generateFrameNumbers('dom', { start: 6, end: 7, first: 0 }),
        frameRate: 8,
        repeat: -1
    });
    scene.anims.create({
        key: 'en-stand',
        frames: scene.anims.generateFrameNumbers('engineer', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'en-talk',
        frames: scene.anims.generateFrameNumbers('engineer', { start: 2, end: 3, first: 2 }),
        frameRate: 2,
        repeat: -1
    });


    scene.anims.create({
        key: 'mark',
        frames: scene.anims.generateFrameNumbers('mark', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
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

// TODO 이벤트 메서드
function skip() {
    if(status.scene === 'title'){
        if(mainConfig.debugMode){
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
        if(!ui.dialogGroup.visible) {
            ui.skip.setVisible(true);
            ui.dialogGroup.setVisible(true);
        }
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
            mainObject.player.play('player-stand');
            setTimeout(() => ui.mark.setVisible(true), 200);
            setTimeout(() => mainConfig.playerMovable = true, 0);
            let col = scene.physics.add.overlap(mainObject.player, mainObject.dom, function () {
                col.active = false;
                ui.mark.setVisible(false);
                setVisibleObjects(true, [mainObject.dom, ui.skip, ui.dialogGroup]);
                moveToPoint(mainObject.player, mainObject.dom.x + 60, mainObject.dom.y, true);
                mainConfig.lookAt = mainObject.dom;
                dialog();
                mainObject.dom.play('dom-talk');
            }, null, this);
        }
        if(index === 12){
            setTimeout(() => mainConfig.playerMovable = true, 20);
            moveToPoint(mainObject.dom, display.centerW, display.height - 200);
            mainConfig.moveFinishedEvent = function () {
                let col = scene.physics.add.overlap(mainObject.player, mainObject.dom, function () {
                    col.active = false;
                    setVisibleObjects(true, [ui.skip, ui.dialogGroup]);
                    mainConfig.playerMovable = false;
                    mainConfig.lookAt = true;
                    moveToPoint(mainObject.player, mainObject.dom.x - 60, mainObject.dom.y, true);
                    dialog();
                    mainObject.dom.play('dom-talk');
                }, null, this);
            }
        }
        if(index === 19){
            // 다음 스테이지로
            setTimeout(() => mainConfig.playerMovable = true, 0);
            setTimeout(() => mainConfig.domFollow = true, 0);
            let col = scene.physics.add.overlap(mainObject.player, ui.next, function () {
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
}
function setVisibleObjects(bool, arr) {
    // 배열 오브젝트 모두 setVisible 실행
    for (let i = 0; i < arr.length; i++) {
        arr[i].setVisible(bool);
    }
}
function moveFinished(character) {
    // 이동 완료 후 바라보기
    if(mainConfig.lookAt) {
        mainObject.player.setFlipX(mainObject.player.x - mainObject.dom.x > 0);
        mainObject.dom.setFlipX(mainObject.dom.x - mainObject.player.x > 0);
        mainConfig.lookAt = false;
    }
    if(mainConfig.moveFinishedEvent !== null) {
        mainConfig.moveFinishedEvent();
        mainConfig.moveFinishedEvent = null;
    }
}

// TODO 씬 제어
function chapterTitle(skip) {
    if(skip) {
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
        mainConfig.titleFadeOut = null;
        status.scene = 'chapter';
        status.index = 0;
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
            mainObject.particles.setVisible(false);
            mainObject.engineer.setVisible(true);
            mainObject.player.x = mainObject.dom.x = display.centerW;
            mainObject.player.y = mainObject.dom.y = -80;
            mainConfig.lookAt = true;
            moveToPoint(mainObject.player, display.centerW + 20, 100, false);
            moveToPoint(mainObject.dom, display.centerW - 20, 100, false);
            mainConfig.moveFinishedEvent = function () {
                dialog();
                console.log('chapter new')
            }
        }
    }
}
/******/ })()
;
//# sourceMappingURL=app.js.map