import { compress } from "../lib/compress.js";

export class CardUI {
    constructor(card) {
        this.card = card;
        this.template = null
        this.develop = true
    }

    async init() {
        if (this.develop){
            console.log("(re)loading template")
            this.template = await this.loadTemplate("../templates/card.html")
        }else if (!this.template){
            this.template = await this.loadTemplate("https://raw.githubusercontent.com/Roll-for-Initiative/roll-v2/refs/heads/main/templates/card.html")
        }
        this.createElement()
        this.findElements();
        this.findElements();
        this.bindEvents();
        await this.render();
    }

    async show() {
        const event = new CustomEvent("raycaster:inactive", {
            bubbles: true,
        });
        document.dispatchEvent(event);
        await this.init();
    }

    async loadTemplate(url) {
        return await (
            await fetch(url)
        ).text();
    }

    createElement(){
        this.element = document.createElement("div");
        this.element.classList.add("modal");
        this.element.innerHTML = this.template
        document.body.appendChild(this.element);
    }

    hide(e) {
        this.element.remove();
        setTimeout(() => {
            const event = new CustomEvent("raycaster:active", {
                bubbles: true,
            });
            document.dispatchEvent(event);
        }, 500);
    }

    findElements() {
        this.imageEl = this.element.querySelector(".card-editor__image");
        this.inputNameEl = this.element.querySelector(".card-editor__input-name");
        this.closeBtnEl = this.element.querySelector(".card-editor__close");
        this.inputImageEl = this.element.querySelector(".card-editor__input-image");
        this.inputModifierEl = this.element.querySelector(".card-editor__modifier")
        this.inputRollEl = this.element.querySelector(".card-editor__roll")
        this.inputRerollEl = this.element.querySelector(".card-editor__reroll")
        this.deleteBtnEl = this.element.querySelector(".card-editor__delete")
    }

    bindEvents() {
        this.closeBtnEl.addEventListener("click", this.hide.bind(this));
        this.inputNameEl.addEventListener("change", this.onNameChange.bind(this));
        this.inputImageEl.addEventListener("change", this.onImageChange.bind(this));
        this.inputModifierEl.addEventListener("change", this.onModifierChange.bind(this))
        this.deleteBtnEl.addEventListener("click", this.onDelete.bind(this))
    }

    onNameChange(e) {
        this.card.updateName(e.target.value);
    }

    onModifierChange(e){
        this.card.updateModifier(e.target.value)
    }

    onDelete(e){
        this.card.delete()
        this.hide()
    }

    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    }

    async onImageChange(e) {
        // let url = window.URL.createObjectURL(e.target.files[0]);
        const url = await compress(e.target.files[0], 140);
        this.card.setPicture(url, true);
        this.imageEl.src = url;
    }

    async render() {
        this.inputNameEl.value = this.card.name;
        if (this.card.imageSrc) {
            this.imageEl.src = this.card.imageSrc;
        }
        this.inputModifierEl.value = this.card.modifier
        this.inputRollEl.value = parseInt(this.card.roll) -  parseInt(this.card.modifier)
        this.inputRerollEl.value = this.card.reRoll?  this.card.reRoll - this.card.modifier : "x"
    }
}
