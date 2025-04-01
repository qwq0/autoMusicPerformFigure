import { AudioPipeline } from "./audio/AudioPipeline.js";
import { MidiFile } from "./notation/MidiFile.js";
import { NotationPlayer } from "./notation/NotationPlayer.js";

/**
 * 自动演奏人偶 上下文
 * 
 * @typedef {{
 *  name: string,
 *  midiUrl: string,
 *  tag?: Array<string>,
 *  attribute?: {
 *      cheerful?: number,
 *      somber?: number,
 *      fast?: number,
 *      soothing?: number
 *  }
 *  mode?: {
 *      minSpeed?: number,
 *      maxSpeed?: number,
 *      maxDuringRatio?: number,
 *      minDuringRatio?: number,
 *  }
 * }} ScoreInfo
 */
export class AutoMusicPerformFigure
{
    /**
     * 音频管线
     * @type {AudioPipeline}
     */
    pipeline = null;

    /**
     * 演奏者
     * @type {NotationPlayer}
     */
    notationPlayer = null;

    /**
     * 欢快度
     * @type {number}
     */
    cheerfulnessRatio = 0.5;

    /**
     * 乐谱列表
     * @type {Array<ScoreInfo>}
     */
    scoreList = [];

    /**
     * 当前乐谱索引
     * @type {number}
     */
    nowScoreIndex = -1;

    constructor()
    {
        this.pipeline = new AudioPipeline();
        this.notationPlayer = new NotationPlayer(this.pipeline);
    }

    /**
     * 添加乐谱
     * @param {ScoreInfo} score
     */
    addScore(score)
    {
        this.scoreList.push(Object.assign({}, score));
    }

    /**
     * 停止演奏
     */
    stop()
    {
        this.notationPlayer.stop();
    }

    /**
     * 开始演奏
     * 或恢复演奏
     */
    async start()
    {
        this.nowScoreIndex = Math.floor(Math.random() * this.scoreList.length);

        let midiFileData = new Uint8Array(
            await (await fetch(this.scoreList[this.nowScoreIndex].midiUrl)).arrayBuffer()
        );
        let midi = MidiFile.decode(midiFileData);
        this.notationPlayer.setMidiFile(midi);
        this.notationPlayer.play();
    }

    /**
     * 随机切换
     */
    randomSwitch()
    { }
}