import { MidiFile } from "./MidiFile.js";
import { delayPromise } from "./util/delayPromise.js";

/**
 * 谱面演奏者
 */
export class NotationPlayer
{
    /**
     * 演奏序列
     * @type {Array<{
     *  time: number,
     *  pitch: number,
     *  volume: number,
     *  duration: number
     * }>}
     */
    performeSequence = [];

    /**
     * 每小节时间
     * 仅简谱模式
     * @type {number}
     */
    perBarDuration = 600;

    /**
     * 音频管线
     * @type {import("./AudioPipeline.js").AudioPipeline}
     */
    pipeline = null;

    /**
     * 敲击音符回调
     * @type {(pitch: number, duration: number) => void}
     */
    strikeCallback = null;

    /**
     * 当前正在演奏的id
     * @type {string}
     */
    nowPlayingId = "";

    /**
     * 停止索引
     * 表示停止前演奏序列已经演奏的位置
     * @type {number}
     */
    stoppedIndex = 0;

    /**
     * 演奏倍速
     * 开始演奏后不可再变化
     * @type {number}
     */
    speed = 1;

    /**
     * @param {import("./AudioPipeline.js").AudioPipeline} pipeline
     */
    constructor(pipeline)
    {
        this.pipeline = pipeline;
        this.clear();
    }

    clear()
    {
        this.nowPlayingId = "";
        this.stoppedIndex = 0;
        this.speed = 1;
        this.performeSequence.length = 0;
    }

    /**
     * 设置字符串曲谱
     * @param {string} scoreString
     */
    setsStringScore(scoreString)
    {
        this.clear();

        let i = 0;
        // 小节索引
        let barIndex = 0;
        // 小节内音符索引
        let relativeNoteIndex = 0;
        // 半音
        let semitone = 0;
        // 音高
        let relativePitch = 0;
        // 八度
        let octaveIndex = 4;
        // 空白音符
        let blankNote = false;

        /**
         * 处理半音
         */
        let ctSemitone = () =>
        {
            if (
                scoreString[i] == "♯" ||
                scoreString[i] == "#" ||
                scoreString[i] == "♭"
            )
            { // 半音
                if (
                    scoreString[i] == "♯" ||
                    scoreString[i] == "#"
                )
                    semitone++;
                else
                    semitone--;
                i++;
            }
        };

        /**
         * 处理音符
         */
        let ctNote = () =>
        {
            if (!blankNote)
                this.performeSequence.push({
                    time: barIndex * this.perBarDuration + relativeNoteIndex * this.perBarDuration / 4,
                    pitch: (octaveIndex - 4) * 12 + relativePitch + semitone,
                    volume: 0.8,
                    duration: this.perBarDuration / 6
                });
            blankNote = false;
            semitone = 0;
            relativeNoteIndex++;
            relativePitch = 0;
            octaveIndex = 4;
        };

        while (i < scoreString.length)
        {
            semitone = 0;

            ctSemitone();


            if (
                "0" <= scoreString[i] &&
                scoreString[i] <= "9"
            )
            { // 数字音高
                switch (scoreString[i])
                {
                    case "1": {
                        relativePitch = 0;
                        break;
                    }
                    case "2": {
                        relativePitch = 2;
                        break;
                    }
                    case "3": {
                        relativePitch = 4;
                        break;
                    }
                    case "4": {
                        relativePitch = 5;
                        break;
                    }
                    case "5": {
                        relativePitch = 7;
                        break;
                    }
                    case "6": {
                        relativePitch = 9;
                        break;
                    }
                    case "7": {
                        relativePitch = 11;
                        break;
                    }
                    case "0": {
                        blankNote = true;
                        break;
                    }
                }
                i++;
                ctSemitone();
                if (
                    scoreString[i] == "."
                )
                {
                    octaveIndex = 3;
                }

                ctNote();
            }
            else if (
                "A" <= scoreString[i] &&
                scoreString[i] <= "G"
            )
            { // 科学音高
                switch (scoreString[i])
                {
                    case "C": {
                        relativePitch = 0;
                        break;
                    }
                    case "D": {
                        relativePitch = 2;
                        break;
                    }
                    case "E": {
                        relativePitch = 4;
                        break;
                    }
                    case "F": {
                        relativePitch = 5;
                        break;
                    }
                    case "G": {
                        relativePitch = 7;
                        break;
                    }
                    case "A": {
                        relativePitch = 9;
                        break;
                    }
                    case "B": {
                        relativePitch = 11;
                        break;
                    }
                }
                i++;
                ctSemitone();
                if (
                    "0" <= scoreString[i] &&
                    scoreString[i] <= "9"
                )
                {
                    octaveIndex = Number(scoreString[i]);
                }
                i++;

                ctNote();
            }
            else if (scoreString[i] == "|")
            {
                relativeNoteIndex = 0;
                barIndex++;
                i++;
            }
            else
            {
                i++;
            }
        }

        this.#tidyUp();
    }


    /**
     * 设置midi文件
     * @param {MidiFile} midi
     */
    setMidiFile(midi)
    {
        this.clear();

        /** @type {Map<number, number>} */
        let keyReleaseTime = new Map();
        for (let i = midi.keySequence.length - 1; i >= 0; i--)
        {
            let now = midi.keySequence[i];
            if (now.down)
            {
                let releaseTime = keyReleaseTime.get(now.key);
                this.performeSequence.push({
                    time: now.tick * midi.tickDuration,
                    pitch: now.key - 60,
                    volume: Math.min(1, Math.pow(now.velocity / 127, 1.5)),
                    duration: (releaseTime != undefined ? (releaseTime - now.tick) * midi.tickDuration : 150)
                });
            }
            else
            {
                keyReleaseTime.set(now.key, now.tick);
            }
        }
        this.performeSequence.reverse();
        this.#tidyUp();
    }

    /**
     * 整理序列
     */
    #tidyUp()
    {
        this.performeSequence.sort((a, b) =>
        {
            if (a.time < b.time)
                return -1;
            else if (a.time > b.time)
                return 1;
            else
                return 0;
        });
    }

    /**
     * 开始或继续演奏
     */
    async play()
    {
        this.#tidyUp();

        let startTime = performance.now() - this.performeSequence[this.stoppedIndex].time / this.speed + 100;
        let playingId = `${Math.floor(startTime)}_${Math.floor(Math.random() * 1e6)}`;
        this.nowPlayingId = playingId;
        for (let index = this.stoppedIndex; index < this.performeSequence.length; index++)
        {
            let o = this.performeSequence[index];
            let nowTime = performance.now() - startTime;
            let deltaTime = (o.time / this.speed) - nowTime;
            if (deltaTime > 2.5)
            {
                await delayPromise(deltaTime);
                if (this.nowPlayingId != playingId)
                {
                    break;
                }
            }
            let duration = o.duration / this.speed;
            this.pipeline.strikeNode(0, o.pitch + Math.random() * 0.06 - 0.03, duration, o.volume);
            this.stoppedIndex = index;
            if (this.strikeCallback)
                this.strikeCallback(o.pitch, duration);
        }
    }

    /**
     * 倒带回开头
     */
    async rewindToBeginning()
    {
        this.stoppedIndex = 0;
        if(this.nowPlayingId)
        {
            this.nowPlayingId = "";
            await this.play();
        }
    }

    /**
     * 停止演奏
     */
    stop()
    {
        this.nowPlayingId = "";
    }
}