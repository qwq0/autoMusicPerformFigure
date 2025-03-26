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
     * 增益系数
     * 用于修正不同频率的响度区别
     * @type {number}
     */
    gainRatio = 1;

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
        let frequency = 440 * Math.pow(1.0594630943592953, offset);
        this.oscillatorNode.frequency.value = frequency;

        if (frequency < 80)
            this.gainRatio = 1;
        else if (frequency < 3300)
            this.gainRatio = 0.4 + 0.6 * (3300 - frequency) / 3220;
        else if (frequency < 10000)
            this.gainRatio = 0.4 + 0.1 * (frequency - 3300) / 6700;
        else
            this.gainRatio = 0.5;
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
            this.gainNode.gain.value = this.initVolume * this.gainRatio * 0.15;
        }
        else if (deltaTime < 200)
        {
            this.gainNode.gain.value = this.initVolume * this.gainRatio;
        }
        else
        {
            this.gainNode.gain.value = this.initVolume * this.gainRatio * (((3000 - deltaTime) / 2800) * 0.85 + 0.15);
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

        this.update(this.pressTime);
        this.gainNode.gain.value = this.initVolume * this.gainRatio;
        this.gainNode.connect(this.pipeline.mainGainNode);
        await delayPromise(duration);
        this.gainNode.disconnect(this.pipeline.mainGainNode);

        this.free = true;
    }
}