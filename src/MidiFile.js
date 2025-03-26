/**
 * midi文件实例
 * 用于简单解析midi格式文件
 */
export class MidiFile
{
    /**
     * @type {Array<{
     *  time: number,
     *  key: number,
     *  down: boolean,
     *  velocity: number
     * }>}
     */
    keySequence = [];

    constructor()
    { }

    /**
     * 解码文件的轨道部分
     * @param {Uint8Array} chunkData
     */
    #decodeTrack(chunkData)
    {
        let chunkView = new DataView(chunkData.buffer, chunkData.byteOffset, chunkData.byteLength);

        let i = 0;

        let lastEventState = 0;
        let nowTime = 0;
        while (i < chunkData.length)
        {
            let deltaTime = 0;
            ({ value: deltaTime, endIndex: i } = getVint(chunkData, i));

            nowTime += deltaTime;

            let eventState = chunkData[i++];

            if (!(eventState & 0x80))
            { // eventState相同 节省一个字节
                eventState = lastEventState;
                i--;
            }
            let eventType = eventState & 0xf0;
            let eventChannel = eventState & 0x0f;

            if (eventType == 0x80)
            { // 弹起
                let note = chunkData[i++];
                let velocity = chunkData[i++];
                this.keySequence.push({
                    time: nowTime,
                    key: note,
                    down: false,
                    velocity: velocity
                });
                // console.log("up", note, velocity);
            }
            else if (eventType == 0x90)
            { // 按下
                let note = chunkData[i++];
                let velocity = chunkData[i++];
                this.keySequence.push({
                    time: nowTime,
                    key: note,
                    down: velocity != 0,
                    velocity: velocity
                });
                // console.log("down", note, velocity);
            }
            else if (eventType == 0xa0)
            { // 改变触后压力
                let note = chunkData[i++];
                let velocity = chunkData[i++];
            }
            else if (eventType == 0xb0)
            { // 设置控制器
                let controller = chunkData[i++];
                let value = chunkData[i++];
            }
            else if (eventType == 0xc0)
            { // 更改音色
                let program = chunkData[i++];
            }
            else if (eventType == 0xd0)
            { // 改变通道上所有触后压力
                let pressure = chunkData[i++];
            }
            else if (eventType == 0xe0)
            { // 弯音
                let pitchWheelChange = chunkData[i] | (chunkData[i + 1] << 7);
                i += 2;
            }
            else if (eventState == 0xf0)
            { // SysEx消息
                let eventLength = 0;
                ({ value: eventLength, endIndex: i } = getVint(chunkData, i));
                i += eventLength;
            }
            else if (eventState == 0xf7)
            { // SysEx延续消息
                let eventLength = 0;
                ({ value: eventLength, endIndex: i } = getVint(chunkData, i));
                i += eventLength;
            }
            else if (eventState == 0xff)
            { // 元数据
                let metaEventType = chunkData[i++];
                let eventLength = 0;
                ({ value: eventLength, endIndex: i } = getVint(chunkData, i));
                i += eventLength;
            }
            else
            {
                throw `A midi event type (eventState=${eventState}) has occurred that cannot be resolved`;
            }

            lastEventState = eventState;
        }
    }

    /**
     * 解码mide文件
     * @param {Uint8Array} data
     */
    static decode(data)
    {
        let ret = new MidiFile();

        let view = new DataView(data.buffer, data.byteOffset, data.byteLength);

        let index = 0;
        while (index < data.byteLength)
        {
            if (data.byteLength - index < 8)
                throw "An error occurred while parsing midi format";
            let chunkType = (new TextDecoder()).decode(data.subarray(index, index + 4));
            index += 4;
            let chunkLength = view.getUint32(index, false);
            index += 4;
            if (data.byteLength - index < chunkLength)
                throw "An error occurred while parsing midi format";
            let chunkData = data.subarray(index, index + chunkLength);

            if (chunkType == "MThd")
            { // midi头信息
                let chunkView = new DataView(chunkData.buffer, chunkData.byteOffset, chunkData.byteLength);
                let trackType = chunkView.getUint16(0, false);
                let trackCount = chunkView.getUint16(2, false);
                if (!(chunkData[4] & 0x80))
                {
                    let tickSpeed = chunkView.getUint16(4, false);
                }
                else
                {
                    let smtpe = chunkView.getInt8(4);
                    let tickSpeedPerFrame = chunkData[5];
                }
            }
            else if (chunkType == "MTrk")
            { // midi轨道信息
                ret.#decodeTrack(chunkData);
            }
            else
            {
                throw "An error occurred while parsing midi format";
            }

            index += chunkLength;
        }

        return ret;
    }
}

/**
 * 获取边长型数
 * @param {Uint8Array} data
 * @param {number} index
 * @returns {{
 *  endIndex: number,
 *  value: number
 * }}
 */
function getVint(data, index)
{
    let value = 0;

    let now = 0;
    do
    {
        now = data[index++];
        value = (value << 7) | (now & 0x7f);
    }
    while (now & 0x80);

    return {
        endIndex: index,
        value: value
    };
}