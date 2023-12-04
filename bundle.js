(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    var template = "<style>\r\n    .slide-verify-wrapper{\r\n        position: relative;\r\n    }\r\n    .slide-verify-groove{\r\n        width: 100%;\r\n        height: 40px;\r\n        border: #ebebeb solid thin;\r\n        box-sizing: border-box;\r\n    }\r\n    .slide-verify-bar{\r\n        width: 34px;\r\n        height: 34px;\r\n        margin: 2px;\r\n        border-radius: 2px;\r\n        cursor: move;\r\n        background: #d0d0d0;\r\n        position: relative\r\n    }\r\n    .slide-verify-bar::after{\r\n        content: ' ';\r\n        position: absolute;\r\n        width: 100%;\r\n        height: 100%;\r\n        background:\r\n                radial-gradient(circle at 30% 30%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 50% 30%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 70% 30%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 30% 50%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 50% 50%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 70% 50%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 30% 70%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 50% 70%, #e9e9e9 2px, transparent 3px),\r\n                radial-gradient(circle at 70% 70%, #e9e9e9 2px, transparent 3px);\r\n    }\r\n</style>\r\n<div class=\"slide-verify-wrapper\">\r\n    <canvas></canvas>\r\n    <div class=\"slide-verify-groove\">\r\n        <div class=\"slide-verify-bar\"></div>\r\n    </div>\r\n</div>\r\n";

    const blockPath = 'M201.5 255.392h136.964v-61.256c0-58.636 47.37-106.258 106.005-106.57 56.974-0.305 103.406 45.636 103.71 102.61 0.005 0.935-0.003 1.87-0.023 2.805l-1.365 62.41h132.79c57.162 0 103.5 46.34 103.5 103.5v137.05h63.882C903.316 495.941 949 541.625 949 597.98c0 56.353-45.684 102.037-102.037 102.037H783.08V834.5c0 57.161-46.338 103.5-103.5 103.5H550.474v-64.993c0-61.203-49.615-110.818-110.819-110.818-61.203 0-110.818 49.615-110.818 110.818V938H201.5C144.339 938 98 891.661 98 834.5V703.45h71.98c60.436 0 109.428-48.993 109.428-109.428 0-60.435-48.992-109.428-109.427-109.428H98V358.892c0-57.162 46.339-103.5 103.5-103.5z';

    class SlideVerify extends HTMLElement {

        root =   null;
        canvas =  null;
        slideBar =  null;
        slideGroove = null;

        // 是否准备好进行验证
        isReady = false;

        // 宽度
        width = 500;

        // canvas高度
        height = 300;

        image_url = '';

        // 当前图片
        image = null;

        // canvas的context
        ctx = null;

        // 是否正在拖动
        isDrag = false;

        // 最大偏差
        maxOffset = 4;

        // 缺口位置
        gapPosition = {
            x: 0,
            y: 0
        };

        // 缺块位置
        blockPosition = {
            x: 0,
            y: 0
        }

        // 缺块的路径
        gapPath = new Path2D(blockPath);

        static get observedAttributes() {return ['width', 'height', 'image']; }

        constructor() {
            super();

            const shadow = this.attachShadow({mode: 'open'});

            // 初始化dom结构
            const tempNode = document.createElement('div');
            tempNode.innerHTML = template;
            const dom = tempNode.childNodes;

            for (let i = 0; i < dom.length; i++) {
                shadow.appendChild(dom[i]);
            }

            this.root = this.shadowRoot?.querySelector('.slide-verify-wrapper');
            this.canvas = this.shadowRoot?.querySelector('canvas');
            this.slideBar = this.shadowRoot?.querySelector('.slide-verify-bar');
            this.slideGroove = this.shadowRoot?.querySelector('.slide-verify-groove');
            this.ctx = this.canvas?.getContext('2d');

        }

        updateSize() {
           this.root.style.width = `${this.width}px`;
           this.canvas?.setAttribute('width', this.width);
           this.canvas?.setAttribute('height', this.height);
        }

        updateStyle() {
            this.slideGroove.style = `background: linear-gradient(90deg, #f3f3f3 ${this.blockPosition.x}px, white ${this.blockPosition.x}px);`;
            this.slideBar.style = `transform: translateX(${this.blockPosition.x}px);background: #bbbbbb;`;
        }

        verify = () => {

            this.isReady = false;

            const offset = Math.abs(this.gapPosition.x - this.blockPosition.x);
            if (offset <= this.maxOffset) {
                this.slideGroove.style = `
          background: linear-gradient(90deg, #daffda ${this.blockPosition.x}px, white ${this.blockPosition.x}px);
        `;
            } else {
                this.slideGroove.style = `
          background: linear-gradient(90deg, #ffd9d9 ${this.blockPosition.x}px, white ${this.blockPosition.x}px);
        `;
            }
            const event = new CustomEvent('verify', {
                detail: offset <= this.maxOffset
            });
            this.dispatchEvent(event);

        }

        reset = () => {

            // 更新插件的大小
            this.updateSize();

            // 加载图片
            this.image = new Image();
            this.image.src = this.image_url;
            this.image.onload = () => {

                this.slideGroove.style = '';

                this.gapPosition = {
                    x: Math.floor(Math.random() * (this.width - 40)),
                    y: Math.floor(Math.random() * (this.height - 40))
                };
                this.blockPosition = {
                    x: 0,
                    y: 0
                };

                this.draw();
                this.initEvent();
                this.isReady = true;

            };

        }

        handleDrag = (e) => {
            if(!this.isReady || !this.isDrag) { return null; }
            const dx = e.movementX;
            this.blockPosition.x = Math.min(Math.max(this.blockPosition.x + dx, 0), this.width - 40);
            requestAnimationFrame(this.draw);
        }

        handleMouseup = () => {
            this.isDrag = false;
            this.isReady = false;
            this.verify();
            document.removeEventListener('mousemove', this.handleDrag);
            document.removeEventListener('mouseup', this.handleMouseup);
        }

        handleMousedown = (e) => {

            if (this.isReady && (e.target === this.canvas || e.target === this.slideBar)) {

                this.isDrag = true;
                document.addEventListener('mousemove', this.handleDrag);
                document.addEventListener('mouseup', this.handleMouseup);
            }

        }

        initEvent() {

            this.root.addEventListener('mousedown', this.handleMousedown);
            this.addEventListener('reset', () => {
                this.reset();
            });

        }

        draw = () => {
            // 清空画布
            this.ctx.strokeStyle = 'black';
            this.ctx.clearRect(0, 0, this.width, this.height);

            // 背景绘制
            this.ctx.drawImage(this.image, 0, 0, this.width, this.height);


            // 绘制拼图缺失口
            this.ctx.save();
            this.ctx.setTransform(0.044, 0, 0, 0.044, this.gapPosition.x, this.gapPosition.y);
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.lineWidth = 20;
            this.ctx.stroke(this.gapPath);
            this.ctx.fill(this.gapPath);
            this.ctx.restore();

            // 绘制拼图块
            this.ctx.save();
            this.ctx.setTransform(0.044, 0, 0, 0.044, this.blockPosition.x, this.gapPosition.y);
            this.ctx.clip(this.gapPath);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.drawImage(this.image, -(this.gapPosition.x - this.blockPosition.x), 0, this.width, this.height);
            this.ctx.restore();

            // 绘制边框
            this.ctx.save();
            this.ctx.setTransform(0.044, 0, 0, 0.044, this.blockPosition.x, this.gapPosition.y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 20;
            this.ctx.stroke(this.gapPath);
            this.ctx.restore();

            this.updateStyle();
        }



        disconnectedCallback() {
            console.log('slide verify disconnectedCallback');
        }

        connectedCallback() {
            // 元素连接到文档后设置size，并绘制
            this.width = this.getAttribute('width');
            this.height = this.getAttribute('height');
            this.image_url = this.getAttribute('image');
            this.reset();

        }
    }

    customElements.define('verify-component', SlideVerify);

}));
