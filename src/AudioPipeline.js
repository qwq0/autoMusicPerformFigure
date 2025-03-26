import { Oscillator } from "./Oscillator.js";

/**
 * 音频管线实例
 * 
 * 这个上下文管理所有需要用到的音频节点
 */
export class AudioPipeline
{
    /**
     * 音频上下文
     * @type {AudioContext}
     */
    audioContext = null;

    /**
     * 振荡器列表
     * @type {Array<Oscillator>}
     */
    oscillatorList = [];

    /**
     * 主音量节点
     * @type {GainNode}
     */
    mainGainNode = null;

    constructor()
    {
        this.audioContext = new AudioContext();

        this.mainGainNode = new GainNode(this.audioContext, {
            gain: 1
        });
        this.mainGainNode.connect(this.audioContext.destination);

        setInterval(() =>
        { // 更新正在工作的振荡器
            let now = performance.now();
            for (let i = 0; i < this.oscillatorList.length; i++)
            {
                if (!this.oscillatorList[i].free)
                {
                    this.oscillatorList[i].update(now);
                }
            }
        }, 20);
    }

    /**
     * 添加振荡器
     * @returns {Oscillator}
     */
    addOscillator()
    {
        let oscillator = new Oscillator(this);
        this.oscillatorList.push(oscillator);
        return oscillator;
    }

    /**
     * 获取空闲振荡器
     * @returns {Oscillator}
     */
    getFreeOscillator()
    {
        for (let o of this.oscillatorList)
        {
            if (o.free)
                return o;
        }
        return this.addOscillator();
    }

    /**
     * 敲响一个音符
     * @param {number} pitch
     * @param {number} duration
     * @param {number} volume
     * @returns {Promise<void>}
     */
    async strikeNode(pitch, duration, volume)
    {
        let oscillator = this.getFreeOscillator();
        oscillator.setPitch(pitch);
        oscillator.initVolume = volume;
        await oscillator.strike(duration);
    }
}