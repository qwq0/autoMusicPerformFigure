import { delayPromise } from "./util/delayPromise.js";

/**
 * 振荡器实例
 * 通常由 振荡器音频节点 和 音量节点 组成
 */
export class Oscillator
{
    /**
     * 振荡器音频节点
     * @type {OscillatorNode}
     */
    oscillatorNode = null;

    /**
     * 音量节点
     * @type {GainNode}
     */
    gainNode = null;

    /**
     * 节点空闲
     * @type {boolean}
     */
    free = true;

    /**
     * 此振荡器属于的管线
     * @type {import("./AudioPipeline.js").AudioPipeline}
     */
    pipeline = null;

    /**
     * 按下时间
     * @type {number}
     */
    pressTime = 0;

    /**
     * 弹起时间
     * @type {number}
     */
    releaseTime = 0;

    /**
     * 初始音量
     * @type {number}
     */
    initVolume = 1;

    /**
     * @param {import("./AudioPipeline.js").AudioPipeline} pipeline
     */
    constructor(pipeline)
    {
        this.pipeline = pipeline;
        this.oscillatorNode = new OscillatorNode(pipeline.audioContext, {
            frequency: 440,
            type: "sawtooth"
        });
        this.oscillatorNode.start();
        this.gainNode = new GainNode(pipeline.audioContext, {
            gain: 1
        });
        this.oscillatorNode.connect(this.gainNode);
    }

    get endNode()
    {
        return this.gainNode;
    }

    /**
     * 设置音高
     * 0 为中央c
     * 正数为向高音偏移
     * 负数为向低音偏移
     * @param {number} offset
     */
    setPitch(offset)
    {
        this.oscillatorNode.frequency.value = 440 * Math.pow(1.0594630943592953, offset);
    }

    /**
     * 设置音量
     * @param {number} volume
     */
    setVolume(volume)
    {
        this.gainNode.gain.value = volume;
    }

    /**
     * 更新振荡器
     * 进行音量变化
     * @param {number} now
     */
    update(now)
    {
        let deltaTime = now - this.pressTime;
        if (deltaTime > 3000)
        {
            this.gainNode.gain.value = this.initVolume * 0.15;
        }
        else if (deltaTime < 200)
        {
            this.gainNode.gain.value = this.initVolume;
        }
        else
        {
            this.gainNode.gain.value = this.initVolume * (((3000 - deltaTime) / 2800) * 0.85 + 0.15);
        }
    }

    /**
     * 敲响
     * @param {number} duration
     */
    async strike(duration)
    {
        this.pressTime = performance.now();
        this.releaseTime = this.pressTime + duration;

        this.free = false;

        this.gainNode.gain.value = this.initVolume;
        this.gainNode.connect(this.pipeline.mainGainNode);
        await delayPromise(duration);
        this.gainNode.disconnect(this.pipeline.mainGainNode);

        this.free = true;
    }
}