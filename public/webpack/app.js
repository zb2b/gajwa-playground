/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!***************************!*\
  !*** ./public/project.js ***!
  \***************************/
// const FontFaceObserver = require('fontfaceobserver');
let font = new FontFaceObserver('dgm');
font.load().then(function () {
    console.log('font' ,font.family , 'loaded');
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
};
const fontConfig = {font: '32px "dgm"', color: '#fff'};
const game = new Phaser.Game(config);
// TODO: 게임 상태 변경
let gameStatus = {
    Chapter: 'load',
    Index: 0,
    get chapter(){
        return this.Chapter;
    },
    set chapter(value) {
        this.Chapter = value;
        if(value === 'story') story();
        else if(value.split("-")[0] === 'chapter') chapter(value.split("-")[1]);
        myLog.text = this.Chapter + "-" + this.Index;
    },
    get idx(){
        return this.Index;
    },
    set idx(value) {
        this.Index = value;
        myLog.text = this.Chapter + "-" + this.Index;
    },
};
let myLog = {text: null};
const mainObjConfig = {characterMove: false};
const mainObject = {};
const touch = {x: 0, y: 0};
const chapterTitle = [];
const line = { story: [], chapter: [] };
const ui = {};
const timer = { shaker: null };
// TODO: * 프리로드
function preload ()
{
    this.load.json('line', 'data/line.json');
    this.load.image('talkbox', 'image/talkbox.png');
    this.load.spritesheet('stand', 'image/stand.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });
    this.load.spritesheet('run', 'image/run.png', { frameWidth: 32, frameHeight: 32, endFrame: 3 });
    this.load.spritesheet('seek', 'image/seek.png', { frameWidth: 32, frameHeight: 32, endFrame: 1 });
// plugin load
    var url_nine = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexninepatchplugin.min.js';
    this.load.plugin('rexninepatchplugin', url_nine, true);
}
const gameManager = {status: 'ready'};
function create () {
    gameStatus.chapter = 'main';
    gameStatus.idx = 0;
    // TODO: LOG TEXT
    myLog = this.add.text(8, 8, 'main-0', fontConfig).setFontSize(16);
    // 터치 포인터 위치 리턴
    this.input.on('pointerup', function (pointer)
    {
        touch.x = pointer.x;
        touch.y = pointer.y;
        function charMove() {
            mainObject.character.setFlipX(pointer.x < mainObject.character.x);
            game.scene.scenes[0].physics.moveToObject(mainObject.character, {x: pointer.x, y: pointer.y - 32}, 180);
            mainObject.character.play('run');
        }
        if(mainObjConfig.characterMove === true) charMove();
    }, this);

    // TODO: JSON LINES TO ARRAY
    let lineJson = this.cache.json.get('line');
    for (let l = 0; l < lineJson.chapter.length; l++) {
        chapterTitle.push(lineJson.chapter[l]);
    }
    // line Json 첫번째 배열: 챕터별 라인, 두번째 배열: 라인 당 개별 대사
    line.story = lineJson.line.story;
    console.log(line);

    ui.startgame = this.add.text(0, 0, 'Start Game', fontConfig);
    InitObject(ui.startgame, display.width * 0.5, display.height * 0.5, 0.5, true);
    ui.startgame.on('pointerup', function () {
        this.disableInteractive();
        game.scene.scenes[0].tweens.add({
            targets: ui.startgame,
            alpha: 0,
            duration: 800,
            onComplete: () => gameStatus.chapter = 'story'
        });
    });
    // TODO: 스토리 시작 메인 텍스트 설정
    ui.mainText = this.add.text(0, 0, line.story[0][0], fontConfig).setVisible(false).setAlign('center');
    InitObject(ui.mainText, display.width * 0.5, display.height * 0.5, 0.5,true);
    ui.mainText.on('pointerup', function () {
        gameStatus.idx++;
        this.text = line.story[0][gameStatus.idx];
        ShakeObject(this, 20, 20, 240);
        if(gameStatus.idx >= line.story[0].length) {
            gameStatus.chapter = 'chapter-1';
            gameStatus.idx = 0;
        }
    });
    // TODO: 챕터 타이틀 텍스트 설정
    ui.chapterText = this.add.text(0, 0, chapterTitle[0], fontConfig).setVisible(false).setAlign('center');
    InitObject(ui.chapterText, display.width * 0.5, display.height * 0.5, 0.5,true);

    // TODO: 메인 대화창 설정
    ui.talkBox = this.add.rexNinePatch({
        x: display.width * 0.5, y: display.height - 120,
        width: display.width - 20, height: 180,
        key: 'talkbox',
        columns: [16, undefined, 16],
        rows: [16, undefined, 16],
    }).setVisible(false).setInteractive();
    ui.talkBox.on('pointerup', function () {
        game.scene.scenes[0].time.removeAllEvents();
        if(line.story[1].length - 1 > gameStatus.idx) {
            gameStatus.idx++;
            if(gameStatus.idx === 4) mainObject.character.play('seek');
            else if(gameStatus.idx === 5) mainObject.character.play('stand');
        }
        else {
            setTimeout(() => mainObjConfig.characterMove = true, 60);
            ui.talkText.setVisible(false);
            ui.talkBox.setVisible(false);
            ui.taskText.setVisible(true);
        }
        ui.talkText.text = '';
        typewriteText(ui.talkText, line.story[1][gameStatus.idx], 60);
    });
    ui.talkText = this.add.text(0, 0, '', fontConfig).setVisible(true).setAlign('left').setFontSize(16);
    InitObject(ui.talkText, 40, display.height - 180, 0,false);
    // TODO: 미션 텍스트
    ui.taskText = this.add.text(0, 0, '목소리가 나는 곳을 찾아보자.', fontConfig).setVisible(false).setAlign('left').setFontSize(16);
    InitObject(ui.taskText, display.width * 0.5, 60, 0.5,false);
    // TODO: 캐릭터 생성
    setAnims();
    mainObject.character = this.physics.add.sprite(display.width * 0.5, display.height * 0.5, 'stand')
        .play('stand').setScale(2).setVisible(false);

    mainObject.layer = this.add.layer();
    mainObject.layer.add(mainObject.character);
    mainObject.layer.add(ui.talkBox);
    mainObject.layer.add(ui.talkText);
    mainObject.layer.add(ui.taskText);
}
// TODO: 애니메이션 추가
function setAnims() {
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
    game.scene.scenes[0].tweens.add({
        targets: ui.chapterText,
        alpha: 1,
        duration: 2400,
        yoyo: true,
        ease: Phaser.Math.Easing.Elastic.InOut,
        onComplete: startChapter
    });
    function startChapter() {
        ui.talkBox.setVisible(true);
        mainObject.character.setVisible(true).setAlpha(0);
        game.scene.scenes[0].tweens.add({
            targets: mainObject.character,
            alpha: 1,
            duration: 3200,
            ease: 'linear'
        });
        typewriteText(ui.talkText, line.story[1][0], 100);
    }
}

function update () {
    // 터치 포지션 근접시 리셋
    let distance = Phaser.Math.Distance.Between(mainObject.character.x, mainObject.character.y, touch.x, touch.y - 32);
    if (mainObject.character.body.speed > 0)
    {
        if (distance < 4)
        {
            mainObject.character.body.reset(touch.x, touch.y - 32);
            mainObject.character.play('stand');
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