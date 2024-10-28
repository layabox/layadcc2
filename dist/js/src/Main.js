const { regClass, property } = Laya;
let Main = class Main extends Laya.Script {
    onStart() {
        console.log("Game start");
    }
};
Main = __decorate([
    regClass()
], Main);
export { Main };
