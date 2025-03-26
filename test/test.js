import { AudioPipeline } from "../src/AudioPipeline.js";
import { MidiFile } from "../src/MidiFile.js";
import { NotationPlayer } from "../src/NotationPlayer.js";
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

    await new Promise(resolve =>
    {
        document.body.addEventListener("click", () =>
        {
            resolve();
        });
    });

    {

        let pipeline = new AudioPipeline();

        let notaionPlayer = new NotationPlayer(pipeline);

        let midiFileData = new Uint8Array(await (await fetch("./midi/一千光年___One-thousand_Light-years.mid")).arrayBuffer());
        let file = MidiFile.decode(midiFileData);

        notaionPlayer.setMidiFile(file);

        notaionPlayer.strikeCallback = async (pitch, duration) =>
        {
            console.log("strike", pitch, duration);

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

        notaionPlayer.play();
    }
})();