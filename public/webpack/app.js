/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!***************************!*\
  !*** ./public/project.js ***!
  \***************************/
// const FontFaceObserver = require('fontfaceobserver');
console.log("%c@ MYZY.SPACE 2021 POWERED BY MYZY_", "color: #00ff00; font-weight: 900; font-size: 1em; background-color: black; padding: 1rem");

let font = new FontFaceObserver('dgm');
font.load().then(function () {
    //console.log('font' ,font.family , 'loaded');
});

const display = {width : 360, height: 680};
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
};
const fontConfig = {font: '32px "dgm"', color: '#fff'};
const game = new Phaser.Game(config);
// TODO: 게임 상태 변경
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
let myLog = {text: null};
const bodyConfig = {};
const mainObjConfig = {skip: 0, taskIndex: 0, characterMove: false, look: null};
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
    this.load.image('map', 'image/map-desert.png');

    // maps
    this.load.image('talkbox', 'image/talkbox.png');

    // character animation
    this.load.spritesheet('stand', 'image/stand.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });
    this.load.spritesheet('run', 'image/run.png', { frameWidth: 32, frameHeight: 32, endFrame: 3 });
    this.load.spritesheet('seek', 'image/seek.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });

    this.load.spritesheet('dom-idle', 'image/dom-stand.png', { frameWidth: 16, frameHeight: 16, endFrame: 1 });
    this.load.spritesheet('dom-run', 'image/dom-run.png', { frameWidth: 16, frameHeight: 16, endFrame: 1 });

    // another animation
    this.load.spritesheet('blink', 'image/blink.png', { frameWidth: 16, frameHeight: 16, endFrame: 1 });

    // plugins
    var url_nine = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexninepatchplugin.min.js';
    this.load.plugin('rexninepatchplugin', url_nine, true);
}
function create () {
    gameStatus.chapter = 'main';
    gameStatus.idx = 0;

    // TODO: 로그 및 디버그
    const LogContainer = this.add.container(0, 0).setVisible(false);
    myLog = this.add.text(6, 2, 'main-0', fontConfig).setFontSize(16);
    const myLogBox = this.add.rectangle(display.width * 0.5, 8, display.width, 24, 0x333333, 1);
    LogContainer.add([myLogBox, myLog]);
    this.physics.world.drawDebug = false;
    this.input.keyboard.addKey('TAB').on('down', function(event) {
        LogContainer.setVisible(true);
        game.scene.scenes[0].physics.world.drawDebug = true;
    }).on('up', function(event) {
        LogContainer.setVisible(false);
        game.config.physics.arcade.drawDebug = true;
        game.scene.scenes[0].physics.world.drawDebug = false;
        game.scene.scenes[0].physics.world.debugGraphic.clear();
    });
    this.input.keyboard.addKey(49).on('down', function(event) {
        mainObjConfig.skip = 1;
    })
    // 키코드 디버그 window.addEventListener("keydown", function (event) { console.log(event); })

    // 터치 포인터 위치 리턴
    function charMove(pos) {
        charMovePos.player.x = pos.x;
        charMovePos.player.y = pos.y;
        mainObjConfig.look = null;
        mainObject.character.setFlipX(pos.x < mainObject.character.x);
        game.scene.scenes[0].physics.moveToObject(mainObject.character, {x: pos.x, y: pos.y}, 180);
        mainObject.character.play('run');
    }
    this.input.on('pointerup', function (pointer)
    {
        // if(pointer.y < 120) return;
        if(mainObjConfig.characterMove === true) charMove(pointer);
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
    InitObject(ui.startgame, display.width * 0.5, display.height * 0.5, 0.5, false);

    // TODO: 스토리 시작 메인 텍스트 설정
    ui.mainText = this.add.text(0, 0, line.story[0][0], fontConfig).setVisible(false).setAlign('center');
    InitObject(ui.mainText, display.width * 0.5, display.height * 0.5, 0.5,true);

    // TODO: 전체화면 스킵 오브젝트
    ui.skip = this.add.rectangle(display.width * 0.5, display.height * 0.5, display.width, display.height, 0x00ff00, 0).setVisible(true);
    ui.skip.setInteractive().setVisible(true);
    ui.skip.on('pointerup', function () {
        if(gameStatus.chapter === 'main'){
            if(mainObjConfig.skip !== 0){
                gameStatus.chapter = 'chapter-' + mainObjConfig.skip.toString();
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
    InitObject(ui.chapterText, display.width * 0.5, display.height * 0.5, 0.5,true);

    // TODO: 메인 대화창 설정
    ui.talkBox = this.add.container(display.width * 0.5, display.height * 0.5 + 140).setVisible(false);
    ui.talkText = this.add.text(-display.width * 0.5 + 40, 32, '', fontConfig).setAlign('left').setFontSize(16).setLineSpacing(8);
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
        if(ui.talkBox.visible === false) ui.talkBox.setVisible(true);
        if(ui.taskBox.visible === true) ui.taskBox.setVisible(false);
        game.scene.scenes[0].time.removeAllEvents();
        if(line.story[gameStatus.chapterNum].length - 1 > gameStatus.idx) {
            gameStatus.idx++;
            if(line.story[1][gameStatus.idx] === 'close'){
                talkClosed();
            }
            if(gameStatus.idx === 2) {
                game.scene.scenes[0].tweens.killTweensOf(mainObject.character);
                game.scene.scenes[0].tweens.add({
                    targets: mainObject.character,
                    alpha: 0.2,
                    duration: 3200
                });
            }
            else if(gameStatus.idx === 3) {
                game.scene.scenes[0].tweens.killTweensOf(mainObject.character);
                game.scene.scenes[0].tweens.add({
                    targets: mainObject.character,
                    alpha: 1,
                    duration: 400
                });
            }
            else if(gameStatus.idx === 4) mainObject.character.play('seek');
            else if(gameStatus.idx === 5) mainObject.character.play('stand');
        }
        else {
            console.log('null index line');
        }
        ui.talkText.text = '';
        typewriteText(ui.talkText, line.story[1][gameStatus.idx], 60);
    }

    // TODO: 미션 텍스트
    ui.taskBox = this.add.container(display.width * 0.5, 60).setVisible(false);
    ui.taskText = this.add.text(0, 0, line.task[mainObjConfig.taskIndex], fontConfig).setOrigin(0.5).setFontSize(16);
    ui.taskBackground = this.add.rectangle(0, 0, display.width, 32, 0x000000).setOrigin(0.5);
    ui.taskBox.add([ui.taskBackground, ui.taskText]);

    // TODO: 캐릭터 생성
    setAnims();
    mainObject.group = this.add.container();
    mainObject.character = this.physics.add.sprite(display.width * 0.5, display.height * 0.5 - 10, 'stand')
        .play('stand').setOrigin(0.5, 1).setScale(2).setVisible(false);

    mainObject.dom = this.physics.add.sprite(display.width * 0.5 + 80, display.height * 0.5 - 10, 'dom-idle')
        .play('dom-stand').setOrigin(0.5, 1).setScale(2).setVisible(false);

    ui.bg = this.add.sprite(display.width * 0.5, display.height * 0.5, 'map').setScale(2).setVisible(false);

    // TODO: 기타 효과 오브젝트 생성
    otherObject.blink = this.physics.add.sprite(display.width * 0.5 + 80, display.height * 0.5 - 10, 'blink')
        .setScale(2).setVisible(false);
    bodyConfig.blink = this.physics.add.overlap(mainObject.character, otherObject.blink, onCol, null, this);
    bodyConfig.dom = this.physics.add.overlap(mainObject.character, mainObject.dom, onCol, null, this);
    bodyConfig.blink.active = false;
    bodyConfig.dom.active = false;

    mainObject.group.add([mainObject.character, mainObject.dom, otherObject.blink]);

    // TODO: 물리 설정
    function onCol(player, obj) {
        if(obj === otherObject.blink){
            bodyConfig.blink.active = false
            var movePos = {x: mainObject.dom.x - 40, y: mainObject.dom.y};
            charMove({x: movePos.x, y: movePos.y});
            mainObjConfig.characterMove = false;
            obj.setVisible(false);
            mainObject.dom.setVisible(true);
            looking(mainObject.dom, movePos, false);
            mainObjConfig.look = mainObject.dom;
            mainObjConfig.taskIndex++;
            talk();
        }
        else if(obj === mainObject.dom){
            characterMove(mainObject.character, obj.x + 40, obj.y, 160);
            mainObjConfig.look = mainObject.dom;
            bodyConfig.dom.active = false;
            mainObjConfig.characterMove = false;
            looking(mainObject.dom, charMovePos.player, false);
            talk();
        }
    }

    // 레이어 정리
    mainObject.layer = this.add.layer();
    mainObject.layer.add(ui.bg);
    mainObject.layer.add(mainObject.group);
    mainObject.layer.add(ui.talkBox);
    mainObject.layer.add(ui.taskBox);
    mainObject.layer.add(ui.skip);
    mainObject.layer.add(ui.bg);
    mainObject.layer.add(LogContainer);
}

function setAnims() {
    // TODO: 애니메이션 추가
    var scene = game.scene.scenes[0];
    scene.anims.create({
        key: 'stand',
        frames: scene.anims.generateFrameNumbers('stand', { start: 0, end: 1, first: 0 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: 'run',
        frames: scene.anims.generateFrameNumbers('run', { start: 0, end: 3, first: 0 }),
        frameRate: 8,
        repeat: -1
    });
    scene.anims.create({
        key: 'seek',
        frames: scene.anims.generateFrameNumbers('seek', { start: 0, end: 1, first: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'dom-stand',
        frames: scene.anims.generateFrameNumbers('dom-idle', { start: 0, end: 1, first: 0 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: 'dom-run',
        frames: scene.anims.generateFrameNumbers('dom-run', { start: 0, end: 1, first: 0 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: 'blink',
        frames: scene.anims.generateFrameNumbers('blink', { start: 0, end: 1, first: 0 }),
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
function chapter(chapterNum) {
    // TODO: 챕터 시작
    console.log('챕터', chapterNum, '시작');
    ui.mainText.setVisible(false);
    ui.chapterText.setVisible(true);
    ui.chapterText.alpha = 0;
    // 챕터 타이틀 애니메이션
    if(mainObjConfig.skip !== 0){
        startChapter();
        return;
    }
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
    ui.talkBox.setVisible(true);
    ui.bg.setVisible(true);
    mainObject.character.setVisible(true).setAlpha(0);
    game.scene.scenes[0].tweens.add({
        targets: mainObject.character,
        alpha: 1,
        duration: 3200,
        ease: 'linear'
    });
    typewriteText(ui.talkText, line.story[1][0], 100);
}
// TODO: 대화 종료
function talkClosed() {
    // 공통 작업
    setTimeout(() => mainObjConfig.characterMove = true, 60);
    ui.talkBox.setVisible(false);
    ui.taskBox.setVisible(true);
    ui.taskText.text = line.task[mainObjConfig.taskIndex];

    if(gameStatus.chapterNum === 1){
        setTimeout(function () {
            if(gameStatus.idx < 7){
                bodyConfig.blink.active = true;
                otherObject.blink.setVisible(true).play('blink');
            }
        }, 2400);
        if(gameStatus.idx === 12){
            mainObject.dom.play('dom-run');
            characterMove(mainObject.dom, display.width * 0.5, 160, 120);
        }
    }

}
function characterMove(character, x, y, speed) {
    var name;
    if(character === mainObject.character) name = 'player'
    else if(character === mainObject.dom) name = 'dom'
    charMovePos[name].x = x;
    charMovePos[name].y = y;
    game.scene.scenes[0].physics.moveToObject(character, {x: x, y: y}, speed);
}
function looking(character, target, each) {
    character.setFlipX(character.x > target.x);
    if(each) target.setFlipX(target.x > character.x);
}
function update () {
    // TODO 업데이트
    // 터치 포지션 근접시 리셋
    let dis = {
        player: Phaser.Math.Distance.Between(mainObject.character.x, mainObject.character.y, charMovePos.player.x, charMovePos.player.y),
        dom: Phaser.Math.Distance.Between(mainObject.dom.x, mainObject.dom.y, charMovePos.dom.x, charMovePos.dom.y)
    };
    if (mainObject.character.body.speed > 0)
    {
        // 캐릭터 레이어 변경
        mainObject.group.list.sort(function(a, b) {
            return a.y > b.y ? 1 : -1;
        });

        // 정지
        if (dis.player < 4)
        {
            mainObject.character.body.reset(charMovePos.player.x, charMovePos.player.y);
            mainObject.character.play('stand');
            if(mainObjConfig.look !== null){
                looking(mainObject.character, mainObjConfig.look, false);
            }
        }
    }
    if (mainObject.dom.body.speed > 0)
    {
        // 캐릭터 레이어 변경
        mainObject.group.list.sort(function(a, b) {
            return a.y > b.y ? 1 : -1;
        });

        // 정지
        if (dis.dom < 4)
        {
            mainObject.dom.body.reset(charMovePos.dom.x, charMovePos.dom.y);
            mainObject.dom.play('dom-stand');
            bodyConfig.dom.active = true;
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
/******/ })()
;
//# sourceMappingURL=app.js.map