// const FontFaceObserver = require('fontfaceobserver');
console.log("%c@ MYZY.SPACE 2021 POWERED BY MYZY_", "color: #00ff00; font-weight: 900; font-size: 1em; background-color: black; padding: 1rem");

let font = new FontFaceObserver('dgm');
font.load().then(function () {
    //console.log('font' ,font.family , 'loaded');
});

const display = {width : 360, height: 680, centerW : 180, centerH: 340 };
function device(){
    let varUA = navigator.userAgent.toLowerCase(); //userAgent 값 얻기

    if ( varUA.indexOf('android') > -1) {
        return "안드로이드";
    } else if ( varUA.indexOf("iphone") > -1||varUA.indexOf("ipad") > -1||varUA.indexOf("ipod") > -1 ) {
        return "아이폰";
    } else if ( varUA.indexOf("mac") > -1) {
        return "맥";
    } else if ( varUA.indexOf("windows") > -1) {
        return "컴퓨터";
    } else {
        return "기계";
    }
}

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
const fontConfig = {font: '32px "dgm"', color: '#fff'};
const game = new Phaser.Game(config);
// TODO: 게임 상태 매니저
let gameStatus = {
    Chapter: 'load',
    ChapterNum: 0,
    Index: 0,
    get chapter(){
        return this.Chapter;
    },
    set chapter(value) {
        this.Chapter = value;
        if(value === 'story') story();
        else if(value.split("-")[0] === 'chapter') {
            this.ChapterNum = Number(value.split("-")[1]);
            chapter(this.ChapterNum);
        }
        myLog.text = this.Chapter + "-" + this.Index;
    },
    get idx(){
        return this.Index;
    },
    set idx(value) {
        this.Index = value;
        myLog.text = this.Chapter + "-" + this.Index;
        if(this.chapter === 'story'){
            if(this.idx >= line.story[0].length) {
                this.chapter = 'chapter-1';
                this.idx = 0;
                ui.skip.disableInteractive().setVisible(false);
            }
        }
    },
    get chapterNum(){
        return this.ChapterNum;
    }
};
// TODO 변수
let myLog = {text: null};
const bodyConfig = {};
const following = {
    Start: false,
    Distance: 0,
    isMoving: false,
    get start(){
        return this.Start;
    },
    set start(value){
        this.Start = value;
    },
    get distance(){
        return this.Distance;
    },
    set distance(value){
        this.Distance = value;
    }
}
const mainConfig = {skip: 0, taskIndex: 0, isPlayerMovable: false, look: null, path: null, pathDom: null, pathCount: 0, pathcountDom: 0};
const mainObject = {};
const otherObject = {};
const charMovePos = {player: {x: 0, y: 0}, dom: {x: 0, y:0}};
const line = { story: [], chapter: [], task: [] };
const ui = {};
const timer = { shaker: null };

// TODO: * 프리로드
function preload () {
    // Data
    this.load.json('line', 'data/line.json');

    // UI
    this.load.spritesheet('bg', 'image/bg.png', { frameWidth: 180, frameHeight: 340, endFrame: 1 });
    this.load.spritesheet('ui-go-down', 'image/ui-go-down.png', { frameWidth: 37, frameHeight: 30, endFrame: 1 });
    // maps
    this.load.image('talkbox', 'image/talkbox.png');
    this.load.image('building', 'image/building.png');

    // tile map
    this.load.tilemapTiledJSON("map", "map/maps.json");
    this.load.image("tileset", "map/tileset.png");

    // character animation
    this.load.spritesheet('player', 'image/player.png', { frameWidth: 32, frameHeight: 32, endFrame: 8 });

    this.load.spritesheet('dom-stand', 'image/dom-stand.png', { frameWidth: 16, frameHeight: 16, endFrame: 1 });
    this.load.spritesheet('dom-run', 'image/dom-run.png', { frameWidth: 16, frameHeight: 16, endFrame: 1 });

    this.load.spritesheet('cowboy', 'image/cowboy-stand.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });

    // another animation
    this.load.spritesheet('blink', 'image/blink.png', { frameWidth: 16, frameHeight: 16, endFrame: 1 });

    // plugins
    this.load.plugin('rexninepatchplugin', 'rexninepatchplugin.min.js', true);

}
function create () {
    mainConfig.graphicsDom = this.add.graphics();
    mainConfig.graphics = this.add.graphics();
    mainConfig.graphics.lineStyle(1, 0x0000ff, 1);

    mainObject.tile = this.add.container();
    mainObject.tilemap = this.add.tilemap("map");
    const tileset = mainObject.tilemap.addTilesetImage("colortile", "tileset");
    const wallLayer = mainObject.tilemap.createLayer("walls", tileset).setCollisionByProperty({ collides: true }).setAlpha(0.5);
    const objectLayer = mainObject.tilemap.getObjectLayer("navmesh");
    mainConfig.navMesh = this.navMeshPlugin.buildMeshFromTiled("mesh", objectLayer, 12.5);
    mainObject.tile.add([mainConfig.graphics, mainConfig.graphicsDom])

    this.input.on("pointerdown", pointer => {
        mainConfig.graphics.clear();
        const p2 = { x: pointer.x, y: pointer.y };
        mainConfig.path = mainConfig.navMesh.findPath(mainObject.player, p2);
        if(mainConfig.path === null) {
            return;
        }
        var line = new Phaser.Curves.Path(mainObject.player.x, mainObject.player.y);
        for (var i = 0; i < mainConfig.path.length; i++)
        {
            line.lineTo(mainConfig.path[i].x, mainConfig.path[i].y);
        }
        line.draw(mainConfig.graphics);
    });

    gameStatus.chapter = 'main';
    gameStatus.idx = 0;

    // TODO: 로그 및 디버그
    const LogContainer = this.add.container(0, 0).setVisible(false);
    myLog = this.add.text(6, 2, 'main-0', fontConfig).setFontSize(16);
    const myLogBox = this.add.rectangle(display.centerW, 8, display.width, 24, 0xff0000, 1);
    LogContainer.add([myLogBox, myLog, wallLayer]);
    this.physics.world.drawDebug = false;
    this.input.keyboard.addKey('TAB').on('down', function(event) {
        if(!LogContainer.visible){
            LogContainer.setVisible(true);
            game.scene.scenes[0].physics.world.drawDebug = true;
        }
        else {
            LogContainer.setVisible(false);
            game.config.physics.arcade.drawDebug = true;
            game.scene.scenes[0].physics.world.drawDebug = false;
            game.scene.scenes[0].physics.world.debugGraphic.clear();
        }
    });
    this.input.keyboard.addKey('Q').on('down', function(event) {
        mainConfig.isPlayerMovable = !mainConfig.isPlayerMovable;
    })
    this.input.keyboard.addKey(49).on('down', function(event) {
        mainConfig.skip = 1;
        console.log('SKIP TO' ,1);
    })
    this.input.keyboard.addKey(50).on('down', function(event) {
        mainConfig.skip = 2;
        console.log('SKIP TO' ,2);
    })
    // 키코드 디버그 window.addEventListener("keydown", function (event) { console.log(event); })

    // TODO 터치 포인터 위치 리턴
    this.input.on('pointerup', function (pointer)
    {
        if(mainConfig.isPlayerMovable === true) {
            if(mainConfig.path === null){
                mainConfig.pathCount = 0;
                mainConfig.path = [{x: mainObject.player.x, y: mainObject.player.y}];
            }
            else {
                mainConfig.pathCount = 1;
            }
            characterMove(mainObject.player, mainConfig.path[mainConfig.pathCount], 160);
            if(following.start) following.isMoving = true;
        }
    }, this);

    // TODO: JSON LINES TO ARRAY
    let lineJson = this.cache.json.get('line');
    for (let l = 0; l < lineJson.chapter.length; l++) {
        line.chapter.push(lineJson.chapter[l]);
    }
    for (let c = 0; c < lineJson.task.length; c++) {
        line.task.push(lineJson.task[c]);
    }
    // line Json 첫번째 배열: 챕터별 라인, 두번째 배열: 라인 당 개별 대사
    line.story = lineJson.line.story;
    console.log(line);

    ui.startgame = this.add.text(0, 0, 'SHADE OF MYZY\nSTART', fontConfig).setAlign('center');
    InitObject(ui.startgame, display.centerW, display.centerH, 0.5, false);

    // TODO: 스토리 시작 메인 텍스트 설정
    ui.mainText = this.add.text(0, 0, line.story[0][0], fontConfig).setVisible(false).setAlign('center');
    InitObject(ui.mainText, display.centerW, display.centerH, 0.5,true);

    // TODO: 전체화면 스킵 오브젝트
    ui.skip = this.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x00ff00, 0).setVisible(true);
    ui.skip.setInteractive().setVisible(true);
    ui.skip.on('pointerup', function () {
        if(gameStatus.chapter === 'main'){
            if(mainConfig.skip !== 0){
                mainConfig.isSkipped = true;
                gameStatus.chapter = 'chapter-' + mainConfig.skip.toString();
                gameStatus.idx = 0;
                ui.skip.disableInteractive().setVisible(false);
                ui.startgame.setVisible(false);
                this.setVisible(false);
                return;
            }
            this.setVisible(false);
            game.scene.scenes[0].tweens.add({
                targets: ui.startgame,
                alpha: 0,
                duration: 1200,
                onComplete: () => {
                    gameStatus.chapter = 'story';
                    this.setVisible(true);
                }
            });
            return;
        }
        gameStatus.idx++;
        ui.mainText.text = line.story[0][gameStatus.idx];
        ShakeObject(ui.mainText, 20, 20, 240);
    });
    // TODO: 챕터 타이틀 텍스트 설정
    ui.chapterText = this.add.text(0, 0, line.chapter[0], fontConfig).setVisible(false).setAlign('center');
    InitObject(ui.chapterText, display.centerW, display.centerH, 0.5,true);

    // TODO: 메인 대화창 설정
    ui.talkBox = this.add.container(display.centerW, display.centerH + 140).setVisible(false);
    ui.talkText = this.add.text(-display.centerW + 40, 32, '', fontConfig).setAlign('left').setFontSize(16).setLineSpacing(8);
    ui.talkBackground = this.add.rexNinePatch({
        x: 0, y: 0,
        width: display.width - 20, height: 180,
        key: 'talkbox',
        columns: [16, undefined, 16],
        rows: [16, undefined, 16],
    }).setOrigin(0.5, 0).setInteractive();
    ui.talkBox.add([ui.talkBackground, ui.talkText]);
    ui.talkBackground.on('pointerup', function () {
        talk();
    });
    function talk() {
        var chapter = gameStatus.chapterNum;
        if(ui.talkBox.visible === false) ui.talkBox.setVisible(true);
        if(ui.taskBox.visible === true) ui.taskBox.setVisible(false);
        game.scene.scenes[0].time.removeAllEvents();
        if(line.story[chapter].length - 1 > gameStatus.idx) {
            gameStatus.idx++;
            if(line.story[chapter][gameStatus.idx] === 'close'){
                talkClosed();
                mainConfig.taskIndex++;
            }
            if(chapter === 1){
                if(gameStatus.idx === 2) {
                    game.scene.scenes[0].tweens.killTweensOf(mainObject.player);
                    game.scene.scenes[0].tweens.add({
                        targets: mainObject.player,
                        alpha: 0.2,
                        duration: 3200
                    });
                }
                else if(gameStatus.idx === 3) {
                    game.scene.scenes[0].tweens.killTweensOf(mainObject.player);
                    game.scene.scenes[0].tweens.add({
                        targets: mainObject.player,
                        alpha: 1,
                        duration: 400
                    });
                }
                else if(gameStatus.idx === 4) mainObject.player.play('seek');
                else if(gameStatus.idx === 5) mainObject.player.play('stand');
                else if(gameStatus.idx === 6){
                    setTimeout(function () {
                        bodyConfig.blink.active = true;
                        ui.blink.setVisible(true).play('blink');
                    }, 2400);
                }
                else if(gameStatus.idx === 12){
                    var target = {
                        x: display.centerW - 10,
                        y: display.centerH + 80
                    }
                    characterMove(mainObject.dom, target, 160);
                }
                else if(gameStatus.idx === 19){
                    following.start = true;
                    ui.godown.setVisible(true).play('godown');
                    bodyConfig.godown.active = true;
                }
            }
            else if(chapter === 2){

            }
        }
        else {
            console.log('null index line');
        }
        ui.talkText.text = '';
        typewriteText(ui.talkText, line.story[chapter][gameStatus.idx], 60);
    }

    // TODO: 미션 텍스트
    ui.taskBox = this.add.container(display.centerW, 16).setVisible(false);
    ui.taskText = this.add.text(0, 0, '', fontConfig).setOrigin(0.5).setFontSize(16);
    ui.taskBackground = this.add.rectangle(0, 0, display.width, 32, 0x000000).setOrigin(0.5);
    ui.taskBox.add([ui.taskBackground, ui.taskText]);
    // TODO 기타 UI 오브젝트 그룹
    ui.others = this.add.container(0, 0);
    ui.black = this.add.rectangle(display.centerW, display.centerH, display.width, display.height, 0x000000).setVisible(false).setAlpha(0);
    ui.godown = this.physics.add.sprite(display.centerW, display.height - 20, 'ui-go-down').setOrigin(0.5, 1)
        .setScale(2).setVisible(false).setSize(display.width, 30);
    ui.blink = this.physics.add.sprite(display.centerW + 80, 180, 'blink').setOrigin(0.5, 1)
        .setScale(2).setVisible(false);
    ui.others.add([ui.godown, ui.blink, ui.black]);


    // TODO: 캐릭터 생성
    setAnims();
    mainObject.group = this.add.container();
    mainObject.player = this.physics.add.sprite(display.centerW, 180, 'player')
        .play('stand').setOrigin(0.5, 1).setScale(2).setVisible(false);

    mainObject.dom = this.physics.add.sprite(display.centerW + 80, 180, 'dom-idle')
        .play('dom-stand').setOrigin(0.5, 1).setScale(2).setVisible(false);

    mainObject.cowboy = this.physics.add.sprite(display.centerW + 60, 160, 'cowboy')
        .play('cowboy-stand').setOrigin(0.5, 1).setScale(2).setVisible(false);

    ui.bg = this.add.sprite(display.centerW, display.centerH, 'bg').setScale(2).setFrame(0).setVisible(false);

    // TODO 배경 오브젝트 생성
    otherObject.building = this.add.sprite(display.centerW, display.centerH + 90, 'building').setOrigin(0.5, 1)
        .setScale(2).setVisible(false);



    // TODO: 기타 효과 오브젝트 생성
    bodyConfig.dom = this.physics.add.overlap(mainObject.player, mainObject.dom, onCol, null, this);
    bodyConfig.godown = this.physics.add.overlap(mainObject.player, ui.godown, onCol, null, this);
    bodyConfig.blink = this.physics.add.overlap(mainObject.player, ui.blink, onCol, null, this);

    bodyConfig.blink.active = false;
    bodyConfig.dom.active = false;
    bodyConfig.godown.active = false;


    mainObject.group.add([mainObject.player, mainObject.dom, mainObject.cowboy, otherObject.building]);

    // TODO 물리 설정

    // TODO 콜라이더 설정
    function onCol(player, obj) {
        if(obj === ui.blink){
            bodyConfig.blink.active = false
            var target = {x: mainObject.dom.x - 40, y: mainObject.dom.y};
            mainConfig.isPlayerMovable = false;
            obj.setVisible(false);
            mainObject.dom.setVisible(true);
            characterMove(player, target, 160);
            looking(mainObject.dom, target, false);
            mainConfig.look = mainObject.dom;
            talk();
        }
        else if(obj === mainObject.dom){
            var target = {x: obj.x + 40, y: obj.y};
            characterMove(mainObject.player, target, 160);
            mainConfig.look = mainObject.dom;
            bodyConfig.dom.active = false;
            mainConfig.isPlayerMovable = false;
            looking(mainObject.dom, charMovePos.player, false);
            talk();
        }
        else if(obj === ui.godown){
            obj.setVisible(false);
            following.isMoving = true;
            var target = {x: display.centerW, y: display.height + 120};
            characterMove(mainObject.player, target, 160);
            bodyConfig.godown.active = false;
            mainConfig.isPlayerMovable = false;
            toNextChapter();
        }
        else if(obj === otherObject.building){
            characterMove(player, mainObject.dom, 160);
        }
    }

    // TODO 레이어 정리
    mainObject.layer = this.add.layer();
    mainObject.layer.add(ui.bg);
    mainObject.layer.add(mainObject.group);
    mainObject.layer.add(ui.others);
    mainObject.layer.add(ui.talkBox);
    mainObject.layer.add(ui.taskBox);
    mainObject.layer.add(ui.skip);
    mainObject.layer.add(LogContainer);
    mainObject.layer.add(mainObject.tile);
}

function setAnims() {
    // TODO: 애니메이션 추가
    var scene = game.scene.scenes[0];
    scene.anims.create({
        key: 'stand',
        frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'seek',
        frames: scene.anims.generateFrameNumbers('player', { start: 2, end: 3, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'run',
        frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 7, first: 0 }),
        frameRate: 8,
        repeat: -1
    });

    scene.anims.create({
        key: 'dom-stand',
        frames: scene.anims.generateFrameNumbers('dom-stand', { start: 0, end: 1, first: 0 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: 'dom-run',
        frames: scene.anims.generateFrameNumbers('dom-run', { start: 0, end: 1, first: 0 }),
        frameRate: 8,
        repeat: -1
    });
    scene.anims.create({
        key: 'cowboy-stand',
        frames: scene.anims.generateFrameNumbers('cowboy', { start: 0, end: 1, first: 0 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: 'blink',
        frames: scene.anims.generateFrameNumbers('blink', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'godown',
        frames: scene.anims.generateFrameNumbers('ui-go-down', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
}
function story() {
    // TODO: 스토리 시작
    console.log('스토리 시작');
    ui.mainText.setVisible(true);
    ShakeObject(ui.mainText, 20, 20, 240);
}
function toNextChapter(){
    var next = parseInt(gameStatus.chapterNum) + 1;
    ui.talkBox.setVisible(false);
    ui.taskBox.setVisible(false);
    ui.black.setVisible(true);
    game.scene.scenes[0].tweens.add({
        targets: ui.black,
        alpha: 1,
        duration: 1400,
        onComplete: function () {
            ui.bg.setVisible(false);
            gameStatus.chapter = 'chapter-' + next;
            gameStatus.idx = 0;
            ui.black.setVisible(false);
        }
    });
}
function chapter(chapterNum) {
    // TODO: 챕터 시작
    console.log('챕터', chapterNum, '시작');
    ui.mainText.setVisible(false);
    ui.chapterText.setVisible(true);
    ui.chapterText.alpha = 0;
    // 챕터 타이틀 애니메이션
    if(mainConfig.skip !== 0){
        mainConfig.skip = 0;
        startChapter();
        return;
    }
    ui.chapterText.text = line.chapter[gameStatus.chapterNum];
    game.scene.scenes[0].tweens.add({
        targets: ui.chapterText,
        alpha: 1,
        duration: 2400,
        yoyo: true,
        ease: Phaser.Math.Easing.Elastic.InOut,
        onComplete: startChapter
    });
}
// 챕터 시작
function startChapter() {
    ui.talkText.text = '';
    mainConfig.taskIndex = 0;
    var chapNum = gameStatus.chapterNum;
    ui.bg.setVisible(true).setFrame(gameStatus.chapterNum-1);
    if(chapNum === 1){
        mainObject.player.setVisible(true).setAlpha(0);
        game.scene.scenes[0].tweens.add({
            targets: mainObject.player,
            alpha: 1,
            duration: 3200,
            ease: 'linear'
        });
        ui.talkBox.setVisible(true);
        typewriteText(ui.talkText, line.story[chapNum][0], 100);
    }
    else if(chapNum === 2){
        if(mainConfig.isSkipped){
            following.start = true;
            mainObject.player.setVisible(true);
            mainObject.dom.setVisible(true);
            mainObject.dom.x = display.centerW - 20;
        }
        otherObject.building.setVisible(true);
        mainObject.player.y = -120;
        mainObject.dom.y = -120;
        following.isMoving = true;
        characterMove(mainObject.player, {x: display.centerW, y: 100}, 160);
        var talk = setTimeout(function () {
            ui.talkBox.setVisible(true);
            typewriteText(ui.talkText, line.story[chapNum][0], 100);
            clearTimeout(talk);
        }, 800);
    }
    
}
// TODO: 대화 종료
function talkClosed() {
    // 공통 작업
    setTimeout(() => mainConfig.isPlayerMovable = true, 60);
    ui.talkBox.setVisible(false);
    ui.taskBox.setVisible(true);
    ui.taskText.text = line.task[gameStatus.chapterNum - 1][mainConfig.taskIndex];
}
function characterMove(character, target, speed) {
    var name;
    if(character === mainObject.player) {
        name = 'player';
        if(character.anims.currentAnim.key !== 'run') character.play('run');
    }
    else if(character === mainObject.dom) {
        name = 'dom';
        if(character.anims.currentAnim.key !== 'dom-run') character.play('dom-run');
    }
    charMovePos[name].x = target.x;
    charMovePos[name].y = target.y;
    mainConfig.look = null;
    character.setFlipX(target.x < character.x);
    game.scene.scenes[0].physics.moveToObject(character, target, speed);
}
function looking(character, target, each) {
    character.setFlipX(character.x > target.x);
    if(each) target.setFlipX(target.x > character.x);
}
let step = 0;
function update () {
    // TODO 업데이트
    // 터치 포지션 근접시 리셋
    let dis = {
        player: Phaser.Math.Distance.Between(mainObject.player.x, mainObject.player.y, charMovePos.player.x, charMovePos.player.y),
        dom: Phaser.Math.Distance.Between(mainObject.dom.x, mainObject.dom.y, charMovePos.dom.x, charMovePos.dom.y)
    };
    if (mainObject.player.body.speed > 0)
    {
        step++;
        if(step > 80) {
            step = 0;
            if(following.start) {
                if(mainObject.dom.y < 0) {
                    characterMove(mainObject.dom, mainObject.player, 160);
                }
                else {
                    mainConfig.pathcountDom = 1;
                    mainConfig.pathDom = mainConfig.navMesh.findPath(mainObject.dom, mainObject.player);
                    characterMove(mainObject.dom, mainConfig.pathDom[mainConfig.pathcountDom], 160);

                    mainConfig.graphicsDom.clear();
                    var line = new Phaser.Curves.Path(mainObject.dom.x, mainObject.dom.y);
                    for (var i = 0; i < mainConfig.pathDom.length; i++)
                    {
                        line.lineTo(mainConfig.pathDom[i].x, mainConfig.pathDom[i].y);
                    }
                    line.draw(mainConfig.graphicsDom);

                }

            }
        }
        // 캐릭터 레이어 변경
        mainObject.group.list.sort(function(a, b) {
            return a.y > b.y ? 1 : -1;
        });

        // 정지
        if (dis.player < 4)
        {
            // 플레이어 경로 따라 이동
            if(mainConfig.path !== null){
                // 마지막 경로가 아닐때
                if(mainConfig.path.length > mainConfig.pathCount + 1){
                    mainConfig.pathCount++;
                    characterMove(mainObject.player, mainConfig.path[mainConfig.pathCount], 160);
                    if(following.start) following.isMoving = true;
                    looking(mainObject.player, mainConfig.path[mainConfig.path.length - 1], false);
                }
                else {
                    mainObject.player.body.reset(charMovePos.player.x, charMovePos.player.y);
                    if(mainObject.player.anims.currentAnim.key !== 'stand') mainObject.player.play('stand');
                    if(mainConfig.look !== null){
                        looking(mainObject.player, mainConfig.look, false);
                    }
                }
            }
        }
    }
    if (mainObject.dom.body.speed > 0)
    {
        if (dis.dom < 4)
        {
            mainObject.dom.body.reset(charMovePos.dom.x, charMovePos.dom.y);
            mainObject.dom.play('dom-stand');
            // 플레이어 경로 따라 이동
            if(mainConfig.pathDom !== null){
                // 마지막 경로가 아닐때
                if(mainConfig.pathDom.length > mainConfig.pathcountDom + 1){
                    mainConfig.pathcountDom++;
                    characterMove(mainObject.dom, mainConfig.pathDom[mainConfig.pathcountDom], 160);
                    looking(mainObject.dom, mainObject.player, false);
                }
                else {
                    mainObject.dom.body.reset(charMovePos.dom.x, charMovePos.dom.y);
                    if(mainObject.dom.anims.currentAnim.key !== 'dom-stand') mainObject.dom.play('dom-stand');
                    looking(mainObject.dom, mainObject.player, false);
                }
            }
        }

    }
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
    const x = obj.x;
    const y = obj.y;
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