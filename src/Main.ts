import { LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";

const { regClass, property } = Laya;

@regClass()
export class Main extends Laya.Script {

    onStart() {
        console.log("Game start");
    }
}