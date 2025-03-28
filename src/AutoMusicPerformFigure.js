import { AudioPipeline } from "./AudioPipeline.js";
import { NotationPlayer } from "./NotationPlayer";

/**
 * 自动演奏人偶 上下文
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

    constructor()
    {
        this.pipeline = new AudioPipeline();
        this.notationPlayer = new NotationPlayer(this.pipeline);
    }

    /**
     * 停止演奏
     */
    stop()
    {}

    /**
     * 开始演奏
     * 或恢复演奏
     */
    start()
    {}

    /**
     * 随机切换
     */
    randomSwitch()
    {}
}