import { AudioPipeline } from "../src/audio/AudioPipeline.js";
import { AutoMusicPerformFigure } from "../src/AutoMusicPerformFigure.js";
import { MidiFile } from "../src/notation/MidiFile.js";
import { NotationPlayer } from "../src/notation/NotationPlayer.js";
import { delayPromise } from "../src/util/delayPromise.js";



(async () =>
{
    {
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.left = "0";
        document.body.style.top = "0";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.parentElement.style.margin = "0";
    }

    let textElement = document.createElement("div");
    textElement.innerText = "点击屏幕播放";
    document.body.appendChild(textElement);

    await new Promise(resolve =>
    {
        document.body.addEventListener("click", () =>
        {
            resolve();
        });
    });

    textElement.remove();

    {
        let figure = new AutoMusicPerformFigure();

        figure.addScore({
            name: "一千光年",
            midiUrl: "./midi/一千光年.mid"
        });
        // figure.addScore({
        //     name: "三日月ステップ",
        //     midiUrl: "./midi/三日月ステップ.mid"
        // });
        figure.addScore({
            name: "IMAWANOKIWA",
            midiUrl: "./midi/IMAWANOKIWA.mid"
        });
        figure.addScore({
            name: "ひとときの安息",
            midiUrl: "./midi/ひとときの安息_千恋万花.mid"
        });
        figure.addScore({
            name: "phony",
            midiUrl: "./midi/phony.mid"
        });
        figure.addScore({
            name: "致涂黑世界的书信",
            midiUrl: "./midi/kuronurisekaiateshokan.mid"
        });
        figure.addScore({
            name: "少女レイ",
            midiUrl: "./midi/Shoujo-Rei.mid"
        });
        figure.addScore({
            name: "Bittersweet",
            midiUrl: "./midi/Bittersweet.mid"
        });
        figure.addScore({
            name: "捕食ひ捕食",
            midiUrl: "./midi/捕食ひ捕食.mid"
        });
        figure.addScore({
            name: "1000年生きてる",
            midiUrl: "./midi/1000年生きてる.mid"
        });
        figure.addScore({
            name: "魔法少女とチョコレゐト",
            midiUrl: "./midi/魔法少女とチョコレゐト.mid"
        });
        figure.addScore({
            name: "熱異常",
            midiUrl: "./midi/熱異常.mid"
        });
        figure.addScore({
            name: "水死体にもどらないで",
            midiUrl: "./midi/水死体にもどらないで.mid"
        });
        figure.addScore({
            name: "きゅうくらりん",
            midiUrl: "./midi/きゅうくらりん.mid"
        });
        figure.addScore({
            name: "くろうばあないと",
            midiUrl: "./midi/くろうばあないと.mid"
        });
        figure.addScore({
            name: "ジレンマ",
            midiUrl: "./midi/ジレンマ.mid"
        });
        figure.addScore({
            name: "バベル",
            midiUrl: "./midi/バベル.mid"
        });
        figure.addScore({
            name: "フューチャー・イヴ",
            midiUrl: "./midi/フューチャー・イヴ.mid"
        });
        figure.addScore({
            name: "メズマライザー",
            midiUrl: "./midi/メズマライザー.mid"
        });
        figure.addScore({
            name: "ももいろの鍵",
            midiUrl: "./midi/ももいろの鍵.mid"
        });
        figure.addScore({
            name: "Liar_Dancer",
            midiUrl: "./midi/Liar_Dancer.mid"
        });

        figure.notationPlayer.strikeCallback = async (pitch, duration) =>
        {
            // console.log("strike", pitch, duration);

            let node = document.createElement("div");
            node.style.position = "fixed";
            node.style.left = "100%";
            node.style.top = ((pitch * -0.9) + 50).toFixed(3) + "%";
            node.style.height = "2%";
            node.style.width = (duration / 15).toFixed(3) + "%";
            node.style.backgroundColor = "rgb(0, 0, 0)";
            document.body.appendChild(node);
            let animation = node.animate([
                {
                    left: ""
                },
                {
                    left: "-100%"
                }
            ], 3000);
            await animation.finished;
            node.remove();
        };

        figure.start();
    }

})();