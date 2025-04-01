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
            midiUrl: "./midi/一千光年___One-thousand_Light-years.mid"
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
            midiUrl: "./midi/75838_Shoujo-Rei.mid"
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