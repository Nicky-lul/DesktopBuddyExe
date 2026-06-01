(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("This extension must run unsandboxed.");
  }

  const vm = Scratch.vm;
  const renderer = vm.renderer;
  const texts = new Map();
  const quality = 4;

  function makeCanvas(data) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let width = 1;
    let height = 1;

    for (const item of data.items) {
      ctx.font = `${item.size}px ${item.font}`;
      const metrics = ctx.measureText(item.text);
      width = Math.max(width, Math.abs(item.x) + metrics.width + 40);
      height = Math.max(height, Math.abs(item.y) + item.size * 2 + 40);
    }

    canvas.width = width * quality;
    canvas.height = height * quality;

    ctx.scale(quality, quality);

    const centerX = width / 2;
    const centerY = height / 2;

    for (const item of data.items) {
      ctx.font = `${item.size}px ${item.font}`;
      ctx.fillStyle = item.color;
      ctx.textBaseline = "middle";
      ctx.textAlign = item.align;

      ctx.fillText(item.text, centerX + item.x, centerY - item.y);
    }

    return canvas;
  }

  function updateText(target) {
    const data = texts.get(target.id);
    if (!data || data.items.length === 0) return;

    const canvas = makeCanvas(data);

    if (data.skinId === null) {
      data.skinId = renderer.createBitmapSkin(canvas, quality);
      data.drawableId = renderer.createDrawable("sprite");
      renderer.updateDrawableSkinId(data.drawableId, data.skinId);
    } else {
      renderer.updateBitmapSkin(data.skinId, canvas, quality);
    }

    renderer.updateDrawableProperties(data.drawableId, {
      position: [target.x, target.y],
      direction: target.direction,
      scale: [target.size, target.size],
      visible: target.visible
    });
  }

  vm.runtime.on("RUNTIME_STEP_START", () => {
    for (const target of vm.runtime.targets) {
      if (!target.isOriginal) continue;
      updateText(target);
    }
  });

  class SpriteText {
    getInfo() {
      return {
        id: "spritetext",
        name: "Sprite Text",
        color1: "#4C97FF",
        blocks: [
          {
            opcode: "addText",
            blockType: Scratch.BlockType.COMMAND,
            text: "add text [TEXT]",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello!"
              }
            }
          },
          {
            opcode: "setStyle",
            blockType: Scratch.BlockType.COMMAND,
            text: "set font [FONT] size [SIZE] color [COLOR] align [ALIGN]",
            arguments: {
              FONT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Arial"
              },
              SIZE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 24
              },
              COLOR: {
                type: Scratch.ArgumentType.COLOR,
                defaultValue: "#ffffff"
              },
              ALIGN: {
                type: Scratch.ArgumentType.STRING,
                menu: "alignments",
                defaultValue: "center"
              }
            }
          },
          {
            opcode: "setPosition",
            blockType: Scratch.BlockType.COMMAND,
            text: "set text position x [X] y [Y]",
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: "getX",
            blockType: Scratch.BlockType.REPORTER,
            text: "text x"
          },
          {
            opcode: "getY",
            blockType: Scratch.BlockType.REPORTER,
            text: "text y"
          },
          {
            opcode: "getFontSize",
            blockType: Scratch.BlockType.REPORTER,
            text: "font size"
          },
          {
            opcode: "clearText",
            blockType: Scratch.BlockType.COMMAND,
            text: "clear all sprite text"
          }
        ],
        menus: {
          alignments: {
            acceptReporters: true,
            items: ["left", "center", "right"]
          }
        }
      };
    }

    ensure(target) {
      if (!texts.has(target.id)) {
        texts.set(target.id, {
          current: {
            font: "Arial",
            size: 24,
            color: "#ffffff",
            align: "center",
            x: 0,
            y: 0
          },
          items: [],
          skinId: null,
          drawableId: null
        });
      }

      return texts.get(target.id);
    }

    addText(args, util) {
      const target = util.target;
      const data = this.ensure(target);

      data.items.push({
        text: String(args.TEXT),
        font: data.current.font,
        size: data.current.size,
        color: data.current.color,
        align: data.current.align,
        x: data.current.x,
        y: data.current.y
      });

      updateText(target);
    }

    setStyle(args, util) {
      const target = util.target;
      const data = this.ensure(target);

      data.current.font = String(args.FONT);
      data.current.size = Number(args.SIZE) || 24;
      data.current.color = String(args.COLOR);
      data.current.align = String(args.ALIGN);

      updateText(target);
    }

    setPosition(args, util) {
      const target = util.target;
      const data = this.ensure(target);

      data.current.x = Number(args.X) || 0;
      data.current.y = Number(args.Y) || 0;

      updateText(target);
    }

    getX(args, util) {
      return this.ensure(util.target).current.x;
    }

    getY(args, util) {
      return this.ensure(util.target).current.y;
    }

    getFontSize(args, util) {
      return this.ensure(util.target).current.size;
    }

    clearText(args, util) {
      const target = util.target;
      const data = texts.get(target.id);

      if (data && data.drawableId !== null) {
        renderer.destroyDrawable(data.drawableId, "sprite");
      }

      texts.delete(target.id);
    }
  }

  Scratch.extensions.register(new SpriteText());
})(Scratch);