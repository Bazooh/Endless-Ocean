export class Input {

    forward = false;
    backward = false;
    up = false;
    down = false;
    left = false;
    right = false;

    constructor() {
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    
    onKeyDown(event) {this.changeKeyInput(event.keyCode, true)};
    onKeyUp(event) {this.changeKeyInput(event.keyCode, false)};
    
    changeKeyInput(keyCode, isDown) {
        switch(keyCode) {
            case 87:
            case 38:
                this.forward = isDown;
                break;
            case 83:
            case 40:
                this.backward = isDown;
                break;
            case 68:
            case 39:
                this.right = isDown;
                break;
            case 65:
            case 37:
                this.left = isDown;
                break;
            case 32:
                this.up = isDown;
                break;
            case 16:
                this.down = isDown;
                break;
            
        }
    }

}

