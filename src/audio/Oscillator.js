import { delayPromise } from "../util/delayPromise.js";

/**
 * 波形类型列表
 * @type {Array<"sawtooth" | "sine" | "square" | "triangle">}
 */
let waveTypeList = [
    "sawtooth",
    "square",
    "triangle",
    "sine"
];

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
     * 波形类型
     * 0 锯齿波
     * 1 方波
     * 2 三角波 
     * 3 正弦波
     * @type {number}
     */
    type = 0;

    /**
     * @param {import("./AudioPipeline.js").AudioPipeline} pipeline
     * @param {number} type
     */
    constructor(pipeline, type)
    {
        this.pipeline = pipeline;
        this.type = type;

        this.gainNode = new GainNode(this.pipeline.audioContext, {
            gain: 1
        });
        this.refreshOscillatorNode();
    }

    get endNode()
    {
        return this.gainNode;
    }

    /**
     * 刷新振荡器节点
     */
    refreshOscillatorNode()
    {
        if (this.oscillatorNode)
        {
            this.oscillatorNode.disconnect(this.gainNode);
            this.oscillatorNode.stop();
        }

        this.oscillatorNode = new OscillatorNode(this.pipeline.audioContext, {
            frequency: 440,
            detune: 0,
            type: waveTypeList[this.type],
            // type: "custom",
            // periodicWave: new PeriodicWave(pipeline.audioContext, {
            //     real: [0, 1, 0.33, 0.1089],
            //     imag: [0, 0, 0, 0]
            // })
        });

        this.oscillatorNode.start();
        this.oscillatorNode.connect(this.gainNode);
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
        if (this.type == 3)
            this.refreshOscillatorNode();

        let frequency = Math.pow(1.0594630943592953, 96.37631656229593 + offset);
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

        let volume = this.initVolume * this.gainRatio;
        if (deltaTime > 3000)
        { // 长时间按下的音量
            volume *= 0.15;
        }
        else if (deltaTime < 200)
        { // 渐强结束后 一小段时间维持最大音量
            volume *= 1;
        }
        else
        { // 一段时间后渐弱
            volume *= (((3000 - deltaTime) / 2800) * 0.85 + 0.15);
        }

        if (this.type == 3)
        { // 对于正弦波
            if (deltaTime < 50)
            { // 刚开始按下的渐强
                volume *= deltaTime / 50;
            }
            if (this.releaseTime - now < 70)
            { // 弹起时渐弱
                volume *= (this.releaseTime - now) / 70;
            }
        }
        else
        {
            if (this.releaseTime - now < 30)
            { // 弹起时渐弱
                volume *= (this.releaseTime - now) / 30;
            }
        }

        this.gainNode.gain.value = Math.max(volume, 0);
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