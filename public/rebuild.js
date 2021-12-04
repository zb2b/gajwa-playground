console.log("%c@ MYZY.SPACE 2021 POWERED BY MYZY_", "color: #00ff00; font-weight: 900; font-size: 1em; background-color: black; padding: 1rem");
import { PhaserNavMeshPlugin } from "phaser-navmesh";

const font = new FontFaceObserver('dgm').load();
const display = {width : 360, height: 680, centerW : 180, centerH: 340 };
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
    },
    mode: Phaser.Scale.FIT,
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
    debugMode : false,
    debugModeChapter: 0,

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

    pcRecordOn: false,
    pcRecord: [],
    sheepRecordOn: false,
    sheepRecord: [],

    clear : [false, false, false, false, false],
    reward: [0, 0, 0, 0, 0],
    livingSheep: 0,
    sheepJump: null,
    sheepLast : [],
    sheepBlinkTimer : [null, null, null, null, null],
    bridgeJumpingNow: false,
    bridgeSelection: 0,
    bridgeAnswer : [1, 2, 5, 7, 8],
    bridgeFail : [0, 3, 4, 6, 9],
    sheepEndPos : [
        {x: 40, y: display.height - 80},
        {x: 40, y: display.height - 20},
        {x: 80, y: display.height - 50},
        {x: 120, y: display.height - 20},
        {x: 120, y: display.height - 80},
    ],
    deadSheep : [],
    bridgePos : {
        start: {x: display.centerW, y: 192},
        end: {x: display.centerW + 60, y: display.height - 100}
    },

    fishingDone : false,
    fishingbarGrav: null,
    fishCasting: null,
    fishingBarSize: 40,
    fishingPower : 0,
    fishFloatTween: [],
    fishingTimer: null,
    fishingFailTimer: null,
    fishWait: false,
    fishingRodOn: false,
    fishingNow: false,
    fishIconContact: false,
    fishPoint: 0,
    fishRun: 0,
    retryFishing: 0,
    floatOnAir: false,

    gambleSelection: 2,
    gambleFirst: null,
    gambleOpenHint: null,
    startGamble: false,

    minigameTween: null,
    signalTween: null,
    signalReadCount: 0,
    signalGambleTween: [],

    theend: false,
    detectCount: 0,
    forestSeed: 5,
    gameResult: 0,
    endingIdx: 0,
    endingData: [],
    endinglogTween: []
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
    // tile map
    this.load.tilemapTiledJSON("map", "map/map.json");
    // sprites
    this.load.aseprite('character', 'image/characters.png', 'image/characters.json');
    this.load.aseprite('fishing-player', 'image/fishing-player.png', 'image/fishing-player.json');
    this.load.aseprite('stones', 'image/stones.png', 'image/stones.json');
    this.load.atlas('obj', 'image/obj.png', 'image/obj.json');

    // UI

    this.load.image("frame", "image/ending-frame.png");
    this.load.spritesheet('title', 'image/title.png', { frameWidth: 180, frameHeight: 390, endFrame: 1 });
    this.load.spritesheet('signal', 'image/signal.png', { frameWidth: 16, frameHeight: 16, endFrame: 12 });
    this.load.spritesheet('bg', 'image/backgrounds.png', { frameWidth: 180, frameHeight: 340, endFrame: 12 });
    this.load.atlas('minigame', 'image/minigame.png', 'image/minigame.json');
    this.load.spritesheet('pc-err', 'image/pc-err.png', { frameWidth: 96, frameHeight: 80, endFrame: 5 });
    this.load.spritesheet('float-water', 'image/float-water.png', { frameWidth: 64, frameHeight: 32, endFrame: 18 });
    this.load.spritesheet('fish-icon', 'image/fish-icon.png', { frameWidth: 16, frameHeight: 16, endFrame: 1 });
    this.load.spritesheet('doors', 'image/doors.png', { frameWidth: 35, frameHeight: 48, endFrame: 16 });
    this.load.atlas('keyboard', 'image/keyboard.png', 'image/keyboard.json');
    this.load.atlas('ui', 'image/ui.png', 'image/ui.json');
    // plugins
    this.load.plugin('rexninepatchplugin', 'rexninepatchplugin.min.js', true);
    // particle
    this.load.atlas("leaf", "image/leaf.png", 'image/leaf.json');
    // audio
    this.load.audio('bgm', 'audio/bgm.mp3');
}
function create() {
    mainObject.bgm = this.sound.add('bgm');
    mainObject.bgm.loop = true;
    mainObject.bgm.play();
    const resetConfig = {};
    Object.keys(mainConfig).forEach(function (v) {
        resetConfig[v] = mainConfig[v];
    });

    status.chapterIdx = mainConfig.debugModeChapter;
    setLines(this);
    setAnimations(this);
    createGraphics(this);
    createCharacters(this);
    createUIObjects(this);
    createSignal(this);
    createObjects(this);
    createParticles(this);
    buildMap(this);
    setLayer(this);
    this.input.on('pointerdown', pointer => {
        if(status.chapterIdx === 1 && mainConfig.pcRecordOn){
            // 컴퓨터 게임 기록
            if(mainConfig.pcRecord.length > 19){
                mainConfig.pcRecord.shift();
            }
            let pos = {x: pointer.x, y: pointer.y};
            if(pos.y > 600) return;
            mainConfig.pcRecord.push(pos);
        }
        if(status.chapterIdx === 2 && mainConfig.sheepRecordOn){
            // 양건너기 기록
            if(mainConfig.sheepRecord.length > 19){
                mainConfig.sheepRecord.shift();
            }
            let pos = {x: pointer.x, y: pointer.y};
            if(pos.y > 600) return;
            mainConfig.sheepRecord.push(pos);
        }
    });
    this.input.on('pointerup', pointer => {
        if(!mainConfig.playerMovable) return;
        mainConfig.pathCount.player = 1;
        path.set('player', maps.navMesh.findPath(mainObject.player, { x: pointer.x, y: pointer.y }));
        if(path.get('player') === null){
            let length = 10;
            const anglePos = [
                {x: -length, y: 0},
                {x: 0, y: -length},
                {x: length, y: 0},
                {x: 0, y: length}
            ];
            newPathFind();
            function newPathFind() {
                let newPath;
                for (let i = 0; i < 4; i++) {
                    newPath = maps.navMesh.findPath(mainObject.player, { x: pointer.x + anglePos[i].x, y: pointer.y + anglePos[i].y })
                    if(newPath !== null) {
                        path.set('player', newPath);
                        break;
                    }
                }
                if(newPath === null){
                    length += 10;
                    anglePos[0] = {x: -length, y: 0};
                    anglePos[1] = {x: 0, y: -length};
                    anglePos[2] = {x: length, y: 0};
                    anglePos[3] = {x: 0, y: length};
                    newPathFind();
                }
            }
        }
        if(path.get('player').length < 1) return;
        moveCharacter('player');
    });
    this.input.keyboard.addKey('R').on('down', function(event) {
        console.log('Reset');
        resetGame(resetConfig);
    })
    this.input.keyboard.addKey('Z').on('down', function(event) {
        if(mainConfig.endingIdx > 0) mainConfig.endingIdx--;
        endingMotion();
    })
    this.input.keyboard.addKey('X').on('down', function(event) {
        if(mainConfig.endingIdx < 5) mainConfig.endingIdx++;
        endingMotion();
    })
}
function endingMotion() {
    game.scene.scenes[0].tweens.add({
        targets: ui.endingLog,
        x: mainConfig.endingIdx * -display.width,
        duration: 800,
        ease: Phaser.Math.Easing.Quintic.Out
    });
    if(!mainConfig.endinglogTween[mainConfig.endingIdx]){
        if(mainConfig.endingIdx === 0) return;
        mainConfig.endinglogTween[mainConfig.endingIdx] =
            game.scene.scenes[0].tweens.addCounter({
                from: 0,
                to: mainConfig.endingData[mainConfig.endingIdx],
                ease: Phaser.Math.Easing.Quartic.Out,
                duration: 1600,
                repeat: 0,
                onUpdate: function (tween)
                {
                    let value = Math.round(tween.getValue());
                    ui.logText[mainConfig.endingIdx].text = value;
                }
            });
    }
}
function resetGame(resetConfig) {
    game.scene.scenes[0].scene.restart();
    Object.keys(mainConfig).forEach(function (v) {
        mainConfig[v] = resetConfig[v];
    });
    moveTargets.player = {x: 0, y: 0};
    moveTargets.dom = {x: 0, y: 0};
    moveTargets.engineer = {x: 0, y: 0};
    status.scene ='title';
    status.index =0;
    status.chapterIdx =0;
    status.taskIdx =0;
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
    if(status.chapterIdx === 2){
        if(status.index === 13){
            if(mainConfig.bridgeSelection < 5){
                for (let i = 0; i < mainObject.sheeps.length; i++){
                    let sheepDis = Phaser.Math.Distance.Between(
                        mainObject.sheeps[i].x,
                        mainObject.sheeps[i].y,
                        mainConfig.bridgePos.start.x,
                        mainConfig.bridgePos.start.y);
                    if(mainObject.sheeps[i].body.speed > 0){
                        if (sheepDis < 4){
                            mainObject.sheeps[i].body.reset(mainObject.sheeps[i].x, mainObject.sheeps[i].y);
                            mainObject.sheeps[i].play('sheep-stand');
                            if(mainConfig.sheepJump !== null) {
                                mainConfig.sheepJump();
                                mainConfig.sheepJump = null;
                            }
                        }
                    }
                }
                for (let i = 0; i < mainConfig.deadSheep.length; i++) {
                    if(mainConfig.deadSheep[i].x < -16){
                        mainConfig.deadSheep[i].disableBody();
                        mainConfig.deadSheep[i].setVisible(false);
                    }
                }
            }
            else {
                for (let i = 0; i < mainObject.sheeps.length; i++) {
                    if(mainObject.sheeps[i].body.speed > 0){
                        let sheepDis = Phaser.Math.Distance.Between(
                            mainObject.sheeps[i].x,
                            mainObject.sheeps[i].y,
                            mainConfig.sheepLast[i].x,
                            mainConfig.sheepLast[i].y);
                        if(sheepDis < 4){
                            mainObject.sheeps[i].body.reset(mainObject.sheeps[i].x, mainObject.sheeps[i].y);
                            mainObject.sheeps[i].play('sheep-stand');
                            if(i === mainObject.sheeps.length - 1) {
                                setTimeout(function () {
                                    sheepFinish();
                                }, 400);
                            }
                        }
                    }
                }
            }
        }
    }
    if(status.chapterIdx === 3){
        if(mainConfig.fishingNow){
            if(mainConfig.fishPoint > 0){
                ui.fishingCastbar.setFillStyle(Phaser.Display.Color.GetColor(0, 255, 0));
                ui.fishingCastBoxB.setTexture('ui', 'catch').setOrigin(0.5);
                ui.fishingCastbar.width = Math.round(mainConfig.fishPoint * 0.45);
                ui.fishingCastbar.setOrigin(0.5);
            }
            else {
                ui.fishingCastbar.setFillStyle(Phaser.Display.Color.GetColor(255, 0, 0));
                ui.fishingCastBoxB.setTexture('ui', 'run').setOrigin(0.5);
                ui.fishingCastbar.width = Math.abs(Math.round(mainConfig.fishPoint * 0.45));
                ui.fishingCastbar.setOrigin(0.5);
            }
            if(ui.fishIcon.body.touching.none) mainConfig.fishIconContact = false;
            if(mainConfig.fishIconContact){
                if(mainConfig.fishPoint < 320) {
                    mainConfig.fishPoint++;
                }
                else if(mainConfig.fishPoint === 320) {
                    // 잡음
                    mainConfig.fishPoint = 0;
                    fishingFinish(true);
                }
                return;
            }
            else if(!mainConfig.fishIconContact) {
                if(mainConfig.fishPoint > -320) {
                    mainConfig.fishPoint--;
                }
                if(mainConfig.fishPoint === -320){
                    // 도망
                    mainConfig.fishPoint = 0;
                    fishingFinish(false);
                }
                return;
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
    maps.tilemap = scene.add.tilemap("map");
    maps.tileset = maps.tilemap.addTilesetImage("tileset", "tileset");
    maps.tilemap.createLayer("bg", maps.tileset);
    maps.objectLayer = [];

    for (let i = 0; i < 6; i++) {
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

    mainObject.player = scene.physics.add.sprite(display.centerW, display.centerH - 40)
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('player-stand');
    mainObject.dom = scene.physics.add.sprite(display.centerW - 72, display.centerH - 28)
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('dom-stand').setVisible(false);
    mainObject.engineer = scene.physics.add.sprite(104, 504)
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).play('engineer-type').setVisible(false);
    mainObject.man = scene.physics.add.sprite(302, 168).play('man-stand')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).setFlipX(true).setVisible(false);
    mainObject.fishman = scene.physics.add.sprite(146, 396).play('fishman-stand')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).setVisible(false);
    mainObject.gambler = scene.physics.add.sprite(102, 294).play('gambler-stand')
        .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).setVisible(false);

    mainObject.sheeps = [];
    const sheepPos = [
        { x: 216, y: 64 },
        { x: 272, y: 62 },
        { x: 328, y: 68 },
        { x: 216, y: 104 },
        { x: 272, y: 106 }
        ]
    for (let i = 0; i < 5; i++) {
        mainObject.sheeps[i] = scene.physics.add.sprite(sheepPos[i].x, sheepPos[i].y).play('sheep-stand')
            .setOrigin(0.5, 1).setScale(2).setSize(16, 16).setOffset(8, 16).setFlipX(Math.random() > 0.5).setVisible(false);
        mainConfig.sheepBlinkTimer[i] = getRandomInt(160);
    }
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

    ui.esc = scene.add.sprite(display.centerW, display.centerH, 'ui', 'escape0').setOrigin(0.5).setScale(3).setVisible(false).setInteractive();
    ui.esc.on('pointerdown', () => {
        ui.esc.setTexture('ui', 'escape1').setOrigin(0.5).setScale(3);
    }).on('pointerup', () => {
        clearTimeout(timer.shaker);
        timer.shaker = undefined;
        ui.esc.x = display.centerW;
        ui.esc.y = display.centerH;
        ui.esc.setTexture('ui', 'escape0').setOrigin(0.5).setScale(3);
        ui.esc.setVisible(false);
        ui.skip.setVisible(true);
        skip();
    }).on('pointerout', () => {
        ui.esc.setTexture('ui', 'escape0').setOrigin(0.5).setScale(3);
    });

    ui.bg = scene.add.sprite(0, 0, 'bg').setOrigin(0).setScale(2);

    ui.smoke = scene.add.sprite(200, 100).play('smoke').setScale(2).setVisible(false);

    ui.skip = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x00ff00, 0)
        .setInteractive();
    ui.endingSkip = scene.add.rectangle(0, 0, display.centerW, display.height, 0x00ff00, 0).setVisible(false).setOrigin(0).setInteractive();
    ui.endingSkip.on('pointerup', pointer => {
        if(mainConfig.endingIdx > 0) mainConfig.endingIdx--;
        endingMotion();
    });
    ui.background = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000);

    ui.dark = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000).setVisible(false);
    ui.title = scene.add.sprite(0, 0).play('title').setOrigin(0).setScale(2);
    ui.largeText = scene.add.text(display.centerW, display.centerH, '', fontConfig)
        .setAlign('center').setOrigin(0.5).setVisible(false);
    ui.mark = scene.add.sprite(mainObject.dom.x - 12, mainObject.dom.y + 8, 'mark').play('mark')
        .setOrigin(1).setScale(2).setVisible(false);

    ui.next = scene.physics.add.sprite(display.centerW - 60, display.height - 10).play('next')
        .setSize(display.width, 20).setScale(2).setOffset(-60, 30).setVisible(false);

    ui.fishmanPlace = scene.add.rectangle(80, display.height - 160, 160, 100, 0x00ff00).setVisible(false);
    scene.physics.add.existing(ui.fishmanPlace);

    // 미니게임 창 생성
    ui.gameGroup = scene.add.container();
    ui.gameBackground = scene.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000);
    ui.gameTransitionUp = scene.add.sprite(display.centerW, 0, 'ui', 'transition').setOrigin(0.5, 0).setFlipY(true).setScale(2);
    ui.gameTransitionDown = scene.add.sprite(display.centerW, display.height, 'ui', 'transition').setOrigin(0.5, 0).setScale(2);
    ui.pcOff = scene.add.rectangle(display.centerW, 200, 188, 158, 0xffffff).setVisible(false);
    ui.pcErr = scene.add.sprite(display.centerW, 200).play('pc-err').setOrigin(0.5).setScale(2);
    ui.pcDown = scene.add.sprite(display.centerW, display.centerH - 136, 'keyboard', 'down').setOrigin(0.5).setScale(2).setVisible(false);
    ui.pcKeyboard = scene.add.sprite(20, 608, 'minigame', 'pc-keyboard').setScale(2);
    ui.pc = scene.add.sprite(42, 430, 'minigame', 'pc0').setScale(2);

    ui.pcBreak = scene.add.rectangle(display.centerW - 16, display.centerH + 48, 210, 100, 0x0000f00, 0).setInteractive().on('pointerup', pointer => {
        createParts(pointer.x, pointer.y, RandomPlusMinus() * 200, -100 + Math.random() * -400);
    });
    ui.pcPw = scene.add.container();
    ui.pcPwList = [];
    ui.pcInfo = '';
    for (let i = 0; i < 4; i++) {
        ui.pcPwList[i] = scene.add.text(114 + i * 36, 184, '*', fontConfig).setFontSize(48).setVisible(false);
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
                pos.x = 268;
                pos.y = 548;
            }
            else if(i === 11){
                index = 'esc-';
                pos.x = 52;
                pos.y = 484;
            }
            else if(i === 12){
                index = 'danger-';
                pos.x = 52;
                pos.y = 584;
            }
            else if(i === 13){
                index = 'power-';
                pos.x = 274;
                pos.y = 362;
            }
            else{
                index = i;
                let y = (i < 5) ? 520 : 548;
                pos.x = (i < 5) ? 52 + (i * 40) : 68 + ((i - 5) * 40);
                pos.y = y;
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
    // 낚시찌 물튐 효과 생성
    ui.floatWater = scene.add.sprite(0, 0, 'float-water').setOrigin(0.5).setScale(3).setVisible(false);
    ui.floatWaterWave = scene.add.group({
        visible: false,
        frameQuantity: 10,
        maxSize: 10,
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
    // 징검다리 생성
    ui.bridges = [];
    mainConfig.animsStones = scene.anims.createFromAseprite('stones');
    let stoneData = scene.cache.json.get('stones').meta.frameTags;
    for (let i = 0; i < stoneData.length; i++) {
        if(stoneData[i].repeat === undefined) mainConfig.animsStones[i].repeat = -1;
        else mainConfig.animsStones[i].repeat = stoneData[i].repeat;
        if(stoneData[i].frameRate === undefined) mainConfig.animsStones[i].frameRate = 2;
        else mainConfig.animsStones[i].frameRate = stoneData[i].frameRate;
    }
    const bridgePos = [
        // 0
        {x: 32, y: 272},
        {x: 124, y: 278},
        {x: 32, y: 336},
        {x: 140, y: 336},
        {x: 68, y: 398},
        // 5
        {x: 172, y: 398},
        {x: 86, y: 460},
        {x: 198, y: 458},
        {x: 92, y: 518},
        {x: 200, y: 512},
    ]
    for (let i = 0; i < 10; i++) {
        ui.bridges[i] = scene.add.sprite(bridgePos[i].x + 64, bridgePos[i].y).play('stone' + i).setScale(2).setOrigin(0.5, 0);
    }
    // 낚시게임 생성
    mainConfig.fishingAnims = scene.anims.createFromAseprite('fishing-player');
    let fishingData = scene.cache.json.get('fishing-player').meta.frameTags;
    for (let i = 0; i < fishingData.length; i++) {
        if(fishingData[i].repeat === undefined) mainConfig.fishingAnims[i].repeat = -1;
        else mainConfig.fishingAnims[i].repeat = fishingData[i].repeat;
        if(fishingData[i].frameRate === undefined) mainConfig.fishingAnims[i].frameRate = 2;
        else mainConfig.fishingAnims[i].frameRate = fishingData[i].frameRate;
    }
    const fishline = new Map();
    fishline.set(1, "[강태공]\n이건..상류에 서식하는 사이버피쉬로군요..\n미세한 에너지를 섭취해 생존하지요..")
        .set(2, "[강태공]\n오이이이잉어라고 하는 종류입니다...\n맛이 아주...좋아서 감탄사가..\n튀어나온다고 하지요..")
        .set(3, "[강태공]\n음.. 안녕장어라는.. 종입니다.. \n학명은.. 'Hello Eel'이라고 하는데..\n생존력이 뛰어나고 서식지가 다양합니다..")
        .set(4, "[강태공]\n오호.. 가물가물가물치로군요..\n정말 희귀해서 저도 잡아본 기억이...\n가물가물...합니다...")
        .set(5, "[강태공]\n놀랍..습니다...이것은...\n미지의 메기입니다...\n이건...저도 처음 봤습니다...");

    ui.fishing = scene.add.sprite(0, display.height).play('fishing').setScale(3);
    ui.fishingPlayer = scene.add.sprite(24, 404).play('fishing-wait').setScale(3).setOrigin(0, 1);
    ui.fishingPlayer.on('animationcomplete', function () {
        let key = ui.fishingPlayer.anims.currentAnim.key;
        if(key === 'fishing-throw') {
            ui.fishingPlayer.play('fishing-wait');
        }
    });
    ui.fishingPlayer.on('animationupdate', function (anim, frame) {
        let key = ui.fishingPlayer.anims.currentAnim.key;
        if(key === 'fishing-cancel'){
            if(frame.textureFrame === '16'){
                fishingBack(false);
            }
        }
        if(key === 'fishing-finish') {
            if(frame.textureFrame === '16'){
                fishingBack(true);
                setTimeout(function (){
                    scene.tweens.add({
                        targets: ui.gameGroup,
                        y: -860,
                        duration: 2000,
                        ease: Phaser.Math.Easing.Quintic.In,
                        onComplete: function () {
                            // 낚시게임 완료
                            ui.skip.setVisible(true);
                            ui.dialogGroup.setVisible(true);

                            if(!mainConfig.clear[2]){
                                // 최초 완료시
                                mainConfig.clear[2] = true;
                                mainConfig.reward[2] = 2;
                                ui.fishingPlayer.setInteractive();
                            }
                            else {
                                // 추가 완료시
                                status.index = 15;
                                line.story[3][15] = fishline.get(mainConfig.retryFishing);
                            }
                            dialog();
                        }
                    });
                }, 1200);
            }
        }
    });
    let fishingQuit = false;
    ui.fishingPlayer.on('pointerup', function () {
        if(!mainConfig.clear[2] || fishingQuit || mainConfig.fishingNow || mainConfig.fishCasting !== null || mainConfig.floatOnAir) return;
        let f = (ui.fishingPlayer.anims.currentAnim.key === 'fishing-wait' || ui.fishingPlayer.anims.currentAnim.key === 'fishing-catch');
        if(!f) return;
        fishingQuit = true;
        mainConfig.fishingDone = true;
        if(ui.fishingFloat.visible){
            if(ui.fishingPlayer.anims.currentAnim.key !== 'fishing-cancel'){
                ui.fishingPlayer.play('fishing-cancel');
            }
        }
        mainConfig.fishWait = false;
        ui.fishingMark.setVisible(false);
        clearTimeout(mainConfig.fishingTimer);
        clearTimeout(mainConfig.fishingFailTimer);
        mainConfig.fishCasting = null;
        mainConfig.fishingTimer = null;

        ui.task.text = "낚시를 다시 하거나 모험을 계속하자";
        ui.fishingCastbar.width = 0;
        ui.fishingCastbar.setOrigin(0.5);
        scene.tweens.add({
            targets: ui.gameGroup,
            y: -860,
            duration: 2000,
            ease: Phaser.Math.Easing.Quintic.In,
            onComplete: function () {
                fishingQuit = false;
                moveEnable();
                let col = scene.physics.add.overlap(mainObject.player, mainObject.fishman, function () {
                    col.active = false;
                    mainConfig.playerMovable = false;
                    mainConfig.domFollow = false;
                    mainConfig.lookAt.player = mainObject.fishman;
                    mainConfig.lookAt.dom = mainObject.fishman;
                    moveToPoint('player', mainObject.fishman.x - 20, mainObject.fishman.y + 60, false);
                    moveToPoint('dom', mainObject.fishman.x - 40, mainObject.fishman.y + 80, false);
                    ui.gameGroup.y = 600;
                    ui.gameGroup.setVisible(true);
                    ui.fishingBar.setSize(42, mainConfig.fishingBarSize * 3);
                    ui.fishingBar.body.setSize(42, mainConfig.fishingBarSize * 3);
                    ui.fishingPlayer.play('fishing-wait');
                    ui.fishingCastBoxB.setTexture('ui', 'power1').setOrigin(0.5);
                    ui.fishingFloat.setTexture('ui', 'float').setOrigin(0.5);
                    mainConfig.fishingDone = false;
                    mainConfig.fishingRodOn = false;
                    mainConfig.fishingNow = false;
                    scene.tweens.add({
                        targets: ui.gameGroup,
                        y: 0,
                        duration: 2000,
                        ease: Phaser.Math.Easing.Quintic.Out,
                    });
                });
            }
        });
    });

    ui.fishingCastGroup = scene.add.container().setPosition(display.centerW, 140);
    ui.fishingCastbar = scene.add.rectangle(0, 0, 0, 24, 0x00ff00).setOrigin(0.5);
    ui.fishingCastBoxA = scene.physics.add.sprite(0, -15, 'ui', 'power0').setOrigin(0.5).setScale(3);
    ui.fishingCastBoxB = scene.physics.add.sprite(0, -15, 'ui', 'power1').setOrigin(0.5).setScale(3);
    ui.fishingCastGroup.add([ui.fishingCastBoxA, ui.fishingCastbar, ui.fishingCastBoxB])

    ui.fishingGroup = scene.add.container();
    ui.fishingBox = [];
    let fishingBoxHeight = 80;
    ui.fishingBox[0] = scene.add.rectangle(display.centerW, display.centerH - fishingBoxHeight * 1.5, 80, 20, 0x000000).setOrigin(0.5).setVisible(false);
    ui.fishingBox[1] = scene.add.rectangle(display.centerW, display.centerH + fishingBoxHeight * 1.5 + 1.5, 80, 20, 0x000000).setOrigin(0.5).setVisible(false);
    ui.fishIcon = scene.physics.add.sprite(display.centerW, display.centerH - 80, 'ui', 'fishicon').setOrigin(0.5).setScale(3).setFlipX(true);
    ui.fishingUI = scene.add.rexNinePatch({
        x: display.centerW, y: display.centerH + 1,
        width: 20, height: fishingBoxHeight,
        key: 'ui',
        baseFrame: 'fishing-bg',
        columns: [6, undefined, 6],
        rows: [6, undefined, 6],
    }).setOrigin(0.5).setScale(3);


    ui.fishingBar = scene.add.rectangle(display.centerW, display.centerH, 42, mainConfig.fishingBarSize * 3, 0x00ff00);
    scene.physics.add.existing(ui.fishingBar);

    ui.fishingEffect = scene.add.container();
    ui.fishingGroup.add([ui.fishingUI, ui.fishingBox[0], ui.fishingBox[1], ui.fishingBar, ui.fishIcon]).setVisible(false);
    ui.fishingEffect.add(ui.floatWater);

    scene.physics.add.existing(ui.fishingBox[0], true);
    scene.physics.add.existing(ui.fishingBox[1], true);
    scene.physics.add.collider(ui.fishingBox[0], ui.fishingBar);
    scene.physics.add.collider(ui.fishingBox[1], ui.fishingBar);
    scene.physics.add.collider(ui.fishingBox[0], ui.fishIcon);
    scene.physics.add.collider(ui.fishingBox[1], ui.fishIcon);
    ui.fishingBar.body.bounce.y = 0.5;

    ui.fishingBtn = scene.add.sprite(display.centerW, display.height - 100, 'ui', 'fishBtn0').setOrigin(0.5).setScale(3).setInteractive();
    ui.fishingMark = scene.add.sprite(0, 0).play('mark-fish').setScale(3).setVisible(false);
    ui.fishingFloat = scene.add.sprite(0, 0, 'ui', 'float').setScale(3).setVisible(false);
    ui.fishingFloat.on('animationcomplete', function () {
        let key = ui.fishingFloat.anims.currentAnim.key;
        if(key === 'float-in') {
            ui.fishingFloat.play('float-loop');
        }
    });
    // 물고기 잡기 콜라이더
    scene.physics.add.overlap(ui.fishIcon, ui.fishingBar, function () {
        mainConfig.fishIconContact = true;
    }, null, this);


    ui.fishingBtn.on('pointerdown', function () {
        if(mainConfig.fishingDone) return;
        this.setTexture('ui', (mainConfig.fishingNow) ? 'hookBtn1' : 'fishBtn1').setOrigin(0.5);
        if(mainConfig.fishingNow){
            mainConfig.fishingbarGrav = scene.tweens.addCounter({
                from: 0,
                to: -800,
                ease: Phaser.Math.Easing.Linear,
                duration: 1200,
                onUpdate: function (tween)
                {
                    let value = Math.floor(tween.getValue());
                    ui.fishingBar.body.setGravityY(value);
                }
            });
        }
        else {
            cast();
        }
        function cast() {
            clearTimeout(mainConfig.fishingTimer);
            clearTimeout(mainConfig.fishingFailTimer);
            mainConfig.fishCasting = null;
            mainConfig.fishingTimer = null;

            if(mainConfig.fishFloatTween[0]!==undefined) {
                if(mainConfig.fishFloatTween[0].progress < 1) return;
            }
            if(mainConfig.fishingRodOn) {
                // 물고기 입질이 있는 도중이면
                if(mainConfig.fishWait){
                    // 낚기 시작
                    mainConfig.fishingNow = true;
                    startFishing();
                }
                else {
                    // 낚싯대 되돌리기
                    if(ui.fishingPlayer.anims.currentAnim.key === 'fishing-cancel') return;
                    ui.fishingPlayer.play('fishing-cancel');
                    ui.task.text = "길게 눌러서 낚싯대를 던지자";
                    ui.fishingCastbar.width = 0;
                    ui.fishingCastbar.setOrigin(0.5);
                }
            }
            else {
                let power = [0, 150];
                casting(power);
            }
            function casting(power) {
                ui.fishingPlayer.play('fishing-power');
                let ease = (power[0] === 0) ? Phaser.Math.Easing.Quintic.In : Phaser.Math.Easing.Quintic.Out;
                mainConfig.fishCasting = scene.tweens.addCounter({
                    from: power[0],
                    to: power[1],
                    ease: ease,
                    duration: 1200,
                    repeat: 0,
                    onUpdate: function (tween)
                    {
                        let value = Math.floor(tween.getValue());
                        ui.fishingCastbar.width = value;
                        ui.fishingCastbar.setOrigin(0.5);
                    },
                    onComplete: function () {
                        let tmp = power[0];
                        power[0] = power[1];
                        power[1] = tmp;
                        casting(power);
                    }
                });
            }
        }

    }).on('pointerup', function () {
        this.setTexture('ui', (mainConfig.fishingNow) ? 'hookBtn0' : 'fishBtn0' ).setOrigin(0.5);
        fishOut();
    }).on('pointerout', function () {
        this.setTexture('ui', (mainConfig.fishingNow) ? 'hookBtn0' : 'fishBtn0').setOrigin(0.5);
        fishOut();
    });
    function fishOut() {
        if(mainConfig.fishingNow) {
            mainConfig.fishingbarGrav?.stop();
            ui.fishingBar.body.setGravityY(800);
        }
        else {
            // 낚싯대 던지기 완료
            if(mainConfig.fishCasting === null) return;
            mainConfig.fishCasting?.stop();
            mainConfig.fishingPower = mainConfig.fishCasting.getValue();
            fishingCastFloat(mainConfig.fishingPower);
            mainConfig.fishCasting = null;
        }
    }
    // TODO 몬티홀 생성
    ui.gamblePos = scene.add.rectangle(display.centerW, display.centerH + 80, display.width, 40, 0x000000).setVisible(false);
    scene.physics.add.existing(ui.gamblePos, true);
    ui.gamble = scene.add.sprite(0, display.height).play('gamble').setScale(3);
    ui.gambler = scene.add.sprite(6, 387).play('gambler-stand').setScale(3).setOrigin(0).setInteractive();
    ui.gambler.on('pointerup', function () {
        // 겜블 포기 요청
        if(mainConfig.startGamble){
            status.index = 18;
            if(!ui.dialogGroup.visible) {
                ui.skip.setVisible(true);
                ui.dialogGroup.setVisible(true);
            }
            dialog();
            ui.gambler.play('gambler-talk');
        }
    });
    ui.doors = scene.add.container();
    ui.doorlist = [];
    for (let i = 0; i < 3; i++) {
        const x = [15, 129, 237]
        ui.doorlist[i] = scene.add.sprite(x[i], 179).play('door-off').setScale(3).setOrigin(0);
    }
    ui.doors.add(ui.doorlist);
    ui.gambleBtns = scene.add.container();
    ui.gambleBtn = {};
    ui.gambleBtn.left = scene.add.sprite(display.centerW - 96, 562, 'ui', 'left-on').setScale(3).setInteractive();
    ui.gambleBtn.select = scene.add.sprite(display.centerW, 562, 'ui', 'select-on').setScale(3).setInteractive();
    ui.gambleBtn.right = scene.add.sprite(display.centerW + 96, 562, 'ui', 'right-on').setScale(3).setInteractive();
    ui.gambleHand = scene.add.sprite(ui.doorlist[mainConfig.gambleSelection].x + 6, 470).play('hand').setOrigin(0).setScale(3).setVisible(false);

    ui.gambleResult = [];
    ui.gambleResult[0] = scene.add.sprite(ui.doorlist[0].x + 21, 321).play('fakesheep').setScale(3).setVisible(false);
    ui.gambleResult[1] = scene.add.sprite(ui.doorlist[1].x + 21, 300).play('double').setScale(3).setVisible(false);
    ui.gambleResult[2] = scene.add.sprite(ui.doorlist[2].x + 21, 321).play('fakesheep').setScale(3).setVisible(false);

    for (const [key, value] of Object.entries(ui.gambleBtn)) {
        value.on('pointerdown', function () {
            if(!mainConfig.startGamble) return;
            this.setTexture('ui', key + '-off');
        });
        value.on('pointerup', function () {
            if(!mainConfig.startGamble) return;
            this.setTexture('ui', key + '-on');
            if(key === 'left'){
                if(mainConfig.gambleSelection === 1 && mainConfig.gambleOpenHint === 0) return;
                if(mainConfig.gambleSelection > 0) mainConfig.gambleSelection--;
                ui.gambleHand.x = ui.doorlist[mainConfig.gambleSelection].x + 6;
            }
            else if(key === 'select'){
                // 첫 선택
                if(mainConfig.gambleOpenHint === null){
                    mainConfig.gambleFirst = mainConfig.gambleSelection;
                    mainConfig.startGamble = false;
                    ui.doorlist[mainConfig.gambleSelection].play('door-on');
                    const num = ["첫 번째 ", "두 번째 ", "세 번째 "];
                    status.index = 24;
                    line.story[4][24] = "[몬티 홀]\n오 마이 갓!!!\n" + num[mainConfig.gambleSelection] + "문을 고르셨습니다!!\n신중하게 고르신거겠지요~?";
                    if(!ui.dialogGroup.visible) {
                        ui.skip.setVisible(true);
                        ui.dialogGroup.setVisible(true);
                    }
                    dialog();
                }
                else {
                    mainConfig.startGamble = false;
                    setTask(false);
                    ui.gambler.play('gambler-show');
                    if(mainConfig.gambleFirst === mainConfig.gambleSelection){
                        // 선택 유지
                        line.story[4][32] = "[몬티 홀]\n골랐습니다! 뚝심있는 분이시군요!\n처음 고른 문이 역시 믿을만하죠?";
                    }
                    else {
                        // 선택 바꿈
                        ui.doorlist[mainConfig.gambleFirst].play('door-off');
                        ui.doorlist[mainConfig.gambleSelection].play('door-on');
                        line.story[4][32] = "[몬티 홀]\n오! 정말입니까? 이분! 선택을 바꾸고\n새로운 문을 고르셨습니다!!\n이제는 되돌릴 수 없는 선택!";
                    }
                    if(mainConfig.gambleSelection === 1){
                        // 성공
                        line.story[4][35] = "[몬티 홀]\n당첨입니다!!! 정말 놀랍습니다!"
                        line.story[4][36] = "[몬티 홀]\n약속한대로 씨앗을 두배로 만들어\n드리겠습니다!! 축하드립니다!\n잘 가세요!"
                    }
                    else {
                        // 실패
                        line.story[4][35] = "[몬티 홀]\n안타깝게도.. 꽝입니다!!!\n정말 유감이네요!"
                        line.story[4][36] = "[몬티 홀]\n약속한대로 씨앗의 절반은 제가...\n하하 그럼 이만! 잘 가세요!"
                    }
                    if(!ui.dialogGroup.visible) {
                        ui.skip.setVisible(true);
                        ui.dialogGroup.setVisible(true);
                    }
                    signalToggle(false);
                    gambleCounter(mainConfig.gambleSelection);
                    dialog();
                    writeUserData();
                }
            }
            else if(key === 'right'){
                if(mainConfig.gambleSelection === 1 && mainConfig.gambleOpenHint === 2) return;
                if(mainConfig.gambleSelection < 2) {
                    mainConfig.gambleSelection++;
                }
                ui.gambleHand.x = ui.doorlist[mainConfig.gambleSelection].x + 6;
            }
        });
        value.on('pointerout', function () {
            this.setTexture('ui', key + '-on');
        });
    }
    ui.gambleBtns.add([ui.gambleBtn.left, ui.gambleBtn.select, ui.gambleBtn.right]);

    let signalHelpBool = true;
    ui.signalHelpBox = scene.add.rectangle(0, 0, display.width, display.height, 0x000000, 0.85).setOrigin(0);
    let helpText = '[흔적 감지하기]\n\n당신은 다른 시공간의 존재이기 때문에\n다른 세계의 흔적을 감지할 수 있는\n특별한 능력이 있습니다.' +
        '\n\n누군가의 흔적을 통해 상황을 추측할 수 있으며\n이 능력을 사용할 수 있는 상황이 되면\n이 아이콘이 나타납니다.';
    ui.signalHelp = scene.add.text(display.centerW, display.centerH, helpText, fontConfig)
        .setAlign('center').setOrigin(0.5).setFontSize(16).setLineSpacing(8);
    ui.signalHelpGroup = scene.add.container().add([ui.signalHelpBox, ui.signalHelp]);
    ui.signalBtn = scene.add.sprite(display.centerW ,display.height + 120, 'ui', 'signal-on').setOrigin(0.5, 1).setScale(3).setInteractive();
    ui.signalGamblerBox = scene.add.rectangle(0, 0, display.width, display.height, 0x000000, 0.7).setOrigin(0).setInteractive();
    ui.signalGambler = [];
    const Coloredfont = {font: '48px "dgm"', color: '#000'};
    for (let i = 0; i < 3; i++) {
        ui.signalGambler[i] = scene.add.text(ui.doorlist[i].x + 96, ui.doorlist[i].y + 114, '0%', Coloredfont)
            .setAlign('left').setOrigin(1).setLineSpacing(8).setStroke('#0f0', 6);
    }
    ui.signalGamblerTitle = scene.add.text(display.centerW, 222, '다른 세계의 선택을 감지했다.', fontConfig)
        .setAlign('center').setOrigin(0.5).setFontSize(16).setStroke('#000', 2);
    ui.signalGamblerGroup = scene.add.container().add([ui.signalGamblerBox, ui.signalGamblerTitle]).setVisible(false);
    ui.signalGamblerGroup.add(ui.signalGambler);
    ui.signalGamblerBox.on('pointerup', pointer => {
        if(mainConfig.signalGambleTween[2] !== null) return;
        ui.signalGamblerGroup.setVisible(false);
        ui.signalBtn.setInteractive();
    });
    ui.signalHelpBox.on('pointerup', function () {
        ui.signalHelpGroup.setVisible(false);
        signalHelpBool = false;
    });
    ui.signalBtn.on('pointerdown', function () {
        this.setTexture('ui', 'signal-off').setOrigin(0.5, 1).setScale(3);
    }).on('pointerout', function () {
        this.setTexture('ui', 'signal-on').setOrigin(0.5, 1).setScale(3);
    }).on('pointerup', function () {
        this.setTexture('ui', 'signal-on').setOrigin(0.5, 1).setScale(3);
        if(signalHelpBool) {
            ui.group.add(ui.signalHelpGroup);
            setTimeout(function (){
                ui.signalHelpBox.setInteractive();
            }, 200);
        }
        else {
            ui.signalBtn.disableInteractive();
            const level = {1: 'engineer', 2: 'sheep', 4: 'gambler' };
            readData(level[status.chapterIdx]);
            mainConfig.detectCount++;
            savedData.detectCount = mainConfig.detectCount;
        }
    });

    // 엔딩
    ui.endingGroup = scene.add.container();
    ui.endingCounts = [];
    ui.endingText = [];
    ui.endingBoxes = [];
    const endingFont = {font: '48px "dgm"', color: '#000'};

    const endingCount = {font: '48px "dgm"', color: '#000'};
    const endingCountShadow = {font: '48px "dgm"', color: '#000'};

    let bg = scene.add.rectangle(0,0, display.width, display.height, 0xffffff).setOrigin(0);
    ui.endingBtns = [];
    const BtnText = [
        {text: '> 처음으로 돌아가기', size: 180},
        {text: '> 미래에 숲이 된 공원 보러가기', size: 260},
        {text: '> 가좌플레이그라운드 방문하기', size: 260},
        {text: '> 미지의 세계로', size: 148},
    ]
    for (let i = 0; i < 4; i++) {
        let txt = scene.add.text(display.centerW, display.centerH + (i * 60), BtnText[i].text, endingFont)
            .setAlign('center').setOrigin(0.5, 1).setLineSpacing(8).setFontSize(16);
        let box = scene.add.rectangle(txt.x, txt.y + 20, BtnText[i].size, 54, 0x00ff00).setOrigin(0.5, 1);
        ui.endingBtns[i] = scene.add.container().add([box, txt]);
    }

    ui.logList = [];
    ui.logText = [];
    const loginfo = [
        {text: '당신이 컴퓨터를 정지한 방법', size: 260},
        {text: '당신이 구한 한 양의 수', size: 200},
        {text: '당신이 낚은 물고기의 수', size: 200},
        {text: '당신이 시공간을 감지한 횟수', size: 240},
        {text: '당신이 기부한 씨앗의 수', size: 200},
        {text: '시공간을 넘어 모인 씨앗의 수', size: 260},
    ];
    for (let i = 0; i < 6; i++) {
        ui.logList[i] = scene.add.container().setPosition(display.centerW + i * display.width, display.centerH);
        let txt = scene.add.text(0, 220, loginfo[i].text, endingFont)
            .setAlign('left').setOrigin(0.5, 1).setLineSpacing(8).setFontSize(16);
        let box = scene.add.rectangle(txt.x, txt.y + 10, loginfo[i].size, 36, 0x00ff00).setOrigin(0.5, 1);
        ui.logText[i] = scene.add.text(0, 40, '0', endingCount)
            .setAlign('center').setOrigin(0.5, 1).setLineSpacing(8).setFontSize(80);
        ui.logList[i].add([box, txt, ui.logText[i]]);
    }
    let num = ['', '마리', '마리', '번', '개', '개'];
    ui.theend = scene.add.text(display.centerW, display.centerH + 32, 'THE END', endingCount)
        .setAlign('center').setOrigin(0.5, 1).setLineSpacing(8).setFontSize(32);

    ui.endingLog = scene.add.container().add(ui.logList).setPosition(display.width, 0);


    ui.endingchar = [];
    ui.endingchar[0] = scene.add.sprite(display.centerW, 120).play('dom-stand').setScale(2).setOrigin(0.5);
    ui.endingchar[1] = scene.add.sprite(display.centerW + 40, 100).play('fishman-stand').setFlipX(true).setScale(2).setOrigin(0.5);
    ui.endingchar[2] = scene.add.sprite(display.centerW - 40, 100).play('gambler-stand').setScale(2).setOrigin(0.5);
    ui.endingchar[3] = scene.add.sprite(display.centerW - 60, 140).play('man-stand').setScale(2).setOrigin(0.5);
    ui.endingchar[4] = scene.add.sprite(display.centerW + 60, 140).play('engineer-stand').setFlipX(true).setScale(2).setOrigin(0.5);

    ui.endingFrame = scene.add.sprite(0, 0, 'frame').setScale(2).setOrigin(0);

    ui.endingGroup.add(bg);
    ui.endingGroup.add(ui.endingLog);
    ui.endingGroup.add(ui.endingchar);
    ui.endingGroup.add(ui.theend);
    ui.endingGroup.add(ui.endingFrame);

    ui.endingGroup.setVisible(false);

    // 스테이지 별 미니게임 씬 오브젝트 추가
    ui.gameScene = [];
    ui.gameScene[0] = scene.add.container().add([ui.pcKeyboard, ui.pc, ui.keyboard, ui.pcErr, ui.pcPw, ui.pcDown, ui.pcOff, ui.pcBreak]);
    ui.gameScene[1] = scene.add.container();
    ui.gameScene[2] = scene.add.container().add([ui.fishing, ui.fishingFloat, ui.fishingPlayer, ui.fishingCastGroup, ui.fishingEffect, ui.fishingGroup, ui.fishingMark, ui.fishingBtn]);
    ui.gameScene[3] = scene.add.container().add([ui.gamble, ui.doors, ui.gambleResult[0], ui.gambleResult[1], ui.gambleResult[2], ui.gambler, ui.gambleBtns, ui.gambleHand]);
    ui.gameScene[4] = scene.add.container();
    ui.bridge = scene.add.container().setVisible(false);
    ui.bridges.forEach(function (bridge, index) {
        ui.bridge.add(bridge);
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
        key: 'ui',
        baseFrame: 'default',
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
        key: 'ui',
        baseFrame: 'task',
        columns: [15, undefined, 15],
        rows: [0, undefined, 0],
    }).setOrigin(0.5, 1).setScale(2);
    ui.taskGroup.add([ui.taskBox, ui.task]);
    ui.taskGroup.y = -64;
    ui.rewardBox = scene.add.rexNinePatch({
        x: 0, y: 0,
        width: 120, height: 32,
        key: 'ui',
        baseFrame: 'default',
        columns: [8, undefined, 8],
        rows: [8, undefined, 8],
    }).setOrigin(0).setScale(2);
    ui.rewardMsg = scene.add.text(120, 32, '', fontConfig).setFontSize(16).setOrigin(0.5).setLineSpacing(4);
    ui.rewardGroup = scene.add.container().setPosition(display.centerW - 120, display.centerH - 40).setVisible(false);
    ui.rewardGroup.add([ui.rewardBox, ui.rewardMsg]);

    ui.skip.on('pointerup', function () {
        skip();
    });
}
function createSignal(scene) {
    // 시그널 효과 생성
    ui.signal = scene.physics.add.group({
        visible: false,
        active: false,
        frameQuantity: 20,
        maxSize: 20
    });
}
function setTask(visible) {
    let scene = game.scene.scenes[0];
    let pos;
    let ease;
    if (visible){
        pos = -8;
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
    mainObject.particles.createEmitter({
        x: 0,
        y: 0,
        speed: 80,
        gravityX: 320,
        gravityY: 120,
        lifespan: 6000,
        scale: 2,
        emitZone: { source: emitZone }
    });
    mainObject.titlezone = new Phaser.Geom.Rectangle(0, -80, display.width + 320, 40);
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
        frequency: 250,
        scale: 2,
        rotate: { start: 0, end: 360, ease: 'Back.easeOut' },
        emitZone: { source: mainObject.titlezone }
    });
}
function createObjects(scene) {
    // 기타 오브젝트 생성
    object.list = [];
    object.list[0] = scene.add.sprite(242, 472, 'obj', 'rock0').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[1] = scene.add.sprite(12, 580, 'obj', 'rock1').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[2] = scene.add.sprite(234, 596 + 80, 'obj', 'rock2').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[3] = scene.add.sprite(58 * 2, 143 * 2 + 92 * 2,'obj', 'pc-0').setScale(2).setOrigin(0, 1).play('pc').setVisible(false);
    object.list[4] = scene.add.sprite(110, 506, 'keyboard', 'pc-console').setScale(2).setOrigin(0, 1).setVisible(false);

    object.list[5] = scene.add.sprite(92, 396, 'obj', 'fishing-0').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[6] = scene.add.sprite(46, 316, 'obj', 'fishing-1').setScale(2).setOrigin(0, 1).setVisible(false);

    object.list[7] = scene.add.sprite(70, 654, 'obj', 'gate').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[8] = scene.add.sprite(148, 232, 'obj', 'arrow').setScale(2).setOrigin(0, 1).setVisible(false);
    object.list[9] = scene.add.sprite(158, 402, 'obj', 'tree-bottom0').setScale(2).setOrigin(0, 1).setVisible(false);

    object.tree = scene.add.sprite(82, 150, 'obj', 'tree-top0').setScale(2).setOrigin(0).setVisible(false);
    object.treeGroup = scene.add.container().add(object.tree);
    object.treeshade = scene.add.sprite(88, 366, 'obj', 'tree-shade0').setScale(2).setOrigin(0).setVisible(false);
}
function setLayer(scene) {
    // TODO 레이어 및 그룹 오브젝트 생성
    mainObject.layer = scene.add.layer();

    mainObject.bg = scene.add.container();
    mainObject.bg.add([ui.bg, ui.smoke, ui.next, ui.bridge, ui.gamblePos, object.treeshade]);

    mainObject.group = scene.add.container();
    mainObject.group.add([mainObject.player, mainObject.dom, mainObject.engineer, mainObject.man, mainObject.fishman, mainObject.gambler]);
    mainObject.group.add(object.list);
    for (let i = 0; i < mainObject.sheeps.length; i++) {
        mainObject.group.add(mainObject.sheeps[i]);
    }

    ui.group = scene.add.container();
    ui.group.add([ui.background, ui.mark, ui.gameGroup, ui.signalBtn, ui.dialogGroup, ui.rewardGroup, ui.taskGroup, ui.largeText, ui.esc, ui.title, mainObject.TitleParticle, ui.dark, ui.signalGamblerGroup, ui.skip, ui.endingSkip]);

    // 레이어 정렬
    mainObject.layer.add(mainObject.bg);
    mainObject.layer.add(mainObject.group);
    mainObject.layer.add(object.treeGroup);
    mainObject.layer.add(mainObject.particles);
    mainObject.layer.add(ui.group);
    mainObject.layer.add(ui.effectGroup);
    mainObject.layer.add(ui.endingGroup);
}
function setAnimations(scene) {
    // TODO 애니메이션 추가
    scene.anims.create({
        key: 'title',
        frames: scene.anims.generateFrameNumbers('title', { start: 0, end: 1 }),
        frameRate: 1,
        repeat: -1
    });
    scene.anims.create({
        key: 'signal',
        frames: scene.anims.generateFrameNumbers('signal', { start: 0, end: 12 }),
        frameRate: 12,
    });
    scene.anims.create({
        key: 'mark',
        repeat: -1,
        frameRate: 2,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'mark',
            end: 1
        })
    });
    scene.anims.create({
        key: 'mark-fish',
        repeat: -1,
        frameRate: 2,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'mark',
            start: 2,
            end: 3
        })
    });
    scene.anims.create({
        key: 'pc-err',
        frames: scene.anims.generateFrameNumbers('pc-err', { start: 0, end: 5, first: 0 }),
        frameRate: 24,
        repeat: -1
    });
    scene.anims.create({
        key: 'float-water',
        frames: scene.anims.generateFrameNumbers('float-water', { start: 0, end: 9, first: 0 }),
        frameRate: 16
    });
    scene.anims.create({
        key: 'float-water-wave',
        frames: scene.anims.generateFrameNumbers('float-water', { start: 9, end: 18 }),
        frameRate: 16
    });
    // backgrounds
    scene.anims.create({
        key: 'bg0',
        frames: scene.anims.generateFrameNumbers('bg', { start: 0, end: 0 }),
        frameRate: 1,
    });
    scene.anims.create({
        key: 'bg1',
        frames: scene.anims.generateFrameNumbers('bg', { start: 1, end: 1 }),
        frameRate: 1,
    });
    scene.anims.create({
        key: 'bg2',
        frames: scene.anims.generateFrameNumbers('bg', { start: 2, end: 3 }),
        repeat: -1,
        frameRate: 2,
    });
    scene.anims.create({
        key: 'bg3',
        frames: scene.anims.generateFrameNumbers('bg', { start: 4, end: 5 }),
        repeat: -1,
        frameRate: 2,
    });
    scene.anims.create({
        key: 'bg4',
        frames: scene.anims.generateFrameNumbers('bg', { start: 6, end: 6 }),
        frameRate: 1,
    });
    scene.anims.create({
        key: 'bg5-0',
        frames: scene.anims.generateFrameNumbers('bg', { start: 7, end: 8 }),
        repeat: -1,
        frameRate: 1,
    });
    scene.anims.create({
        key: 'bg5-1',
        frames: scene.anims.generateFrameNumbers('bg', { start: 9, end: 10 }),
        repeat: -1,
        frameRate: 1,
    });
    scene.anims.create({
        key: 'bg5-2',
        frames: scene.anims.generateFrameNumbers('bg', { start: 11, end: 12 }),
        repeat: -1,
        frameRate: 1,
    });
    scene.anims.create({
        key: 'smoke',
        repeat: -1,
        frameRate: 4,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'smoke-',
            end: 2
        })
    });
    scene.anims.create({
        key: 'next',
        repeat: -1,
        frameRate: 2,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'next-',
            end: 1
        })
    });
    scene.anims.create({
        key: 'next-right',
        repeat: -1,
        frameRate: 2,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'next-',
            start: 2,
            end: 3
        })
    });
    scene.anims.create({
        key: 'pc',
        repeat: -1,
        frameRate: 8,
        frames: scene.anims.generateFrameNames('obj', {
            prefix: 'pc-',
            end: 2
        })
    });
    scene.anims.create({
        key: 'fishing',
        repeat: -1,
        frameRate: 2,
        frames: scene.anims.generateFrameNames('minigame', {
            prefix: 'fishing',
            end: 1
        })
    });
    scene.anims.create({
        key: 'gamble',
        repeat: -1,
        frameRate: 2,
        frames: scene.anims.generateFrameNames('minigame', {
            prefix: 'gamble',
            end: 1
        })
    });
    scene.anims.create({
        key: 'float-in',
        frameRate: 6,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'float-in',
            end: 2
        })
    });
    scene.anims.create({
        key: 'float-loop',
        repeat: -1,
        frameRate: 2,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'float-loop',
            end: 1
        })
    });
    scene.anims.create({
        key: 'float-bite',
        frameRate: 6,
        repeat: -1,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'float-in',
            end: 2
        })
    });
    scene.anims.create({
        key: 'door-off',
        frames: scene.anims.generateFrameNumbers('doors', { start: 0, end: 0 }),
        frameRate: 2,
    });
    scene.anims.create({
        key: 'door-on',
        frames: scene.anims.generateFrameNumbers('doors', { start: 1, end: 1 }),
        frameRate: 2,
    });
    scene.anims.create({
        key: 'door-open',
        frames: scene.anims.generateFrameNumbers('doors', { start: 1, end: 8 }),
        frameRate: 16,
    });
    scene.anims.create({
        key: 'door-hint-open',
        frames: scene.anims.generateFrameNumbers('doors', { start: 9, end: 15 }),
        frameRate: 16,
    });
    scene.anims.create({
        key: 'hand',
        frameRate: 2,
        repeat: -1,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'hand',
            end: 1
        })
    });
    scene.anims.create({
        key: 'fakesheep',
        frameRate: 2,
        repeat: -1,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'fakesheep',
            end: 1
        })
    });
    scene.anims.create({
        key: 'double',
        frameRate: 2,
        repeat: -1,
        frames: scene.anims.generateFrameNames('ui', {
            prefix: 'double',
            end: 1
        })
    });
}
function setLines(scene) {
    // TODO 텍스트 데이터 생성 및 정리
    let jsonText = scene.cache.json.get('text');
    line.chapter = jsonText.chapter;
    line.task = jsonText.task;
    line.opening = jsonText.opening;
    line.story = jsonText.story;
}

// TODO 동작 메서드
const lerp = (x, y, a) => x * (1 - a) + y * a;
function signalToggle(visible) {
    let scene = game.scene.scenes[0];
    mainConfig.signalTween?.stop();
    if(visible){
        ui.signalBtn.setInteractive();
        ui.signalBtn.setVisible(true);
        ui.signalBtn.y = display.height + 120;
        mainConfig.signalTween = scene.tweens.add({
            targets: ui.signalBtn,
            y: display.height + 18,
            duration: 800,
            ease: Phaser.Math.Easing.Quintic.Out,
            onComplete: function () {

            }
        });
    }
    else {
        mainConfig.signalTween = game.scene.scenes[0].tweens.add({
            targets: ui.signalBtn,
            y: display.height + 120,
            duration: 800,
            ease: Phaser.Math.Easing.Quintic.In,
            onComplete: function (){
                ui.signalBtn.setVisible(false);
            }
        });
    }
}
function Move(character, target, speed) {
    game.scene.scenes[0].physics.moveToObject(character, target, speed);
}
function moveCharacter(character) {
    let speed = 160;
    if(character === 'engineer') speed = 80;
    moveTargets[character].x = path.get(character)[mainConfig.pathCount[character]].x;
    moveTargets[character].y = path.get(character)[mainConfig.pathCount[character]].y;
    let next = path.get(character)[mainConfig.pathCount[character] + 1]?.x;
    if(mainObject[character].anims.currentAnim.key !== character + '-run') mainObject[character].play(character + '-run');
    mainObject[character].setFlipX(mainObject[character].x - moveTargets[character].x > 0);
    if(next !== undefined) mainObject[character].setFlipX(mainObject[character].x - next > 0);
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
function sheepStanby(sheep) {
    sheep.setFlipX(true);
    sheep.play('sheep-run');
    Move(sheep, mainConfig.bridgePos.start, 100);
}
function sheepTalk(idx, sheep) {
    clearTimeout(mainConfig.sheepBlinkTimer[idx]);
    mainConfig.sheepBlinkTimer[idx] = setTimeout(function () {
        if(sheep.anims.currentAnim.key === 'sheep-stand') sheep.play('sheep-talk');
    }, 1600 + Math.round(Math.random() * 3200));
}
function jumpTo(jumper, target, action) {
    if(jumper === undefined) return;
    mainConfig.bridgeJumpingNow = true;
    let scene = game.scene.scenes[0];
    let a = jumper;
    let b = target;
    let path = [];
    path[0] = {x: a.x, y: a.y};
    path[1] = {x: lerp(a.x, b.x, 0.5) , y: lerp(a.y, b.y - 60, 0.5)}
    path[2] = {x: b.x, y: b.y + 20}
    a.setFlipX(a.x > b.x);
    if(a === mainObject.player){
        if(a.anims.currentAnim.key !== 'player-jump') a.play('player-jump');
    }
    else if(a === mainObject.dom){
        if(a.anims.currentAnim.key !== 'dom-jump') a.play('dom-jump');
    }
    else {
        if(a.anims.currentAnim.key !== 'sheep-jump') a.play('sheep-jump');
        let idx = mainObject.sheeps.findIndex((obj) => a === obj);
        sheepTalk(idx, a);
    }
    scene.tweens.add({
        targets: a,
        x: path[2].x,
        duration: 600,
        ease: Phaser.Math.Easing.Linear
    });
    scene.tweens.add({
        targets: a,
        y: path[1].y,
        duration: 300,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onComplete: function () {
            scene.tweens.add({
                targets: a,
                y: path[2].y,
                duration: 300,
                ease: Phaser.Math.Easing.Quadratic.In,
                onComplete: function () {
                    mainConfig.bridgeJumpingNow = false;
                    action();
                }
            });
        }
    });
}
function fishingBack(catched) {
    const scene = game.scene.scenes[0];
    let target = {x: ui.fishingPlayer.x + 68, y: ui.fishingPlayer.y - 20};
    const path = [];
    path[0] = {x: ui.fishingFloat.x, y: ui.fishingFloat.y};
    path[1] = {x: lerp(ui.fishingFloat.x, target.x, 0.85) , y: lerp(ui.fishingFloat.y - 180, target.y - 180, 0.5)};
    path[2] = {x: target.x, y: target.y};

    ui.fishingFloat.stop();
    // TODO 물고기 잡혔을때
    if(catched) {
        ui.fishingFloat.setTexture('ui', 'fish' + mainConfig.retryFishing).setOrigin(0.5);
    }
    else ui.fishingFloat.setTexture('ui', 'float').setOrigin(0.5);
    mainConfig.floatOnAir = true;
    mainConfig.fishFloatTween[0] = scene.tweens.add({
        targets: ui.fishingFloat,
        x: path[2].x,
        duration: 1200,
        ease: Phaser.Math.Easing.Linear,
        onComplete: function (){ mainConfig.floatOnAir = false; }
    });
    mainConfig.fishFloatTween[1] = scene.tweens.add({
        targets: ui.fishingFloat,
        y: path[1].y,
        duration: 600,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onComplete: function () {
            mainConfig.fishFloatTween[2] = scene.tweens.add({
                targets: ui.fishingFloat,
                y: path[2].y,
                duration: 600,
                ease: Phaser.Math.Easing.Quartic.In,
                onComplete: function () {
                    if(catched){
                        ui.fishingPlayer.play('fishing-done' + mainConfig.retryFishing);
                    }
                    else {
                        ui.fishingPlayer.play('fishing-wait');
                        mainConfig.fishingRodOn = false;
                    }
                    ui.fishingFloat.setVisible(false);
                }
            });
        }
    });
}
function fishingCastFloat(power) {
    // 낚시찌 던지기
    mainConfig.fishingRodOn = true;
    const scene = game.scene.scenes[0];
    for (let i = 0; i < mainConfig.fishFloatTween.length; i++) {
        mainConfig.fishFloatTween[i].stop();
    }
    ui.fishingPlayer.play('fishing-throw');
    ui.fishingFloat.setVisible(true);
    // 찌 출발위치
    ui.fishingFloat.setPosition(ui.fishingPlayer.x + 68, ui.fishingPlayer.y - 20);
    let target = {x: 180 + Math.round(power), y: 420 + Math.round(Math.random() * 20)};
    const path = [];
    path[0] = {x: ui.fishingFloat.x, y: ui.fishingFloat.y};
    path[1] = {x: lerp(ui.fishingFloat.x, target.x, 0.85) , y: lerp(ui.fishingFloat.y - 160 - Math.round(power * 0.5), target.y - 160 - Math.round(power * 0.5), 0.5)};
    path[2] = {x: target.x, y: target.y};
    let speed = 1200 + Math.round(power)
    mainConfig.floatOnAir = true;
    mainConfig.fishFloatTween[0] = scene.tweens.add({
        targets: ui.fishingFloat,
        x: path[2].x,
        duration: speed,
        ease: Phaser.Math.Easing.Linear,
        onComplete: function () {
            mainConfig.floatOnAir = false;
        }
    });
    mainConfig.fishFloatTween[1] = scene.tweens.add({
        targets: ui.fishingFloat,
        y: path[1].y,
        duration: speed * 0.5,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onComplete: function () {
            mainConfig.fishFloatTween[2] = scene.tweens.add({
                targets: ui.fishingFloat,
                y: path[2].y,
                duration: speed * 0.5,
                ease: Phaser.Math.Easing.Quartic.In,
                onComplete: function () {
                    ui.floatWater.setPosition(target.x, target.y);
                    ui.floatWater.setVisible(true);
                    ui.floatWater.play('float-water');
                    ui.fishingFloat.play('float-in');
                    // 찌 물에 떨어짐
                    // 낚시 시작
                    startBite();
                }
            });
        }
    });
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
const getRandomInt = function (max) {
    return RandomPlusMinus() * Math.round(Math.random() * max);
}
function RandomizePos(obj, x, y, min, max) {
    obj.x = x + min + Math.random() * max * RandomPlusMinus();
    obj.y = y + min + Math.random() * max * RandomPlusMinus();
}
function shakeObject(obj, max, speed, time) {
    if(timer.shaker !== undefined) return;
    const x = obj.x;
    const y = obj.y;
    if(time !== null)
    {
        setTimeout(()=> {
            clearTimeout(timer.shaker);
            timer.shaker = undefined;
            obj.x = x;
            obj.y = y;
        }, time);
    }
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
    signalToggle(false);
    mainConfig.pcRecordOn = false;
    object.list[3].stop();
    object.list[3].setTexture('obj' , (way === 'break') ? 'pc-broken' : 'pc-off').setOrigin(0, 1);

    // PC 미니게임 종료 후 결과에 따라 대사 변경
    const newline = new Map();
    newline.set('1234', "[폰 왈도 노이만 3세]\n어떻게 비밀번호를 알아냈지?!\n천재가 분명해! 자네..")
        .set('0000', "[폰 왈도 노이만 3세]\n초기화 패스워드 0000이라..자네..\n나랑 일해볼 생각 없나..?")
        .set('power', "[폰 왈도 노이만 3세]\n파워를 직접적으로 차단한다라..\n자네.. 컴퓨터를 좀 아는군?")
        .set('danger', "[폰 왈도 노이만 3세]\n그 버튼은 무서워서 단 한번도\n못 눌러봤는데.. 대담한 친구로군..")
        .set('break', "[폰 왈도 노이만 3세]\n아니..커..컴퓨터가..\n과격한 친구로군.. 어쨋든 오작동은\n멈췄으니.. 성공했다고 봐야겠어.");
    const reward = new Map();
    // 씨앗 리워드 결정
    reward.set('1234', 8)
        .set('0000', 2)
        .set('power', 10)
        .set('danger', 2)
        .set('break', 5);
    mainConfig.reward[0] = reward.get(way);
    savedData.trace.engineer = {how: way, path: mainConfig.pcRecord};
    writeUserData();

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
    // 씨앗을 받았다 메세지 UI 출력
    // bool: 켜기 끄기
    // count: 씨앗 갯수

    if(bool){
        setTimeout(() => ui.skip.setVisible(true), 400);
        ui.rewardGroup.setVisible(true);
        ui.rewardMsg.text = '씨앗을 ' + count + '개 받았다!'
        mainConfig.seedNum += count;
    }
    else ui.rewardGroup.setVisible(false);
    savedData.totalseed = mainConfig.seedNum;
    for (let i = 0; i < mainConfig.reward.length; i++) {
        savedData.seed[i] = mainConfig.reward[i];
    }
    writeUserData();
}
function setGameScenes() {
    // 챕터에 따라 미니게임 씬 정렬
    if(status.chapterIdx < 1) return;
    for (let i = 0; i < ui.gameScene.length; i++) {
        ui.gameScene[i].setVisible(false);
    }
    ui.gameGroup.y = 840;
    ui.gameScene[status.chapterIdx - 1].setVisible(true);
}
function fishingFinish(success) {
    // 낚시 완료
    // success: 성공 여부
    ui.fishingCastbar.width = 0;
    ui.fishingCastbar.setOrigin(0.5);
    ui.fishingCastbar.setFillStyle(Phaser.Display.Color.GetColor(0, 255, 0));
    ui.fishingBtn.setTexture('ui', 'fishBtn0').setOrigin(0.5);
    let scene = game.scene.scenes[0];

    mainConfig.fishingNow = false;
    mainConfig.fishWait = false;
    ui.fishIcon.body.setGravityY(0);
    ui.fishIcon.body.setVelocity(0, 0);
    ui.fishingBar.body.setGravityY(0);
    ui.fishingBar.body.setVelocity(0, 0);
    ui.fishingBar.setPosition(display.centerW, display.centerH);
    ui.fishIcon.y = display.centerH - 80;
    setVisibleObjects(false, [ui.fishingBar, ui.fishingGroup]);
    if(success){
        if(!mainConfig.clear[2]) {
            setTask(false);
        }
        else {
            ui.task.text = line.task[status.chapterIdx][2];
            mainConfig.retryFishing++;
            savedData.trace.fish = mainConfig.retryFishing + 1;

        }
        ui.fishingPlayer.play('fishing-finish');
        mainConfig.fishingDone = true;
        ui.gameGroup.setVisible(true);
    }
    else {
        setTimeout(function () {
            ui.fishingCastBoxB.setTexture('ui', 'power1').setOrigin(0.5);
            if(ui.fishingPlayer.anims.currentAnim.key === 'fishing-cancel') return;
            ui.fishingPlayer.play('fishing-cancel');
            ui.task.text = "길게 눌러서 낚싯대를 던지자";
            ui.fishingCastbar.width = 0;
            ui.fishingCastbar.setOrigin(0.5);
        }, 200);
    }
}
function startFishing() {
    ui.fishingMark.setVisible(false);
    ui.fishingBar.body.setVelocity(0);
    ui.fishingBar.setPosition(display.centerW, display.centerH);
    ui.fishingCastBoxB.setTexture('ui', 'catch').setOrigin(0.5);
    ui.fishingBtn.setTexture('ui', 'fishBtn0').setOrigin(0.5);
    setVisibleObjects(true, [ui.fishingBar, ui.fishingGroup]);
    ui.task.text = '물고기가 영역 안에 위치하도록 하자';
    createFloatWave(ui.fishingFloat);
    ui.fishingBar.body.setGravityY(800);
    fishMove();
    function fishMove() {
        ui.fishIcon.body.setGravityY(getRandomInt(400));
        setTimeout(function () {
            if(!mainConfig.fishingNow) return;
            fishMove();
        }, 200);
    }
}
function startBite() {
    clearTimeout(mainConfig.fishingFailTimer);
    ui.fishingPlayer.play('fishing-wait');
    ui.task.text = '물고기가 물때까지 기다리자';
    let waitFish = Math.round(6000 + Math.round(Math.random() * 3200) - mainConfig.fishingPower * 10);
    let waitFail = Math.round(2400 - mainConfig.retryFishing * 500 + Math.round(Math.random() * 1200));
    // 물고기 대기
    mainConfig.fishingTimer = setTimeout(function () {
        mainConfig.fishWait = true;
        ui.fishingPlayer.play('fishing-catch');
        ui.fishingMark.setVisible(true).setPosition(ui.fishingFloat.x - 16, display.centerH + 30);
        // 입질 시작
        ui.task.text = '한번 더 눌러서 낚시를 시작하자';
        ui.fishingFloat.play('float-bite');
        createFloatWave(ui.fishingFloat);
        // 무반응할 경우 낚시 실패
        mainConfig.fishingFailTimer = setTimeout(function () {
            ui.fishingMark.setVisible(false);
            mainConfig.fishWait = false;
            ui.fishingFloat.play('float-loop');
            startBite();
        }, waitFail);
    }, waitFish);
}
function createFloatWave(target) {
    // 낚시찌 위치에 물결 재생
    if(!mainConfig.fishWait) return;
    let wave =  ui.floatWaterWave.get();
    if (!wave) return;
    ui.fishingEffect.add(wave);
    wave.setScale(3);
    wave.setPosition(target.x, target.y);
    wave.play('float-water-wave');
    wave.on('animationcomplete', function () {
        wave.destroy();
        setTimeout(function () {
            createFloatWave(target);
        }, 800);
    });
}
function createParts(x, y, vx, vy) {
    // pc 부수기
    if(mainConfig.clear[0]) return;
    mainConfig.pcCrackCount++;
    if(mainConfig.pcCrackCount === 10) {
        ui.pc.setTexture('minigame', 'pc1');
    }
    else if(mainConfig.pcCrackCount > 20 && mainConfig.pcCrackCount < 35){
        ui.pc.setTexture('minigame', 'pc2');
        ui.pcErr.y =ui.pcOff.y= 202;
    }
    else if(mainConfig.pcCrackCount > 35 && mainConfig.pcCrackCount < 60){
        ui.pc.setTexture('minigame', 'pc3');
        ui.pcErr.y =ui.pcOff.y= 210;
    }
    else if(mainConfig.pcCrackCount > 60){
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
    for (let i = 0; i < mainObject.sheeps.length; i++) {
        if(mainObject.sheeps[i].body.speed > 0) return;
    }
    if(mainConfig.bridgeJumpingNow) return;
    let livingSheep = mainObject.sheeps[0];
    let nextSheep = mainObject.sheeps[1];
    if(Math.floor(index / 2) !== mainConfig.bridgeSelection) return;

    if(index === mainConfig.bridgeAnswer[mainConfig.bridgeSelection]){
        // 생존
        jumpTo(livingSheep, bridge, function () {
            ui.bridges[mainConfig.bridgeFail[mainConfig.bridgeSelection]].play('stone' + mainConfig.bridgeFail[mainConfig.bridgeSelection] + '-out');
            livingSheep.play('sheep-stand');
            nextSheep = mainObject.sheeps[mainConfig.bridgeSelection - mainConfig.livingSheep + 1];
            if(nextSheep !== undefined) {
                if(nextSheep.y < ui.bridges[0].y) sheepStanby(nextSheep);
            }
            if(mainConfig.livingSheep > 0) {
                mainConfig.sheepJump = function () {
                    let followCount = 0;
                    followUp(nextSheep);
                    function followUp(sheep) {
                        jumpTo(sheep, ui.bridges[mainConfig.bridgeAnswer[followCount]], function () {
                            sheep.play('sheep-stand');
                            followCount++;
                            if (followCount === mainConfig.livingSheep) return;
                            followUp(sheep);
                        });
                        nextSheep = mainObject.sheeps[mainConfig.bridgeSelection - mainConfig.livingSheep + 1];
                        if(nextSheep !== undefined) {
                            sheepStanby(nextSheep);
                            mainConfig.sheepJump = function () {
                                jumpTo(nextSheep, ui.bridges[mainConfig.bridgeAnswer[0]], function () {
                                    nextSheep.play('sheep-stand');
                                });
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < mainConfig.bridgeSelection; i++) {
                jumpTo(mainObject.sheeps[i + 1], ui.bridges[mainConfig.bridgeAnswer[mainConfig.bridgeSelection - 1 - i]], function () {
                    mainObject.sheeps[i + 1].play('sheep-stand');
                });
            }
            mainConfig.bridgeSelection++;
            finishJump(true);
        })
    }
    else {
        // 실패
        jumpTo(livingSheep, bridge, function () {
            // livingSheep 점프 후 실패 후 제거
            ui.bridges[mainConfig.bridgeFail[mainConfig.bridgeSelection]].play('stone' + mainConfig.bridgeFail[mainConfig.bridgeSelection] + '-out');
            mainConfig.livingSheep++;
            livingSheep.setGravityX(-600);
            livingSheep.setVelocity(80, (mainConfig.bridgeSelection > 2) ? -40 : 60);
            livingSheep.play('sheep-dead');
            livingSheep.setFlipX(false);
            mainConfig.deadSheep.push(livingSheep);
            mainObject.sheeps.shift();
            // 남은 양 점프
            nextSheep = mainObject.sheeps[mainConfig.bridgeSelection - mainConfig.livingSheep + 1];
            if(nextSheep !== undefined) {
                if(nextSheep.y < ui.bridges[0].y) sheepStanby(nextSheep);
                mainConfig.sheepJump = function () {
                    let followCount = 0;
                    followUp(nextSheep);
                    function followUp(sheep) {
                        jumpTo(sheep, ui.bridges[mainConfig.bridgeAnswer[followCount]], function () {
                            sheep.play('sheep-stand');
                            followCount++;
                            if(followCount === mainConfig.livingSheep) return;
                            followUp(sheep);
                        });
                        nextSheep = mainObject.sheeps[mainConfig.bridgeSelection - mainConfig.livingSheep + 1];
                        if(nextSheep !== undefined) {
                            if(nextSheep.y < ui.bridges[0].y) sheepStanby(nextSheep);
                            mainConfig.sheepJump = function () {
                                jumpTo(nextSheep, ui.bridges[mainConfig.bridgeAnswer[0]], function () {
                                    nextSheep.play('sheep-stand');
                                });
                                let toNext = mainObject.sheeps[mainConfig.bridgeSelection - mainConfig.livingSheep + 2];
                                if(toNext !== undefined){
                                    sheepStanby(toNext);
                                }
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < mainConfig.bridgeSelection; i++) {
                jumpTo(mainObject.sheeps[i], ui.bridges[mainConfig.bridgeAnswer[mainConfig.bridgeSelection - 1 - i]], function () {
                    mainObject.sheeps[i].play('sheep-stand');
                    jumpTo(mainObject.sheeps[i], ui.bridges[mainConfig.bridgeAnswer[mainConfig.bridgeSelection - 1 - i]], function () {
                        mainObject.sheeps[i].play('sheep-stand');
                    })
                })
            }
            mainConfig.bridgeSelection++;
            finishJump(false);
        });
    }
    function finishJump(success) {
        let count = (success) ? 4 : 3;
        if(mainConfig.bridgeSelection === 5){
            // 양 퀘스트 완료
            signalToggle(false);
            mainConfig.sheepRecordOn = false;
            savedData.trace.sheep = {sheep: mainObject.sheeps.length, path: mainConfig.sheepRecord};
            writeUserData();
            console.log(savedData.trace)
            let left = 0;
            f();
            function f() {
                for (let i = 0; i < mainObject.sheeps.length; i++) {
                    let target = ui.bridges[mainConfig.bridgeAnswer[count - i + left]];
                    if(target === undefined) {
                        target = mainConfig.bridgePos.end;
                    }
                    if(success){
                        if(i === 0) target = mainConfig.bridgePos.end;
                    }
                    if(mainObject.sheeps[i].y < mainConfig.bridgePos.end.y){
                        jumpTo(mainObject.sheeps[i], target, function () {
                            mainObject.sheeps[i].play('sheep-run');
                            let lastPos = mainConfig.sheepEndPos[i];
                            mainConfig.sheepLast[i] = lastPos;
                            Move(mainObject.sheeps[i], lastPos, 100);
                            mainObject.sheeps[i].setFlipX(mainObject.sheeps[i].x > lastPos.x);
                            if(i === mainObject.sheeps.length - 1){
                                if(left < mainObject.sheeps.length + 1){
                                    left++;
                                    f();
                                }
                            }
                        });
                    }
                }
            }
            if(!success && mainConfig.deadSheep.length > 4){
                setTimeout(function () {
                    sheepFinish();
                }, 1000);
            }
        }
    }

    // 인터렉션 설정 및 퀘스트 재설정
    ui.bridges[mainConfig.bridgeAnswer[mainConfig.bridgeSelection]].disableInteractive();
    ui.bridges[mainConfig.bridgeFail[mainConfig.bridgeSelection]].disableInteractive();
    const number = {
        0: '첫 번째' ,
        1: '두 번째' ,
        2: '세 번째' ,
        3: '네 번째' ,
    }
    let korNum = number[mainConfig.bridgeSelection + 1];
    if(korNum === undefined) korNum = '마지막';
    ui.task.text = korNum + " 다리를 선택하자";
}
function sheepFinish() {
    for (let i = 0; i < mainObject.sheeps.length; i++) {
        sheepTalk(i, mainObject.sheeps[i]);
    }
    setTask(false);
    mainConfig.clear[1] = true;
    let dead = mainConfig.deadSheep.length;
    const newLine = {13: new Map(), 14: new Map(), 15: new Map(), 16: null, 17: null};
    newLine[13].set(5, "[양치기 소년]\n........");
    newLine[13].set(4, "[양치기 소년]\n아아.. 단 한마리만 건넜어..");
    newLine[13].set(3, "[양치기 소년]\n하하.. 내 양의 반 이상이...");
    newLine[13].set(2, "[양치기 소년]\n음.. 그래도 양들이 세마리나\n강을 건넜네..");
    newLine[13].set(1, "[양치기 소년]\n오호.. 너 꽤나 잘 맞추는데?");
    newLine[13].set(0, "[양치기 소년]\n대단해..전부 맞췄어!!");

    newLine[14].set(5, "[아무 말도 하지 않는다]");
    newLine[14].set(4, "[먼 산을 바라본다]");
    newLine[14].set(3, "[미안한 표정으로 쳐다본다]");
    newLine[14].set(2, "[양치기를 쳐다본다]");
    newLine[14].set(1, "[미소를 짓는다]");
    newLine[14].set(0, "[뿌듯한 얼굴로 양치기를 본다]");

    newLine[15].set(5, "[양치기 소년]\n어쩔 수 없지.. 애초에 내가 선택을\n너에게 부탁했잖아..");
    newLine[15].set(4, "[양치기 소년]\n아니 괘..괜찮아..\n한 마리라도 남았으니 다행이지..");
    newLine[15].set(3, "[양치기 소년]\n어쩔 수 없지 뭐..\n양을 더 많이 빠트린 적도 있으니까..");
    newLine[15].set(2, "[양치기 소년]\n이 정도면 나보단 낫네..\n어차피 확률은 반반이였잖아 그치?");
    newLine[15].set(1, "[양치기 소년]\n뭔가 구별할 수 있는 방법이\n있는거야? 내 눈엔 똑같은데..");
    newLine[15].set(0, "[양치기 소년]\n진짜 어떻게 한 거야?!\n나한테도 방법 좀 알려달라고..");

    newLine[16] = "[양치기 소년]\n떠밀려간 양은 너무 걱정하지마.\n강 하류는 얕아서 아마 괜찮을거야."
    if(dead === 0) newLine[16] = "[양치기 소년]\n자 이제 저 징검다리를 지나서\n건너가면 돼."

    newLine[17] = "[양치기 소년]\n내가 데리러 갈테니 넌 마저\n건너가도록 하라구."
    if(dead === 0) newLine[17] = "[양치기 소년]\n난 이쪽에 남은 짐을 챙겨서 갈테니\n걱정말라구."

    line.story[status.chapterIdx][13] = newLine[13].get(dead);
    line.story[status.chapterIdx][14] = newLine[14].get(dead);
    line.story[status.chapterIdx][15] = newLine[15].get(dead);
    line.story[status.chapterIdx][16] = newLine[16];
    line.story[status.chapterIdx][17] = newLine[17];

    mainConfig.reward[1] = (6-dead) * 2;

    ui.skip.setVisible(true);
    ui.dialogGroup.setVisible(true);
    dialog();
}
function checkSignal(arr) {
    // TODO 시그널
    let count = 0;
    console.log('check')
    blink();
    function blink() {
        let sign =  ui.signal.get();
        if (!sign) return;
        ui.effectGroup.add(sign);
        sign.play('signal');
        sign
            .setOrigin(0.5)
            .setScale(3)
            .enableBody(true, arr[count].x, arr[count].y, true, true)
        sign.on('animationcomplete', function (a) {
            if(sign.x === arr[arr.length-1].x && sign.y === arr[arr.length-1].y) {
                ui.signalBtn.setInteractive();
            }
            sign.destroy();
        });
        count++;
        if(count < arr.length) setTimeout(blink, 100);
    }
}

// TODO 이벤트 메서드
function skip() {
    if(status.scene === 'title'){
        if(mainConfig.debugMode){
            mainObject.TitleEmitter.stop();
            mainObject.TitleEmitter.setVisible(false);
            ui.title.setVisible(false);
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
            y: -390-340,
            duration: 1800,
            ease: Phaser.Math.Easing.Quintic.In,
            onComplete: function () {
                ui.title.setVisible(false);
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
            if(ui.title.visible) return;
            if(status.index === 3){
                ui.esc.setVisible(true);
                ui.skip.setVisible(false);
                shakeObject(ui.esc, 6, 60, null);
            }
            ui.largeText.text = line.opening[status.index];
            shakeObject(ui.largeText, 20, 20, 240);
            status.index++;
        }
    }
    else if(status.scene === 'chapter'){
        if(ui.rewardGroup.visible === true){
            setReward(false, null);
            if(status.chapterIdx === 5) {
                return;
            }
            ui.dialogGroup.setVisible(true);
        }
        dialog();
    }
    else if(status.scene === 'ending'){
        if(!mainConfig.theend){
            game.scene.scenes[0].tweens.add({
                targets: ui.endingLog,
                x: 0,
                duration: 800,
                ease: Phaser.Math.Easing.Quintic.Out
            });
            game.scene.scenes[0].tweens.add({
                targets: ui.theend,
                x: -display.width,
                duration: 800,
                ease: Phaser.Math.Easing.Quintic.Out,
                onComplete: function (){
                    mainConfig.theend = true;
                }
            });
            return;
        }
        if(mainConfig.endingIdx < ui.logText.length - 1) mainConfig.endingIdx++;
        endingMotion();
        if(mainConfig.endingIdx === 1){
            ui.endingSkip.setVisible(true);
        }
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
// TODO 인덱스 메서드
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
                moveToPoint('player', mainObject.dom.x + 60, mainObject.dom.y, true);
                mainConfig.lookAt.player = mainObject.dom;
                mainConfig.lookAt.dom = mainObject.player;
                mainObject.dom.setVisible(true).play('dom-out');
                mainObject.dom.on('animationcomplete', function (a) {
                    if(a.key === 'dom-out'){
                        mainObject.dom.play('dom-talk');
                        setVisibleObjects(true, [ui.skip, ui.dialogGroup]);
                        dialog();
                    }
                });
                setTask(false);
            }, null, this);
        }
        if(index === 12){
            setTask(true);
            setTimeout(() => mainConfig.playerMovable = true, 20);
            moveToPoint('dom', display.centerW, display.centerH + 120);
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
            finishChapter({x: display.centerW, y: display.height + 180});
        }
    }
    else if(chapter === 1) {
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
                moveToPoint('player', mainObject.engineer.x + 60, mainObject.engineer.y + 20, true);
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
            mainConfig.pcRecordOn = true;
            setTask(true);
            ui.gameGroup.y = 600;
            ui.gameGroup.setVisible(true);
            scene.tweens.add({
                targets: ui.gameGroup,
                y: 0,
                duration: 2000,
                ease: Phaser.Math.Easing.Quintic.Out,
                onComplete: function () {
                    signalToggle(true);
                }
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
            repeat();
            function repeat() {
                if(status.chapterIdx !== 1) {
                    return;
                }
                moveToPoint('engineer', 288, 466, true);
                mainConfig.moveFinishedEvent.engineer = function () {
                    mainObject.engineer.play('engineer-type');
                    mainObject.engineer.setFlipX(true);
                    let n = setTimeout(function () {
                        if(status.chapterIdx !== 1) {
                            clearTimeout(n);
                            return;
                        }
                        moveToPoint('engineer', 104, 504, true);
                        mainConfig.moveFinishedEvent.engineer = function () {
                            mainObject.engineer.play('engineer-type');
                            mainObject.engineer.setFlipX(false);
                            setTimeout(function () {
                                repeat();
                            }, 2400 + Math.round(Math.random() * 8000));
                        };
                    }, 2400 + Math.round(Math.random() * 8000));
                };
            }
            moveEnable();
            finishChapter({x: display.centerW, y: display.height + 180});
        }
    }
    else if(chapter === 2) {
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
                moveToPoint('player', mainObject.man.x - 60, mainObject.man.y, true);
                moveToPoint('dom', mainObject.man.x + 40, mainObject.man.y - 20, true);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
                mainObject.man.play('man-talk');
            }, null, this);
        }
        else if (index === 6){
            mainObject.man.play('man-stand');
        }
        else if (index === 7){
            mainObject.man.play('man-talk');
        }
        else if (index === 12) {
            // 양건너기 시작
            sheepStanby(mainObject.sheeps[0]);
            mainObject.man.play('man-stand');
            mainObject.man.setFlipX(true);
            mainObject.player.setFlipX(true);
            ui.bridges.forEach(function (bridge) {
                bridge.setInteractive();
            });
            setTask(true);
            signalToggle(true);
            mainConfig.sheepRecordOn = true;
        }
        else if (index === 13){
            mainObject.player.setFlipX(false);
            mainObject.man.play('man-talk');
        }
        else if (index === 14){
            mainObject.man.play('man-stand');
        }
        else if (index === 15){
            mainObject.man.play('man-talk');
        }
        else if (index === 18){
            mainObject.man.play('man-stand');
            setTimeout(function () {
                setReward(true, mainConfig.reward[1]);
            }, 400);
        }
        else if (index === 19){
            mainObject.man.play('man-talk');
        }
        else if (index === 20){
            mainObject.man.setFlipX(true);
            mainObject.man.play('man-stand');
            mainConfig.lookAt.player = null;
            mainConfig.lookAt.dom = null;
            moveToPoint('player', mainConfig.bridgePos.start.x, mainConfig.bridgePos.start.y, true);
            moveToPoint('dom', mainConfig.bridgePos.start.x + 40, mainConfig.bridgePos.start.y, true);
            mainConfig.moveFinishedEvent.player = function () {
                let jumpCount = 0;
                let jumpCountDom = 0;
                playerJump();
                function playerJump() {
                    if(jumpCount === 1) DomJump();
                    jumpTo(mainObject.player, ui.bridges[mainConfig.bridgeAnswer[jumpCount]], function () {
                        if (jumpCount < 4) {
                            mainObject.player.play('player-stand');
                            jumpCount++;
                            playerJump();
                        }
                        else {
                            // 주인공 점프
                            jumpTo(mainObject.player, mainConfig.bridgePos.end, function (){
                                mainConfig.playerMovable = true;
                                mainObject.player.play('player-stand');
                                setTask(true);
                                finishChapter({x: display.centerW, y: display.height + 180});
                            })
                        }
                    })
                }
                function DomJump() {
                    jumpTo(mainObject.dom, ui.bridges[mainConfig.bridgeAnswer[jumpCountDom]], function () {
                        if (jumpCountDom < 4) {
                            mainObject.dom.play('dom-stand');
                            jumpCountDom++;
                            DomJump();
                        }
                        else {
                            jumpTo(mainObject.dom, {x: mainConfig.bridgePos.end.x -40, y: mainConfig.bridgePos.end.y}, function (){
                                mainConfig.domFollow = true;
                                mainObject.dom.play('dom-stand');
                            })
                        }
                    })
                }
            }
        }
    }
    else if(chapter === 3) {
        if (index === 2) {
            finishChapter({x: display.width + 60, y: display.height - 80}, 'right');
            setTask(true);
            moveEnable();
            let col = scene.physics.add.overlap(mainObject.player, ui.fishmanPlace, function () {
                col.active = false;
                setTask(false);
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.fishman;
                mainConfig.lookAt.dom = mainObject.fishman;
                moveToPoint('player', mainObject.fishman.x - 20, mainObject.fishman.y + 60, false);
                moveToPoint('dom', mainObject.fishman.x - 40, mainObject.fishman.y + 80, false);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
            }, null, this);
        }
        else if(index === 4){
            mainObject.dom.play('dom-talk');
        }
        else if(index === 5){
            mainObject.dom.play('dom-stand');
        }
        else if(index === 7){
            mainObject.fishman.play('fishman-talk');
        }
        else if(index === 8){
            setTask(true);
            ui.gameGroup.y = 600;
            ui.gameGroup.setVisible(true);
            scene.tweens.add({
                targets: ui.gameGroup,
                y: 0,
                duration: 2000,
                ease: Phaser.Math.Easing.Quintic.Out,
            });
        }
        else if(index === 10){
            mainObject.fishman.play('fishman-stand');
        }
        else if(index === 11){
            if(savedData.trace.fish === 0) savedData.trace.fish = 1;
            setTimeout(function () {
                setReward(true, mainConfig.reward[2]);
            }, 400);
        }
        else if(index === 12){
            mainObject.fishman.play('fishman-talk');
        }
        else if(index === 13){
            mainObject.fishman.play('fishman-stand');
            mainObject.dom.play('dom-talk');
        }
        else if(index === 14){
            setTask(true);
            moveEnable();
            let col = scene.physics.add.overlap(mainObject.player, mainObject.fishman, function () {
                col.active = false;
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.fishman;
                mainConfig.lookAt.dom = mainObject.fishman;
                moveToPoint('player', mainObject.fishman.x - 20, mainObject.fishman.y + 60, false);
                moveToPoint('dom', mainObject.fishman.x - 40, mainObject.fishman.y + 80, false);
                ui.gameGroup.y = 600;
                ui.gameGroup.setVisible(true);
                initFishing();
                scene.tweens.add({
                    targets: ui.gameGroup,
                    y: 0,
                    duration: 2000,
                    ease: Phaser.Math.Easing.Quintic.Out,
                });
            });
        }
        else if(index === 16){
            let fishReward = (mainConfig.retryFishing === 5)? 10 : 1 + mainConfig.retryFishing;
            setReward(true, fishReward);
            mainConfig.reward[2] += fishReward;
        }
        else if(index === 18){
            moveEnable();
            let col = scene.physics.add.overlap(mainObject.player, mainObject.fishman, function () {
                col.active = false;
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.fishman;
                mainConfig.lookAt.dom = mainObject.fishman;
                moveToPoint('player', mainObject.fishman.x - 20, mainObject.fishman.y + 60, false);
                moveToPoint('dom', mainObject.fishman.x - 40, mainObject.fishman.y + 80, false);
                if(mainConfig.retryFishing < 5){
                    ui.gameGroup.y = 600;
                    ui.gameGroup.setVisible(true);
                    initFishing();
                    scene.tweens.add({
                        targets: ui.gameGroup,
                        y: 0,
                        duration: 2000,
                        ease: Phaser.Math.Easing.Quintic.Out,
                    });
                }
                else {
                    if(!ui.dialogGroup.visible) {
                        ui.skip.setVisible(true);
                        ui.dialogGroup.setVisible(true);
                    }
                    dialog();
                }
            });
        }
        else if(index === 21){
            moveEnable();
            ui.task.text = '낚시는 이제 그만하고 모험을 계속하자';
        }
    }
    else if(chapter === 4) {
        if (index === 2) {
            mainObject.TitleEmitter.setVisible(false);
            mainObject.TitleEmitter.start();
            mainObject.TitleEmitter.setGravityX(20);
            mainObject.TitleEmitter.setGravityY(40);
            mainObject.TitleEmitter.setFrequency(200);
            mainObject.TitleEmitter.setLifespan(12000);
            setTask(true);
            moveEnable();
            let col = scene.physics.add.overlap(mainObject.player, ui.gamblePos, function () {
                col.active = false;
                setTask(false);
                mainObject.gambler.play('gambler-talk');
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.gambler;
                mainConfig.lookAt.dom = mainObject.gambler;
                moveToPoint('player', mainObject.player.x, mainObject.player.y - 20, false);
                moveToPoint('dom', mainObject.dom.x, mainObject.dom.y - 20, false);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
            }, null, this);
        }
        else if(index === 7) {
            setTask(true);
            finishChapter({x: display.centerW, y: display.height + 180});
            moveEnable();
            mainObject.gambler.play('gambler-stand');
            ui.gamblePos.body.setSize(60, 60).setOffset(72, -136);
            ui.gamblePos.setSize(60, 60).setOrigin(0.5);
            ui.gamblePos.setPosition(mainObject.gambler.x, mainObject.gambler.y);
            let col = scene.physics.add.overlap(mainObject.player, ui.gamblePos, function () {
                col.active = false;
                mainObject.gambler.play('gambler-talk');
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.gambler;
                mainConfig.lookAt.dom = mainObject.gambler;
                moveToPoint('player', mainObject.gambler.x + 60, mainObject.gambler.y + 20, false);
                moveToPoint('dom', mainObject.gambler.x + 80, mainObject.gambler.y + 40, false);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
                setTask(false);
            }, null, this);
        }
        else if(index === 9){
            mainObject.gambler.play('gambler-stand');
            mainObject.dom.play('dom-talk');
        }
        else if(index === 10) {
            mainObject.dom.play('dom-stand');
            gamble(true);
        }
        else if(index === 13){
            line.story[4][14] = "[몬티 홀]\n지금 갖고있는 씨앗이.. 음..\n모두 합쳐서 " + mainConfig.seedNum + "개 정도 되니까..\n두배면...와우!";
        }
        else if(index === 17) {
            // 겜블 시작
            signalToggle(true);
            ui.gambleHand.setVisible(true);
            mainConfig.startGamble = true;
            ui.gambler.play('gambler-stand');
            setTask(true);
        }
        else if(index === 19) {
            // 겜블 포기
            signalToggle(false);
            mainConfig.startGamble = false;
            ui.gambler.play('gambler-stand');
            setTask(false);
            gamble(false);
        }
        else if(index === 21){
            // 겜블 재시작
            gamble(true);
            mainObject.gambler.play('gambler-stand');
        }
        else if(index === 23){
            // 겜블 재시작
            signalToggle(true);
            ui.gambleHand.setVisible(true);
            mainConfig.startGamble = true;
            ui.gambler.play('gambler-stand');
            status.taskIdx = 2;
            setTask(true);
        }
        else if(index === 26){
            ui.gambler.play('gambler-talk');
            function openSheep(door) {
                ui.doorlist[door].play('door-hint-open');
                ui.doorlist[door].on('animationcomplete', function (a) {
                    if(a.key === 'door-hint-open'){
                        setTimeout(function () {
                            ui.gambleResult[door].setVisible(true);
                            if(!ui.dialogGroup.visible) {
                                ui.skip.setVisible(true);
                                ui.dialogGroup.setVisible(true);
                            }
                            dialog();
                        }, 400);
                    }
                });
            }
            // 다른패 보여주기
            if(mainConfig.gambleSelection === 0){
                mainConfig.gambleOpenHint = 2;
                openSheep(2);
            }
            else if(mainConfig.gambleSelection === 1){
                let open = (Math.random() > 0.5) ? 0 : 2;
                mainConfig.gambleOpenHint = open;
                openSheep(open);
            }
            else if(mainConfig.gambleSelection === 2){
                mainConfig.gambleOpenHint = 0;
                openSheep(0);
            }
        }
        else if(index === 31){
            mainConfig.startGamble = true;
            ui.gambler.play('gambler-stand');
        }
        else if(index === 34){
            ui.doorlist[mainConfig.gambleSelection].play('door-open');
            ui.doorlist[mainConfig.gambleSelection].on('animationcomplete', function (a) {
                setTimeout(function () {
                    // 몬티홀 완료
                    ui.gambleResult[mainConfig.gambleSelection].setVisible(true);
                    if(!ui.dialogGroup.visible) {
                        ui.skip.setVisible(true);
                        ui.dialogGroup.setVisible(true);
                    }
                    ui.gambler.play('gambler-talk');
                    dialog();
                }, 400);
            });
        }
        else if(index === 37){
            ui.gambler.play('gambler-stand');
            mainConfig.clear[3] = true;
            setTimeout(function (){
                scene.tweens.add({
                    targets: ui.gameGroup,
                    y: -860,
                    duration: 2000,
                    ease: Phaser.Math.Easing.Quintic.In,
                    onComplete: function () {
                        if(mainConfig.gambleSelection === 1){
                            setReward(true, mainConfig.seedNum);
                            mainConfig.reward[3] = mainConfig.seedNum;
                        }
                        else {
                            let count = Math.floor(mainConfig.seedNum * 0.5);
                            setTimeout(() => ui.skip.setVisible(true), 400);
                            ui.rewardGroup.setVisible(true);
                            ui.rewardMsg.text = '씨앗을 ' + count + '개 잃었다!'
                            mainConfig.seedNum -= count;
                            mainConfig.reward[3] = -count;
                            savedData.seed[3] = mainConfig.reward[3];
                            writeUserData();
                        }
                    }
                })
            }, 200);
        }
        else if(index === 39){
            setTask(true);
            mainObject.gambler.play('gambler-show');
            moveEnable();
        }
        function gamble(start) {
            if(start){
                ui.gameGroup.y = 600;
                ui.gameGroup.setVisible(true);
                scene.tweens.add({
                    targets: ui.gameGroup,
                    y: 0,
                    duration: 2000,
                    ease: Phaser.Math.Easing.Quintic.Out,
                    onComplete: function () {
                        ui.skip.setVisible(true);
                        ui.dialogGroup.setVisible(true);
                        dialog();
                        ui.gambler.play('gambler-talk');
                    }
                });
            }
            else {
                setTimeout(function (){
                    scene.tweens.add({
                        targets: ui.gameGroup,
                        y: -860,
                        duration: 2000,
                        ease: Phaser.Math.Easing.Quintic.In,
                        onComplete: function () {
                            if(mainConfig.clear[3]){
                                status.index = 20;
                                dialog();
                            }
                            else {
                                ui.gambleHand.setVisible(false);
                                moveEnable();
                                let col = scene.physics.add.overlap(mainObject.player, ui.gamblePos, function () {
                                    col.active = false;
                                    mainObject.gambler.play('gambler-talk');
                                    mainConfig.playerMovable = false;
                                    mainConfig.domFollow = false;
                                    mainConfig.lookAt.player = mainObject.gambler;
                                    mainConfig.lookAt.dom = mainObject.gambler;
                                    moveToPoint('player', mainObject.gambler.x + 60, mainObject.gambler.y + 20, false);
                                    moveToPoint('dom', mainObject.gambler.x + 80, mainObject.gambler.y + 40, false);
                                    if(!ui.dialogGroup.visible) {
                                        ui.skip.setVisible(true);
                                        ui.dialogGroup.setVisible(true);
                                    }
                                    dialog();
                                    setTask(false);
                                }, null, this);
                            }
                            ui.gambler.play('gambler-stand');
                            status.taskIdx = 3;
                            setTask(true);
                        }
                    });
                }, 200);
            }
        }
    }
    else if(chapter === 5) {
        if(index === 2){
            const newline = [
                ["[돔]\n어때? 나무 그늘이 있으니 살 것 같지?", "[그늘에 들어가 몸을 회복한다]",],
                ["[돔]\n음..간신히 열기는 막을 수 있겠네.", "[그늘에 들어가 한 숨 돌린다]",],
            ]
            const newPos = [
                {
                    player: {x: display.centerW + 40, y: display.centerH + 90},
                    dom: {x: display.centerW - 40, y: display.centerH + 90},
                },
                {
                    player: {x: display.centerW + 30, y: display.centerH + 70},
                    dom: {x: display.centerW - 30, y: display.centerH + 70},
                },
                {
                    player: {x: display.centerW + 16, y: display.centerH + 50},
                    dom: {x: display.centerW - 16, y: display.centerH + 50},
                },
            ]
            if(mainConfig.gameResult === 1) {
                line.story[5][3] = newline[0][0];
                line.story[5][4] = newline[0][1];
            }
            else if(mainConfig.gameResult === 2) {
                line.story[5][3] = newline[1][0];
                line.story[5][4] = newline[1][1];
            }

            moveEnable();
            let treeCol = scene.add.rectangle(display.centerW, display.centerH + 80, display.width, 40, 0x000000).setVisible(false);
            scene.physics.add.existing(treeCol);
            let col = scene.physics.add.overlap(mainObject.player, treeCol, function () {
                treeCol.destroy();
                col.active = false;
                mainConfig.playerMovable = false;
                mainConfig.domFollow = false;
                mainConfig.lookAt.player = mainObject.dom;
                mainConfig.lookAt.dom = mainObject.player;
                moveToPoint('player', newPos[mainConfig.gameResult].player.x, newPos[mainConfig.gameResult].player.y, true);
                moveToPoint('dom', newPos[mainConfig.gameResult].dom.x, newPos[mainConfig.gameResult].dom.y, true);
                if(!ui.dialogGroup.visible) {
                    ui.skip.setVisible(true);
                    ui.dialogGroup.setVisible(true);
                }
                dialog();
                mainConfig.moveFinishedEvent.dom = function () {
                    mainObject.dom.play('dom-talk');
                }
            }, null, this);
        }
        else if(index === 4){
            mainObject.dom.play('dom-stand');
        }
        else if(index === 5){
            mainObject.dom.play('dom-talk');
        }
        else if(index === 8){
            mainObject.dom.play('dom-stand');
        }
        else if(index === 9){
            mainObject.dom.play('dom-talk');
        }
        else if(index === 11){
            setTimeout(function () {
                mainObject.dom.play('dom-stand');
                mainObject.player.play('player-stand');
                mainConfig.playerMovable = true;
                mainConfig.domFollow = false;
            }, 0);
            let seed = scene.add.rectangle(0,0,16, 16, 0x000000).setVisible(false);
            scene.physics.add.existing(seed);
            seedColect();
            function seedColect() {
                seed.setPosition(display.centerW + getRandomInt(160), display.height + 16 - Math.round(Math.random() * 340));
                let seedCol = scene.physics.add.overlap(mainObject.player, seed, function () {
                    if(mainConfig.forestSeed > 0){
                        seedCol.active = false;
                        mainConfig.forestSeed--;
                        seedDrop();
                        seedColect();
                    }
                }, null, this);
            }
            function seedDrop() {
                status.index = 11;
                moveToPoint('player', mainObject.player.x, mainObject.player.y, true);
                let seedNum = Math.ceil(Math.random() * 3);
                setTimeout(() => ui.skip.setVisible(true), 400);
                ui.rewardGroup.setVisible(true);
                ui.rewardMsg.text = '씨앗을 ' + seedNum + '개 발견했다!'
                mainConfig.seedNum += seedNum;
                savedData.totalseed = mainConfig.seedNum;
                for (let i = 0; i < mainConfig.reward.length; i++) {
                    savedData.seed[i] = mainConfig.reward[i];
                }
                writeUserData();
            }
            setTimeout(function () {
                let col = scene.physics.add.overlap(mainObject.player, mainObject.dom, function () {
                    col.active = false;
                    mainConfig.playerMovable = false;
                    mainConfig.domFollow = false;
                    mainConfig.lookAt.player = mainObject.dom;
                    mainConfig.lookAt.dom = mainObject.player;
                    moveToPoint('player', mainObject.dom.x + 40, mainObject.dom.y, true);
                    if(!ui.dialogGroup.visible) {
                        ui.skip.setVisible(true);
                        ui.dialogGroup.setVisible(true);
                    }
                    dialog();
                    mainObject.dom.play('dom-talk');
                }, null, this);
            }, 2000);
        }
        else if(index === 14){
            mainConfig.clear[4] = true;
            donateSeed();
            writeUserData();
            let light = scene.add.rectangle(0,0, display.width, display.height, 0xffffff).setOrigin(0).setAlpha(0);
            ui.group.add(light);
            mainObject.dom.play('dom-power0');
            mainObject.dom.setOrigin(0.4, 1);
            scene.tweens.add({
                targets: light,
                alpha: 1,
                duration: 8000,
                else: Phaser.Math.Easing.Quintic.In,
                onUpdate : function (value) {
                    let percent = Math.round(value.getValue() * 100);
                    if(percent === 30) mainObject.dom.play('dom-power1');
                    else if(percent === 60) mainObject.dom.play('dom-power2');
                },
                onComplete: function () {
                    let endlight = scene.add.rectangle(0,0, display.width, display.height, 0xffffff).setOrigin(0).setAlpha(1);
                    ui.endingGroup.add(endlight);
                    ui.endingGroup.setVisible(true);
                    scene.tweens.add({
                        targets: endlight,
                        alpha: 0,
                        duration: 4000,
                        else: Phaser.Math.Easing.Quintic.Out,
                        onComplete: function () {
                            status.scene = 'ending';
                            ui.skip.setVisible(true);
                        }
                    });
                }
            });
            function zoom() {
                ui.skip.disableInteractive();
                ui.cam.zoom = 1;
                setTimeout(function () {
                    ui.cam.pan(display.centerW, mainObject.player.y, 6000, Phaser.Math.Easing.Quintic.In, true);
                    ui.cam.zoomTo(4, 6000, Phaser.Math.Easing.Quintic.In);
                    ui.cam.on(Phaser.Cameras.Scene2D.Events.ZOOM_COMPLETE, () => {
                        ui.dialogGroup.setVisible(true);
                        dialog();
                        ui.skip.setInteractive();
                    });
                }, 400);
            }
        }
    }
}
function initFishing() {
    let retry = mainConfig.retryFishing + 1;
    mainConfig.fishingBarSize = 40 - (retry * 6);
    if(retry === 5) line.story[3][17] = "[강태공]\n정말 대단합니다.. 받아주십시오...\n이제는 물고기가.. 잡히지 않을 것..\n같습니다...";
    ui.fishingBar.setSize(42, mainConfig.fishingBarSize * 3);
    ui.fishingBar.body.setSize(42, mainConfig.fishingBarSize * 3);
    ui.fishingPlayer.play('fishing-wait');
    ui.fishingCastBoxB.setTexture('ui', 'power1').setOrigin(0.5);
    ui.fishingFloat.setTexture('ui', 'float').setOrigin(0.5);
    mainConfig.fishingDone = false;
    mainConfig.fishingRodOn = false;
    mainConfig.fishingNow = false;
}
function finishChapter(pos, dir = 'down') {
    let scene = game.scene.scenes[0];
    if(dir === 'down'){
        ui.next.play('next').setPosition(display.centerW - 60, display.height - 10)
            .setSize(display.width, 20).setScale(2).setOffset(-60, 30).setVisible(false);

    }
    else if(dir === 'right'){
        ui.next.play('next-right').setPosition(display.width - 100, display.height - 32)
            .setSize(48, 80).setScale(2).setOffset(0, 0).setVisible(false);
    }
    ui.next.setVisible(true);
    let col = scene.physics.add.overlap(mainObject.player, ui.next, function () {
        setTask(false);
        status.chapterIdx++;
        col.active = false;
        mainConfig.domFollow = false;
        ui.dark.setVisible(true).setAlpha(0);
        moveToPoint('player', pos.x, pos.y, false);
        moveToPoint('dom', pos.x, pos.y, false);
        scene.tweens.add({
            targets: ui.dark,
            alpha: 1,
            duration: 2000,
            onComplete: () => chapterTitle(mainConfig.debugMode)
        });
    });
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
    let value;
    for(value in mainConfig.lookAt){
        if(mainConfig.lookAt[value] !== null) {
            mainObject[value].setFlipX(mainObject[value].x - mainConfig.lookAt[value].x > 0);
        }
    }
}
function setBackground(idx) {
    if(idx === 5) {
        // TODO 결과 배경
        if(mainConfig.seedNum <= 15) mainConfig.gameResult = 2;
        else if(15 < mainConfig.seedNum && mainConfig.seedNum < 40) mainConfig.gameResult = 1;
        else if(mainConfig.seedNum > 40) mainConfig.gameResult = 0;
        ui.bg.play('bg5-' + mainConfig.gameResult);
        if(mainConfig.gameResult === 0){
            let scene = game.scene.scenes[0];
            object.treeObj = [];
            object.treeObj[0] = scene.add.sprite(0, 0, 'obj', 'tree-bg0').setOrigin(0).setScale(2);
            object.treeObj[1] = scene.add.sprite(display.width, 0, 'obj', 'tree-bg1').setOrigin(1, 0).setScale(2);
            object.treeGroup.add(object.treeObj);
        }
        else if(mainConfig.gameResult === 1) {
            let scene = game.scene.scenes[0];
            object.treeObj = [];
            object.treeObj[0] = scene.add.sprite(0, 298, 'obj', 'tree-obj0').setOrigin(0, 1).setScale(2);
            object.treeObj[1] = scene.add.sprite(126 * 2, 79 * 2 + 58, 'obj', 'tree-obj0').setOrigin(0, 1).setScale(2);
            object.treeObj[2] = scene.add.sprite(29 * 2, 46 * 2 + 58, 'obj', 'tree-obj0').setOrigin(0, 1).setScale(2);
            object.treeObj[3] = scene.add.sprite(119 * 2, 78, 'obj', 'tree-obj0').setOrigin(0, 1).setScale(2);

            object.treeObj[4] = scene.add.sprite(90, 74, 'obj', 'tree-obj1').setOrigin(0, 1).setScale(2);
            object.treeObj[5] = scene.add.sprite(232, 142, 'obj', 'tree-obj1').setOrigin(0, 1).setScale(2);
            mainObject.group.add(object.treeObj);
        }
    }
    else {
        ui.bg.play('bg' + idx);
    }
}
// TODO 씬 제어
function chapterTitle(skip) {
    ui.background.setVisible(true);
    ui.dark.setVisible(false);
    if(skip) {
        // 디버그 씬 스킵
        if(mainConfig.debugMode) {
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
        ui.next.setVisible(false);
        ui.background.setVisible(false);
        ui.dark.setVisible(true);
        let scene = game.scene.scenes[0];
        setGameScenes();
        mainConfig.titleFadeOut = null;
        status.scene = 'chapter';
        status.index = 0;
        status.taskIdx = 0;
        game.scene.scenes[0].tweens.add({
            targets: ui.dark,
            alpha: 0,
            duration: 1200,
            onComplete: () => ui.dark.setVisible(false)
        });
        ui.largeText.setVisible(false);
        setBackground(chapterIdx);
        if(chapterIdx === 0){
            setVisibleObjects(true, [object.list[0], object.list[1], object.list[2], ui.smoke]);
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
            maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[1], 12.5);
            setVisibleObjects(false, [object.list[0], object.list[1], object.list[2], ui.smoke]);
            setVisibleObjects(true, [object.list[3], object.list[4]]);
            mainObject.particles.setVisible(false);
            mainObject.engineer.setVisible(true);
            mainObject.player.x = -16;
            mainObject.player.y = 200;
            mainObject.dom.x = -64;
            mainObject.dom.y = 220;

            moveToPoint('player', display.centerW + 30, 200, false);
            moveToPoint('dom', display.centerW - 30, 200, false);
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
            setVisibleObjects(false, [ui.skip, mainObject.engineer, object.list[3], object.list[4]]);
            setVisibleObjects(true, [ui.bridge, mainObject.man]);
            for (let i = 0; i < mainObject.sheeps.length; i++) {
                mainObject.sheeps[i].setVisible(true);
            }
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

            for (let i = 0; i < mainObject.sheeps.length; i++) {
                let sheep = mainObject.sheeps[i];
                mainConfig.sheepBlinkTimer[i] = setTimeout(function () {
                    if(sheep.anims.currentAnim.key === 'sheep-stand') sheep.play('sheep-talk');
                }, Math.round(Math.random() * 2400));
            }
            for (let i = 0; i < mainObject.sheeps.length; i++) {
                let sheep = mainObject.sheeps[i];
                sheep.on('animationcomplete', function () {
                    if(sheep.anims.currentAnim.key === 'sheep-talk') {
                        sheep.play('sheep-stand');
                        sheepTalk(i ,sheep);
                    }
                });
            }
        }
        else if(chapterIdx === 3){
            maps.navMesh.destroy();
            setVisibleObjects(false, mainObject.sheeps);
            setVisibleObjects(false, [ui.skip, ui.bridge, mainObject.man]);
            setVisibleObjects(true, [mainObject.fishman, object.list[5], object.list[6]]);
            maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[3], 12.5);
            mainObject.player.x = display.width + 40;
            mainObject.dom.x = display.width + 120;
            mainObject.player.y = mainObject.dom.y = 80;
            moveToPoint('player', 240, 100, false);
            moveToPoint('dom', 280, 100, false);
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
        else if(chapterIdx === 4){
            maps.navMesh.destroy();
            setVisibleObjects(false, [ui.skip, mainObject.fishman, object.list[5], object.list[6]]);
            setVisibleObjects(true, [mainObject.gambler, object.list[7], object.list[8]]);
            ui.fishingGroup.destroy();
            ui.fishingCastGroup.destroy();
            mainObject.fishman.destroy();
            maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[4], 12.5);
            mainObject.player.x = -40;
            mainObject.dom.x = -120;
            mainObject.player.y = mainObject.dom.y = 80;
            moveToPoint('player', 120, 100, false);
            moveToPoint('dom', 80, 100, false);
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
        else if(chapterIdx === 5){
            mainObject.TitleEmitter.setVisible(true);
            if(mainConfig.debugMode){
                mainObject.TitleEmitter.start();
                mainObject.TitleEmitter.setGravityX(20);
                mainObject.TitleEmitter.setGravityY(40);
                mainObject.TitleEmitter.setFrequency(200);
                mainObject.TitleEmitter.setLifespan(12000);
            }

            mainObject.titlezone.x = -450;
            mainObject.titlezone.y = -320;
            mainObject.titlezone.height = 200;
            setResult(mainConfig.gameResult);
            function setResult(seed) {
                object.list[9].setTexture('obj', 'tree-bottom' + seed).setScale(2).setOrigin(0, 1);
                object.tree.setTexture('obj', 'tree-top' + seed).setScale(2).setOrigin(0);
                object.treeshade.setTexture('obj', 'tree-shade' + seed).setScale(2).setOrigin(0);
                if(seed === 0){
                    object.list[9].setPosition(158, 402);
                    object.tree.setPosition(82, 150);
                    object.treeshade.setPosition(88, 366);
                }
                else if(seed === 1) {
                    object.list[9].setPosition(158, 400);
                    object.tree.setPosition(122, 232);
                    object.treeshade.setPosition(120, 364);
                }
                else if(seed === 2){
                    object.list[9].setPosition(168, 386);
                    object.tree.setPosition(132, 282);
                    object.treeshade.setPosition(150, 370);
                }
            }

            maps.navMesh.destroy();
            setVisibleObjects(false, [ui.skip, mainObject.gambler, object.list[7], object.list[8]]);
            setVisibleObjects(true, [object.tree, object.treeshade, object.list[9]]);
            mainObject.gambler.destroy();
            ui.gamblePos.destroy();
            maps.navMesh = scene.navMeshPlugin.buildMeshFromTiled("mesh", maps.objectLayer[5], 12.5);
            mainObject.player.x = display.centerW + 20;
            mainObject.dom.x = display.centerW - 20;
            mainObject.player.y = mainObject.dom.y = -80;
            moveToPoint('player', display.centerW + 20, 100, false);
            moveToPoint('dom', display.centerW - 20, 100, false);
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
        for (let i = 0; i < mainConfig.clear.length; i++) {
            savedData.clear[i] = mainConfig.clear[i];
        }
        writeUserData();
    }
}
function setEndingData(total) {
    // 당신이 컴퓨터를 정지한 방법
    // 당신이 구한 한 양의 수
    // 당신이 낚은 물고기의 수
    // 당신이 시공간을 감지한 횟수
    // 당신이 기부한 씨앗의 수
    // 시공간을 넘어 모인 씨앗의 수

    mainConfig.endingData[0] = savedData.trace.engineer.how;
    mainConfig.endingData[1] = savedData.trace.sheep.sheep;
    mainConfig.endingData[2] = savedData.trace.fish;
    mainConfig.endingData[3] = savedData.detectCount;
    mainConfig.endingData[4] = savedData.totalseed;
    mainConfig.endingData[5] = total;

    ui.logText[0].text = mainConfig.endingData[0];
}

// TODO 통신 제어
const firebaseConfig = {
    apiKey: "AIzaSyC3DxEONfmGK_m2KXrc1kPxr8Tb-PPD2so",
    authDomain: "shadeofmyzy.firebaseapp.com",
    databaseURL: "https://shadeofmyzy-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "shadeofmyzy",
    storageBucket: "shadeofmyzy.appspot.com",
    messagingSenderId: "998415412293",
    appId: "1:998415412293:web:0fa07ed86e1636949b072c",
    measurementId: "G-C36EW7DTRY"
};

const serverData = {
    uid: null,
    engineer: null,
    sheep: null,
    gambler: null
};
function getCurrentDate()
{
    var date = new Date();
    var year = date.getFullYear().toString();
    var month = date.getMonth() + 1;
    month = month < 10 ? '0' + month.toString() : month.toString();
    var day = date.getDate();
    day = day < 10 ? '0' + day.toString() : day.toString();
    var hour = date.getHours();
    hour = hour < 10 ? '0' + hour.toString() : hour.toString();
    var minites = date.getMinutes();
    minites = minites < 10 ? '0' + minites.toString() : minites.toString();
    var seconds = date.getSeconds();
    seconds = seconds < 10 ? '0' + seconds.toString() : seconds.toString();
    return year + month + day + hour + minites + seconds;
}

const savedData = {
    index: null,
    totalseed: 0,
    detectCount: 0,
    seed : [],
    clear: [],
    trace: {
        engineer: {how: null, path: []},
        sheep: {sheep: 0, path: []},
        fish: 0,
        gambler: []
    },
    time : null
}

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

import { getDatabase, ref, set, get, child, runTransaction, onValue, query, orderByChild, orderByKey, limitToLast, equalTo } from "firebase/database";

import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
const auth = getAuth();
signInAnonymously(auth).catch((error) => {
        console.log(error.code);
        console.log(error.message);
    });
onAuthStateChanged(auth, (user) => {
    if (user) {
        serverData.uid = user.uid;
        toggleCounter();
    } else {
    }
});
function writeUserData() {
    if(!serverData.uid) return;
    if(!savedData.index){
        initUserData(null);
        return;
    }
    const db = getDatabase();
    savedData.time = getCurrentDate();
    set(ref(db, 'users/' + serverData.uid), savedData);
}
function initUserData(value) {
    const dbRef = ref(getDatabase());
    get(child(dbRef, 'users/' + serverData.uid + '/index')).then((snapshot) => {
        if (snapshot.exists()) {
            savedData.index = snapshot.val();
        }
        else {
            savedData.index = value;
        }
    }).then(function () {
        writeUserData();
    });
}
function readTotalSeed() {
    const db = getDatabase();
    let seedRef = query(ref(db, 'seed'));
    get(seedRef).then((snapshot) => {
        if (snapshot.exists()) {
            setEndingData(snapshot.val());
        }
    });
}
function readData(level) {
    mainConfig.signalReadCount++;
    if(mainConfig.signalReadCount > 20){
        // 20번 시도에도 없으면 리턴
        mainConfig.signalReadCount = 0;
        ui.signalBtn.setInteractive();
        return;
    }
    let r = 0;
    const db = getDatabase();
    if(level === 'engineer' || level === 'sheep'){
        const dbRef = ref(getDatabase());
        get(child(dbRef, 'userCount/users')).then((snapshot) => {
            if (snapshot.exists()) {
                r = Math.round(Math.random() * snapshot.val());
            }
        }).then(() =>{
            const traceRef = query(ref(db, 'users/'), orderByChild('index'), equalTo(r));
            get(traceRef).then((snapshot) => {
                if (snapshot.exists()) {
                    snapshot.forEach(data => {
                        const key = data.key;
                        const value = data.val();
                        if(value.trace){
                            if(value.trace[level]) serverData[level] = value.trace[level];
                        }
                    })
                }
            }).then(() => {
                if(serverData[level]) {
                    checkSignal(serverData[level].path);
                }
                else {
                    readData(level);
                }
            })
        });
    }
    else if(level === 'gambler'){
        let selection = [];
        let total = 0;
        let gamblerRef = query(ref(db, 'gambler/'));
        get(gamblerRef, 'gambler/').then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((value) => {
                    selection.push(value.val());
                    total += value.val();
                })
            }
        }).then(()=>{
           let percent = [];
            for (let i = 0; i < 3; i++) {
                percent[i] = Math.round(selection[i] / total * 100);
                if(percent[i] < 10) ui.signalGambler[i].x = ui.doorlist[i].x + 86
                else ui.signalGambler[i].x = ui.doorlist[i].x + 96
            }
            ui.signalGamblerGroup.setVisible(true);
            percentUp();
            function percentUp() {
                for (let i = 0; i < 3; i++) {
                    mainConfig.signalGambleTween[i] = game.scene.scenes[0].tweens.addCounter({
                        from: 0,
                        to: percent[i],
                        ease: Phaser.Math.Easing.Quartic.Out,
                        duration: 1600,
                        repeat: 0,
                        onUpdate: function (tween)
                        {
                            let value = Math.round(tween.getValue());
                            ui.signalGambler[i].text = value + '%';
                        },
                        onComplete: function () {
                            mainConfig.signalGambleTween[i] = null;
                        }
                    });
                }
            }
        });
    }
}

function toggleCounter() {
    const db = getDatabase();
    const viewRef = ref(db, 'userCount/views');
    const userRef = ref(db, 'userCount/users');
    const uidRef = query(ref(db, 'users/'), orderByKey(), equalTo(serverData.uid));

    runTransaction(viewRef, (post) => {
        return post + 1;
    });
    onValue(uidRef, (snapshot) => {
        if(!snapshot.val()){
            runTransaction(userRef, (post) => {
                return post + 1;
            }).then((value) => {
                initUserData(value.snapshot.val());
            });
        }
    }, {
        onlyOnce: true
    });
}
function donateSeed() {
    const db = getDatabase();
    const uidRef = query(ref(db, 'users/'), orderByKey(), equalTo(serverData.uid));
    const seedRef = query(ref(db, 'seed'));

    onValue(uidRef, (snapshot) => {
        if(snapshot.val()){
            runTransaction(seedRef, (post) => {
                return post + mainConfig.seedNum;
            }).then(()=>{
                readTotalSeed();
            });
        }
    }, {
        onlyOnce: true
    });
}

function gambleCounter(idx) {
    const db = getDatabase();
    const gambleRef = ref(db, 'gambler/' + idx);
    runTransaction(gambleRef, (post) => {
        return post + 1;
    });
}
