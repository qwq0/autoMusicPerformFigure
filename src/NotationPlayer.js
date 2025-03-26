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
     * @type {number}
     */
    perBarDuration = 600;

    /**
     * @type {import("./AudioPipeline.js").AudioPipeline}
     */
    pipeline = null;

    /**
     * @type {(pitch: number, duration: number) => void}
     */
    strikeCallback = null;

    /**
     * @param {import("./AudioPipeline.js").AudioPipeline} pipeline
     */
    constructor(pipeline)
    {
        this.pipeline = pipeline;
    }

    /**
     * 设置每分钟节拍数
     * @param {number} bpm
     */
    setBpm(bpm)
    { }

    /**
     * 设置字符串曲谱
     * @param {string} scoreString
     */
    setsStringScore(scoreString)
    {
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
    }


    /**
     * 设置midi文件
     * @param {MidiFile} midi
     */
    setMidiFile(midi)
    {
        /** @type {Map<number, number>} */
        let keyReleaseTime = new Map();
        for (let i = midi.keySequence.length - 1; i >= 0; i--)
        {
            let now = midi.keySequence[i];
            if (now.down)
            {
                let releaseTime = keyReleaseTime.get(now.key);
                this.performeSequence.push({
                    time: now.time * 0.6,
                    pitch: now.key - 60,
                    volume: Math.min(1, Math.pow(now.velocity / 127, 1.5)),
                    duration: (releaseTime != undefined ? (releaseTime - now.time) * 0.6 : 150)
                });
            }
            else
            {
                keyReleaseTime.set(now.key, now.time);
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
     * 开始演奏
     */
    async play()
    {
        this.#tidyUp();

        let startTime = performance.now() + 100;
        for (let o of this.performeSequence)
        {
            let nowTime = performance.now() - startTime;
            if (nowTime + 1.5 < o.time)
            {
                await delayPromise(o.time - nowTime);
            }
            this.pipeline.strikeNode(o.pitch, o.duration, o.volume);
            if (this.strikeCallback)
                this.strikeCallback(o.pitch, o.duration);
        }
    }
}