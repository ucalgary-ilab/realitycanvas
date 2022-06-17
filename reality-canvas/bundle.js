(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Animation = void 0;

var _Global = require("./Global.js");

var _Util = require("./Util.js");

var now = function () {
  if (_Global.glob.performance && _Global.glob.performance.now) {
    return function () {
      return _Global.glob.performance.now();
    };
  }

  return function () {
    return new Date().getTime();
  };
}();

class Animation {
  constructor(func, layers) {
    this.id = Animation.animIdCounter++;
    this.frame = {
      time: 0,
      timeDiff: 0,
      lastTime: now(),
      frameRate: 0
    };
    this.func = func;
    this.setLayers(layers);
  }

  setLayers(layers) {
    var lays = [];

    if (!layers) {
      lays = [];
    } else if (layers.length > 0) {
      lays = layers;
    } else {
      lays = [layers];
    }

    this.layers = lays;
    return this;
  }

  getLayers() {
    return this.layers;
  }

  addLayer(layer) {
    var layers = this.layers,
        len = layers.length,
        n;

    for (n = 0; n < len; n++) {
      if (layers[n]._id === layer._id) {
        return false;
      }
    }

    this.layers.push(layer);
    return true;
  }

  isRunning() {
    var a = Animation,
        animations = a.animations,
        len = animations.length,
        n;

    for (n = 0; n < len; n++) {
      if (animations[n].id === this.id) {
        return true;
      }
    }

    return false;
  }

  start() {
    this.stop();
    this.frame.timeDiff = 0;
    this.frame.lastTime = now();

    Animation._addAnimation(this);

    return this;
  }

  stop() {
    Animation._removeAnimation(this);

    return this;
  }

  _updateFrameObject(time) {
    this.frame.timeDiff = time - this.frame.lastTime;
    this.frame.lastTime = time;
    this.frame.time += this.frame.timeDiff;
    this.frame.frameRate = 1000 / this.frame.timeDiff;
  }

  static _addAnimation(anim) {
    this.animations.push(anim);

    this._handleAnimation();
  }

  static _removeAnimation(anim) {
    var id = anim.id,
        animations = this.animations,
        len = animations.length,
        n;

    for (n = 0; n < len; n++) {
      if (animations[n].id === id) {
        this.animations.splice(n, 1);
        break;
      }
    }
  }

  static _runFrames() {
    var layerHash = {},
        animations = this.animations,
        anim,
        layers,
        func,
        n,
        i,
        layersLen,
        layer,
        key,
        needRedraw;

    for (n = 0; n < animations.length; n++) {
      anim = animations[n];
      layers = anim.layers;
      func = anim.func;

      anim._updateFrameObject(now());

      layersLen = layers.length;

      if (func) {
        needRedraw = func.call(anim, anim.frame) !== false;
      } else {
        needRedraw = true;
      }

      if (!needRedraw) {
        continue;
      }

      for (i = 0; i < layersLen; i++) {
        layer = layers[i];

        if (layer._id !== undefined) {
          layerHash[layer._id] = layer;
        }
      }
    }

    for (key in layerHash) {
      if (!layerHash.hasOwnProperty(key)) {
        continue;
      }

      layerHash[key].batchDraw();
    }
  }

  static _animationLoop() {
    var Anim = Animation;

    if (Anim.animations.length) {
      Anim._runFrames();

      _Util.Util.requestAnimFrame(Anim._animationLoop);
    } else {
      Anim.animRunning = false;
    }
  }

  static _handleAnimation() {
    if (!this.animRunning) {
      this.animRunning = true;

      _Util.Util.requestAnimFrame(this._animationLoop);
    }
  }

}

exports.Animation = Animation;
Animation.animations = [];
Animation.animIdCounter = 0;
Animation.animRunning = false;

},{"./Global.js":8,"./Util.js":16}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SceneCanvas = exports.HitCanvas = exports.Canvas = void 0;

var _Util = require("./Util.js");

var _Context = require("./Context.js");

var _Global = require("./Global.js");

var _Factory = require("./Factory.js");

var _Validators = require("./Validators.js");

var _pixelRatio;

function getDevicePixelRatio() {
  if (_pixelRatio) {
    return _pixelRatio;
  }

  var canvas = _Util.Util.createCanvasElement();

  var context = canvas.getContext('2d');

  _pixelRatio = function () {
    var devicePixelRatio = _Global.Konva._global.devicePixelRatio || 1,
        backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
    return devicePixelRatio / backingStoreRatio;
  }();

  return _pixelRatio;
}

class Canvas {
  constructor(config) {
    this.pixelRatio = 1;
    this.width = 0;
    this.height = 0;
    this.isCache = false;
    var conf = config || {};
    var pixelRatio = conf.pixelRatio || _Global.Konva.pixelRatio || getDevicePixelRatio();
    this.pixelRatio = pixelRatio;
    this._canvas = _Util.Util.createCanvasElement();
    this._canvas.style.padding = '0';
    this._canvas.style.margin = '0';
    this._canvas.style.border = '0';
    this._canvas.style.background = 'transparent';
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0';
    this._canvas.style.left = '0';
  }

  getContext() {
    return this.context;
  }

  getPixelRatio() {
    return this.pixelRatio;
  }

  setPixelRatio(pixelRatio) {
    var previousRatio = this.pixelRatio;
    this.pixelRatio = pixelRatio;
    this.setSize(this.getWidth() / previousRatio, this.getHeight() / previousRatio);
  }

  setWidth(width) {
    this.width = this._canvas.width = width * this.pixelRatio;
    this._canvas.style.width = width + 'px';

    var pixelRatio = this.pixelRatio,
        _context = this.getContext()._context;

    _context.scale(pixelRatio, pixelRatio);
  }

  setHeight(height) {
    this.height = this._canvas.height = height * this.pixelRatio;
    this._canvas.style.height = height + 'px';

    var pixelRatio = this.pixelRatio,
        _context = this.getContext()._context;

    _context.scale(pixelRatio, pixelRatio);
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  setSize(width, height) {
    this.setWidth(width || 0);
    this.setHeight(height || 0);
  }

  toDataURL(mimeType, quality) {
    try {
      return this._canvas.toDataURL(mimeType, quality);
    } catch (e) {
      try {
        return this._canvas.toDataURL();
      } catch (err) {
        _Util.Util.error('Unable to get data URL. ' + err.message + ' For more info read https://konvajs.org/docs/posts/Tainted_Canvas.html.');

        return '';
      }
    }
  }

}

exports.Canvas = Canvas;

_Factory.Factory.addGetterSetter(Canvas, 'pixelRatio', undefined, (0, _Validators.getNumberValidator)());

class SceneCanvas extends Canvas {
  constructor(config = {
    width: 0,
    height: 0
  }) {
    super(config);
    this.context = new _Context.SceneContext(this);
    this.setSize(config.width, config.height);
  }

}

exports.SceneCanvas = SceneCanvas;

class HitCanvas extends Canvas {
  constructor(config = {
    width: 0,
    height: 0
  }) {
    super(config);
    this.hitCanvas = true;
    this.context = new _Context.HitContext(this);
    this.setSize(config.width, config.height);
  }

}

exports.HitCanvas = HitCanvas;

},{"./Context.js":4,"./Factory.js":6,"./Global.js":8,"./Util.js":16,"./Validators.js":17}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Container = void 0;

var _Factory = require("./Factory.js");

var _Node = require("./Node.js");

var _Validators = require("./Validators.js");

class Container extends _Node.Node {
  constructor() {
    super(...arguments);
    this.children = [];
  }

  getChildren(filterFunc) {
    if (!filterFunc) {
      return this.children || [];
    }

    const children = this.children || [];
    var results = [];
    children.forEach(function (child) {
      if (filterFunc(child)) {
        results.push(child);
      }
    });
    return results;
  }

  hasChildren() {
    return this.getChildren().length > 0;
  }

  removeChildren() {
    this.getChildren().forEach(child => {
      child.parent = null;
      child.index = 0;
      child.remove();
    });
    this.children = [];

    this._requestDraw();

    return this;
  }

  destroyChildren() {
    this.getChildren().forEach(child => {
      child.parent = null;
      child.index = 0;
      child.destroy();
    });
    this.children = [];

    this._requestDraw();

    return this;
  }

  add(...children) {
    if (arguments.length > 1) {
      for (var i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
      }

      return this;
    }

    var child = children[0];

    if (child.getParent()) {
      child.moveTo(this);
      return this;
    }

    this._validateAdd(child);

    child.index = this.getChildren().length;
    child.parent = this;

    child._clearCaches();

    this.getChildren().push(child);

    this._fire('add', {
      child: child
    });

    this._requestDraw();

    return this;
  }

  destroy() {
    if (this.hasChildren()) {
      this.destroyChildren();
    }

    super.destroy();
    return this;
  }

  find(selector) {
    return this._generalFind(selector, false);
  }

  findOne(selector) {
    var result = this._generalFind(selector, true);

    return result.length > 0 ? result[0] : undefined;
  }

  _generalFind(selector, findOne) {
    var retArr = [];

    this._descendants(node => {
      const valid = node._isMatch(selector);

      if (valid) {
        retArr.push(node);
      }

      if (valid && findOne) {
        return true;
      }

      return false;
    });

    return retArr;
  }

  _descendants(fn) {
    let shouldStop = false;
    const children = this.getChildren();

    for (const child of children) {
      shouldStop = fn(child);

      if (shouldStop) {
        return true;
      }

      if (!child.hasChildren()) {
        continue;
      }

      shouldStop = child._descendants(fn);

      if (shouldStop) {
        return true;
      }
    }

    return false;
  }

  toObject() {
    var obj = _Node.Node.prototype.toObject.call(this);

    obj.children = [];
    this.getChildren().forEach(child => {
      obj.children.push(child.toObject());
    });
    return obj;
  }

  isAncestorOf(node) {
    var parent = node.getParent();

    while (parent) {
      if (parent._id === this._id) {
        return true;
      }

      parent = parent.getParent();
    }

    return false;
  }

  clone(obj) {
    var node = _Node.Node.prototype.clone.call(this, obj);

    this.getChildren().forEach(function (no) {
      node.add(no.clone());
    });
    return node;
  }

  getAllIntersections(pos) {
    var arr = [];
    this.find('Shape').forEach(function (shape) {
      if (shape.isVisible() && shape.intersects(pos)) {
        arr.push(shape);
      }
    });
    return arr;
  }

  _clearSelfAndDescendantCache(attr) {
    var _a;

    super._clearSelfAndDescendantCache(attr);

    if (this.isCached()) {
      return;
    }

    (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function (node) {
      node._clearSelfAndDescendantCache(attr);
    });
  }

  _setChildrenIndices() {
    var _a;

    (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function (child, n) {
      child.index = n;
    });

    this._requestDraw();
  }

  drawScene(can, top) {
    var layer = this.getLayer(),
        canvas = can || layer && layer.getCanvas(),
        context = canvas && canvas.getContext(),
        cachedCanvas = this._getCanvasCache(),
        cachedSceneCanvas = cachedCanvas && cachedCanvas.scene;

    var caching = canvas && canvas.isCache;

    if (!this.isVisible() && !caching) {
      return this;
    }

    if (cachedSceneCanvas) {
      context.save();
      var m = this.getAbsoluteTransform(top).getMatrix();
      context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);

      this._drawCachedSceneCanvas(context);

      context.restore();
    } else {
      this._drawChildren('drawScene', canvas, top);
    }

    return this;
  }

  drawHit(can, top) {
    if (!this.shouldDrawHit(top)) {
      return this;
    }

    var layer = this.getLayer(),
        canvas = can || layer && layer.hitCanvas,
        context = canvas && canvas.getContext(),
        cachedCanvas = this._getCanvasCache(),
        cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

    if (cachedHitCanvas) {
      context.save();
      var m = this.getAbsoluteTransform(top).getMatrix();
      context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);

      this._drawCachedHitCanvas(context);

      context.restore();
    } else {
      this._drawChildren('drawHit', canvas, top);
    }

    return this;
  }

  _drawChildren(drawMethod, canvas, top) {
    var _a;

    var context = canvas && canvas.getContext(),
        clipWidth = this.clipWidth(),
        clipHeight = this.clipHeight(),
        clipFunc = this.clipFunc(),
        hasClip = clipWidth && clipHeight || clipFunc;
    const selfCache = top === this;

    if (hasClip) {
      context.save();
      var transform = this.getAbsoluteTransform(top);
      var m = transform.getMatrix();
      context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      context.beginPath();

      if (clipFunc) {
        clipFunc.call(this, context, this);
      } else {
        var clipX = this.clipX();
        var clipY = this.clipY();
        context.rect(clipX, clipY, clipWidth, clipHeight);
      }

      context.clip();
      m = transform.copy().invert().getMatrix();
      context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    }

    var hasComposition = !selfCache && this.globalCompositeOperation() !== 'source-over' && drawMethod === 'drawScene';

    if (hasComposition) {
      context.save();

      context._applyGlobalCompositeOperation(this);
    }

    (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function (child) {
      child[drawMethod](canvas, top);
    });

    if (hasComposition) {
      context.restore();
    }

    if (hasClip) {
      context.restore();
    }
  }

  getClientRect(config) {
    var _a;

    config = config || {};
    var skipTransform = config.skipTransform;
    var relativeTo = config.relativeTo;
    var minX, minY, maxX, maxY;
    var selfRect = {
      x: Infinity,
      y: Infinity,
      width: 0,
      height: 0
    };
    var that = this;
    (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function (child) {
      if (!child.visible()) {
        return;
      }

      var rect = child.getClientRect({
        relativeTo: that,
        skipShadow: config.skipShadow,
        skipStroke: config.skipStroke
      });

      if (rect.width === 0 && rect.height === 0) {
        return;
      }

      if (minX === undefined) {
        minX = rect.x;
        minY = rect.y;
        maxX = rect.x + rect.width;
        maxY = rect.y + rect.height;
      } else {
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.width);
        maxY = Math.max(maxY, rect.y + rect.height);
      }
    });
    var shapes = this.find('Shape');
    var hasVisible = false;

    for (var i = 0; i < shapes.length; i++) {
      var shape = shapes[i];

      if (shape._isVisible(this)) {
        hasVisible = true;
        break;
      }
    }

    if (hasVisible && minX !== undefined) {
      selfRect = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    } else {
      selfRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }

    if (!skipTransform) {
      return this._transformedRect(selfRect, relativeTo);
    }

    return selfRect;
  }

}

exports.Container = Container;

_Factory.Factory.addComponentsGetterSetter(Container, 'clip', ['x', 'y', 'width', 'height']);

_Factory.Factory.addGetterSetter(Container, 'clipX', undefined, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Container, 'clipY', undefined, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Container, 'clipWidth', undefined, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Container, 'clipHeight', undefined, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Container, 'clipFunc');

},{"./Factory.js":6,"./Node.js":11,"./Validators.js":17}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SceneContext = exports.HitContext = exports.Context = void 0;

var _Util = require("./Util.js");

var _Global = require("./Global.js");

function simplifyArray(arr) {
  var retArr = [],
      len = arr.length,
      util = _Util.Util,
      n,
      val;

  for (n = 0; n < len; n++) {
    val = arr[n];

    if (util._isNumber(val)) {
      val = Math.round(val * 1000) / 1000;
    } else if (!util._isString(val)) {
      val = val + '';
    }

    retArr.push(val);
  }

  return retArr;
}

var COMMA = ',',
    OPEN_PAREN = '(',
    CLOSE_PAREN = ')',
    OPEN_PAREN_BRACKET = '([',
    CLOSE_BRACKET_PAREN = '])',
    SEMICOLON = ';',
    DOUBLE_PAREN = '()',
    EQUALS = '=',
    CONTEXT_METHODS = ['arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clearRect', 'clip', 'closePath', 'createLinearGradient', 'createPattern', 'createRadialGradient', 'drawImage', 'ellipse', 'fill', 'fillText', 'getImageData', 'createImageData', 'lineTo', 'moveTo', 'putImageData', 'quadraticCurveTo', 'rect', 'restore', 'rotate', 'save', 'scale', 'setLineDash', 'setTransform', 'stroke', 'strokeText', 'transform', 'translate'];
var CONTEXT_PROPERTIES = ['fillStyle', 'strokeStyle', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'lineCap', 'lineDashOffset', 'lineJoin', 'lineWidth', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'globalAlpha', 'globalCompositeOperation', 'imageSmoothingEnabled'];
const traceArrMax = 100;

class Context {
  constructor(canvas) {
    this.canvas = canvas;
    this._context = canvas._canvas.getContext('2d');

    if (_Global.Konva.enableTrace) {
      this.traceArr = [];

      this._enableTrace();
    }
  }

  fillShape(shape) {
    if (shape.fillEnabled()) {
      this._fill(shape);
    }
  }

  _fill(shape) {}

  strokeShape(shape) {
    if (shape.hasStroke()) {
      this._stroke(shape);
    }
  }

  _stroke(shape) {}

  fillStrokeShape(shape) {
    if (shape.attrs.fillAfterStrokeEnabled) {
      this.strokeShape(shape);
      this.fillShape(shape);
    } else {
      this.fillShape(shape);
      this.strokeShape(shape);
    }
  }

  getTrace(relaxed, rounded) {
    var traceArr = this.traceArr,
        len = traceArr.length,
        str = '',
        n,
        trace,
        method,
        args;

    for (n = 0; n < len; n++) {
      trace = traceArr[n];
      method = trace.method;

      if (method) {
        args = trace.args;
        str += method;

        if (relaxed) {
          str += DOUBLE_PAREN;
        } else {
          if (_Util.Util._isArray(args[0])) {
            str += OPEN_PAREN_BRACKET + args.join(COMMA) + CLOSE_BRACKET_PAREN;
          } else {
            if (rounded) {
              args = args.map(a => typeof a === 'number' ? Math.floor(a) : a);
            }

            str += OPEN_PAREN + args.join(COMMA) + CLOSE_PAREN;
          }
        }
      } else {
        str += trace.property;

        if (!relaxed) {
          str += EQUALS + trace.val;
        }
      }

      str += SEMICOLON;
    }

    return str;
  }

  clearTrace() {
    this.traceArr = [];
  }

  _trace(str) {
    var traceArr = this.traceArr,
        len;
    traceArr.push(str);
    len = traceArr.length;

    if (len >= traceArrMax) {
      traceArr.shift();
    }
  }

  reset() {
    var pixelRatio = this.getCanvas().getPixelRatio();
    this.setTransform(1 * pixelRatio, 0, 0, 1 * pixelRatio, 0, 0);
  }

  getCanvas() {
    return this.canvas;
  }

  clear(bounds) {
    var canvas = this.getCanvas();

    if (bounds) {
      this.clearRect(bounds.x || 0, bounds.y || 0, bounds.width || 0, bounds.height || 0);
    } else {
      this.clearRect(0, 0, canvas.getWidth() / canvas.pixelRatio, canvas.getHeight() / canvas.pixelRatio);
    }
  }

  _applyLineCap(shape) {
    var lineCap = shape.getLineCap();

    if (lineCap) {
      this.setAttr('lineCap', lineCap);
    }
  }

  _applyOpacity(shape) {
    var absOpacity = shape.getAbsoluteOpacity();

    if (absOpacity !== 1) {
      this.setAttr('globalAlpha', absOpacity);
    }
  }

  _applyLineJoin(shape) {
    var lineJoin = shape.attrs.lineJoin;

    if (lineJoin) {
      this.setAttr('lineJoin', lineJoin);
    }
  }

  setAttr(attr, val) {
    this._context[attr] = val;
  }

  arc(a0, a1, a2, a3, a4, a5) {
    this._context.arc(a0, a1, a2, a3, a4, a5);
  }

  arcTo(a0, a1, a2, a3, a4) {
    this._context.arcTo(a0, a1, a2, a3, a4);
  }

  beginPath() {
    this._context.beginPath();
  }

  bezierCurveTo(a0, a1, a2, a3, a4, a5) {
    this._context.bezierCurveTo(a0, a1, a2, a3, a4, a5);
  }

  clearRect(a0, a1, a2, a3) {
    this._context.clearRect(a0, a1, a2, a3);
  }

  clip() {
    this._context.clip();
  }

  closePath() {
    this._context.closePath();
  }

  createImageData(a0, a1) {
    var a = arguments;

    if (a.length === 2) {
      return this._context.createImageData(a0, a1);
    } else if (a.length === 1) {
      return this._context.createImageData(a0);
    }
  }

  createLinearGradient(a0, a1, a2, a3) {
    return this._context.createLinearGradient(a0, a1, a2, a3);
  }

  createPattern(a0, a1) {
    return this._context.createPattern(a0, a1);
  }

  createRadialGradient(a0, a1, a2, a3, a4, a5) {
    return this._context.createRadialGradient(a0, a1, a2, a3, a4, a5);
  }

  drawImage(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
    var a = arguments,
        _context = this._context;

    if (a.length === 3) {
      _context.drawImage(a0, a1, a2);
    } else if (a.length === 5) {
      _context.drawImage(a0, a1, a2, a3, a4);
    } else if (a.length === 9) {
      _context.drawImage(a0, a1, a2, a3, a4, a5, a6, a7, a8);
    }
  }

  ellipse(a0, a1, a2, a3, a4, a5, a6, a7) {
    this._context.ellipse(a0, a1, a2, a3, a4, a5, a6, a7);
  }

  isPointInPath(x, y) {
    return this._context.isPointInPath(x, y);
  }

  fill(path2d) {
    if (path2d) {
      this._context.fill(path2d);
    } else {
      this._context.fill();
    }
  }

  fillRect(x, y, width, height) {
    this._context.fillRect(x, y, width, height);
  }

  strokeRect(x, y, width, height) {
    this._context.strokeRect(x, y, width, height);
  }

  fillText(text, x, y, maxWidth) {
    if (maxWidth) {
      this._context.fillText(text, x, y, maxWidth);
    } else {
      this._context.fillText(text, x, y);
    }
  }

  measureText(text) {
    return this._context.measureText(text);
  }

  getImageData(a0, a1, a2, a3) {
    return this._context.getImageData(a0, a1, a2, a3);
  }

  lineTo(a0, a1) {
    this._context.lineTo(a0, a1);
  }

  moveTo(a0, a1) {
    this._context.moveTo(a0, a1);
  }

  rect(a0, a1, a2, a3) {
    this._context.rect(a0, a1, a2, a3);
  }

  putImageData(a0, a1, a2) {
    this._context.putImageData(a0, a1, a2);
  }

  quadraticCurveTo(a0, a1, a2, a3) {
    this._context.quadraticCurveTo(a0, a1, a2, a3);
  }

  restore() {
    this._context.restore();
  }

  rotate(a0) {
    this._context.rotate(a0);
  }

  save() {
    this._context.save();
  }

  scale(a0, a1) {
    this._context.scale(a0, a1);
  }

  setLineDash(a0) {
    if (this._context.setLineDash) {
      this._context.setLineDash(a0);
    } else if ('mozDash' in this._context) {
      this._context['mozDash'] = a0;
    } else if ('webkitLineDash' in this._context) {
      this._context['webkitLineDash'] = a0;
    }
  }

  getLineDash() {
    return this._context.getLineDash();
  }

  setTransform(a0, a1, a2, a3, a4, a5) {
    this._context.setTransform(a0, a1, a2, a3, a4, a5);
  }

  stroke(path2d) {
    if (path2d) {
      this._context.stroke(path2d);
    } else {
      this._context.stroke();
    }
  }

  strokeText(a0, a1, a2, a3) {
    this._context.strokeText(a0, a1, a2, a3);
  }

  transform(a0, a1, a2, a3, a4, a5) {
    this._context.transform(a0, a1, a2, a3, a4, a5);
  }

  translate(a0, a1) {
    this._context.translate(a0, a1);
  }

  _enableTrace() {
    var that = this,
        len = CONTEXT_METHODS.length,
        origSetter = this.setAttr,
        n,
        args;

    var func = function (methodName) {
      var origMethod = that[methodName],
          ret;

      that[methodName] = function () {
        args = simplifyArray(Array.prototype.slice.call(arguments, 0));
        ret = origMethod.apply(that, arguments);

        that._trace({
          method: methodName,
          args: args
        });

        return ret;
      };
    };

    for (n = 0; n < len; n++) {
      func(CONTEXT_METHODS[n]);
    }

    that.setAttr = function () {
      origSetter.apply(that, arguments);
      var prop = arguments[0];
      var val = arguments[1];

      if (prop === 'shadowOffsetX' || prop === 'shadowOffsetY' || prop === 'shadowBlur') {
        val = val / this.canvas.getPixelRatio();
      }

      that._trace({
        property: prop,
        val: val
      });
    };
  }

  _applyGlobalCompositeOperation(node) {
    const op = node.attrs.globalCompositeOperation;
    var def = !op || op === 'source-over';

    if (!def) {
      this.setAttr('globalCompositeOperation', op);
    }
  }

}

exports.Context = Context;
CONTEXT_PROPERTIES.forEach(function (prop) {
  Object.defineProperty(Context.prototype, prop, {
    get() {
      return this._context[prop];
    },

    set(val) {
      this._context[prop] = val;
    }

  });
});

class SceneContext extends Context {
  _fillColor(shape) {
    var fill = shape.fill();
    this.setAttr('fillStyle', fill);

    shape._fillFunc(this);
  }

  _fillPattern(shape) {
    this.setAttr('fillStyle', shape._getFillPattern());

    shape._fillFunc(this);
  }

  _fillLinearGradient(shape) {
    var grd = shape._getLinearGradient();

    if (grd) {
      this.setAttr('fillStyle', grd);

      shape._fillFunc(this);
    }
  }

  _fillRadialGradient(shape) {
    var grd = shape._getRadialGradient();

    if (grd) {
      this.setAttr('fillStyle', grd);

      shape._fillFunc(this);
    }
  }

  _fill(shape) {
    var hasColor = shape.fill(),
        fillPriority = shape.getFillPriority();

    if (hasColor && fillPriority === 'color') {
      this._fillColor(shape);

      return;
    }

    var hasPattern = shape.getFillPatternImage();

    if (hasPattern && fillPriority === 'pattern') {
      this._fillPattern(shape);

      return;
    }

    var hasLinearGradient = shape.getFillLinearGradientColorStops();

    if (hasLinearGradient && fillPriority === 'linear-gradient') {
      this._fillLinearGradient(shape);

      return;
    }

    var hasRadialGradient = shape.getFillRadialGradientColorStops();

    if (hasRadialGradient && fillPriority === 'radial-gradient') {
      this._fillRadialGradient(shape);

      return;
    }

    if (hasColor) {
      this._fillColor(shape);
    } else if (hasPattern) {
      this._fillPattern(shape);
    } else if (hasLinearGradient) {
      this._fillLinearGradient(shape);
    } else if (hasRadialGradient) {
      this._fillRadialGradient(shape);
    }
  }

  _strokeLinearGradient(shape) {
    var start = shape.getStrokeLinearGradientStartPoint(),
        end = shape.getStrokeLinearGradientEndPoint(),
        colorStops = shape.getStrokeLinearGradientColorStops(),
        grd = this.createLinearGradient(start.x, start.y, end.x, end.y);

    if (colorStops) {
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }

      this.setAttr('strokeStyle', grd);
    }
  }

  _stroke(shape) {
    var dash = shape.dash(),
        strokeScaleEnabled = shape.getStrokeScaleEnabled();

    if (shape.hasStroke()) {
      if (!strokeScaleEnabled) {
        this.save();
        var pixelRatio = this.getCanvas().getPixelRatio();
        this.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }

      this._applyLineCap(shape);

      if (dash && shape.dashEnabled()) {
        this.setLineDash(dash);
        this.setAttr('lineDashOffset', shape.dashOffset());
      }

      this.setAttr('lineWidth', shape.strokeWidth());

      if (!shape.getShadowForStrokeEnabled()) {
        this.setAttr('shadowColor', 'rgba(0,0,0,0)');
      }

      var hasLinearGradient = shape.getStrokeLinearGradientColorStops();

      if (hasLinearGradient) {
        this._strokeLinearGradient(shape);
      } else {
        this.setAttr('strokeStyle', shape.stroke());
      }

      shape._strokeFunc(this);

      if (!strokeScaleEnabled) {
        this.restore();
      }
    }
  }

  _applyShadow(shape) {
    var _a, _b, _c;

    var color = (_a = shape.getShadowRGBA()) !== null && _a !== void 0 ? _a : 'black',
        blur = (_b = shape.getShadowBlur()) !== null && _b !== void 0 ? _b : 5,
        offset = (_c = shape.getShadowOffset()) !== null && _c !== void 0 ? _c : {
      x: 0,
      y: 0
    },
        scale = shape.getAbsoluteScale(),
        ratio = this.canvas.getPixelRatio(),
        scaleX = scale.x * ratio,
        scaleY = scale.y * ratio;
    this.setAttr('shadowColor', color);
    this.setAttr('shadowBlur', blur * Math.min(Math.abs(scaleX), Math.abs(scaleY)));
    this.setAttr('shadowOffsetX', offset.x * scaleX);
    this.setAttr('shadowOffsetY', offset.y * scaleY);
  }

}

exports.SceneContext = SceneContext;

class HitContext extends Context {
  _fill(shape) {
    this.save();
    this.setAttr('fillStyle', shape.colorKey);

    shape._fillFuncHit(this);

    this.restore();
  }

  strokeShape(shape) {
    if (shape.hasHitStroke()) {
      this._stroke(shape);
    }
  }

  _stroke(shape) {
    if (shape.hasHitStroke()) {
      var strokeScaleEnabled = shape.getStrokeScaleEnabled();

      if (!strokeScaleEnabled) {
        this.save();
        var pixelRatio = this.getCanvas().getPixelRatio();
        this.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }

      this._applyLineCap(shape);

      var hitStrokeWidth = shape.hitStrokeWidth();
      var strokeWidth = hitStrokeWidth === 'auto' ? shape.strokeWidth() : hitStrokeWidth;
      this.setAttr('lineWidth', strokeWidth);
      this.setAttr('strokeStyle', shape.colorKey);

      shape._strokeFuncHit(this);

      if (!strokeScaleEnabled) {
        this.restore();
      }
    }
  }

}

exports.HitContext = HitContext;

},{"./Global.js":8,"./Util.js":16}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DD = void 0;

var _Global = require("./Global.js");

var _Util = require("./Util.js");

const DD = {
  get isDragging() {
    var flag = false;

    DD._dragElements.forEach(elem => {
      if (elem.dragStatus === 'dragging') {
        flag = true;
      }
    });

    return flag;
  },

  justDragged: false,

  get node() {
    var node;

    DD._dragElements.forEach(elem => {
      node = elem.node;
    });

    return node;
  },

  _dragElements: new Map(),

  _drag(evt) {
    const nodesToFireEvents = [];

    DD._dragElements.forEach((elem, key) => {
      const {
        node
      } = elem;
      const stage = node.getStage();
      stage.setPointersPositions(evt);

      if (elem.pointerId === undefined) {
        elem.pointerId = _Util.Util._getFirstPointerId(evt);
      }

      const pos = stage._changedPointerPositions.find(pos => pos.id === elem.pointerId);

      if (!pos) {
        return;
      }

      if (elem.dragStatus !== 'dragging') {
        var dragDistance = node.dragDistance();
        var distance = Math.max(Math.abs(pos.x - elem.startPointerPos.x), Math.abs(pos.y - elem.startPointerPos.y));

        if (distance < dragDistance) {
          return;
        }

        node.startDrag({
          evt
        });

        if (!node.isDragging()) {
          return;
        }
      }

      node._setDragPosition(evt, elem);

      nodesToFireEvents.push(node);
    });

    nodesToFireEvents.forEach(node => {
      node.fire('dragmove', {
        type: 'dragmove',
        target: node,
        evt: evt
      }, true);
    });
  },

  _endDragBefore(evt) {
    DD._dragElements.forEach(elem => {
      const {
        node
      } = elem;
      const stage = node.getStage();

      if (evt) {
        stage.setPointersPositions(evt);
      }

      const pos = stage._changedPointerPositions.find(pos => pos.id === elem.pointerId);

      if (!pos) {
        return;
      }

      if (elem.dragStatus === 'dragging' || elem.dragStatus === 'stopped') {
        DD.justDragged = true;
        _Global.Konva._mouseListenClick = false;
        _Global.Konva._touchListenClick = false;
        _Global.Konva._pointerListenClick = false;
        elem.dragStatus = 'stopped';
      }

      const drawNode = elem.node.getLayer() || elem.node instanceof _Global.Konva['Stage'] && elem.node;

      if (drawNode) {
        drawNode.batchDraw();
      }
    });
  },

  _endDragAfter(evt) {
    DD._dragElements.forEach((elem, key) => {
      if (elem.dragStatus === 'stopped') {
        elem.node.fire('dragend', {
          type: 'dragend',
          target: elem.node,
          evt: evt
        }, true);
      }

      if (elem.dragStatus !== 'dragging') {
        DD._dragElements.delete(key);
      }
    });
  }

};
exports.DD = DD;

if (_Global.Konva.isBrowser) {
  window.addEventListener('mouseup', DD._endDragBefore, true);
  window.addEventListener('touchend', DD._endDragBefore, true);
  window.addEventListener('mousemove', DD._drag);
  window.addEventListener('touchmove', DD._drag);
  window.addEventListener('mouseup', DD._endDragAfter, false);
  window.addEventListener('touchend', DD._endDragAfter, false);
}

},{"./Global.js":8,"./Util.js":16}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Factory = void 0;

var _Util = require("./Util.js");

var _Validators = require("./Validators.js");

var GET = 'get',
    SET = 'set';
const Factory = {
  addGetterSetter(constructor, attr, def, validator, after) {
    Factory.addGetter(constructor, attr, def);
    Factory.addSetter(constructor, attr, validator, after);
    Factory.addOverloadedGetterSetter(constructor, attr);
  },

  addGetter(constructor, attr, def) {
    var method = GET + _Util.Util._capitalize(attr);

    constructor.prototype[method] = constructor.prototype[method] || function () {
      var val = this.attrs[attr];
      return val === undefined ? def : val;
    };
  },

  addSetter(constructor, attr, validator, after) {
    var method = SET + _Util.Util._capitalize(attr);

    if (!constructor.prototype[method]) {
      Factory.overWriteSetter(constructor, attr, validator, after);
    }
  },

  overWriteSetter(constructor, attr, validator, after) {
    var method = SET + _Util.Util._capitalize(attr);

    constructor.prototype[method] = function (val) {
      if (validator && val !== undefined && val !== null) {
        val = validator.call(this, val, attr);
      }

      this._setAttr(attr, val);

      if (after) {
        after.call(this);
      }

      return this;
    };
  },

  addComponentsGetterSetter(constructor, attr, components, validator, after) {
    var len = components.length,
        capitalize = _Util.Util._capitalize,
        getter = GET + capitalize(attr),
        setter = SET + capitalize(attr),
        n,
        component;

    constructor.prototype[getter] = function () {
      var ret = {};

      for (n = 0; n < len; n++) {
        component = components[n];
        ret[component] = this.getAttr(attr + capitalize(component));
      }

      return ret;
    };

    var basicValidator = (0, _Validators.getComponentValidator)(components);

    constructor.prototype[setter] = function (val) {
      var oldVal = this.attrs[attr],
          key;

      if (validator) {
        val = validator.call(this, val);
      }

      if (basicValidator) {
        basicValidator.call(this, val, attr);
      }

      for (key in val) {
        if (!val.hasOwnProperty(key)) {
          continue;
        }

        this._setAttr(attr + capitalize(key), val[key]);
      }

      this._fireChangeEvent(attr, oldVal, val);

      if (after) {
        after.call(this);
      }

      return this;
    };

    Factory.addOverloadedGetterSetter(constructor, attr);
  },

  addOverloadedGetterSetter(constructor, attr) {
    var capitalizedAttr = _Util.Util._capitalize(attr),
        setter = SET + capitalizedAttr,
        getter = GET + capitalizedAttr;

    constructor.prototype[attr] = function () {
      if (arguments.length) {
        this[setter](arguments[0]);
        return this;
      }

      return this[getter]();
    };
  },

  addDeprecatedGetterSetter(constructor, attr, def, validator) {
    _Util.Util.error('Adding deprecated ' + attr);

    var method = GET + _Util.Util._capitalize(attr);

    var message = attr + ' property is deprecated and will be removed soon. Look at Konva change log for more information.';

    constructor.prototype[method] = function () {
      _Util.Util.error(message);

      var val = this.attrs[attr];
      return val === undefined ? def : val;
    };

    Factory.addSetter(constructor, attr, validator, function () {
      _Util.Util.error(message);
    });
    Factory.addOverloadedGetterSetter(constructor, attr);
  },

  backCompat(constructor, methods) {
    _Util.Util.each(methods, function (oldMethodName, newMethodName) {
      var method = constructor.prototype[newMethodName];

      var oldGetter = GET + _Util.Util._capitalize(oldMethodName);

      var oldSetter = SET + _Util.Util._capitalize(oldMethodName);

      function deprecated() {
        method.apply(this, arguments);

        _Util.Util.error('"' + oldMethodName + '" method is deprecated and will be removed soon. Use ""' + newMethodName + '" instead.');
      }

      constructor.prototype[oldMethodName] = deprecated;
      constructor.prototype[oldGetter] = deprecated;
      constructor.prototype[oldSetter] = deprecated;
    });
  },

  afterSetFilter() {
    this._filterUpToDate = false;
  }

};
exports.Factory = Factory;

},{"./Util.js":16,"./Validators.js":17}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FastLayer = void 0;

var _Util = require("./Util.js");

var _Layer = require("./Layer.js");

var _Global = require("./Global.js");

class FastLayer extends _Layer.Layer {
  constructor(attrs) {
    super(attrs);
    this.listening(false);

    _Util.Util.warn('Konva.Fast layer is deprecated. Please use "new Konva.Layer({ listening: false })" instead.');
  }

}

exports.FastLayer = FastLayer;
FastLayer.prototype.nodeType = 'FastLayer';
(0, _Global._registerNode)(FastLayer);

},{"./Global.js":8,"./Layer.js":10,"./Util.js":16}],8:[function(require,module,exports){
(function (global){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.glob = exports._registerNode = exports.Konva = void 0;
var PI_OVER_180 = Math.PI / 180;

function detectBrowser() {
  return typeof window !== 'undefined' && ({}.toString.call(window) === '[object Window]' || {}.toString.call(window) === '[object global]');
}

const glob = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : typeof WorkerGlobalScope !== 'undefined' ? self : {};
exports.glob = glob;
const Konva = {
  _global: glob,
  version: '8.3.9',
  isBrowser: detectBrowser(),
  isUnminified: /param/.test(function (param) {}.toString()),
  dblClickWindow: 400,

  getAngle(angle) {
    return Konva.angleDeg ? angle * PI_OVER_180 : angle;
  },

  enableTrace: false,
  pointerEventsEnabled: true,
  autoDrawEnabled: true,
  hitOnDragEnabled: false,
  capturePointerEventsEnabled: false,
  _mouseListenClick: false,
  _touchListenClick: false,
  _pointerListenClick: false,
  _mouseInDblClickWindow: false,
  _touchInDblClickWindow: false,
  _pointerInDblClickWindow: false,
  _mouseDblClickPointerId: null,
  _touchDblClickPointerId: null,
  _pointerDblClickPointerId: null,
  pixelRatio: typeof window !== 'undefined' && window.devicePixelRatio || 1,
  dragDistance: 3,
  angleDeg: true,
  showWarnings: true,
  dragButtons: [0, 1],

  isDragging() {
    return Konva['DD'].isDragging;
  },

  isDragReady() {
    return !!Konva['DD'].node;
  },

  document: glob.document,

  _injectGlobal(Konva) {
    glob.Konva = Konva;
  }

};
exports.Konva = Konva;

const _registerNode = NodeClass => {
  Konva[NodeClass.prototype.getClassName()] = NodeClass;
};

exports._registerNode = _registerNode;

Konva._injectGlobal(Konva);

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Group = void 0;

var _Util = require("./Util.js");

var _Container = require("./Container.js");

var _Global = require("./Global.js");

class Group extends _Container.Container {
  _validateAdd(child) {
    var type = child.getType();

    if (type !== 'Group' && type !== 'Shape') {
      _Util.Util.throw('You may only add groups and shapes to groups.');
    }
  }

}

exports.Group = Group;
Group.prototype.nodeType = 'Group';
(0, _Global._registerNode)(Group);

},{"./Container.js":3,"./Global.js":8,"./Util.js":16}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Layer = void 0;

var _Util = require("./Util.js");

var _Container = require("./Container.js");

var _Node = require("./Node.js");

var _Factory = require("./Factory.js");

var _Canvas = require("./Canvas.js");

var _Validators = require("./Validators.js");

var _Shape = require("./Shape.js");

var _Global = require("./Global.js");

var HASH = '#',
    BEFORE_DRAW = 'beforeDraw',
    DRAW = 'draw',
    INTERSECTION_OFFSETS = [{
  x: 0,
  y: 0
}, {
  x: -1,
  y: -1
}, {
  x: 1,
  y: -1
}, {
  x: 1,
  y: 1
}, {
  x: -1,
  y: 1
}],
    INTERSECTION_OFFSETS_LEN = INTERSECTION_OFFSETS.length;

class Layer extends _Container.Container {
  constructor(config) {
    super(config);
    this.canvas = new _Canvas.SceneCanvas();
    this.hitCanvas = new _Canvas.HitCanvas({
      pixelRatio: 1
    });
    this._waitingForDraw = false;
    this.on('visibleChange.konva', this._checkVisibility);

    this._checkVisibility();

    this.on('imageSmoothingEnabledChange.konva', this._setSmoothEnabled);

    this._setSmoothEnabled();
  }

  createPNGStream() {
    const c = this.canvas._canvas;
    return c.createPNGStream();
  }

  getCanvas() {
    return this.canvas;
  }

  getNativeCanvasElement() {
    return this.canvas._canvas;
  }

  getHitCanvas() {
    return this.hitCanvas;
  }

  getContext() {
    return this.getCanvas().getContext();
  }

  clear(bounds) {
    this.getContext().clear(bounds);
    this.getHitCanvas().getContext().clear(bounds);
    return this;
  }

  setZIndex(index) {
    super.setZIndex(index);
    var stage = this.getStage();

    if (stage && stage.content) {
      stage.content.removeChild(this.getNativeCanvasElement());

      if (index < stage.children.length - 1) {
        stage.content.insertBefore(this.getNativeCanvasElement(), stage.children[index + 1].getCanvas()._canvas);
      } else {
        stage.content.appendChild(this.getNativeCanvasElement());
      }
    }

    return this;
  }

  moveToTop() {
    _Node.Node.prototype.moveToTop.call(this);

    var stage = this.getStage();

    if (stage && stage.content) {
      stage.content.removeChild(this.getNativeCanvasElement());
      stage.content.appendChild(this.getNativeCanvasElement());
    }

    return true;
  }

  moveUp() {
    var moved = _Node.Node.prototype.moveUp.call(this);

    if (!moved) {
      return false;
    }

    var stage = this.getStage();

    if (!stage || !stage.content) {
      return false;
    }

    stage.content.removeChild(this.getNativeCanvasElement());

    if (this.index < stage.children.length - 1) {
      stage.content.insertBefore(this.getNativeCanvasElement(), stage.children[this.index + 1].getCanvas()._canvas);
    } else {
      stage.content.appendChild(this.getNativeCanvasElement());
    }

    return true;
  }

  moveDown() {
    if (_Node.Node.prototype.moveDown.call(this)) {
      var stage = this.getStage();

      if (stage) {
        var children = stage.children;

        if (stage.content) {
          stage.content.removeChild(this.getNativeCanvasElement());
          stage.content.insertBefore(this.getNativeCanvasElement(), children[this.index + 1].getCanvas()._canvas);
        }
      }

      return true;
    }

    return false;
  }

  moveToBottom() {
    if (_Node.Node.prototype.moveToBottom.call(this)) {
      var stage = this.getStage();

      if (stage) {
        var children = stage.children;

        if (stage.content) {
          stage.content.removeChild(this.getNativeCanvasElement());
          stage.content.insertBefore(this.getNativeCanvasElement(), children[1].getCanvas()._canvas);
        }
      }

      return true;
    }

    return false;
  }

  getLayer() {
    return this;
  }

  remove() {
    var _canvas = this.getNativeCanvasElement();

    _Node.Node.prototype.remove.call(this);

    if (_canvas && _canvas.parentNode && _Util.Util._isInDocument(_canvas)) {
      _canvas.parentNode.removeChild(_canvas);
    }

    return this;
  }

  getStage() {
    return this.parent;
  }

  setSize({
    width,
    height
  }) {
    this.canvas.setSize(width, height);
    this.hitCanvas.setSize(width, height);

    this._setSmoothEnabled();

    return this;
  }

  _validateAdd(child) {
    var type = child.getType();

    if (type !== 'Group' && type !== 'Shape') {
      _Util.Util.throw('You may only add groups and shapes to a layer.');
    }
  }

  _toKonvaCanvas(config) {
    config = config || {};
    config.width = config.width || this.getWidth();
    config.height = config.height || this.getHeight();
    config.x = config.x !== undefined ? config.x : this.x();
    config.y = config.y !== undefined ? config.y : this.y();
    return _Node.Node.prototype._toKonvaCanvas.call(this, config);
  }

  _checkVisibility() {
    const visible = this.visible();

    if (visible) {
      this.canvas._canvas.style.display = 'block';
    } else {
      this.canvas._canvas.style.display = 'none';
    }
  }

  _setSmoothEnabled() {
    this.getContext()._context.imageSmoothingEnabled = this.imageSmoothingEnabled();
  }

  getWidth() {
    if (this.parent) {
      return this.parent.width();
    }
  }

  setWidth() {
    _Util.Util.warn('Can not change width of layer. Use "stage.width(value)" function instead.');
  }

  getHeight() {
    if (this.parent) {
      return this.parent.height();
    }
  }

  setHeight() {
    _Util.Util.warn('Can not change height of layer. Use "stage.height(value)" function instead.');
  }

  batchDraw() {
    if (!this._waitingForDraw) {
      this._waitingForDraw = true;

      _Util.Util.requestAnimFrame(() => {
        this.draw();
        this._waitingForDraw = false;
      });
    }

    return this;
  }

  getIntersection(pos) {
    if (!this.isListening() || !this.isVisible()) {
      return null;
    }

    var spiralSearchDistance = 1;
    var continueSearch = false;

    while (true) {
      for (let i = 0; i < INTERSECTION_OFFSETS_LEN; i++) {
        const intersectionOffset = INTERSECTION_OFFSETS[i];

        const obj = this._getIntersection({
          x: pos.x + intersectionOffset.x * spiralSearchDistance,
          y: pos.y + intersectionOffset.y * spiralSearchDistance
        });

        const shape = obj.shape;

        if (shape) {
          return shape;
        }

        continueSearch = !!obj.antialiased;

        if (!obj.antialiased) {
          break;
        }
      }

      if (continueSearch) {
        spiralSearchDistance += 1;
      } else {
        return null;
      }
    }
  }

  _getIntersection(pos) {
    const ratio = this.hitCanvas.pixelRatio;
    const p = this.hitCanvas.context.getImageData(Math.round(pos.x * ratio), Math.round(pos.y * ratio), 1, 1).data;
    const p3 = p[3];

    if (p3 === 255) {
      const colorKey = _Util.Util._rgbToHex(p[0], p[1], p[2]);

      const shape = _Shape.shapes[HASH + colorKey];

      if (shape) {
        return {
          shape: shape
        };
      }

      return {
        antialiased: true
      };
    } else if (p3 > 0) {
      return {
        antialiased: true
      };
    }

    return {};
  }

  drawScene(can, top) {
    var layer = this.getLayer(),
        canvas = can || layer && layer.getCanvas();

    this._fire(BEFORE_DRAW, {
      node: this
    });

    if (this.clearBeforeDraw()) {
      canvas.getContext().clear();
    }

    _Container.Container.prototype.drawScene.call(this, canvas, top);

    this._fire(DRAW, {
      node: this
    });

    return this;
  }

  drawHit(can, top) {
    var layer = this.getLayer(),
        canvas = can || layer && layer.hitCanvas;

    if (layer && layer.clearBeforeDraw()) {
      layer.getHitCanvas().getContext().clear();
    }

    _Container.Container.prototype.drawHit.call(this, canvas, top);

    return this;
  }

  enableHitGraph() {
    this.hitGraphEnabled(true);
    return this;
  }

  disableHitGraph() {
    this.hitGraphEnabled(false);
    return this;
  }

  setHitGraphEnabled(val) {
    _Util.Util.warn('hitGraphEnabled method is deprecated. Please use layer.listening() instead.');

    this.listening(val);
  }

  getHitGraphEnabled(val) {
    _Util.Util.warn('hitGraphEnabled method is deprecated. Please use layer.listening() instead.');

    return this.listening();
  }

  toggleHitCanvas() {
    if (!this.parent || !this.parent['content']) {
      return;
    }

    var parent = this.parent;
    var added = !!this.hitCanvas._canvas.parentNode;

    if (added) {
      parent.content.removeChild(this.hitCanvas._canvas);
    } else {
      parent.content.appendChild(this.hitCanvas._canvas);
    }
  }

}

exports.Layer = Layer;
Layer.prototype.nodeType = 'Layer';
(0, _Global._registerNode)(Layer);

_Factory.Factory.addGetterSetter(Layer, 'imageSmoothingEnabled', true);

_Factory.Factory.addGetterSetter(Layer, 'clearBeforeDraw', true);

_Factory.Factory.addGetterSetter(Layer, 'hitGraphEnabled', true, (0, _Validators.getBooleanValidator)());

},{"./Canvas.js":2,"./Container.js":3,"./Factory.js":6,"./Global.js":8,"./Node.js":11,"./Shape.js":13,"./Util.js":16,"./Validators.js":17}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Node = void 0;

var _Util = require("./Util.js");

var _Factory = require("./Factory.js");

var _Canvas = require("./Canvas.js");

var _Global = require("./Global.js");

var _DragAndDrop = require("./DragAndDrop.js");

var _Validators = require("./Validators.js");

var ABSOLUTE_OPACITY = 'absoluteOpacity',
    ALL_LISTENERS = 'allEventListeners',
    ABSOLUTE_TRANSFORM = 'absoluteTransform',
    ABSOLUTE_SCALE = 'absoluteScale',
    CANVAS = 'canvas',
    CHANGE = 'Change',
    CHILDREN = 'children',
    KONVA = 'konva',
    LISTENING = 'listening',
    MOUSEENTER = 'mouseenter',
    MOUSELEAVE = 'mouseleave',
    NAME = 'name',
    SET = 'set',
    SHAPE = 'Shape',
    SPACE = ' ',
    STAGE = 'stage',
    TRANSFORM = 'transform',
    UPPER_STAGE = 'Stage',
    VISIBLE = 'visible',
    TRANSFORM_CHANGE_STR = ['xChange.konva', 'yChange.konva', 'scaleXChange.konva', 'scaleYChange.konva', 'skewXChange.konva', 'skewYChange.konva', 'rotationChange.konva', 'offsetXChange.konva', 'offsetYChange.konva', 'transformsEnabledChange.konva'].join(SPACE);
let idCounter = 1;

class Node {
  constructor(config) {
    this._id = idCounter++;
    this.eventListeners = {};
    this.attrs = {};
    this.index = 0;
    this._allEventListeners = null;
    this.parent = null;
    this._cache = new Map();
    this._attachedDepsListeners = new Map();
    this._lastPos = null;
    this._batchingTransformChange = false;
    this._needClearTransformCache = false;
    this._filterUpToDate = false;
    this._isUnderCache = false;
    this._dragEventId = null;
    this._shouldFireChangeEvents = false;
    this.setAttrs(config);
    this._shouldFireChangeEvents = true;
  }

  hasChildren() {
    return false;
  }

  _clearCache(attr) {
    if ((attr === TRANSFORM || attr === ABSOLUTE_TRANSFORM) && this._cache.get(attr)) {
      this._cache.get(attr).dirty = true;
    } else if (attr) {
      this._cache.delete(attr);
    } else {
      this._cache.clear();
    }
  }

  _getCache(attr, privateGetter) {
    var cache = this._cache.get(attr);

    var isTransform = attr === TRANSFORM || attr === ABSOLUTE_TRANSFORM;
    var invalid = cache === undefined || isTransform && cache.dirty === true;

    if (invalid) {
      cache = privateGetter.call(this);

      this._cache.set(attr, cache);
    }

    return cache;
  }

  _calculate(name, deps, getter) {
    if (!this._attachedDepsListeners.get(name)) {
      const depsString = deps.map(dep => dep + 'Change.konva').join(SPACE);
      this.on(depsString, () => {
        this._clearCache(name);
      });

      this._attachedDepsListeners.set(name, true);
    }

    return this._getCache(name, getter);
  }

  _getCanvasCache() {
    return this._cache.get(CANVAS);
  }

  _clearSelfAndDescendantCache(attr) {
    this._clearCache(attr);

    if (attr === ABSOLUTE_TRANSFORM) {
      this.fire('absoluteTransformChange');
    }
  }

  clearCache() {
    this._cache.delete(CANVAS);

    this._clearSelfAndDescendantCache();

    this._requestDraw();

    return this;
  }

  cache(config) {
    var conf = config || {};
    var rect = {};

    if (conf.x === undefined || conf.y === undefined || conf.width === undefined || conf.height === undefined) {
      rect = this.getClientRect({
        skipTransform: true,
        relativeTo: this.getParent()
      });
    }

    var width = Math.ceil(conf.width || rect.width),
        height = Math.ceil(conf.height || rect.height),
        pixelRatio = conf.pixelRatio,
        x = conf.x === undefined ? Math.floor(rect.x) : conf.x,
        y = conf.y === undefined ? Math.floor(rect.y) : conf.y,
        offset = conf.offset || 0,
        drawBorder = conf.drawBorder || false,
        hitCanvasPixelRatio = conf.hitCanvasPixelRatio || 1;

    if (!width || !height) {
      _Util.Util.error('Can not cache the node. Width or height of the node equals 0. Caching is skipped.');

      return;
    }

    width += offset * 2 + 1;
    height += offset * 2 + 1;
    x -= offset;
    y -= offset;
    var cachedSceneCanvas = new _Canvas.SceneCanvas({
      pixelRatio: pixelRatio,
      width: width,
      height: height
    }),
        cachedFilterCanvas = new _Canvas.SceneCanvas({
      pixelRatio: pixelRatio,
      width: 0,
      height: 0
    }),
        cachedHitCanvas = new _Canvas.HitCanvas({
      pixelRatio: hitCanvasPixelRatio,
      width: width,
      height: height
    }),
        sceneContext = cachedSceneCanvas.getContext(),
        hitContext = cachedHitCanvas.getContext();
    cachedHitCanvas.isCache = true;
    cachedSceneCanvas.isCache = true;

    this._cache.delete(CANVAS);

    this._filterUpToDate = false;

    if (conf.imageSmoothingEnabled === false) {
      cachedSceneCanvas.getContext()._context.imageSmoothingEnabled = false;
      cachedFilterCanvas.getContext()._context.imageSmoothingEnabled = false;
    }

    sceneContext.save();
    hitContext.save();
    sceneContext.translate(-x, -y);
    hitContext.translate(-x, -y);
    this._isUnderCache = true;

    this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);

    this._clearSelfAndDescendantCache(ABSOLUTE_SCALE);

    this.drawScene(cachedSceneCanvas, this);
    this.drawHit(cachedHitCanvas, this);
    this._isUnderCache = false;
    sceneContext.restore();
    hitContext.restore();

    if (drawBorder) {
      sceneContext.save();
      sceneContext.beginPath();
      sceneContext.rect(0, 0, width, height);
      sceneContext.closePath();
      sceneContext.setAttr('strokeStyle', 'red');
      sceneContext.setAttr('lineWidth', 5);
      sceneContext.stroke();
      sceneContext.restore();
    }

    this._cache.set(CANVAS, {
      scene: cachedSceneCanvas,
      filter: cachedFilterCanvas,
      hit: cachedHitCanvas,
      x: x,
      y: y
    });

    this._requestDraw();

    return this;
  }

  isCached() {
    return this._cache.has(CANVAS);
  }

  getClientRect(config) {
    throw new Error('abstract "getClientRect" method call');
  }

  _transformedRect(rect, top) {
    var points = [{
      x: rect.x,
      y: rect.y
    }, {
      x: rect.x + rect.width,
      y: rect.y
    }, {
      x: rect.x + rect.width,
      y: rect.y + rect.height
    }, {
      x: rect.x,
      y: rect.y + rect.height
    }];
    var minX, minY, maxX, maxY;
    var trans = this.getAbsoluteTransform(top);
    points.forEach(function (point) {
      var transformed = trans.point(point);

      if (minX === undefined) {
        minX = maxX = transformed.x;
        minY = maxY = transformed.y;
      }

      minX = Math.min(minX, transformed.x);
      minY = Math.min(minY, transformed.y);
      maxX = Math.max(maxX, transformed.x);
      maxY = Math.max(maxY, transformed.y);
    });
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  _drawCachedSceneCanvas(context) {
    context.save();

    context._applyOpacity(this);

    context._applyGlobalCompositeOperation(this);

    const canvasCache = this._getCanvasCache();

    context.translate(canvasCache.x, canvasCache.y);

    var cacheCanvas = this._getCachedSceneCanvas();

    var ratio = cacheCanvas.pixelRatio;
    context.drawImage(cacheCanvas._canvas, 0, 0, cacheCanvas.width / ratio, cacheCanvas.height / ratio);
    context.restore();
  }

  _drawCachedHitCanvas(context) {
    var canvasCache = this._getCanvasCache(),
        hitCanvas = canvasCache.hit;

    context.save();
    context.translate(canvasCache.x, canvasCache.y);
    context.drawImage(hitCanvas._canvas, 0, 0, hitCanvas.width / hitCanvas.pixelRatio, hitCanvas.height / hitCanvas.pixelRatio);
    context.restore();
  }

  _getCachedSceneCanvas() {
    var filters = this.filters(),
        cachedCanvas = this._getCanvasCache(),
        sceneCanvas = cachedCanvas.scene,
        filterCanvas = cachedCanvas.filter,
        filterContext = filterCanvas.getContext(),
        len,
        imageData,
        n,
        filter;

    if (filters) {
      if (!this._filterUpToDate) {
        var ratio = sceneCanvas.pixelRatio;
        filterCanvas.setSize(sceneCanvas.width / sceneCanvas.pixelRatio, sceneCanvas.height / sceneCanvas.pixelRatio);

        try {
          len = filters.length;
          filterContext.clear();
          filterContext.drawImage(sceneCanvas._canvas, 0, 0, sceneCanvas.getWidth() / ratio, sceneCanvas.getHeight() / ratio);
          imageData = filterContext.getImageData(0, 0, filterCanvas.getWidth(), filterCanvas.getHeight());

          for (n = 0; n < len; n++) {
            filter = filters[n];

            if (typeof filter !== 'function') {
              _Util.Util.error('Filter should be type of function, but got ' + typeof filter + ' instead. Please check correct filters');

              continue;
            }

            filter.call(this, imageData);
            filterContext.putImageData(imageData, 0, 0);
          }
        } catch (e) {
          _Util.Util.error('Unable to apply filter. ' + e.message + ' This post my help you https://konvajs.org/docs/posts/Tainted_Canvas.html.');
        }

        this._filterUpToDate = true;
      }

      return filterCanvas;
    }

    return sceneCanvas;
  }

  on(evtStr, handler) {
    this._cache && this._cache.delete(ALL_LISTENERS);

    if (arguments.length === 3) {
      return this._delegate.apply(this, arguments);
    }

    var events = evtStr.split(SPACE),
        len = events.length,
        n,
        event,
        parts,
        baseEvent,
        name;

    for (n = 0; n < len; n++) {
      event = events[n];
      parts = event.split('.');
      baseEvent = parts[0];
      name = parts[1] || '';

      if (!this.eventListeners[baseEvent]) {
        this.eventListeners[baseEvent] = [];
      }

      this.eventListeners[baseEvent].push({
        name: name,
        handler: handler
      });
    }

    return this;
  }

  off(evtStr, callback) {
    var events = (evtStr || '').split(SPACE),
        len = events.length,
        n,
        t,
        event,
        parts,
        baseEvent,
        name;
    this._cache && this._cache.delete(ALL_LISTENERS);

    if (!evtStr) {
      for (t in this.eventListeners) {
        this._off(t);
      }
    }

    for (n = 0; n < len; n++) {
      event = events[n];
      parts = event.split('.');
      baseEvent = parts[0];
      name = parts[1];

      if (baseEvent) {
        if (this.eventListeners[baseEvent]) {
          this._off(baseEvent, name, callback);
        }
      } else {
        for (t in this.eventListeners) {
          this._off(t, name, callback);
        }
      }
    }

    return this;
  }

  dispatchEvent(evt) {
    var e = {
      target: this,
      type: evt.type,
      evt: evt
    };
    this.fire(evt.type, e);
    return this;
  }

  addEventListener(type, handler) {
    this.on(type, function (evt) {
      handler.call(this, evt.evt);
    });
    return this;
  }

  removeEventListener(type) {
    this.off(type);
    return this;
  }

  _delegate(event, selector, handler) {
    var stopNode = this;
    this.on(event, function (evt) {
      var targets = evt.target.findAncestors(selector, true, stopNode);

      for (var i = 0; i < targets.length; i++) {
        evt = _Util.Util.cloneObject(evt);
        evt.currentTarget = targets[i];
        handler.call(targets[i], evt);
      }
    });
  }

  remove() {
    if (this.isDragging()) {
      this.stopDrag();
    }

    _DragAndDrop.DD._dragElements.delete(this._id);

    this._remove();

    return this;
  }

  _clearCaches() {
    this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);

    this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);

    this._clearSelfAndDescendantCache(ABSOLUTE_SCALE);

    this._clearSelfAndDescendantCache(STAGE);

    this._clearSelfAndDescendantCache(VISIBLE);

    this._clearSelfAndDescendantCache(LISTENING);
  }

  _remove() {
    this._clearCaches();

    var parent = this.getParent();

    if (parent && parent.children) {
      parent.children.splice(this.index, 1);

      parent._setChildrenIndices();

      this.parent = null;
    }
  }

  destroy() {
    this.remove();
    return this;
  }

  getAttr(attr) {
    var method = 'get' + _Util.Util._capitalize(attr);

    if (_Util.Util._isFunction(this[method])) {
      return this[method]();
    }

    return this.attrs[attr];
  }

  getAncestors() {
    var parent = this.getParent(),
        ancestors = [];

    while (parent) {
      ancestors.push(parent);
      parent = parent.getParent();
    }

    return ancestors;
  }

  getAttrs() {
    return this.attrs || {};
  }

  setAttrs(config) {
    this._batchTransformChanges(() => {
      var key, method;

      if (!config) {
        return this;
      }

      for (key in config) {
        if (key === CHILDREN) {
          continue;
        }

        method = SET + _Util.Util._capitalize(key);

        if (_Util.Util._isFunction(this[method])) {
          this[method](config[key]);
        } else {
          this._setAttr(key, config[key]);
        }
      }
    });

    return this;
  }

  isListening() {
    return this._getCache(LISTENING, this._isListening);
  }

  _isListening(relativeTo) {
    const listening = this.listening();

    if (!listening) {
      return false;
    }

    const parent = this.getParent();

    if (parent && parent !== relativeTo && this !== relativeTo) {
      return parent._isListening(relativeTo);
    } else {
      return true;
    }
  }

  isVisible() {
    return this._getCache(VISIBLE, this._isVisible);
  }

  _isVisible(relativeTo) {
    const visible = this.visible();

    if (!visible) {
      return false;
    }

    const parent = this.getParent();

    if (parent && parent !== relativeTo && this !== relativeTo) {
      return parent._isVisible(relativeTo);
    } else {
      return true;
    }
  }

  shouldDrawHit(top, skipDragCheck = false) {
    if (top) {
      return this._isVisible(top) && this._isListening(top);
    }

    var layer = this.getLayer();
    var layerUnderDrag = false;

    _DragAndDrop.DD._dragElements.forEach(elem => {
      if (elem.dragStatus !== 'dragging') {
        return;
      } else if (elem.node.nodeType === 'Stage') {
        layerUnderDrag = true;
      } else if (elem.node.getLayer() === layer) {
        layerUnderDrag = true;
      }
    });

    var dragSkip = !skipDragCheck && !_Global.Konva.hitOnDragEnabled && layerUnderDrag;
    return this.isListening() && this.isVisible() && !dragSkip;
  }

  show() {
    this.visible(true);
    return this;
  }

  hide() {
    this.visible(false);
    return this;
  }

  getZIndex() {
    return this.index || 0;
  }

  getAbsoluteZIndex() {
    var depth = this.getDepth(),
        that = this,
        index = 0,
        nodes,
        len,
        n,
        child;

    function addChildren(children) {
      nodes = [];
      len = children.length;

      for (n = 0; n < len; n++) {
        child = children[n];
        index++;

        if (child.nodeType !== SHAPE) {
          nodes = nodes.concat(child.getChildren().slice());
        }

        if (child._id === that._id) {
          n = len;
        }
      }

      if (nodes.length > 0 && nodes[0].getDepth() <= depth) {
        addChildren(nodes);
      }
    }

    if (that.nodeType !== UPPER_STAGE) {
      addChildren(that.getStage().getChildren());
    }

    return index;
  }

  getDepth() {
    var depth = 0,
        parent = this.parent;

    while (parent) {
      depth++;
      parent = parent.parent;
    }

    return depth;
  }

  _batchTransformChanges(func) {
    this._batchingTransformChange = true;
    func();
    this._batchingTransformChange = false;

    if (this._needClearTransformCache) {
      this._clearCache(TRANSFORM);

      this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
    }

    this._needClearTransformCache = false;
  }

  setPosition(pos) {
    this._batchTransformChanges(() => {
      this.x(pos.x);
      this.y(pos.y);
    });

    return this;
  }

  getPosition() {
    return {
      x: this.x(),
      y: this.y()
    };
  }

  getRelativePointerPosition() {
    if (!this.getStage()) {
      return null;
    }

    var pos = this.getStage().getPointerPosition();

    if (!pos) {
      return null;
    }

    var transform = this.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pos);
  }

  getAbsolutePosition(top) {
    let haveCachedParent = false;
    let parent = this.parent;

    while (parent) {
      if (parent.isCached()) {
        haveCachedParent = true;
        break;
      }

      parent = parent.parent;
    }

    if (haveCachedParent && !top) {
      top = true;
    }

    var absoluteMatrix = this.getAbsoluteTransform(top).getMatrix(),
        absoluteTransform = new _Util.Transform(),
        offset = this.offset();
    absoluteTransform.m = absoluteMatrix.slice();
    absoluteTransform.translate(offset.x, offset.y);
    return absoluteTransform.getTranslation();
  }

  setAbsolutePosition(pos) {
    var origTrans = this._clearTransform();

    this.attrs.x = origTrans.x;
    this.attrs.y = origTrans.y;
    delete origTrans.x;
    delete origTrans.y;

    this._clearCache(TRANSFORM);

    var it = this._getAbsoluteTransform().copy();

    it.invert();
    it.translate(pos.x, pos.y);
    pos = {
      x: this.attrs.x + it.getTranslation().x,
      y: this.attrs.y + it.getTranslation().y
    };

    this._setTransform(origTrans);

    this.setPosition({
      x: pos.x,
      y: pos.y
    });

    this._clearCache(TRANSFORM);

    this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);

    return this;
  }

  _setTransform(trans) {
    var key;

    for (key in trans) {
      this.attrs[key] = trans[key];
    }
  }

  _clearTransform() {
    var trans = {
      x: this.x(),
      y: this.y(),
      rotation: this.rotation(),
      scaleX: this.scaleX(),
      scaleY: this.scaleY(),
      offsetX: this.offsetX(),
      offsetY: this.offsetY(),
      skewX: this.skewX(),
      skewY: this.skewY()
    };
    this.attrs.x = 0;
    this.attrs.y = 0;
    this.attrs.rotation = 0;
    this.attrs.scaleX = 1;
    this.attrs.scaleY = 1;
    this.attrs.offsetX = 0;
    this.attrs.offsetY = 0;
    this.attrs.skewX = 0;
    this.attrs.skewY = 0;
    return trans;
  }

  move(change) {
    var changeX = change.x,
        changeY = change.y,
        x = this.x(),
        y = this.y();

    if (changeX !== undefined) {
      x += changeX;
    }

    if (changeY !== undefined) {
      y += changeY;
    }

    this.setPosition({
      x: x,
      y: y
    });
    return this;
  }

  _eachAncestorReverse(func, top) {
    var family = [],
        parent = this.getParent(),
        len,
        n;

    if (top && top._id === this._id) {
      return;
    }

    family.unshift(this);

    while (parent && (!top || parent._id !== top._id)) {
      family.unshift(parent);
      parent = parent.parent;
    }

    len = family.length;

    for (n = 0; n < len; n++) {
      func(family[n]);
    }
  }

  rotate(theta) {
    this.rotation(this.rotation() + theta);
    return this;
  }

  moveToTop() {
    if (!this.parent) {
      _Util.Util.warn('Node has no parent. moveToTop function is ignored.');

      return false;
    }

    var index = this.index,
        len = this.parent.getChildren().length;

    if (index < len - 1) {
      this.parent.children.splice(index, 1);
      this.parent.children.push(this);

      this.parent._setChildrenIndices();

      return true;
    }

    return false;
  }

  moveUp() {
    if (!this.parent) {
      _Util.Util.warn('Node has no parent. moveUp function is ignored.');

      return false;
    }

    var index = this.index,
        len = this.parent.getChildren().length;

    if (index < len - 1) {
      this.parent.children.splice(index, 1);
      this.parent.children.splice(index + 1, 0, this);

      this.parent._setChildrenIndices();

      return true;
    }

    return false;
  }

  moveDown() {
    if (!this.parent) {
      _Util.Util.warn('Node has no parent. moveDown function is ignored.');

      return false;
    }

    var index = this.index;

    if (index > 0) {
      this.parent.children.splice(index, 1);
      this.parent.children.splice(index - 1, 0, this);

      this.parent._setChildrenIndices();

      return true;
    }

    return false;
  }

  moveToBottom() {
    if (!this.parent) {
      _Util.Util.warn('Node has no parent. moveToBottom function is ignored.');

      return false;
    }

    var index = this.index;

    if (index > 0) {
      this.parent.children.splice(index, 1);
      this.parent.children.unshift(this);

      this.parent._setChildrenIndices();

      return true;
    }

    return false;
  }

  setZIndex(zIndex) {
    if (!this.parent) {
      _Util.Util.warn('Node has no parent. zIndex parameter is ignored.');

      return this;
    }

    if (zIndex < 0 || zIndex >= this.parent.children.length) {
      _Util.Util.warn('Unexpected value ' + zIndex + ' for zIndex property. zIndex is just index of a node in children of its parent. Expected value is from 0 to ' + (this.parent.children.length - 1) + '.');
    }

    var index = this.index;
    this.parent.children.splice(index, 1);
    this.parent.children.splice(zIndex, 0, this);

    this.parent._setChildrenIndices();

    return this;
  }

  getAbsoluteOpacity() {
    return this._getCache(ABSOLUTE_OPACITY, this._getAbsoluteOpacity);
  }

  _getAbsoluteOpacity() {
    var absOpacity = this.opacity();
    var parent = this.getParent();

    if (parent && !parent._isUnderCache) {
      absOpacity *= parent.getAbsoluteOpacity();
    }

    return absOpacity;
  }

  moveTo(newContainer) {
    if (this.getParent() !== newContainer) {
      this._remove();

      newContainer.add(this);
    }

    return this;
  }

  toObject() {
    var obj = {},
        attrs = this.getAttrs(),
        key,
        val,
        getter,
        defaultValue,
        nonPlainObject;
    obj.attrs = {};

    for (key in attrs) {
      val = attrs[key];
      nonPlainObject = _Util.Util.isObject(val) && !_Util.Util._isPlainObject(val) && !_Util.Util._isArray(val);

      if (nonPlainObject) {
        continue;
      }

      getter = typeof this[key] === 'function' && this[key];
      delete attrs[key];
      defaultValue = getter ? getter.call(this) : null;
      attrs[key] = val;

      if (defaultValue !== val) {
        obj.attrs[key] = val;
      }
    }

    obj.className = this.getClassName();
    return _Util.Util._prepareToStringify(obj);
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  getParent() {
    return this.parent;
  }

  findAncestors(selector, includeSelf, stopNode) {
    var res = [];

    if (includeSelf && this._isMatch(selector)) {
      res.push(this);
    }

    var ancestor = this.parent;

    while (ancestor) {
      if (ancestor === stopNode) {
        return res;
      }

      if (ancestor._isMatch(selector)) {
        res.push(ancestor);
      }

      ancestor = ancestor.parent;
    }

    return res;
  }

  isAncestorOf(node) {
    return false;
  }

  findAncestor(selector, includeSelf, stopNode) {
    return this.findAncestors(selector, includeSelf, stopNode)[0];
  }

  _isMatch(selector) {
    if (!selector) {
      return false;
    }

    if (typeof selector === 'function') {
      return selector(this);
    }

    var selectorArr = selector.replace(/ /g, '').split(','),
        len = selectorArr.length,
        n,
        sel;

    for (n = 0; n < len; n++) {
      sel = selectorArr[n];

      if (!_Util.Util.isValidSelector(sel)) {
        _Util.Util.warn('Selector "' + sel + '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".');

        _Util.Util.warn('If you have a custom shape with such className, please change it to start with upper letter like "Triangle".');

        _Util.Util.warn('Konva is awesome, right?');
      }

      if (sel.charAt(0) === '#') {
        if (this.id() === sel.slice(1)) {
          return true;
        }
      } else if (sel.charAt(0) === '.') {
        if (this.hasName(sel.slice(1))) {
          return true;
        }
      } else if (this.className === sel || this.nodeType === sel) {
        return true;
      }
    }

    return false;
  }

  getLayer() {
    var parent = this.getParent();
    return parent ? parent.getLayer() : null;
  }

  getStage() {
    return this._getCache(STAGE, this._getStage);
  }

  _getStage() {
    var parent = this.getParent();

    if (parent) {
      return parent.getStage();
    } else {
      return undefined;
    }
  }

  fire(eventType, evt = {}, bubble) {
    evt.target = evt.target || this;

    if (bubble) {
      this._fireAndBubble(eventType, evt);
    } else {
      this._fire(eventType, evt);
    }

    return this;
  }

  getAbsoluteTransform(top) {
    if (top) {
      return this._getAbsoluteTransform(top);
    } else {
      return this._getCache(ABSOLUTE_TRANSFORM, this._getAbsoluteTransform);
    }
  }

  _getAbsoluteTransform(top) {
    var at;

    if (top) {
      at = new _Util.Transform();

      this._eachAncestorReverse(function (node) {
        var transformsEnabled = node.transformsEnabled();

        if (transformsEnabled === 'all') {
          at.multiply(node.getTransform());
        } else if (transformsEnabled === 'position') {
          at.translate(node.x() - node.offsetX(), node.y() - node.offsetY());
        }
      }, top);

      return at;
    } else {
      at = this._cache.get(ABSOLUTE_TRANSFORM) || new _Util.Transform();

      if (this.parent) {
        this.parent.getAbsoluteTransform().copyInto(at);
      } else {
        at.reset();
      }

      var transformsEnabled = this.transformsEnabled();

      if (transformsEnabled === 'all') {
        at.multiply(this.getTransform());
      } else if (transformsEnabled === 'position') {
        const x = this.attrs.x || 0;
        const y = this.attrs.y || 0;
        const offsetX = this.attrs.offsetX || 0;
        const offsetY = this.attrs.offsetY || 0;
        at.translate(x - offsetX, y - offsetY);
      }

      at.dirty = false;
      return at;
    }
  }

  getAbsoluteScale(top) {
    var parent = this;

    while (parent) {
      if (parent._isUnderCache) {
        top = parent;
      }

      parent = parent.getParent();
    }

    const transform = this.getAbsoluteTransform(top);
    const attrs = transform.decompose();
    return {
      x: attrs.scaleX,
      y: attrs.scaleY
    };
  }

  getAbsoluteRotation() {
    return this.getAbsoluteTransform().decompose().rotation;
  }

  getTransform() {
    return this._getCache(TRANSFORM, this._getTransform);
  }

  _getTransform() {
    var _a, _b;

    var m = this._cache.get(TRANSFORM) || new _Util.Transform();
    m.reset();

    var x = this.x(),
        y = this.y(),
        rotation = _Global.Konva.getAngle(this.rotation()),
        scaleX = (_a = this.attrs.scaleX) !== null && _a !== void 0 ? _a : 1,
        scaleY = (_b = this.attrs.scaleY) !== null && _b !== void 0 ? _b : 1,
        skewX = this.attrs.skewX || 0,
        skewY = this.attrs.skewY || 0,
        offsetX = this.attrs.offsetX || 0,
        offsetY = this.attrs.offsetY || 0;

    if (x !== 0 || y !== 0) {
      m.translate(x, y);
    }

    if (rotation !== 0) {
      m.rotate(rotation);
    }

    if (skewX !== 0 || skewY !== 0) {
      m.skew(skewX, skewY);
    }

    if (scaleX !== 1 || scaleY !== 1) {
      m.scale(scaleX, scaleY);
    }

    if (offsetX !== 0 || offsetY !== 0) {
      m.translate(-1 * offsetX, -1 * offsetY);
    }

    m.dirty = false;
    return m;
  }

  clone(obj) {
    var attrs = _Util.Util.cloneObject(this.attrs),
        key,
        allListeners,
        len,
        n,
        listener;

    for (key in obj) {
      attrs[key] = obj[key];
    }

    var node = new this.constructor(attrs);

    for (key in this.eventListeners) {
      allListeners = this.eventListeners[key];
      len = allListeners.length;

      for (n = 0; n < len; n++) {
        listener = allListeners[n];

        if (listener.name.indexOf(KONVA) < 0) {
          if (!node.eventListeners[key]) {
            node.eventListeners[key] = [];
          }

          node.eventListeners[key].push(listener);
        }
      }
    }

    return node;
  }

  _toKonvaCanvas(config) {
    config = config || {};
    var box = this.getClientRect();
    var stage = this.getStage(),
        x = config.x !== undefined ? config.x : Math.floor(box.x),
        y = config.y !== undefined ? config.y : Math.floor(box.y),
        pixelRatio = config.pixelRatio || 1,
        canvas = new _Canvas.SceneCanvas({
      width: config.width || Math.ceil(box.width) || (stage ? stage.width() : 0),
      height: config.height || Math.ceil(box.height) || (stage ? stage.height() : 0),
      pixelRatio: pixelRatio
    }),
        context = canvas.getContext();

    if (config.imageSmoothingEnabled === false) {
      context._context.imageSmoothingEnabled = false;
    }

    context.save();

    if (x || y) {
      context.translate(-1 * x, -1 * y);
    }

    this.drawScene(canvas);
    context.restore();
    return canvas;
  }

  toCanvas(config) {
    return this._toKonvaCanvas(config)._canvas;
  }

  toDataURL(config) {
    config = config || {};
    var mimeType = config.mimeType || null,
        quality = config.quality || null;

    var url = this._toKonvaCanvas(config).toDataURL(mimeType, quality);

    if (config.callback) {
      config.callback(url);
    }

    return url;
  }

  toImage(config) {
    if (!config || !config.callback) {
      throw 'callback required for toImage method config argument';
    }

    var callback = config.callback;
    delete config.callback;

    _Util.Util._urlToImage(this.toDataURL(config), function (img) {
      callback(img);
    });
  }

  setSize(size) {
    this.width(size.width);
    this.height(size.height);
    return this;
  }

  getSize() {
    return {
      width: this.width(),
      height: this.height()
    };
  }

  getClassName() {
    return this.className || this.nodeType;
  }

  getType() {
    return this.nodeType;
  }

  getDragDistance() {
    if (this.attrs.dragDistance !== undefined) {
      return this.attrs.dragDistance;
    } else if (this.parent) {
      return this.parent.getDragDistance();
    } else {
      return _Global.Konva.dragDistance;
    }
  }

  _off(type, name, callback) {
    var evtListeners = this.eventListeners[type],
        i,
        evtName,
        handler;

    for (i = 0; i < evtListeners.length; i++) {
      evtName = evtListeners[i].name;
      handler = evtListeners[i].handler;

      if ((evtName !== 'konva' || name === 'konva') && (!name || evtName === name) && (!callback || callback === handler)) {
        evtListeners.splice(i, 1);

        if (evtListeners.length === 0) {
          delete this.eventListeners[type];
          break;
        }

        i--;
      }
    }
  }

  _fireChangeEvent(attr, oldVal, newVal) {
    this._fire(attr + CHANGE, {
      oldVal: oldVal,
      newVal: newVal
    });
  }

  addName(name) {
    if (!this.hasName(name)) {
      var oldName = this.name();
      var newName = oldName ? oldName + ' ' + name : name;
      this.name(newName);
    }

    return this;
  }

  hasName(name) {
    if (!name) {
      return false;
    }

    const fullName = this.name();

    if (!fullName) {
      return false;
    }

    var names = (fullName || '').split(/\s/g);
    return names.indexOf(name) !== -1;
  }

  removeName(name) {
    var names = (this.name() || '').split(/\s/g);
    var index = names.indexOf(name);

    if (index !== -1) {
      names.splice(index, 1);
      this.name(names.join(' '));
    }

    return this;
  }

  setAttr(attr, val) {
    var func = this[SET + _Util.Util._capitalize(attr)];

    if (_Util.Util._isFunction(func)) {
      func.call(this, val);
    } else {
      this._setAttr(attr, val);
    }

    return this;
  }

  _requestDraw() {
    if (_Global.Konva.autoDrawEnabled) {
      const drawNode = this.getLayer() || this.getStage();
      drawNode === null || drawNode === void 0 ? void 0 : drawNode.batchDraw();
    }
  }

  _setAttr(key, val) {
    var oldVal = this.attrs[key];

    if (oldVal === val && !_Util.Util.isObject(val)) {
      return;
    }

    if (val === undefined || val === null) {
      delete this.attrs[key];
    } else {
      this.attrs[key] = val;
    }

    if (this._shouldFireChangeEvents) {
      this._fireChangeEvent(key, oldVal, val);
    }

    this._requestDraw();
  }

  _setComponentAttr(key, component, val) {
    var oldVal;

    if (val !== undefined) {
      oldVal = this.attrs[key];

      if (!oldVal) {
        this.attrs[key] = this.getAttr(key);
      }

      this.attrs[key][component] = val;

      this._fireChangeEvent(key, oldVal, val);
    }
  }

  _fireAndBubble(eventType, evt, compareShape) {
    if (evt && this.nodeType === SHAPE) {
      evt.target = this;
    }

    var shouldStop = (eventType === MOUSEENTER || eventType === MOUSELEAVE) && (compareShape && (this === compareShape || this.isAncestorOf && this.isAncestorOf(compareShape)) || this.nodeType === 'Stage' && !compareShape);

    if (!shouldStop) {
      this._fire(eventType, evt);

      var stopBubble = (eventType === MOUSEENTER || eventType === MOUSELEAVE) && compareShape && compareShape.isAncestorOf && compareShape.isAncestorOf(this) && !compareShape.isAncestorOf(this.parent);

      if ((evt && !evt.cancelBubble || !evt) && this.parent && this.parent.isListening() && !stopBubble) {
        if (compareShape && compareShape.parent) {
          this._fireAndBubble.call(this.parent, eventType, evt, compareShape);
        } else {
          this._fireAndBubble.call(this.parent, eventType, evt);
        }
      }
    }
  }

  _getProtoListeners(eventType) {
    let listeners = this._cache.get(ALL_LISTENERS);

    if (!listeners) {
      listeners = {};
      let obj = Object.getPrototypeOf(this);

      while (obj) {
        if (!obj.eventListeners) {
          obj = Object.getPrototypeOf(obj);
          continue;
        }

        for (var event in obj.eventListeners) {
          const newEvents = obj.eventListeners[event];
          const oldEvents = listeners[event] || [];
          listeners[event] = newEvents.concat(oldEvents);
        }

        obj = Object.getPrototypeOf(obj);
      }

      this._cache.set(ALL_LISTENERS, listeners);
    }

    return listeners[eventType];
  }

  _fire(eventType, evt) {
    evt = evt || {};
    evt.currentTarget = this;
    evt.type = eventType;

    const topListeners = this._getProtoListeners(eventType);

    if (topListeners) {
      for (var i = 0; i < topListeners.length; i++) {
        topListeners[i].handler.call(this, evt);
      }
    }

    const selfListeners = this.eventListeners[eventType];

    if (selfListeners) {
      for (var i = 0; i < selfListeners.length; i++) {
        selfListeners[i].handler.call(this, evt);
      }
    }
  }

  draw() {
    this.drawScene();
    this.drawHit();
    return this;
  }

  _createDragElement(evt) {
    var pointerId = evt ? evt.pointerId : undefined;
    var stage = this.getStage();
    var ap = this.getAbsolutePosition();
    var pos = stage._getPointerById(pointerId) || stage._changedPointerPositions[0] || ap;

    _DragAndDrop.DD._dragElements.set(this._id, {
      node: this,
      startPointerPos: pos,
      offset: {
        x: pos.x - ap.x,
        y: pos.y - ap.y
      },
      dragStatus: 'ready',
      pointerId
    });
  }

  startDrag(evt, bubbleEvent = true) {
    if (!_DragAndDrop.DD._dragElements.has(this._id)) {
      this._createDragElement(evt);
    }

    const elem = _DragAndDrop.DD._dragElements.get(this._id);

    elem.dragStatus = 'dragging';
    this.fire('dragstart', {
      type: 'dragstart',
      target: this,
      evt: evt && evt.evt
    }, bubbleEvent);
  }

  _setDragPosition(evt, elem) {
    const pos = this.getStage()._getPointerById(elem.pointerId);

    if (!pos) {
      return;
    }

    var newNodePos = {
      x: pos.x - elem.offset.x,
      y: pos.y - elem.offset.y
    };
    var dbf = this.dragBoundFunc();

    if (dbf !== undefined) {
      const bounded = dbf.call(this, newNodePos, evt);

      if (!bounded) {
        _Util.Util.warn('dragBoundFunc did not return any value. That is unexpected behavior. You must return new absolute position from dragBoundFunc.');
      } else {
        newNodePos = bounded;
      }
    }

    if (!this._lastPos || this._lastPos.x !== newNodePos.x || this._lastPos.y !== newNodePos.y) {
      this.setAbsolutePosition(newNodePos);

      this._requestDraw();
    }

    this._lastPos = newNodePos;
  }

  stopDrag(evt) {
    const elem = _DragAndDrop.DD._dragElements.get(this._id);

    if (elem) {
      elem.dragStatus = 'stopped';
    }

    _DragAndDrop.DD._endDragBefore(evt);

    _DragAndDrop.DD._endDragAfter(evt);
  }

  setDraggable(draggable) {
    this._setAttr('draggable', draggable);

    this._dragChange();
  }

  isDragging() {
    const elem = _DragAndDrop.DD._dragElements.get(this._id);

    return elem ? elem.dragStatus === 'dragging' : false;
  }

  _listenDrag() {
    this._dragCleanup();

    this.on('mousedown.konva touchstart.konva', function (evt) {
      var shouldCheckButton = evt.evt['button'] !== undefined;
      var canDrag = !shouldCheckButton || _Global.Konva.dragButtons.indexOf(evt.evt['button']) >= 0;

      if (!canDrag) {
        return;
      }

      if (this.isDragging()) {
        return;
      }

      var hasDraggingChild = false;

      _DragAndDrop.DD._dragElements.forEach(elem => {
        if (this.isAncestorOf(elem.node)) {
          hasDraggingChild = true;
        }
      });

      if (!hasDraggingChild) {
        this._createDragElement(evt);
      }
    });
  }

  _dragChange() {
    if (this.attrs.draggable) {
      this._listenDrag();
    } else {
      this._dragCleanup();

      var stage = this.getStage();

      if (!stage) {
        return;
      }

      const dragElement = _DragAndDrop.DD._dragElements.get(this._id);

      const isDragging = dragElement && dragElement.dragStatus === 'dragging';
      const isReady = dragElement && dragElement.dragStatus === 'ready';

      if (isDragging) {
        this.stopDrag();
      } else if (isReady) {
        _DragAndDrop.DD._dragElements.delete(this._id);
      }
    }
  }

  _dragCleanup() {
    this.off('mousedown.konva');
    this.off('touchstart.konva');
  }

  isClientRectOnScreen(margin = {
    x: 0,
    y: 0
  }) {
    const stage = this.getStage();

    if (!stage) {
      return false;
    }

    const screenRect = {
      x: -margin.x,
      y: -margin.y,
      width: stage.width() + 2 * margin.x,
      height: stage.height() + 2 * margin.y
    };
    return _Util.Util.haveIntersection(screenRect, this.getClientRect());
  }

  static create(data, container) {
    if (_Util.Util._isString(data)) {
      data = JSON.parse(data);
    }

    return this._createNode(data, container);
  }

  static _createNode(obj, container) {
    var className = Node.prototype.getClassName.call(obj),
        children = obj.children,
        no,
        len,
        n;

    if (container) {
      obj.attrs.container = container;
    }

    if (!_Global.Konva[className]) {
      _Util.Util.warn('Can not find a node with class name "' + className + '". Fallback to "Shape".');

      className = 'Shape';
    }

    const Class = _Global.Konva[className];
    no = new Class(obj.attrs);

    if (children) {
      len = children.length;

      for (n = 0; n < len; n++) {
        no.add(Node._createNode(children[n]));
      }
    }

    return no;
  }

}

exports.Node = Node;
Node.prototype.nodeType = 'Node';
Node.prototype._attrsAffectingSize = [];
Node.prototype.eventListeners = {};
Node.prototype.on.call(Node.prototype, TRANSFORM_CHANGE_STR, function () {
  if (this._batchingTransformChange) {
    this._needClearTransformCache = true;
    return;
  }

  this._clearCache(TRANSFORM);

  this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
});
Node.prototype.on.call(Node.prototype, 'visibleChange.konva', function () {
  this._clearSelfAndDescendantCache(VISIBLE);
});
Node.prototype.on.call(Node.prototype, 'listeningChange.konva', function () {
  this._clearSelfAndDescendantCache(LISTENING);
});
Node.prototype.on.call(Node.prototype, 'opacityChange.konva', function () {
  this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
});
const addGetterSetter = _Factory.Factory.addGetterSetter;
addGetterSetter(Node, 'zIndex');
addGetterSetter(Node, 'absolutePosition');
addGetterSetter(Node, 'position');
addGetterSetter(Node, 'x', 0, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'y', 0, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'globalCompositeOperation', 'source-over', (0, _Validators.getStringValidator)());
addGetterSetter(Node, 'opacity', 1, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'name', '', (0, _Validators.getStringValidator)());
addGetterSetter(Node, 'id', '', (0, _Validators.getStringValidator)());
addGetterSetter(Node, 'rotation', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addComponentsGetterSetter(Node, 'scale', ['x', 'y']);

addGetterSetter(Node, 'scaleX', 1, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'scaleY', 1, (0, _Validators.getNumberValidator)());

_Factory.Factory.addComponentsGetterSetter(Node, 'skew', ['x', 'y']);

addGetterSetter(Node, 'skewX', 0, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'skewY', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addComponentsGetterSetter(Node, 'offset', ['x', 'y']);

addGetterSetter(Node, 'offsetX', 0, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'offsetY', 0, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'dragDistance', null, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'width', 0, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'height', 0, (0, _Validators.getNumberValidator)());
addGetterSetter(Node, 'listening', true, (0, _Validators.getBooleanValidator)());
addGetterSetter(Node, 'preventDefault', true, (0, _Validators.getBooleanValidator)());
addGetterSetter(Node, 'filters', null, function (val) {
  this._filterUpToDate = false;
  return val;
});
addGetterSetter(Node, 'visible', true, (0, _Validators.getBooleanValidator)());
addGetterSetter(Node, 'transformsEnabled', 'all', (0, _Validators.getStringValidator)());
addGetterSetter(Node, 'size');
addGetterSetter(Node, 'dragBoundFunc');
addGetterSetter(Node, 'draggable', false, (0, _Validators.getBooleanValidator)());

_Factory.Factory.backCompat(Node, {
  rotateDeg: 'rotate',
  setRotationDeg: 'setRotation',
  getRotationDeg: 'getRotation'
});

},{"./Canvas.js":2,"./DragAndDrop.js":5,"./Factory.js":6,"./Global.js":8,"./Util.js":16,"./Validators.js":17}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEvent = createEvent;
exports.getCapturedShape = getCapturedShape;
exports.hasPointerCapture = hasPointerCapture;
exports.releaseCapture = releaseCapture;
exports.setPointerCapture = setPointerCapture;

var _Global = require("./Global.js");

const Captures = new Map();
const SUPPORT_POINTER_EVENTS = _Global.Konva._global['PointerEvent'] !== undefined;

function getCapturedShape(pointerId) {
  return Captures.get(pointerId);
}

function createEvent(evt) {
  return {
    evt,
    pointerId: evt.pointerId
  };
}

function hasPointerCapture(pointerId, shape) {
  return Captures.get(pointerId) === shape;
}

function setPointerCapture(pointerId, shape) {
  releaseCapture(pointerId);
  const stage = shape.getStage();
  if (!stage) return;
  Captures.set(pointerId, shape);

  if (SUPPORT_POINTER_EVENTS) {
    shape._fire('gotpointercapture', createEvent(new PointerEvent('gotpointercapture')));
  }
}

function releaseCapture(pointerId, target) {
  const shape = Captures.get(pointerId);
  if (!shape) return;
  const stage = shape.getStage();

  if (stage && stage.content) {}

  Captures.delete(pointerId);

  if (SUPPORT_POINTER_EVENTS) {
    shape._fire('lostpointercapture', createEvent(new PointerEvent('lostpointercapture')));
  }
}

},{"./Global.js":8}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shapes = exports.Shape = void 0;

var _Global = require("./Global.js");

var _Util = require("./Util.js");

var _Factory = require("./Factory.js");

var _Node = require("./Node.js");

var _Validators = require("./Validators.js");

var PointerEvents = _interopRequireWildcard(require("./PointerEvents.js"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var HAS_SHADOW = 'hasShadow';
var SHADOW_RGBA = 'shadowRGBA';
var patternImage = 'patternImage';
var linearGradient = 'linearGradient';
var radialGradient = 'radialGradient';
let dummyContext;

function getDummyContext() {
  if (dummyContext) {
    return dummyContext;
  }

  dummyContext = _Util.Util.createCanvasElement().getContext('2d');
  return dummyContext;
}

const shapes = {};
exports.shapes = shapes;

function _fillFunc(context) {
  context.fill();
}

function _strokeFunc(context) {
  context.stroke();
}

function _fillFuncHit(context) {
  context.fill();
}

function _strokeFuncHit(context) {
  context.stroke();
}

function _clearHasShadowCache() {
  this._clearCache(HAS_SHADOW);
}

function _clearGetShadowRGBACache() {
  this._clearCache(SHADOW_RGBA);
}

function _clearFillPatternCache() {
  this._clearCache(patternImage);
}

function _clearLinearGradientCache() {
  this._clearCache(linearGradient);
}

function _clearRadialGradientCache() {
  this._clearCache(radialGradient);
}

class Shape extends _Node.Node {
  constructor(config) {
    super(config);
    let key;

    while (true) {
      key = _Util.Util.getRandomColor();

      if (key && !(key in shapes)) {
        break;
      }
    }

    this.colorKey = key;
    shapes[key] = this;
  }

  getContext() {
    _Util.Util.warn('shape.getContext() method is deprecated. Please do not use it.');

    return this.getLayer().getContext();
  }

  getCanvas() {
    _Util.Util.warn('shape.getCanvas() method is deprecated. Please do not use it.');

    return this.getLayer().getCanvas();
  }

  getSceneFunc() {
    return this.attrs.sceneFunc || this['_sceneFunc'];
  }

  getHitFunc() {
    return this.attrs.hitFunc || this['_hitFunc'];
  }

  hasShadow() {
    return this._getCache(HAS_SHADOW, this._hasShadow);
  }

  _hasShadow() {
    return this.shadowEnabled() && this.shadowOpacity() !== 0 && !!(this.shadowColor() || this.shadowBlur() || this.shadowOffsetX() || this.shadowOffsetY());
  }

  _getFillPattern() {
    return this._getCache(patternImage, this.__getFillPattern);
  }

  __getFillPattern() {
    if (this.fillPatternImage()) {
      var ctx = getDummyContext();
      const pattern = ctx.createPattern(this.fillPatternImage(), this.fillPatternRepeat() || 'repeat');

      if (pattern && pattern.setTransform) {
        const tr = new _Util.Transform();
        tr.translate(this.fillPatternX(), this.fillPatternY());
        tr.rotate(_Global.Konva.getAngle(this.fillPatternRotation()));
        tr.scale(this.fillPatternScaleX(), this.fillPatternScaleY());
        tr.translate(-1 * this.fillPatternOffsetX(), -1 * this.fillPatternOffsetY());
        const m = tr.getMatrix();
        const matrix = typeof DOMMatrix === 'undefined' ? {
          a: m[0],
          b: m[1],
          c: m[2],
          d: m[3],
          e: m[4],
          f: m[5]
        } : new DOMMatrix(m);
        pattern.setTransform(matrix);
      }

      return pattern;
    }
  }

  _getLinearGradient() {
    return this._getCache(linearGradient, this.__getLinearGradient);
  }

  __getLinearGradient() {
    var colorStops = this.fillLinearGradientColorStops();

    if (colorStops) {
      var ctx = getDummyContext();
      var start = this.fillLinearGradientStartPoint();
      var end = this.fillLinearGradientEndPoint();
      var grd = ctx.createLinearGradient(start.x, start.y, end.x, end.y);

      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }

      return grd;
    }
  }

  _getRadialGradient() {
    return this._getCache(radialGradient, this.__getRadialGradient);
  }

  __getRadialGradient() {
    var colorStops = this.fillRadialGradientColorStops();

    if (colorStops) {
      var ctx = getDummyContext();
      var start = this.fillRadialGradientStartPoint();
      var end = this.fillRadialGradientEndPoint();
      var grd = ctx.createRadialGradient(start.x, start.y, this.fillRadialGradientStartRadius(), end.x, end.y, this.fillRadialGradientEndRadius());

      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }

      return grd;
    }
  }

  getShadowRGBA() {
    return this._getCache(SHADOW_RGBA, this._getShadowRGBA);
  }

  _getShadowRGBA() {
    if (this.hasShadow()) {
      var rgba = _Util.Util.colorToRGBA(this.shadowColor());

      return 'rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + rgba.a * (this.shadowOpacity() || 1) + ')';
    }
  }

  hasFill() {
    return this._calculate('hasFill', ['fillEnabled', 'fill', 'fillPatternImage', 'fillLinearGradientColorStops', 'fillRadialGradientColorStops'], () => {
      return this.fillEnabled() && !!(this.fill() || this.fillPatternImage() || this.fillLinearGradientColorStops() || this.fillRadialGradientColorStops());
    });
  }

  hasStroke() {
    return this._calculate('hasStroke', ['strokeEnabled', 'strokeWidth', 'stroke', 'strokeLinearGradientColorStops'], () => {
      return this.strokeEnabled() && this.strokeWidth() && !!(this.stroke() || this.strokeLinearGradientColorStops());
    });
  }

  hasHitStroke() {
    const width = this.hitStrokeWidth();

    if (width === 'auto') {
      return this.hasStroke();
    }

    return this.strokeEnabled() && !!width;
  }

  intersects(point) {
    var stage = this.getStage(),
        bufferHitCanvas = stage.bufferHitCanvas,
        p;
    bufferHitCanvas.getContext().clear();
    this.drawHit(bufferHitCanvas, null, true);
    p = bufferHitCanvas.context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
    return p[3] > 0;
  }

  destroy() {
    _Node.Node.prototype.destroy.call(this);

    delete shapes[this.colorKey];
    delete this.colorKey;
    return this;
  }

  _useBufferCanvas(forceFill) {
    var _a;

    if (!this.getStage()) {
      return false;
    }

    const perfectDrawEnabled = (_a = this.attrs.perfectDrawEnabled) !== null && _a !== void 0 ? _a : true;

    if (!perfectDrawEnabled) {
      return false;
    }

    const hasFill = forceFill || this.hasFill();
    const hasStroke = this.hasStroke();
    const isTransparent = this.getAbsoluteOpacity() !== 1;

    if (hasFill && hasStroke && isTransparent) {
      return true;
    }

    const hasShadow = this.hasShadow();
    const strokeForShadow = this.shadowForStrokeEnabled();

    if (hasFill && hasStroke && hasShadow && strokeForShadow) {
      return true;
    }

    return false;
  }

  setStrokeHitEnabled(val) {
    _Util.Util.warn('strokeHitEnabled property is deprecated. Please use hitStrokeWidth instead.');

    if (val) {
      this.hitStrokeWidth('auto');
    } else {
      this.hitStrokeWidth(0);
    }
  }

  getStrokeHitEnabled() {
    if (this.hitStrokeWidth() === 0) {
      return false;
    } else {
      return true;
    }
  }

  getSelfRect() {
    var size = this.size();
    return {
      x: this._centroid ? -size.width / 2 : 0,
      y: this._centroid ? -size.height / 2 : 0,
      width: size.width,
      height: size.height
    };
  }

  getClientRect(config = {}) {
    const skipTransform = config.skipTransform;
    const relativeTo = config.relativeTo;
    const fillRect = this.getSelfRect();
    const applyStroke = !config.skipStroke && this.hasStroke();
    const strokeWidth = applyStroke && this.strokeWidth() || 0;
    const fillAndStrokeWidth = fillRect.width + strokeWidth;
    const fillAndStrokeHeight = fillRect.height + strokeWidth;
    const applyShadow = !config.skipShadow && this.hasShadow();
    const shadowOffsetX = applyShadow ? this.shadowOffsetX() : 0;
    const shadowOffsetY = applyShadow ? this.shadowOffsetY() : 0;
    const preWidth = fillAndStrokeWidth + Math.abs(shadowOffsetX);
    const preHeight = fillAndStrokeHeight + Math.abs(shadowOffsetY);
    const blurRadius = applyShadow && this.shadowBlur() || 0;
    const width = preWidth + blurRadius * 2;
    const height = preHeight + blurRadius * 2;
    const rect = {
      width: width,
      height: height,
      x: -(strokeWidth / 2 + blurRadius) + Math.min(shadowOffsetX, 0) + fillRect.x,
      y: -(strokeWidth / 2 + blurRadius) + Math.min(shadowOffsetY, 0) + fillRect.y
    };

    if (!skipTransform) {
      return this._transformedRect(rect, relativeTo);
    }

    return rect;
  }

  drawScene(can, top) {
    var layer = this.getLayer(),
        canvas = can || layer.getCanvas(),
        context = canvas.getContext(),
        cachedCanvas = this._getCanvasCache(),
        drawFunc = this.getSceneFunc(),
        hasShadow = this.hasShadow(),
        stage,
        bufferCanvas,
        bufferContext;

    var skipBuffer = canvas.isCache;
    var cachingSelf = top === this;

    if (!this.isVisible() && !cachingSelf) {
      return this;
    }

    if (cachedCanvas) {
      context.save();
      var m = this.getAbsoluteTransform(top).getMatrix();
      context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);

      this._drawCachedSceneCanvas(context);

      context.restore();
      return this;
    }

    if (!drawFunc) {
      return this;
    }

    context.save();

    if (this._useBufferCanvas() && !skipBuffer) {
      stage = this.getStage();
      bufferCanvas = stage.bufferCanvas;
      bufferContext = bufferCanvas.getContext();
      bufferContext.clear();
      bufferContext.save();

      bufferContext._applyLineJoin(this);

      var o = this.getAbsoluteTransform(top).getMatrix();
      bufferContext.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
      drawFunc.call(this, bufferContext, this);
      bufferContext.restore();
      var ratio = bufferCanvas.pixelRatio;

      if (hasShadow) {
        context._applyShadow(this);
      }

      context._applyOpacity(this);

      context._applyGlobalCompositeOperation(this);

      context.drawImage(bufferCanvas._canvas, 0, 0, bufferCanvas.width / ratio, bufferCanvas.height / ratio);
    } else {
      context._applyLineJoin(this);

      if (!cachingSelf) {
        var o = this.getAbsoluteTransform(top).getMatrix();
        context.transform(o[0], o[1], o[2], o[3], o[4], o[5]);

        context._applyOpacity(this);

        context._applyGlobalCompositeOperation(this);
      }

      if (hasShadow) {
        context._applyShadow(this);
      }

      drawFunc.call(this, context, this);
    }

    context.restore();
    return this;
  }

  drawHit(can, top, skipDragCheck = false) {
    if (!this.shouldDrawHit(top, skipDragCheck)) {
      return this;
    }

    var layer = this.getLayer(),
        canvas = can || layer.hitCanvas,
        context = canvas && canvas.getContext(),
        drawFunc = this.hitFunc() || this.sceneFunc(),
        cachedCanvas = this._getCanvasCache(),
        cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

    if (!this.colorKey) {
      _Util.Util.warn('Looks like your canvas has a destroyed shape in it. Do not reuse shape after you destroyed it. If you want to reuse shape you should call remove() instead of destroy()');
    }

    if (cachedHitCanvas) {
      context.save();
      var m = this.getAbsoluteTransform(top).getMatrix();
      context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);

      this._drawCachedHitCanvas(context);

      context.restore();
      return this;
    }

    if (!drawFunc) {
      return this;
    }

    context.save();

    context._applyLineJoin(this);

    const selfCache = this === top;

    if (!selfCache) {
      var o = this.getAbsoluteTransform(top).getMatrix();
      context.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
    }

    drawFunc.call(this, context, this);
    context.restore();
    return this;
  }

  drawHitFromCache(alphaThreshold = 0) {
    var cachedCanvas = this._getCanvasCache(),
        sceneCanvas = this._getCachedSceneCanvas(),
        hitCanvas = cachedCanvas.hit,
        hitContext = hitCanvas.getContext(),
        hitWidth = hitCanvas.getWidth(),
        hitHeight = hitCanvas.getHeight(),
        hitImageData,
        hitData,
        len,
        rgbColorKey,
        i,
        alpha;

    hitContext.clear();
    hitContext.drawImage(sceneCanvas._canvas, 0, 0, hitWidth, hitHeight);

    try {
      hitImageData = hitContext.getImageData(0, 0, hitWidth, hitHeight);
      hitData = hitImageData.data;
      len = hitData.length;
      rgbColorKey = _Util.Util._hexToRgb(this.colorKey);

      for (i = 0; i < len; i += 4) {
        alpha = hitData[i + 3];

        if (alpha > alphaThreshold) {
          hitData[i] = rgbColorKey.r;
          hitData[i + 1] = rgbColorKey.g;
          hitData[i + 2] = rgbColorKey.b;
          hitData[i + 3] = 255;
        } else {
          hitData[i + 3] = 0;
        }
      }

      hitContext.putImageData(hitImageData, 0, 0);
    } catch (e) {
      _Util.Util.error('Unable to draw hit graph from cached scene canvas. ' + e.message);
    }

    return this;
  }

  hasPointerCapture(pointerId) {
    return PointerEvents.hasPointerCapture(pointerId, this);
  }

  setPointerCapture(pointerId) {
    PointerEvents.setPointerCapture(pointerId, this);
  }

  releaseCapture(pointerId) {
    PointerEvents.releaseCapture(pointerId, this);
  }

}

exports.Shape = Shape;
Shape.prototype._fillFunc = _fillFunc;
Shape.prototype._strokeFunc = _strokeFunc;
Shape.prototype._fillFuncHit = _fillFuncHit;
Shape.prototype._strokeFuncHit = _strokeFuncHit;
Shape.prototype._centroid = false;
Shape.prototype.nodeType = 'Shape';
(0, _Global._registerNode)(Shape);
Shape.prototype.eventListeners = {};
Shape.prototype.on.call(Shape.prototype, 'shadowColorChange.konva shadowBlurChange.konva shadowOffsetChange.konva shadowOpacityChange.konva shadowEnabledChange.konva', _clearHasShadowCache);
Shape.prototype.on.call(Shape.prototype, 'shadowColorChange.konva shadowOpacityChange.konva shadowEnabledChange.konva', _clearGetShadowRGBACache);
Shape.prototype.on.call(Shape.prototype, 'fillPriorityChange.konva fillPatternImageChange.konva fillPatternRepeatChange.konva fillPatternScaleXChange.konva fillPatternScaleYChange.konva fillPatternOffsetXChange.konva fillPatternOffsetYChange.konva fillPatternXChange.konva fillPatternYChange.konva fillPatternRotationChange.konva', _clearFillPatternCache);
Shape.prototype.on.call(Shape.prototype, 'fillPriorityChange.konva fillLinearGradientColorStopsChange.konva fillLinearGradientStartPointXChange.konva fillLinearGradientStartPointYChange.konva fillLinearGradientEndPointXChange.konva fillLinearGradientEndPointYChange.konva', _clearLinearGradientCache);
Shape.prototype.on.call(Shape.prototype, 'fillPriorityChange.konva fillRadialGradientColorStopsChange.konva fillRadialGradientStartPointXChange.konva fillRadialGradientStartPointYChange.konva fillRadialGradientEndPointXChange.konva fillRadialGradientEndPointYChange.konva fillRadialGradientStartRadiusChange.konva fillRadialGradientEndRadiusChange.konva', _clearRadialGradientCache);

_Factory.Factory.addGetterSetter(Shape, 'stroke', undefined, (0, _Validators.getStringOrGradientValidator)());

_Factory.Factory.addGetterSetter(Shape, 'strokeWidth', 2, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'fillAfterStrokeEnabled', false);

_Factory.Factory.addGetterSetter(Shape, 'hitStrokeWidth', 'auto', (0, _Validators.getNumberOrAutoValidator)());

_Factory.Factory.addGetterSetter(Shape, 'strokeHitEnabled', true, (0, _Validators.getBooleanValidator)());

_Factory.Factory.addGetterSetter(Shape, 'perfectDrawEnabled', true, (0, _Validators.getBooleanValidator)());

_Factory.Factory.addGetterSetter(Shape, 'shadowForStrokeEnabled', true, (0, _Validators.getBooleanValidator)());

_Factory.Factory.addGetterSetter(Shape, 'lineJoin');

_Factory.Factory.addGetterSetter(Shape, 'lineCap');

_Factory.Factory.addGetterSetter(Shape, 'sceneFunc');

_Factory.Factory.addGetterSetter(Shape, 'hitFunc');

_Factory.Factory.addGetterSetter(Shape, 'dash');

_Factory.Factory.addGetterSetter(Shape, 'dashOffset', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'shadowColor', undefined, (0, _Validators.getStringValidator)());

_Factory.Factory.addGetterSetter(Shape, 'shadowBlur', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'shadowOpacity', 1, (0, _Validators.getNumberValidator)());

_Factory.Factory.addComponentsGetterSetter(Shape, 'shadowOffset', ['x', 'y']);

_Factory.Factory.addGetterSetter(Shape, 'shadowOffsetX', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'shadowOffsetY', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'fillPatternImage');

_Factory.Factory.addGetterSetter(Shape, 'fill', undefined, (0, _Validators.getStringOrGradientValidator)());

_Factory.Factory.addGetterSetter(Shape, 'fillPatternX', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'fillPatternY', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'fillLinearGradientColorStops');

_Factory.Factory.addGetterSetter(Shape, 'strokeLinearGradientColorStops');

_Factory.Factory.addGetterSetter(Shape, 'fillRadialGradientStartRadius', 0);

_Factory.Factory.addGetterSetter(Shape, 'fillRadialGradientEndRadius', 0);

_Factory.Factory.addGetterSetter(Shape, 'fillRadialGradientColorStops');

_Factory.Factory.addGetterSetter(Shape, 'fillPatternRepeat', 'repeat');

_Factory.Factory.addGetterSetter(Shape, 'fillEnabled', true);

_Factory.Factory.addGetterSetter(Shape, 'strokeEnabled', true);

_Factory.Factory.addGetterSetter(Shape, 'shadowEnabled', true);

_Factory.Factory.addGetterSetter(Shape, 'dashEnabled', true);

_Factory.Factory.addGetterSetter(Shape, 'strokeScaleEnabled', true);

_Factory.Factory.addGetterSetter(Shape, 'fillPriority', 'color');

_Factory.Factory.addComponentsGetterSetter(Shape, 'fillPatternOffset', ['x', 'y']);

_Factory.Factory.addGetterSetter(Shape, 'fillPatternOffsetX', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'fillPatternOffsetY', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addComponentsGetterSetter(Shape, 'fillPatternScale', ['x', 'y']);

_Factory.Factory.addGetterSetter(Shape, 'fillPatternScaleX', 1, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Shape, 'fillPatternScaleY', 1, (0, _Validators.getNumberValidator)());

_Factory.Factory.addComponentsGetterSetter(Shape, 'fillLinearGradientStartPoint', ['x', 'y']);

_Factory.Factory.addComponentsGetterSetter(Shape, 'strokeLinearGradientStartPoint', ['x', 'y']);

_Factory.Factory.addGetterSetter(Shape, 'fillLinearGradientStartPointX', 0);

_Factory.Factory.addGetterSetter(Shape, 'strokeLinearGradientStartPointX', 0);

_Factory.Factory.addGetterSetter(Shape, 'fillLinearGradientStartPointY', 0);

_Factory.Factory.addGetterSetter(Shape, 'strokeLinearGradientStartPointY', 0);

_Factory.Factory.addComponentsGetterSetter(Shape, 'fillLinearGradientEndPoint', ['x', 'y']);

_Factory.Factory.addComponentsGetterSetter(Shape, 'strokeLinearGradientEndPoint', ['x', 'y']);

_Factory.Factory.addGetterSetter(Shape, 'fillLinearGradientEndPointX', 0);

_Factory.Factory.addGetterSetter(Shape, 'strokeLinearGradientEndPointX', 0);

_Factory.Factory.addGetterSetter(Shape, 'fillLinearGradientEndPointY', 0);

_Factory.Factory.addGetterSetter(Shape, 'strokeLinearGradientEndPointY', 0);

_Factory.Factory.addComponentsGetterSetter(Shape, 'fillRadialGradientStartPoint', ['x', 'y']);

_Factory.Factory.addGetterSetter(Shape, 'fillRadialGradientStartPointX', 0);

_Factory.Factory.addGetterSetter(Shape, 'fillRadialGradientStartPointY', 0);

_Factory.Factory.addComponentsGetterSetter(Shape, 'fillRadialGradientEndPoint', ['x', 'y']);

_Factory.Factory.addGetterSetter(Shape, 'fillRadialGradientEndPointX', 0);

_Factory.Factory.addGetterSetter(Shape, 'fillRadialGradientEndPointY', 0);

_Factory.Factory.addGetterSetter(Shape, 'fillPatternRotation', 0);

_Factory.Factory.backCompat(Shape, {
  dashArray: 'dash',
  getDashArray: 'getDash',
  setDashArray: 'getDash',
  drawFunc: 'sceneFunc',
  getDrawFunc: 'getSceneFunc',
  setDrawFunc: 'setSceneFunc',
  drawHitFunc: 'hitFunc',
  getDrawHitFunc: 'getHitFunc',
  setDrawHitFunc: 'setHitFunc'
});

},{"./Factory.js":6,"./Global.js":8,"./Node.js":11,"./PointerEvents.js":12,"./Util.js":16,"./Validators.js":17}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stages = exports.Stage = void 0;

var _Util = require("./Util.js");

var _Factory = require("./Factory.js");

var _Container = require("./Container.js");

var _Global = require("./Global.js");

var _Canvas = require("./Canvas.js");

var _DragAndDrop = require("./DragAndDrop.js");

var PointerEvents = _interopRequireWildcard(require("./PointerEvents.js"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var STAGE = 'Stage',
    STRING = 'string',
    PX = 'px',
    MOUSEOUT = 'mouseout',
    MOUSELEAVE = 'mouseleave',
    MOUSEOVER = 'mouseover',
    MOUSEENTER = 'mouseenter',
    MOUSEMOVE = 'mousemove',
    MOUSEDOWN = 'mousedown',
    MOUSEUP = 'mouseup',
    POINTERMOVE = 'pointermove',
    POINTERDOWN = 'pointerdown',
    POINTERUP = 'pointerup',
    POINTERCANCEL = 'pointercancel',
    LOSTPOINTERCAPTURE = 'lostpointercapture',
    POINTEROUT = 'pointerout',
    POINTERLEAVE = 'pointerleave',
    POINTEROVER = 'pointerover',
    POINTERENTER = 'pointerenter',
    CONTEXTMENU = 'contextmenu',
    TOUCHSTART = 'touchstart',
    TOUCHEND = 'touchend',
    TOUCHMOVE = 'touchmove',
    TOUCHCANCEL = 'touchcancel',
    WHEEL = 'wheel',
    MAX_LAYERS_NUMBER = 5,
    EVENTS = [[MOUSEENTER, '_pointerenter'], [MOUSEDOWN, '_pointerdown'], [MOUSEMOVE, '_pointermove'], [MOUSEUP, '_pointerup'], [MOUSELEAVE, '_pointerleave'], [TOUCHSTART, '_pointerdown'], [TOUCHMOVE, '_pointermove'], [TOUCHEND, '_pointerup'], [TOUCHCANCEL, '_pointercancel'], [MOUSEOVER, '_pointerover'], [WHEEL, '_wheel'], [CONTEXTMENU, '_contextmenu'], [POINTERDOWN, '_pointerdown'], [POINTERMOVE, '_pointermove'], [POINTERUP, '_pointerup'], [POINTERCANCEL, '_pointercancel'], [LOSTPOINTERCAPTURE, '_lostpointercapture']];
const EVENTS_MAP = {
  mouse: {
    [POINTEROUT]: MOUSEOUT,
    [POINTERLEAVE]: MOUSELEAVE,
    [POINTEROVER]: MOUSEOVER,
    [POINTERENTER]: MOUSEENTER,
    [POINTERMOVE]: MOUSEMOVE,
    [POINTERDOWN]: MOUSEDOWN,
    [POINTERUP]: MOUSEUP,
    [POINTERCANCEL]: 'mousecancel',
    pointerclick: 'click',
    pointerdblclick: 'dblclick'
  },
  touch: {
    [POINTEROUT]: 'touchout',
    [POINTERLEAVE]: 'touchleave',
    [POINTEROVER]: 'touchover',
    [POINTERENTER]: 'touchenter',
    [POINTERMOVE]: TOUCHMOVE,
    [POINTERDOWN]: TOUCHSTART,
    [POINTERUP]: TOUCHEND,
    [POINTERCANCEL]: TOUCHCANCEL,
    pointerclick: 'tap',
    pointerdblclick: 'dbltap'
  },
  pointer: {
    [POINTEROUT]: POINTEROUT,
    [POINTERLEAVE]: POINTERLEAVE,
    [POINTEROVER]: POINTEROVER,
    [POINTERENTER]: POINTERENTER,
    [POINTERMOVE]: POINTERMOVE,
    [POINTERDOWN]: POINTERDOWN,
    [POINTERUP]: POINTERUP,
    [POINTERCANCEL]: POINTERCANCEL,
    pointerclick: 'pointerclick',
    pointerdblclick: 'pointerdblclick'
  }
};

const getEventType = type => {
  if (type.indexOf('pointer') >= 0) {
    return 'pointer';
  }

  if (type.indexOf('touch') >= 0) {
    return 'touch';
  }

  return 'mouse';
};

const getEventsMap = eventType => {
  const type = getEventType(eventType);

  if (type === 'pointer') {
    return _Global.Konva.pointerEventsEnabled && EVENTS_MAP.pointer;
  }

  if (type === 'touch') {
    return EVENTS_MAP.touch;
  }

  if (type === 'mouse') {
    return EVENTS_MAP.mouse;
  }
};

function checkNoClip(attrs = {}) {
  if (attrs.clipFunc || attrs.clipWidth || attrs.clipHeight) {
    _Util.Util.warn('Stage does not support clipping. Please use clip for Layers or Groups.');
  }

  return attrs;
}

const NO_POINTERS_MESSAGE = `Pointer position is missing and not registered by the stage. Looks like it is outside of the stage container. You can set it manually from event: stage.setPointersPositions(event);`;
const stages = [];
exports.stages = stages;

class Stage extends _Container.Container {
  constructor(config) {
    super(checkNoClip(config));
    this._pointerPositions = [];
    this._changedPointerPositions = [];

    this._buildDOM();

    this._bindContentEvents();

    stages.push(this);
    this.on('widthChange.konva heightChange.konva', this._resizeDOM);
    this.on('visibleChange.konva', this._checkVisibility);
    this.on('clipWidthChange.konva clipHeightChange.konva clipFuncChange.konva', () => {
      checkNoClip(this.attrs);
    });

    this._checkVisibility();
  }

  _validateAdd(child) {
    const isLayer = child.getType() === 'Layer';
    const isFastLayer = child.getType() === 'FastLayer';
    const valid = isLayer || isFastLayer;

    if (!valid) {
      _Util.Util.throw('You may only add layers to the stage.');
    }
  }

  _checkVisibility() {
    if (!this.content) {
      return;
    }

    const style = this.visible() ? '' : 'none';
    this.content.style.display = style;
  }

  setContainer(container) {
    if (typeof container === STRING) {
      if (container.charAt(0) === '.') {
        var className = container.slice(1);
        container = document.getElementsByClassName(className)[0];
      } else {
        var id;

        if (container.charAt(0) !== '#') {
          id = container;
        } else {
          id = container.slice(1);
        }

        container = document.getElementById(id);
      }

      if (!container) {
        throw 'Can not find container in document with id ' + id;
      }
    }

    this._setAttr('container', container);

    if (this.content) {
      if (this.content.parentElement) {
        this.content.parentElement.removeChild(this.content);
      }

      container.appendChild(this.content);
    }

    return this;
  }

  shouldDrawHit() {
    return true;
  }

  clear() {
    var layers = this.children,
        len = layers.length,
        n;

    for (n = 0; n < len; n++) {
      layers[n].clear();
    }

    return this;
  }

  clone(obj) {
    if (!obj) {
      obj = {};
    }

    obj.container = typeof document !== 'undefined' && document.createElement('div');
    return _Container.Container.prototype.clone.call(this, obj);
  }

  destroy() {
    super.destroy();
    var content = this.content;

    if (content && _Util.Util._isInDocument(content)) {
      this.container().removeChild(content);
    }

    var index = stages.indexOf(this);

    if (index > -1) {
      stages.splice(index, 1);
    }

    return this;
  }

  getPointerPosition() {
    const pos = this._pointerPositions[0] || this._changedPointerPositions[0];

    if (!pos) {
      _Util.Util.warn(NO_POINTERS_MESSAGE);

      return null;
    }

    return {
      x: pos.x,
      y: pos.y
    };
  }

  _getPointerById(id) {
    return this._pointerPositions.find(p => p.id === id);
  }

  getPointersPositions() {
    return this._pointerPositions;
  }

  getStage() {
    return this;
  }

  getContent() {
    return this.content;
  }

  _toKonvaCanvas(config) {
    config = config || {};
    config.x = config.x || 0;
    config.y = config.y || 0;
    config.width = config.width || this.width();
    config.height = config.height || this.height();
    var canvas = new _Canvas.SceneCanvas({
      width: config.width,
      height: config.height,
      pixelRatio: config.pixelRatio || 1
    });

    var _context = canvas.getContext()._context;

    var layers = this.children;

    if (config.x || config.y) {
      _context.translate(-1 * config.x, -1 * config.y);
    }

    layers.forEach(function (layer) {
      if (!layer.isVisible()) {
        return;
      }

      var layerCanvas = layer._toKonvaCanvas(config);

      _context.drawImage(layerCanvas._canvas, config.x, config.y, layerCanvas.getWidth() / layerCanvas.getPixelRatio(), layerCanvas.getHeight() / layerCanvas.getPixelRatio());
    });
    return canvas;
  }

  getIntersection(pos) {
    if (!pos) {
      return null;
    }

    var layers = this.children,
        len = layers.length,
        end = len - 1,
        n;

    for (n = end; n >= 0; n--) {
      const shape = layers[n].getIntersection(pos);

      if (shape) {
        return shape;
      }
    }

    return null;
  }

  _resizeDOM() {
    var width = this.width();
    var height = this.height();

    if (this.content) {
      this.content.style.width = width + PX;
      this.content.style.height = height + PX;
    }

    this.bufferCanvas.setSize(width, height);
    this.bufferHitCanvas.setSize(width, height);
    this.children.forEach(layer => {
      layer.setSize({
        width,
        height
      });
      layer.draw();
    });
  }

  add(layer, ...rest) {
    if (arguments.length > 1) {
      for (var i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
      }

      return this;
    }

    super.add(layer);
    var length = this.children.length;

    if (length > MAX_LAYERS_NUMBER) {
      _Util.Util.warn('The stage has ' + length + ' layers. Recommended maximum number of layers is 3-5. Adding more layers into the stage may drop the performance. Rethink your tree structure, you can use Konva.Group.');
    }

    layer.setSize({
      width: this.width(),
      height: this.height()
    });
    layer.draw();

    if (_Global.Konva.isBrowser) {
      this.content.appendChild(layer.canvas._canvas);
    }

    return this;
  }

  getParent() {
    return null;
  }

  getLayer() {
    return null;
  }

  hasPointerCapture(pointerId) {
    return PointerEvents.hasPointerCapture(pointerId, this);
  }

  setPointerCapture(pointerId) {
    PointerEvents.setPointerCapture(pointerId, this);
  }

  releaseCapture(pointerId) {
    PointerEvents.releaseCapture(pointerId, this);
  }

  getLayers() {
    return this.children;
  }

  _bindContentEvents() {
    if (!_Global.Konva.isBrowser) {
      return;
    }

    EVENTS.forEach(([event, methodName]) => {
      this.content.addEventListener(event, evt => {
        this[methodName](evt);
      });
    });
  }

  _pointerenter(evt) {
    this.setPointersPositions(evt);
    const events = getEventsMap(evt.type);

    this._fire(events.pointerenter, {
      evt: evt,
      target: this,
      currentTarget: this
    });
  }

  _pointerover(evt) {
    this.setPointersPositions(evt);
    const events = getEventsMap(evt.type);

    this._fire(events.pointerover, {
      evt: evt,
      target: this,
      currentTarget: this
    });
  }

  _getTargetShape(evenType) {
    let shape = this[evenType + 'targetShape'];

    if (shape && !shape.getStage()) {
      shape = null;
    }

    return shape;
  }

  _pointerleave(evt) {
    const events = getEventsMap(evt.type);
    const eventType = getEventType(evt.type);

    if (!events) {
      return;
    }

    this.setPointersPositions(evt);

    var targetShape = this._getTargetShape(eventType);

    var eventsEnabled = !_DragAndDrop.DD.isDragging || _Global.Konva.hitOnDragEnabled;

    if (targetShape && eventsEnabled) {
      targetShape._fireAndBubble(events.pointerout, {
        evt: evt
      });

      targetShape._fireAndBubble(events.pointerleave, {
        evt: evt
      });

      this._fire(events.pointerleave, {
        evt: evt,
        target: this,
        currentTarget: this
      });

      this[eventType + 'targetShape'] = null;
    } else if (eventsEnabled) {
      this._fire(events.pointerleave, {
        evt: evt,
        target: this,
        currentTarget: this
      });

      this._fire(events.pointerout, {
        evt: evt,
        target: this,
        currentTarget: this
      });
    }

    this.pointerPos = undefined;
    this._pointerPositions = [];
  }

  _pointerdown(evt) {
    const events = getEventsMap(evt.type);
    const eventType = getEventType(evt.type);

    if (!events) {
      return;
    }

    this.setPointersPositions(evt);
    var triggeredOnShape = false;

    this._changedPointerPositions.forEach(pos => {
      var shape = this.getIntersection(pos);
      _DragAndDrop.DD.justDragged = false;
      _Global.Konva['_' + eventType + 'ListenClick'] = true;
      const hasShape = shape && shape.isListening();

      if (!hasShape) {
        return;
      }

      if (_Global.Konva.capturePointerEventsEnabled) {
        shape.setPointerCapture(pos.id);
      }

      this[eventType + 'ClickStartShape'] = shape;

      shape._fireAndBubble(events.pointerdown, {
        evt: evt,
        pointerId: pos.id
      });

      triggeredOnShape = true;
      const isTouch = evt.type.indexOf('touch') >= 0;

      if (shape.preventDefault() && evt.cancelable && isTouch) {
        evt.preventDefault();
      }
    });

    if (!triggeredOnShape) {
      this._fire(events.pointerdown, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId: this._pointerPositions[0].id
      });
    }
  }

  _pointermove(evt) {
    const events = getEventsMap(evt.type);
    const eventType = getEventType(evt.type);

    if (!events) {
      return;
    }

    if (_DragAndDrop.DD.isDragging && _DragAndDrop.DD.node.preventDefault() && evt.cancelable) {
      evt.preventDefault();
    }

    this.setPointersPositions(evt);
    var eventsEnabled = !_DragAndDrop.DD.isDragging || _Global.Konva.hitOnDragEnabled;

    if (!eventsEnabled) {
      return;
    }

    var processedShapesIds = {};
    let triggeredOnShape = false;

    var targetShape = this._getTargetShape(eventType);

    this._changedPointerPositions.forEach(pos => {
      const shape = PointerEvents.getCapturedShape(pos.id) || this.getIntersection(pos);
      const pointerId = pos.id;
      const event = {
        evt: evt,
        pointerId
      };
      var differentTarget = targetShape !== shape;

      if (differentTarget && targetShape) {
        targetShape._fireAndBubble(events.pointerout, Object.assign({}, event), shape);

        targetShape._fireAndBubble(events.pointerleave, Object.assign({}, event), shape);
      }

      if (shape) {
        if (processedShapesIds[shape._id]) {
          return;
        }

        processedShapesIds[shape._id] = true;
      }

      if (shape && shape.isListening()) {
        triggeredOnShape = true;

        if (differentTarget) {
          shape._fireAndBubble(events.pointerover, Object.assign({}, event), targetShape);

          shape._fireAndBubble(events.pointerenter, Object.assign({}, event), targetShape);

          this[eventType + 'targetShape'] = shape;
        }

        shape._fireAndBubble(events.pointermove, Object.assign({}, event));
      } else {
        if (targetShape) {
          this._fire(events.pointerover, {
            evt: evt,
            target: this,
            currentTarget: this,
            pointerId
          });

          this[eventType + 'targetShape'] = null;
        }
      }
    });

    if (!triggeredOnShape) {
      this._fire(events.pointermove, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId: this._changedPointerPositions[0].id
      });
    }
  }

  _pointerup(evt) {
    const events = getEventsMap(evt.type);
    const eventType = getEventType(evt.type);

    if (!events) {
      return;
    }

    this.setPointersPositions(evt);
    const clickStartShape = this[eventType + 'ClickStartShape'];
    const clickEndShape = this[eventType + 'ClickEndShape'];
    var processedShapesIds = {};
    let triggeredOnShape = false;

    this._changedPointerPositions.forEach(pos => {
      const shape = PointerEvents.getCapturedShape(pos.id) || this.getIntersection(pos);

      if (shape) {
        shape.releaseCapture(pos.id);

        if (processedShapesIds[shape._id]) {
          return;
        }

        processedShapesIds[shape._id] = true;
      }

      const pointerId = pos.id;
      const event = {
        evt: evt,
        pointerId
      };
      let fireDblClick = false;

      if (_Global.Konva['_' + eventType + 'InDblClickWindow']) {
        fireDblClick = true;
        clearTimeout(this[eventType + 'DblTimeout']);
      } else if (!_DragAndDrop.DD.justDragged) {
        _Global.Konva['_' + eventType + 'InDblClickWindow'] = true;
        clearTimeout(this[eventType + 'DblTimeout']);
      }

      this[eventType + 'DblTimeout'] = setTimeout(function () {
        _Global.Konva['_' + eventType + 'InDblClickWindow'] = false;
      }, _Global.Konva.dblClickWindow);

      if (shape && shape.isListening()) {
        triggeredOnShape = true;
        this[eventType + 'ClickEndShape'] = shape;

        shape._fireAndBubble(events.pointerup, Object.assign({}, event));

        if (_Global.Konva['_' + eventType + 'ListenClick'] && clickStartShape && clickStartShape === shape) {
          shape._fireAndBubble(events.pointerclick, Object.assign({}, event));

          if (fireDblClick && clickEndShape && clickEndShape === shape) {
            shape._fireAndBubble(events.pointerdblclick, Object.assign({}, event));
          }
        }
      } else {
        this[eventType + 'ClickEndShape'] = null;

        if (_Global.Konva['_' + eventType + 'ListenClick']) {
          this._fire(events.pointerclick, {
            evt: evt,
            target: this,
            currentTarget: this,
            pointerId
          });
        }

        if (fireDblClick) {
          this._fire(events.pointerdblclick, {
            evt: evt,
            target: this,
            currentTarget: this,
            pointerId
          });
        }
      }
    });

    if (!triggeredOnShape) {
      this._fire(events.pointerup, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId: this._changedPointerPositions[0].id
      });
    }

    _Global.Konva['_' + eventType + 'ListenClick'] = false;

    if (evt.cancelable) {
      evt.preventDefault();
    }
  }

  _contextmenu(evt) {
    this.setPointersPositions(evt);
    var shape = this.getIntersection(this.getPointerPosition());

    if (shape && shape.isListening()) {
      shape._fireAndBubble(CONTEXTMENU, {
        evt: evt
      });
    } else {
      this._fire(CONTEXTMENU, {
        evt: evt,
        target: this,
        currentTarget: this
      });
    }
  }

  _wheel(evt) {
    this.setPointersPositions(evt);
    var shape = this.getIntersection(this.getPointerPosition());

    if (shape && shape.isListening()) {
      shape._fireAndBubble(WHEEL, {
        evt: evt
      });
    } else {
      this._fire(WHEEL, {
        evt: evt,
        target: this,
        currentTarget: this
      });
    }
  }

  _pointercancel(evt) {
    this.setPointersPositions(evt);
    const shape = PointerEvents.getCapturedShape(evt.pointerId) || this.getIntersection(this.getPointerPosition());

    if (shape) {
      shape._fireAndBubble(POINTERUP, PointerEvents.createEvent(evt));
    }

    PointerEvents.releaseCapture(evt.pointerId);
  }

  _lostpointercapture(evt) {
    PointerEvents.releaseCapture(evt.pointerId);
  }

  setPointersPositions(evt) {
    var contentPosition = this._getContentPosition(),
        x = null,
        y = null;

    evt = evt ? evt : window.event;

    if (evt.touches !== undefined) {
      this._pointerPositions = [];
      this._changedPointerPositions = [];
      Array.prototype.forEach.call(evt.touches, touch => {
        this._pointerPositions.push({
          id: touch.identifier,
          x: (touch.clientX - contentPosition.left) / contentPosition.scaleX,
          y: (touch.clientY - contentPosition.top) / contentPosition.scaleY
        });
      });
      Array.prototype.forEach.call(evt.changedTouches || evt.touches, touch => {
        this._changedPointerPositions.push({
          id: touch.identifier,
          x: (touch.clientX - contentPosition.left) / contentPosition.scaleX,
          y: (touch.clientY - contentPosition.top) / contentPosition.scaleY
        });
      });
    } else {
      x = (evt.clientX - contentPosition.left) / contentPosition.scaleX;
      y = (evt.clientY - contentPosition.top) / contentPosition.scaleY;
      this.pointerPos = {
        x: x,
        y: y
      };
      this._pointerPositions = [{
        x,
        y,
        id: _Util.Util._getFirstPointerId(evt)
      }];
      this._changedPointerPositions = [{
        x,
        y,
        id: _Util.Util._getFirstPointerId(evt)
      }];
    }
  }

  _setPointerPosition(evt) {
    _Util.Util.warn('Method _setPointerPosition is deprecated. Use "stage.setPointersPositions(event)" instead.');

    this.setPointersPositions(evt);
  }

  _getContentPosition() {
    if (!this.content || !this.content.getBoundingClientRect) {
      return {
        top: 0,
        left: 0,
        scaleX: 1,
        scaleY: 1
      };
    }

    var rect = this.content.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      scaleX: rect.width / this.content.clientWidth || 1,
      scaleY: rect.height / this.content.clientHeight || 1
    };
  }

  _buildDOM() {
    this.bufferCanvas = new _Canvas.SceneCanvas({
      width: this.width(),
      height: this.height()
    });
    this.bufferHitCanvas = new _Canvas.HitCanvas({
      pixelRatio: 1,
      width: this.width(),
      height: this.height()
    });

    if (!_Global.Konva.isBrowser) {
      return;
    }

    var container = this.container();

    if (!container) {
      throw 'Stage has no container. A container is required.';
    }

    container.innerHTML = '';
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.content.style.userSelect = 'none';
    this.content.className = 'konvajs-content';
    this.content.setAttribute('role', 'presentation');
    container.appendChild(this.content);

    this._resizeDOM();
  }

  cache() {
    _Util.Util.warn('Cache function is not allowed for stage. You may use cache only for layers, groups and shapes.');

    return this;
  }

  clearCache() {
    return this;
  }

  batchDraw() {
    this.getChildren().forEach(function (layer) {
      layer.batchDraw();
    });
    return this;
  }

}

exports.Stage = Stage;
Stage.prototype.nodeType = STAGE;
(0, _Global._registerNode)(Stage);

_Factory.Factory.addGetterSetter(Stage, 'container');

},{"./Canvas.js":2,"./Container.js":3,"./DragAndDrop.js":5,"./Factory.js":6,"./Global.js":8,"./PointerEvents.js":12,"./Util.js":16}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tween = exports.Easings = void 0;

var _Util = require("./Util.js");

var _Animation = require("./Animation.js");

var _Node = require("./Node.js");

var _Global = require("./Global.js");

var blacklist = {
  node: 1,
  duration: 1,
  easing: 1,
  onFinish: 1,
  yoyo: 1
},
    PAUSED = 1,
    PLAYING = 2,
    REVERSING = 3,
    idCounter = 0,
    colorAttrs = ['fill', 'stroke', 'shadowColor'];

class TweenEngine {
  constructor(prop, propFunc, func, begin, finish, duration, yoyo) {
    this.prop = prop;
    this.propFunc = propFunc;
    this.begin = begin;
    this._pos = begin;
    this.duration = duration;
    this._change = 0;
    this.prevPos = 0;
    this.yoyo = yoyo;
    this._time = 0;
    this._position = 0;
    this._startTime = 0;
    this._finish = 0;
    this.func = func;
    this._change = finish - this.begin;
    this.pause();
  }

  fire(str) {
    var handler = this[str];

    if (handler) {
      handler();
    }
  }

  setTime(t) {
    if (t > this.duration) {
      if (this.yoyo) {
        this._time = this.duration;
        this.reverse();
      } else {
        this.finish();
      }
    } else if (t < 0) {
      if (this.yoyo) {
        this._time = 0;
        this.play();
      } else {
        this.reset();
      }
    } else {
      this._time = t;
      this.update();
    }
  }

  getTime() {
    return this._time;
  }

  setPosition(p) {
    this.prevPos = this._pos;
    this.propFunc(p);
    this._pos = p;
  }

  getPosition(t) {
    if (t === undefined) {
      t = this._time;
    }

    return this.func(t, this.begin, this._change, this.duration);
  }

  play() {
    this.state = PLAYING;
    this._startTime = this.getTimer() - this._time;
    this.onEnterFrame();
    this.fire('onPlay');
  }

  reverse() {
    this.state = REVERSING;
    this._time = this.duration - this._time;
    this._startTime = this.getTimer() - this._time;
    this.onEnterFrame();
    this.fire('onReverse');
  }

  seek(t) {
    this.pause();
    this._time = t;
    this.update();
    this.fire('onSeek');
  }

  reset() {
    this.pause();
    this._time = 0;
    this.update();
    this.fire('onReset');
  }

  finish() {
    this.pause();
    this._time = this.duration;
    this.update();
    this.fire('onFinish');
  }

  update() {
    this.setPosition(this.getPosition(this._time));
    this.fire('onUpdate');
  }

  onEnterFrame() {
    var t = this.getTimer() - this._startTime;

    if (this.state === PLAYING) {
      this.setTime(t);
    } else if (this.state === REVERSING) {
      this.setTime(this.duration - t);
    }
  }

  pause() {
    this.state = PAUSED;
    this.fire('onPause');
  }

  getTimer() {
    return new Date().getTime();
  }

}

class Tween {
  constructor(config) {
    var that = this,
        node = config.node,
        nodeId = node._id,
        duration,
        easing = config.easing || Easings.Linear,
        yoyo = !!config.yoyo,
        key;

    if (typeof config.duration === 'undefined') {
      duration = 0.3;
    } else if (config.duration === 0) {
      duration = 0.001;
    } else {
      duration = config.duration;
    }

    this.node = node;
    this._id = idCounter++;
    var layers = node.getLayer() || (node instanceof _Global.Konva['Stage'] ? node.getLayers() : null);

    if (!layers) {
      _Util.Util.error('Tween constructor have `node` that is not in a layer. Please add node into layer first.');
    }

    this.anim = new _Animation.Animation(function () {
      that.tween.onEnterFrame();
    }, layers);
    this.tween = new TweenEngine(key, function (i) {
      that._tweenFunc(i);
    }, easing, 0, 1, duration * 1000, yoyo);

    this._addListeners();

    if (!Tween.attrs[nodeId]) {
      Tween.attrs[nodeId] = {};
    }

    if (!Tween.attrs[nodeId][this._id]) {
      Tween.attrs[nodeId][this._id] = {};
    }

    if (!Tween.tweens[nodeId]) {
      Tween.tweens[nodeId] = {};
    }

    for (key in config) {
      if (blacklist[key] === undefined) {
        this._addAttr(key, config[key]);
      }
    }

    this.reset();
    this.onFinish = config.onFinish;
    this.onReset = config.onReset;
    this.onUpdate = config.onUpdate;
  }

  _addAttr(key, end) {
    var node = this.node,
        nodeId = node._id,
        start,
        diff,
        tweenId,
        n,
        len,
        trueEnd,
        trueStart,
        endRGBA;
    tweenId = Tween.tweens[nodeId][key];

    if (tweenId) {
      delete Tween.attrs[nodeId][tweenId][key];
    }

    start = node.getAttr(key);

    if (_Util.Util._isArray(end)) {
      diff = [];
      len = Math.max(end.length, start.length);

      if (key === 'points' && end.length !== start.length) {
        if (end.length > start.length) {
          trueStart = start;
          start = _Util.Util._prepareArrayForTween(start, end, node.closed());
        } else {
          trueEnd = end;
          end = _Util.Util._prepareArrayForTween(end, start, node.closed());
        }
      }

      if (key.indexOf('fill') === 0) {
        for (n = 0; n < len; n++) {
          if (n % 2 === 0) {
            diff.push(end[n] - start[n]);
          } else {
            var startRGBA = _Util.Util.colorToRGBA(start[n]);

            endRGBA = _Util.Util.colorToRGBA(end[n]);
            start[n] = startRGBA;
            diff.push({
              r: endRGBA.r - startRGBA.r,
              g: endRGBA.g - startRGBA.g,
              b: endRGBA.b - startRGBA.b,
              a: endRGBA.a - startRGBA.a
            });
          }
        }
      } else {
        for (n = 0; n < len; n++) {
          diff.push(end[n] - start[n]);
        }
      }
    } else if (colorAttrs.indexOf(key) !== -1) {
      start = _Util.Util.colorToRGBA(start);
      endRGBA = _Util.Util.colorToRGBA(end);
      diff = {
        r: endRGBA.r - start.r,
        g: endRGBA.g - start.g,
        b: endRGBA.b - start.b,
        a: endRGBA.a - start.a
      };
    } else {
      diff = end - start;
    }

    Tween.attrs[nodeId][this._id][key] = {
      start: start,
      diff: diff,
      end: end,
      trueEnd: trueEnd,
      trueStart: trueStart
    };
    Tween.tweens[nodeId][key] = this._id;
  }

  _tweenFunc(i) {
    var node = this.node,
        attrs = Tween.attrs[node._id][this._id],
        key,
        attr,
        start,
        diff,
        newVal,
        n,
        len,
        end;

    for (key in attrs) {
      attr = attrs[key];
      start = attr.start;
      diff = attr.diff;
      end = attr.end;

      if (_Util.Util._isArray(start)) {
        newVal = [];
        len = Math.max(start.length, end.length);

        if (key.indexOf('fill') === 0) {
          for (n = 0; n < len; n++) {
            if (n % 2 === 0) {
              newVal.push((start[n] || 0) + diff[n] * i);
            } else {
              newVal.push('rgba(' + Math.round(start[n].r + diff[n].r * i) + ',' + Math.round(start[n].g + diff[n].g * i) + ',' + Math.round(start[n].b + diff[n].b * i) + ',' + (start[n].a + diff[n].a * i) + ')');
            }
          }
        } else {
          for (n = 0; n < len; n++) {
            newVal.push((start[n] || 0) + diff[n] * i);
          }
        }
      } else if (colorAttrs.indexOf(key) !== -1) {
        newVal = 'rgba(' + Math.round(start.r + diff.r * i) + ',' + Math.round(start.g + diff.g * i) + ',' + Math.round(start.b + diff.b * i) + ',' + (start.a + diff.a * i) + ')';
      } else {
        newVal = start + diff * i;
      }

      node.setAttr(key, newVal);
    }
  }

  _addListeners() {
    this.tween.onPlay = () => {
      this.anim.start();
    };

    this.tween.onReverse = () => {
      this.anim.start();
    };

    this.tween.onPause = () => {
      this.anim.stop();
    };

    this.tween.onFinish = () => {
      var node = this.node;
      var attrs = Tween.attrs[node._id][this._id];

      if (attrs.points && attrs.points.trueEnd) {
        node.setAttr('points', attrs.points.trueEnd);
      }

      if (this.onFinish) {
        this.onFinish.call(this);
      }
    };

    this.tween.onReset = () => {
      var node = this.node;
      var attrs = Tween.attrs[node._id][this._id];

      if (attrs.points && attrs.points.trueStart) {
        node.points(attrs.points.trueStart);
      }

      if (this.onReset) {
        this.onReset();
      }
    };

    this.tween.onUpdate = () => {
      if (this.onUpdate) {
        this.onUpdate.call(this);
      }
    };
  }

  play() {
    this.tween.play();
    return this;
  }

  reverse() {
    this.tween.reverse();
    return this;
  }

  reset() {
    this.tween.reset();
    return this;
  }

  seek(t) {
    this.tween.seek(t * 1000);
    return this;
  }

  pause() {
    this.tween.pause();
    return this;
  }

  finish() {
    this.tween.finish();
    return this;
  }

  destroy() {
    var nodeId = this.node._id,
        thisId = this._id,
        attrs = Tween.tweens[nodeId],
        key;
    this.pause();

    for (key in attrs) {
      delete Tween.tweens[nodeId][key];
    }

    delete Tween.attrs[nodeId][thisId];
  }

}

exports.Tween = Tween;
Tween.attrs = {};
Tween.tweens = {};

_Node.Node.prototype.to = function (params) {
  var onFinish = params.onFinish;
  params.node = this;

  params.onFinish = function () {
    this.destroy();

    if (onFinish) {
      onFinish();
    }
  };

  var tween = new Tween(params);
  tween.play();
};

const Easings = {
  BackEaseIn(t, b, c, d) {
    var s = 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  },

  BackEaseOut(t, b, c, d) {
    var s = 1.70158;
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  },

  BackEaseInOut(t, b, c, d) {
    var s = 1.70158;

    if ((t /= d / 2) < 1) {
      return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
    }

    return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
  },

  ElasticEaseIn(t, b, c, d, a, p) {
    var s = 0;

    if (t === 0) {
      return b;
    }

    if ((t /= d) === 1) {
      return b + c;
    }

    if (!p) {
      p = d * 0.3;
    }

    if (!a || a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }

    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  },

  ElasticEaseOut(t, b, c, d, a, p) {
    var s = 0;

    if (t === 0) {
      return b;
    }

    if ((t /= d) === 1) {
      return b + c;
    }

    if (!p) {
      p = d * 0.3;
    }

    if (!a || a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }

    return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
  },

  ElasticEaseInOut(t, b, c, d, a, p) {
    var s = 0;

    if (t === 0) {
      return b;
    }

    if ((t /= d / 2) === 2) {
      return b + c;
    }

    if (!p) {
      p = d * (0.3 * 1.5);
    }

    if (!a || a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }

    if (t < 1) {
      return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }

    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
  },

  BounceEaseOut(t, b, c, d) {
    if ((t /= d) < 1 / 2.75) {
      return c * (7.5625 * t * t) + b;
    } else if (t < 2 / 2.75) {
      return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
    } else if (t < 2.5 / 2.75) {
      return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
    } else {
      return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
    }
  },

  BounceEaseIn(t, b, c, d) {
    return c - Easings.BounceEaseOut(d - t, 0, c, d) + b;
  },

  BounceEaseInOut(t, b, c, d) {
    if (t < d / 2) {
      return Easings.BounceEaseIn(t * 2, 0, c, d) * 0.5 + b;
    } else {
      return Easings.BounceEaseOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
    }
  },

  EaseIn(t, b, c, d) {
    return c * (t /= d) * t + b;
  },

  EaseOut(t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  },

  EaseInOut(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t + b;
    }

    return -c / 2 * (--t * (t - 2) - 1) + b;
  },

  StrongEaseIn(t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  },

  StrongEaseOut(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  },

  StrongEaseInOut(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t * t * t + b;
    }

    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  },

  Linear(t, b, c, d) {
    return c * t / d + b;
  }

};
exports.Easings = Easings;

},{"./Animation.js":1,"./Global.js":8,"./Node.js":11,"./Util.js":16}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Util = exports.Transform = void 0;

var _Global = require("./Global.js");

class Transform {
  constructor(m = [1, 0, 0, 1, 0, 0]) {
    this.dirty = false;
    this.m = m && m.slice() || [1, 0, 0, 1, 0, 0];
  }

  reset() {
    this.m[0] = 1;
    this.m[1] = 0;
    this.m[2] = 0;
    this.m[3] = 1;
    this.m[4] = 0;
    this.m[5] = 0;
  }

  copy() {
    return new Transform(this.m);
  }

  copyInto(tr) {
    tr.m[0] = this.m[0];
    tr.m[1] = this.m[1];
    tr.m[2] = this.m[2];
    tr.m[3] = this.m[3];
    tr.m[4] = this.m[4];
    tr.m[5] = this.m[5];
  }

  point(point) {
    var m = this.m;
    return {
      x: m[0] * point.x + m[2] * point.y + m[4],
      y: m[1] * point.x + m[3] * point.y + m[5]
    };
  }

  translate(x, y) {
    this.m[4] += this.m[0] * x + this.m[2] * y;
    this.m[5] += this.m[1] * x + this.m[3] * y;
    return this;
  }

  scale(sx, sy) {
    this.m[0] *= sx;
    this.m[1] *= sx;
    this.m[2] *= sy;
    this.m[3] *= sy;
    return this;
  }

  rotate(rad) {
    var c = Math.cos(rad);
    var s = Math.sin(rad);
    var m11 = this.m[0] * c + this.m[2] * s;
    var m12 = this.m[1] * c + this.m[3] * s;
    var m21 = this.m[0] * -s + this.m[2] * c;
    var m22 = this.m[1] * -s + this.m[3] * c;
    this.m[0] = m11;
    this.m[1] = m12;
    this.m[2] = m21;
    this.m[3] = m22;
    return this;
  }

  getTranslation() {
    return {
      x: this.m[4],
      y: this.m[5]
    };
  }

  skew(sx, sy) {
    var m11 = this.m[0] + this.m[2] * sy;
    var m12 = this.m[1] + this.m[3] * sy;
    var m21 = this.m[2] + this.m[0] * sx;
    var m22 = this.m[3] + this.m[1] * sx;
    this.m[0] = m11;
    this.m[1] = m12;
    this.m[2] = m21;
    this.m[3] = m22;
    return this;
  }

  multiply(matrix) {
    var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
    var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];
    var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
    var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];
    var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
    var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];
    this.m[0] = m11;
    this.m[1] = m12;
    this.m[2] = m21;
    this.m[3] = m22;
    this.m[4] = dx;
    this.m[5] = dy;
    return this;
  }

  invert() {
    var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
    var m0 = this.m[3] * d;
    var m1 = -this.m[1] * d;
    var m2 = -this.m[2] * d;
    var m3 = this.m[0] * d;
    var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
    var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
    this.m[0] = m0;
    this.m[1] = m1;
    this.m[2] = m2;
    this.m[3] = m3;
    this.m[4] = m4;
    this.m[5] = m5;
    return this;
  }

  getMatrix() {
    return this.m;
  }

  decompose() {
    var a = this.m[0];
    var b = this.m[1];
    var c = this.m[2];
    var d = this.m[3];
    var e = this.m[4];
    var f = this.m[5];
    var delta = a * d - b * c;
    let result = {
      x: e,
      y: f,
      rotation: 0,
      scaleX: 0,
      scaleY: 0,
      skewX: 0,
      skewY: 0
    };

    if (a != 0 || b != 0) {
      var r = Math.sqrt(a * a + b * b);
      result.rotation = b > 0 ? Math.acos(a / r) : -Math.acos(a / r);
      result.scaleX = r;
      result.scaleY = delta / r;
      result.skewX = (a * c + b * d) / delta;
      result.skewY = 0;
    } else if (c != 0 || d != 0) {
      var s = Math.sqrt(c * c + d * d);
      result.rotation = Math.PI / 2 - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s));
      result.scaleX = delta / s;
      result.scaleY = s;
      result.skewX = 0;
      result.skewY = (a * c + b * d) / delta;
    } else {}

    result.rotation = Util._getRotation(result.rotation);
    return result;
  }

}

exports.Transform = Transform;
var OBJECT_ARRAY = '[object Array]',
    OBJECT_NUMBER = '[object Number]',
    OBJECT_STRING = '[object String]',
    OBJECT_BOOLEAN = '[object Boolean]',
    PI_OVER_DEG180 = Math.PI / 180,
    DEG180_OVER_PI = 180 / Math.PI,
    HASH = '#',
    EMPTY_STRING = '',
    ZERO = '0',
    KONVA_WARNING = 'Konva warning: ',
    KONVA_ERROR = 'Konva error: ',
    RGB_PAREN = 'rgb(',
    COLORS = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 132, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 255, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 203],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [119, 128, 144],
  slategrey: [119, 128, 144],
  snow: [255, 255, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  transparent: [255, 255, 255, 0],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 5]
},
    RGB_REGEX = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/,
    animQueue = [];

const req = typeof requestAnimationFrame !== 'undefined' && requestAnimationFrame || function (f) {
  setTimeout(f, 60);
};

const Util = {
  _isElement(obj) {
    return !!(obj && obj.nodeType == 1);
  },

  _isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  },

  _isPlainObject(obj) {
    return !!obj && obj.constructor === Object;
  },

  _isArray(obj) {
    return Object.prototype.toString.call(obj) === OBJECT_ARRAY;
  },

  _isNumber(obj) {
    return Object.prototype.toString.call(obj) === OBJECT_NUMBER && !isNaN(obj) && isFinite(obj);
  },

  _isString(obj) {
    return Object.prototype.toString.call(obj) === OBJECT_STRING;
  },

  _isBoolean(obj) {
    return Object.prototype.toString.call(obj) === OBJECT_BOOLEAN;
  },

  isObject(val) {
    return val instanceof Object;
  },

  isValidSelector(selector) {
    if (typeof selector !== 'string') {
      return false;
    }

    var firstChar = selector[0];
    return firstChar === '#' || firstChar === '.' || firstChar === firstChar.toUpperCase();
  },

  _sign(number) {
    if (number === 0) {
      return 1;
    }

    if (number > 0) {
      return 1;
    } else {
      return -1;
    }
  },

  requestAnimFrame(callback) {
    animQueue.push(callback);

    if (animQueue.length === 1) {
      req(function () {
        const queue = animQueue;
        animQueue = [];
        queue.forEach(function (cb) {
          cb();
        });
      });
    }
  },

  createCanvasElement() {
    var canvas = document.createElement('canvas');

    try {
      canvas.style = canvas.style || {};
    } catch (e) {}

    return canvas;
  },

  createImageElement() {
    return document.createElement('img');
  },

  _isInDocument(el) {
    while (el = el.parentNode) {
      if (el == document) {
        return true;
      }
    }

    return false;
  },

  _urlToImage(url, callback) {
    var imageObj = Util.createImageElement();

    imageObj.onload = function () {
      callback(imageObj);
    };

    imageObj.src = url;
  },

  _rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  _hexToRgb(hex) {
    hex = hex.replace(HASH, EMPTY_STRING);
    var bigint = parseInt(hex, 16);
    return {
      r: bigint >> 16 & 255,
      g: bigint >> 8 & 255,
      b: bigint & 255
    };
  },

  getRandomColor() {
    var randColor = (Math.random() * 0xffffff << 0).toString(16);

    while (randColor.length < 6) {
      randColor = ZERO + randColor;
    }

    return HASH + randColor;
  },

  getRGB(color) {
    var rgb;

    if (color in COLORS) {
      rgb = COLORS[color];
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
      };
    } else if (color[0] === HASH) {
      return this._hexToRgb(color.substring(1));
    } else if (color.substr(0, 4) === RGB_PAREN) {
      rgb = RGB_REGEX.exec(color.replace(/ /g, ''));
      return {
        r: parseInt(rgb[1], 10),
        g: parseInt(rgb[2], 10),
        b: parseInt(rgb[3], 10)
      };
    } else {
      return {
        r: 0,
        g: 0,
        b: 0
      };
    }
  },

  colorToRGBA(str) {
    str = str || 'black';
    return Util._namedColorToRBA(str) || Util._hex3ColorToRGBA(str) || Util._hex6ColorToRGBA(str) || Util._rgbColorToRGBA(str) || Util._rgbaColorToRGBA(str) || Util._hslColorToRGBA(str);
  },

  _namedColorToRBA(str) {
    var c = COLORS[str.toLowerCase()];

    if (!c) {
      return null;
    }

    return {
      r: c[0],
      g: c[1],
      b: c[2],
      a: 1
    };
  },

  _rgbColorToRGBA(str) {
    if (str.indexOf('rgb(') === 0) {
      str = str.match(/rgb\(([^)]+)\)/)[1];
      var parts = str.split(/ *, */).map(Number);
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: 1
      };
    }
  },

  _rgbaColorToRGBA(str) {
    if (str.indexOf('rgba(') === 0) {
      str = str.match(/rgba\(([^)]+)\)/)[1];
      var parts = str.split(/ *, */).map((n, index) => {
        if (n.slice(-1) === '%') {
          return index === 3 ? parseInt(n) / 100 : parseInt(n) / 100 * 255;
        }

        return Number(n);
      });
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts[3]
      };
    }
  },

  _hex6ColorToRGBA(str) {
    if (str[0] === '#' && str.length === 7) {
      return {
        r: parseInt(str.slice(1, 3), 16),
        g: parseInt(str.slice(3, 5), 16),
        b: parseInt(str.slice(5, 7), 16),
        a: 1
      };
    }
  },

  _hex3ColorToRGBA(str) {
    if (str[0] === '#' && str.length === 4) {
      return {
        r: parseInt(str[1] + str[1], 16),
        g: parseInt(str[2] + str[2], 16),
        b: parseInt(str[3] + str[3], 16),
        a: 1
      };
    }
  },

  _hslColorToRGBA(str) {
    if (/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.test(str)) {
      const [_, ...hsl] = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(str);
      const h = Number(hsl[0]) / 360;
      const s = Number(hsl[1]) / 100;
      const l = Number(hsl[2]) / 100;
      let t2;
      let t3;
      let val;

      if (s === 0) {
        val = l * 255;
        return {
          r: Math.round(val),
          g: Math.round(val),
          b: Math.round(val),
          a: 1
        };
      }

      if (l < 0.5) {
        t2 = l * (1 + s);
      } else {
        t2 = l + s - l * s;
      }

      const t1 = 2 * l - t2;
      const rgb = [0, 0, 0];

      for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);

        if (t3 < 0) {
          t3++;
        }

        if (t3 > 1) {
          t3--;
        }

        if (6 * t3 < 1) {
          val = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          val = t2;
        } else if (3 * t3 < 2) {
          val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          val = t1;
        }

        rgb[i] = val * 255;
      }

      return {
        r: Math.round(rgb[0]),
        g: Math.round(rgb[1]),
        b: Math.round(rgb[2]),
        a: 1
      };
    }
  },

  haveIntersection(r1, r2) {
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
  },

  cloneObject(obj) {
    var retObj = {};

    for (var key in obj) {
      if (this._isPlainObject(obj[key])) {
        retObj[key] = this.cloneObject(obj[key]);
      } else if (this._isArray(obj[key])) {
        retObj[key] = this.cloneArray(obj[key]);
      } else {
        retObj[key] = obj[key];
      }
    }

    return retObj;
  },

  cloneArray(arr) {
    return arr.slice(0);
  },

  degToRad(deg) {
    return deg * PI_OVER_DEG180;
  },

  radToDeg(rad) {
    return rad * DEG180_OVER_PI;
  },

  _degToRad(deg) {
    Util.warn('Util._degToRad is removed. Please use public Util.degToRad instead.');
    return Util.degToRad(deg);
  },

  _radToDeg(rad) {
    Util.warn('Util._radToDeg is removed. Please use public Util.radToDeg instead.');
    return Util.radToDeg(rad);
  },

  _getRotation(radians) {
    return _Global.Konva.angleDeg ? Util.radToDeg(radians) : radians;
  },

  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  throw(str) {
    throw new Error(KONVA_ERROR + str);
  },

  error(str) {
    console.error(KONVA_ERROR + str);
  },

  warn(str) {
    if (!_Global.Konva.showWarnings) {
      return;
    }

    console.warn(KONVA_WARNING + str);
  },

  each(obj, func) {
    for (var key in obj) {
      func(key, obj[key]);
    }
  },

  _inRange(val, left, right) {
    return left <= val && val < right;
  },

  _getProjectionToSegment(x1, y1, x2, y2, x3, y3) {
    var x, y, dist;
    var pd2 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

    if (pd2 == 0) {
      x = x1;
      y = y1;
      dist = (x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2);
    } else {
      var u = ((x3 - x1) * (x2 - x1) + (y3 - y1) * (y2 - y1)) / pd2;

      if (u < 0) {
        x = x1;
        y = y1;
        dist = (x1 - x3) * (x1 - x3) + (y1 - y3) * (y1 - y3);
      } else if (u > 1.0) {
        x = x2;
        y = y2;
        dist = (x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3);
      } else {
        x = x1 + u * (x2 - x1);
        y = y1 + u * (y2 - y1);
        dist = (x - x3) * (x - x3) + (y - y3) * (y - y3);
      }
    }

    return [x, y, dist];
  },

  _getProjectionToLine(pt, line, isClosed) {
    var pc = Util.cloneObject(pt);
    var dist = Number.MAX_VALUE;
    line.forEach(function (p1, i) {
      if (!isClosed && i === line.length - 1) {
        return;
      }

      var p2 = line[(i + 1) % line.length];

      var proj = Util._getProjectionToSegment(p1.x, p1.y, p2.x, p2.y, pt.x, pt.y);

      var px = proj[0],
          py = proj[1],
          pdist = proj[2];

      if (pdist < dist) {
        pc.x = px;
        pc.y = py;
        dist = pdist;
      }
    });
    return pc;
  },

  _prepareArrayForTween(startArray, endArray, isClosed) {
    var n,
        start = [],
        end = [];

    if (startArray.length > endArray.length) {
      var temp = endArray;
      endArray = startArray;
      startArray = temp;
    }

    for (n = 0; n < startArray.length; n += 2) {
      start.push({
        x: startArray[n],
        y: startArray[n + 1]
      });
    }

    for (n = 0; n < endArray.length; n += 2) {
      end.push({
        x: endArray[n],
        y: endArray[n + 1]
      });
    }

    var newStart = [];
    end.forEach(function (point) {
      var pr = Util._getProjectionToLine(point, start, isClosed);

      newStart.push(pr.x);
      newStart.push(pr.y);
    });
    return newStart;
  },

  _prepareToStringify(obj) {
    var desc;
    obj.visitedByCircularReferenceRemoval = true;

    for (var key in obj) {
      if (!(obj.hasOwnProperty(key) && obj[key] && typeof obj[key] == 'object')) {
        continue;
      }

      desc = Object.getOwnPropertyDescriptor(obj, key);

      if (obj[key].visitedByCircularReferenceRemoval || Util._isElement(obj[key])) {
        if (desc.configurable) {
          delete obj[key];
        } else {
          return null;
        }
      } else if (Util._prepareToStringify(obj[key]) === null) {
        if (desc.configurable) {
          delete obj[key];
        } else {
          return null;
        }
      }
    }

    delete obj.visitedByCircularReferenceRemoval;
    return obj;
  },

  _assign(target, source) {
    for (var key in source) {
      target[key] = source[key];
    }

    return target;
  },

  _getFirstPointerId(evt) {
    if (!evt.touches) {
      return evt.pointerId || 999;
    } else {
      return evt.changedTouches[0].identifier;
    }
  }

};
exports.Util = Util;

},{"./Global.js":8}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RGBComponent = RGBComponent;
exports.alphaComponent = alphaComponent;
exports.getBooleanValidator = getBooleanValidator;
exports.getComponentValidator = getComponentValidator;
exports.getFunctionValidator = getFunctionValidator;
exports.getNumberArrayValidator = getNumberArrayValidator;
exports.getNumberOrArrayOfNumbersValidator = getNumberOrArrayOfNumbersValidator;
exports.getNumberOrAutoValidator = getNumberOrAutoValidator;
exports.getNumberValidator = getNumberValidator;
exports.getStringOrGradientValidator = getStringOrGradientValidator;
exports.getStringValidator = getStringValidator;

var _Global = require("./Global.js");

var _Util = require("./Util.js");

function _formatValue(val) {
  if (_Util.Util._isString(val)) {
    return '"' + val + '"';
  }

  if (Object.prototype.toString.call(val) === '[object Number]') {
    return val;
  }

  if (_Util.Util._isBoolean(val)) {
    return val;
  }

  return Object.prototype.toString.call(val);
}

function RGBComponent(val) {
  if (val > 255) {
    return 255;
  } else if (val < 0) {
    return 0;
  }

  return Math.round(val);
}

function alphaComponent(val) {
  if (val > 1) {
    return 1;
  } else if (val < 0.0001) {
    return 0.0001;
  }

  return val;
}

function getNumberValidator() {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      if (!_Util.Util._isNumber(val)) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a number.');
      }

      return val;
    };
  }
}

function getNumberOrArrayOfNumbersValidator(noOfElements) {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      let isNumber = _Util.Util._isNumber(val);

      let isValidArray = _Util.Util._isArray(val) && val.length == noOfElements;

      if (!isNumber && !isValidArray) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a number or Array<number>(' + noOfElements + ')');
      }

      return val;
    };
  }
}

function getNumberOrAutoValidator() {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      var isNumber = _Util.Util._isNumber(val);

      var isAuto = val === 'auto';

      if (!(isNumber || isAuto)) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a number or "auto".');
      }

      return val;
    };
  }
}

function getStringValidator() {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      if (!_Util.Util._isString(val)) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a string.');
      }

      return val;
    };
  }
}

function getStringOrGradientValidator() {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      const isString = _Util.Util._isString(val);

      const isGradient = Object.prototype.toString.call(val) === '[object CanvasGradient]' || val && val.addColorStop;

      if (!(isString || isGradient)) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a string or a native gradient.');
      }

      return val;
    };
  }
}

function getFunctionValidator() {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      if (!_Util.Util._isFunction(val)) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a function.');
      }

      return val;
    };
  }
}

function getNumberArrayValidator() {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      if (!_Util.Util._isArray(val)) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a array of numbers.');
      } else {
        val.forEach(function (item) {
          if (!_Util.Util._isNumber(item)) {
            _Util.Util.warn('"' + attr + '" attribute has non numeric element ' + item + '. Make sure that all elements are numbers.');
          }
        });
      }

      return val;
    };
  }
}

function getBooleanValidator() {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      var isBool = val === true || val === false;

      if (!isBool) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a boolean.');
      }

      return val;
    };
  }
}

function getComponentValidator(components) {
  if (_Global.Konva.isUnminified) {
    return function (val, attr) {
      if (!_Util.Util.isObject(val)) {
        _Util.Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be an object with properties ' + components);
      }

      return val;
    };
  }
}

},{"./Global.js":8,"./Util.js":16}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Konva = void 0;

var _Global = require("./Global.js");

var _Util = require("./Util.js");

var _Node = require("./Node.js");

var _Container = require("./Container.js");

var _Stage = require("./Stage.js");

var _Layer = require("./Layer.js");

var _FastLayer = require("./FastLayer.js");

var _Group = require("./Group.js");

var _DragAndDrop = require("./DragAndDrop.js");

var _Shape = require("./Shape.js");

var _Animation = require("./Animation.js");

var _Tween = require("./Tween.js");

var _Context = require("./Context.js");

var _Canvas = require("./Canvas.js");

const Konva = _Util.Util._assign(_Global.Konva, {
  Util: _Util.Util,
  Transform: _Util.Transform,
  Node: _Node.Node,
  Container: _Container.Container,
  Stage: _Stage.Stage,
  stages: _Stage.stages,
  Layer: _Layer.Layer,
  FastLayer: _FastLayer.FastLayer,
  Group: _Group.Group,
  DD: _DragAndDrop.DD,
  Shape: _Shape.Shape,
  shapes: _Shape.shapes,
  Animation: _Animation.Animation,
  Tween: _Tween.Tween,
  Easings: _Tween.Easings,
  Context: _Context.Context,
  Canvas: _Canvas.Canvas
});

exports.Konva = Konva;
var _default = Konva;
exports.default = _default;

},{"./Animation.js":1,"./Canvas.js":2,"./Container.js":3,"./Context.js":4,"./DragAndDrop.js":5,"./FastLayer.js":7,"./Global.js":8,"./Group.js":9,"./Layer.js":10,"./Node.js":11,"./Shape.js":13,"./Stage.js":14,"./Tween.js":15,"./Util.js":16}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Konva = void 0;

var _CoreInternals = require("./_CoreInternals.js");

var _Arc = require("./shapes/Arc.js");

var _Arrow = require("./shapes/Arrow.js");

var _Circle = require("./shapes/Circle.js");

var _Ellipse = require("./shapes/Ellipse.js");

var _Image = require("./shapes/Image.js");

var _Label = require("./shapes/Label.js");

var _Line = require("./shapes/Line.js");

var _Path = require("./shapes/Path.js");

var _Rect = require("./shapes/Rect.js");

var _RegularPolygon = require("./shapes/RegularPolygon.js");

var _Ring = require("./shapes/Ring.js");

var _Sprite = require("./shapes/Sprite.js");

var _Star = require("./shapes/Star.js");

var _Text = require("./shapes/Text.js");

var _TextPath = require("./shapes/TextPath.js");

var _Transformer = require("./shapes/Transformer.js");

var _Wedge = require("./shapes/Wedge.js");

var _Blur = require("./filters/Blur.js");

var _Brighten = require("./filters/Brighten.js");

var _Contrast = require("./filters/Contrast.js");

var _Emboss = require("./filters/Emboss.js");

var _Enhance = require("./filters/Enhance.js");

var _Grayscale = require("./filters/Grayscale.js");

var _HSL = require("./filters/HSL.js");

var _HSV = require("./filters/HSV.js");

var _Invert = require("./filters/Invert.js");

var _Kaleidoscope = require("./filters/Kaleidoscope.js");

var _Mask = require("./filters/Mask.js");

var _Noise = require("./filters/Noise.js");

var _Pixelate = require("./filters/Pixelate.js");

var _Posterize = require("./filters/Posterize.js");

var _RGB = require("./filters/RGB.js");

var _RGBA = require("./filters/RGBA.js");

var _Sepia = require("./filters/Sepia.js");

var _Solarize = require("./filters/Solarize.js");

var _Threshold = require("./filters/Threshold.js");

const Konva = _CoreInternals.Konva.Util._assign(_CoreInternals.Konva, {
  Arc: _Arc.Arc,
  Arrow: _Arrow.Arrow,
  Circle: _Circle.Circle,
  Ellipse: _Ellipse.Ellipse,
  Image: _Image.Image,
  Label: _Label.Label,
  Tag: _Label.Tag,
  Line: _Line.Line,
  Path: _Path.Path,
  Rect: _Rect.Rect,
  RegularPolygon: _RegularPolygon.RegularPolygon,
  Ring: _Ring.Ring,
  Sprite: _Sprite.Sprite,
  Star: _Star.Star,
  Text: _Text.Text,
  TextPath: _TextPath.TextPath,
  Transformer: _Transformer.Transformer,
  Wedge: _Wedge.Wedge,
  Filters: {
    Blur: _Blur.Blur,
    Brighten: _Brighten.Brighten,
    Contrast: _Contrast.Contrast,
    Emboss: _Emboss.Emboss,
    Enhance: _Enhance.Enhance,
    Grayscale: _Grayscale.Grayscale,
    HSL: _HSL.HSL,
    HSV: _HSV.HSV,
    Invert: _Invert.Invert,
    Kaleidoscope: _Kaleidoscope.Kaleidoscope,
    Mask: _Mask.Mask,
    Noise: _Noise.Noise,
    Pixelate: _Pixelate.Pixelate,
    Posterize: _Posterize.Posterize,
    RGB: _RGB.RGB,
    RGBA: _RGBA.RGBA,
    Sepia: _Sepia.Sepia,
    Solarize: _Solarize.Solarize,
    Threshold: _Threshold.Threshold
  }
});

exports.Konva = Konva;

},{"./_CoreInternals.js":18,"./filters/Blur.js":20,"./filters/Brighten.js":21,"./filters/Contrast.js":22,"./filters/Emboss.js":23,"./filters/Enhance.js":24,"./filters/Grayscale.js":25,"./filters/HSL.js":26,"./filters/HSV.js":27,"./filters/Invert.js":28,"./filters/Kaleidoscope.js":29,"./filters/Mask.js":30,"./filters/Noise.js":31,"./filters/Pixelate.js":32,"./filters/Posterize.js":33,"./filters/RGB.js":34,"./filters/RGBA.js":35,"./filters/Sepia.js":36,"./filters/Solarize.js":37,"./filters/Threshold.js":38,"./shapes/Arc.js":40,"./shapes/Arrow.js":41,"./shapes/Circle.js":42,"./shapes/Ellipse.js":43,"./shapes/Image.js":44,"./shapes/Label.js":45,"./shapes/Line.js":46,"./shapes/Path.js":47,"./shapes/Rect.js":48,"./shapes/RegularPolygon.js":49,"./shapes/Ring.js":50,"./shapes/Sprite.js":51,"./shapes/Star.js":52,"./shapes/Text.js":53,"./shapes/TextPath.js":54,"./shapes/Transformer.js":55,"./shapes/Wedge.js":56}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Blur = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

function BlurStack() {
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = 0;
  this.next = null;
}

var mul_table = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
var shg_table = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];

function filterGaussBlurRGBA(imageData, radius) {
  var pixels = imageData.data,
      width = imageData.width,
      height = imageData.height;
  var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, r_out_sum, g_out_sum, b_out_sum, a_out_sum, r_in_sum, g_in_sum, b_in_sum, a_in_sum, pr, pg, pb, pa, rbs;
  var div = radius + radius + 1,
      widthMinus1 = width - 1,
      heightMinus1 = height - 1,
      radiusPlus1 = radius + 1,
      sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2,
      stackStart = new BlurStack(),
      stackEnd = null,
      stack = stackStart,
      stackIn = null,
      stackOut = null,
      mul_sum = mul_table[radius],
      shg_sum = shg_table[radius];

  for (i = 1; i < div; i++) {
    stack = stack.next = new BlurStack();

    if (i === radiusPlus1) {
      stackEnd = stack;
    }
  }

  stack.next = stackStart;
  yw = yi = 0;

  for (y = 0; y < height; y++) {
    r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
    r_sum += sumFactor * pr;
    g_sum += sumFactor * pg;
    b_sum += sumFactor * pb;
    a_sum += sumFactor * pa;
    stack = stackStart;

    for (i = 0; i < radiusPlus1; i++) {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack.a = pa;
      stack = stack.next;
    }

    for (i = 1; i < radiusPlus1; i++) {
      p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
      r_sum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
      g_sum += (stack.g = pg = pixels[p + 1]) * rbs;
      b_sum += (stack.b = pb = pixels[p + 2]) * rbs;
      a_sum += (stack.a = pa = pixels[p + 3]) * rbs;
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
      a_in_sum += pa;
      stack = stack.next;
    }

    stackIn = stackStart;
    stackOut = stackEnd;

    for (x = 0; x < width; x++) {
      pixels[yi + 3] = pa = a_sum * mul_sum >> shg_sum;

      if (pa !== 0) {
        pa = 255 / pa;
        pixels[yi] = (r_sum * mul_sum >> shg_sum) * pa;
        pixels[yi + 1] = (g_sum * mul_sum >> shg_sum) * pa;
        pixels[yi + 2] = (b_sum * mul_sum >> shg_sum) * pa;
      } else {
        pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
      }

      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
      a_sum -= a_out_sum;
      r_out_sum -= stackIn.r;
      g_out_sum -= stackIn.g;
      b_out_sum -= stackIn.b;
      a_out_sum -= stackIn.a;
      p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;
      r_in_sum += stackIn.r = pixels[p];
      g_in_sum += stackIn.g = pixels[p + 1];
      b_in_sum += stackIn.b = pixels[p + 2];
      a_in_sum += stackIn.a = pixels[p + 3];
      r_sum += r_in_sum;
      g_sum += g_in_sum;
      b_sum += b_in_sum;
      a_sum += a_in_sum;
      stackIn = stackIn.next;
      r_out_sum += pr = stackOut.r;
      g_out_sum += pg = stackOut.g;
      b_out_sum += pb = stackOut.b;
      a_out_sum += pa = stackOut.a;
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
      a_in_sum -= pa;
      stackOut = stackOut.next;
      yi += 4;
    }

    yw += width;
  }

  for (x = 0; x < width; x++) {
    g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
    yi = x << 2;
    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
    r_sum += sumFactor * pr;
    g_sum += sumFactor * pg;
    b_sum += sumFactor * pb;
    a_sum += sumFactor * pa;
    stack = stackStart;

    for (i = 0; i < radiusPlus1; i++) {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack.a = pa;
      stack = stack.next;
    }

    yp = width;

    for (i = 1; i <= radius; i++) {
      yi = yp + x << 2;
      r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
      g_sum += (stack.g = pg = pixels[yi + 1]) * rbs;
      b_sum += (stack.b = pb = pixels[yi + 2]) * rbs;
      a_sum += (stack.a = pa = pixels[yi + 3]) * rbs;
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
      a_in_sum += pa;
      stack = stack.next;

      if (i < heightMinus1) {
        yp += width;
      }
    }

    yi = x;
    stackIn = stackStart;
    stackOut = stackEnd;

    for (y = 0; y < height; y++) {
      p = yi << 2;
      pixels[p + 3] = pa = a_sum * mul_sum >> shg_sum;

      if (pa > 0) {
        pa = 255 / pa;
        pixels[p] = (r_sum * mul_sum >> shg_sum) * pa;
        pixels[p + 1] = (g_sum * mul_sum >> shg_sum) * pa;
        pixels[p + 2] = (b_sum * mul_sum >> shg_sum) * pa;
      } else {
        pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
      }

      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
      a_sum -= a_out_sum;
      r_out_sum -= stackIn.r;
      g_out_sum -= stackIn.g;
      b_out_sum -= stackIn.b;
      a_out_sum -= stackIn.a;
      p = x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;
      r_sum += r_in_sum += stackIn.r = pixels[p];
      g_sum += g_in_sum += stackIn.g = pixels[p + 1];
      b_sum += b_in_sum += stackIn.b = pixels[p + 2];
      a_sum += a_in_sum += stackIn.a = pixels[p + 3];
      stackIn = stackIn.next;
      r_out_sum += pr = stackOut.r;
      g_out_sum += pg = stackOut.g;
      b_out_sum += pb = stackOut.b;
      a_out_sum += pa = stackOut.a;
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
      a_in_sum -= pa;
      stackOut = stackOut.next;
      yi += width;
    }
  }
}

const Blur = function Blur(imageData) {
  var radius = Math.round(this.blurRadius());

  if (radius > 0) {
    filterGaussBlurRGBA(imageData, radius);
  }
};

exports.Blur = Blur;

_Factory.Factory.addGetterSetter(_Node.Node, 'blurRadius', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Brighten = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const Brighten = function (imageData) {
  var brightness = this.brightness() * 255,
      data = imageData.data,
      len = data.length,
      i;

  for (i = 0; i < len; i += 4) {
    data[i] += brightness;
    data[i + 1] += brightness;
    data[i + 2] += brightness;
  }
};

exports.Brighten = Brighten;

_Factory.Factory.addGetterSetter(_Node.Node, 'brightness', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Contrast = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const Contrast = function (imageData) {
  var adjust = Math.pow((this.contrast() + 100) / 100, 2);
  var data = imageData.data,
      nPixels = data.length,
      red = 150,
      green = 150,
      blue = 150,
      i;

  for (i = 0; i < nPixels; i += 4) {
    red = data[i];
    green = data[i + 1];
    blue = data[i + 2];
    red /= 255;
    red -= 0.5;
    red *= adjust;
    red += 0.5;
    red *= 255;
    green /= 255;
    green -= 0.5;
    green *= adjust;
    green += 0.5;
    green *= 255;
    blue /= 255;
    blue -= 0.5;
    blue *= adjust;
    blue += 0.5;
    blue *= 255;
    red = red < 0 ? 0 : red > 255 ? 255 : red;
    green = green < 0 ? 0 : green > 255 ? 255 : green;
    blue = blue < 0 ? 0 : blue > 255 ? 255 : blue;
    data[i] = red;
    data[i + 1] = green;
    data[i + 2] = blue;
  }
};

exports.Contrast = Contrast;

_Factory.Factory.addGetterSetter(_Node.Node, 'contrast', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Emboss = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Util = require("../Util.js");

var _Validators = require("../Validators.js");

const Emboss = function (imageData) {
  var strength = this.embossStrength() * 10,
      greyLevel = this.embossWhiteLevel() * 255,
      direction = this.embossDirection(),
      blend = this.embossBlend(),
      dirY = 0,
      dirX = 0,
      data = imageData.data,
      w = imageData.width,
      h = imageData.height,
      w4 = w * 4,
      y = h;

  switch (direction) {
    case 'top-left':
      dirY = -1;
      dirX = -1;
      break;

    case 'top':
      dirY = -1;
      dirX = 0;
      break;

    case 'top-right':
      dirY = -1;
      dirX = 1;
      break;

    case 'right':
      dirY = 0;
      dirX = 1;
      break;

    case 'bottom-right':
      dirY = 1;
      dirX = 1;
      break;

    case 'bottom':
      dirY = 1;
      dirX = 0;
      break;

    case 'bottom-left':
      dirY = 1;
      dirX = -1;
      break;

    case 'left':
      dirY = 0;
      dirX = -1;
      break;

    default:
      _Util.Util.error('Unknown emboss direction: ' + direction);

  }

  do {
    var offsetY = (y - 1) * w4;
    var otherY = dirY;

    if (y + otherY < 1) {
      otherY = 0;
    }

    if (y + otherY > h) {
      otherY = 0;
    }

    var offsetYOther = (y - 1 + otherY) * w * 4;
    var x = w;

    do {
      var offset = offsetY + (x - 1) * 4;
      var otherX = dirX;

      if (x + otherX < 1) {
        otherX = 0;
      }

      if (x + otherX > w) {
        otherX = 0;
      }

      var offsetOther = offsetYOther + (x - 1 + otherX) * 4;
      var dR = data[offset] - data[offsetOther];
      var dG = data[offset + 1] - data[offsetOther + 1];
      var dB = data[offset + 2] - data[offsetOther + 2];
      var dif = dR;
      var absDif = dif > 0 ? dif : -dif;
      var absG = dG > 0 ? dG : -dG;
      var absB = dB > 0 ? dB : -dB;

      if (absG > absDif) {
        dif = dG;
      }

      if (absB > absDif) {
        dif = dB;
      }

      dif *= strength;

      if (blend) {
        var r = data[offset] + dif;
        var g = data[offset + 1] + dif;
        var b = data[offset + 2] + dif;
        data[offset] = r > 255 ? 255 : r < 0 ? 0 : r;
        data[offset + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
        data[offset + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
      } else {
        var grey = greyLevel - dif;

        if (grey < 0) {
          grey = 0;
        } else if (grey > 255) {
          grey = 255;
        }

        data[offset] = data[offset + 1] = data[offset + 2] = grey;
      }
    } while (--x);
  } while (--y);
};

exports.Emboss = Emboss;

_Factory.Factory.addGetterSetter(_Node.Node, 'embossStrength', 0.5, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'embossWhiteLevel', 0.5, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'embossDirection', 'top-left', null, _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'embossBlend', false, null, _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Util.js":16,"../Validators.js":17}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Enhance = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

function remap(fromValue, fromMin, fromMax, toMin, toMax) {
  var fromRange = fromMax - fromMin,
      toRange = toMax - toMin,
      toValue;

  if (fromRange === 0) {
    return toMin + toRange / 2;
  }

  if (toRange === 0) {
    return toMin;
  }

  toValue = (fromValue - fromMin) / fromRange;
  toValue = toRange * toValue + toMin;
  return toValue;
}

const Enhance = function (imageData) {
  var data = imageData.data,
      nSubPixels = data.length,
      rMin = data[0],
      rMax = rMin,
      r,
      gMin = data[1],
      gMax = gMin,
      g,
      bMin = data[2],
      bMax = bMin,
      b,
      i;
  var enhanceAmount = this.enhance();

  if (enhanceAmount === 0) {
    return;
  }

  for (i = 0; i < nSubPixels; i += 4) {
    r = data[i + 0];

    if (r < rMin) {
      rMin = r;
    } else if (r > rMax) {
      rMax = r;
    }

    g = data[i + 1];

    if (g < gMin) {
      gMin = g;
    } else if (g > gMax) {
      gMax = g;
    }

    b = data[i + 2];

    if (b < bMin) {
      bMin = b;
    } else if (b > bMax) {
      bMax = b;
    }
  }

  if (rMax === rMin) {
    rMax = 255;
    rMin = 0;
  }

  if (gMax === gMin) {
    gMax = 255;
    gMin = 0;
  }

  if (bMax === bMin) {
    bMax = 255;
    bMin = 0;
  }

  var rMid, rGoalMax, rGoalMin, gMid, gGoalMax, gGoalMin, bMid, bGoalMax, bGoalMin;

  if (enhanceAmount > 0) {
    rGoalMax = rMax + enhanceAmount * (255 - rMax);
    rGoalMin = rMin - enhanceAmount * (rMin - 0);
    gGoalMax = gMax + enhanceAmount * (255 - gMax);
    gGoalMin = gMin - enhanceAmount * (gMin - 0);
    bGoalMax = bMax + enhanceAmount * (255 - bMax);
    bGoalMin = bMin - enhanceAmount * (bMin - 0);
  } else {
    rMid = (rMax + rMin) * 0.5;
    rGoalMax = rMax + enhanceAmount * (rMax - rMid);
    rGoalMin = rMin + enhanceAmount * (rMin - rMid);
    gMid = (gMax + gMin) * 0.5;
    gGoalMax = gMax + enhanceAmount * (gMax - gMid);
    gGoalMin = gMin + enhanceAmount * (gMin - gMid);
    bMid = (bMax + bMin) * 0.5;
    bGoalMax = bMax + enhanceAmount * (bMax - bMid);
    bGoalMin = bMin + enhanceAmount * (bMin - bMid);
  }

  for (i = 0; i < nSubPixels; i += 4) {
    data[i + 0] = remap(data[i + 0], rMin, rMax, rGoalMin, rGoalMax);
    data[i + 1] = remap(data[i + 1], gMin, gMax, gGoalMin, gGoalMax);
    data[i + 2] = remap(data[i + 2], bMin, bMax, bGoalMin, bGoalMax);
  }
};

exports.Enhance = Enhance;

_Factory.Factory.addGetterSetter(_Node.Node, 'enhance', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Grayscale = void 0;

const Grayscale = function (imageData) {
  var data = imageData.data,
      len = data.length,
      i,
      brightness;

  for (i = 0; i < len; i += 4) {
    brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
    data[i] = brightness;
    data[i + 1] = brightness;
    data[i + 2] = brightness;
  }
};

exports.Grayscale = Grayscale;

},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HSL = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

_Factory.Factory.addGetterSetter(_Node.Node, 'hue', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'saturation', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'luminance', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

const HSL = function (imageData) {
  var data = imageData.data,
      nPixels = data.length,
      v = 1,
      s = Math.pow(2, this.saturation()),
      h = Math.abs(this.hue() + 360) % 360,
      l = this.luminance() * 127,
      i;
  var vsu = v * s * Math.cos(h * Math.PI / 180),
      vsw = v * s * Math.sin(h * Math.PI / 180);
  var rr = 0.299 * v + 0.701 * vsu + 0.167 * vsw,
      rg = 0.587 * v - 0.587 * vsu + 0.33 * vsw,
      rb = 0.114 * v - 0.114 * vsu - 0.497 * vsw;
  var gr = 0.299 * v - 0.299 * vsu - 0.328 * vsw,
      gg = 0.587 * v + 0.413 * vsu + 0.035 * vsw,
      gb = 0.114 * v - 0.114 * vsu + 0.293 * vsw;
  var br = 0.299 * v - 0.3 * vsu + 1.25 * vsw,
      bg = 0.587 * v - 0.586 * vsu - 1.05 * vsw,
      bb = 0.114 * v + 0.886 * vsu - 0.2 * vsw;
  var r, g, b, a;

  for (i = 0; i < nPixels; i += 4) {
    r = data[i + 0];
    g = data[i + 1];
    b = data[i + 2];
    a = data[i + 3];
    data[i + 0] = rr * r + rg * g + rb * b + l;
    data[i + 1] = gr * r + gg * g + gb * b + l;
    data[i + 2] = br * r + bg * g + bb * b + l;
    data[i + 3] = a;
  }
};

exports.HSL = HSL;

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HSV = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const HSV = function (imageData) {
  var data = imageData.data,
      nPixels = data.length,
      v = Math.pow(2, this.value()),
      s = Math.pow(2, this.saturation()),
      h = Math.abs(this.hue() + 360) % 360,
      i;
  var vsu = v * s * Math.cos(h * Math.PI / 180),
      vsw = v * s * Math.sin(h * Math.PI / 180);
  var rr = 0.299 * v + 0.701 * vsu + 0.167 * vsw,
      rg = 0.587 * v - 0.587 * vsu + 0.33 * vsw,
      rb = 0.114 * v - 0.114 * vsu - 0.497 * vsw;
  var gr = 0.299 * v - 0.299 * vsu - 0.328 * vsw,
      gg = 0.587 * v + 0.413 * vsu + 0.035 * vsw,
      gb = 0.114 * v - 0.114 * vsu + 0.293 * vsw;
  var br = 0.299 * v - 0.3 * vsu + 1.25 * vsw,
      bg = 0.587 * v - 0.586 * vsu - 1.05 * vsw,
      bb = 0.114 * v + 0.886 * vsu - 0.2 * vsw;
  var r, g, b, a;

  for (i = 0; i < nPixels; i += 4) {
    r = data[i + 0];
    g = data[i + 1];
    b = data[i + 2];
    a = data[i + 3];
    data[i + 0] = rr * r + rg * g + rb * b;
    data[i + 1] = gr * r + gg * g + gb * b;
    data[i + 2] = br * r + bg * g + bb * b;
    data[i + 3] = a;
  }
};

exports.HSV = HSV;

_Factory.Factory.addGetterSetter(_Node.Node, 'hue', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'saturation', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'value', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Invert = void 0;

const Invert = function (imageData) {
  var data = imageData.data,
      len = data.length,
      i;

  for (i = 0; i < len; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
};

exports.Invert = Invert;

},{}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Kaleidoscope = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Util = require("../Util.js");

var _Validators = require("../Validators.js");

var ToPolar = function (src, dst, opt) {
  var srcPixels = src.data,
      dstPixels = dst.data,
      xSize = src.width,
      ySize = src.height,
      xMid = opt.polarCenterX || xSize / 2,
      yMid = opt.polarCenterY || ySize / 2,
      i,
      x,
      y,
      r = 0,
      g = 0,
      b = 0,
      a = 0;
  var rad,
      rMax = Math.sqrt(xMid * xMid + yMid * yMid);
  x = xSize - xMid;
  y = ySize - yMid;
  rad = Math.sqrt(x * x + y * y);
  rMax = rad > rMax ? rad : rMax;
  var rSize = ySize,
      tSize = xSize,
      radius,
      theta;
  var conversion = 360 / tSize * Math.PI / 180,
      sin,
      cos;

  for (theta = 0; theta < tSize; theta += 1) {
    sin = Math.sin(theta * conversion);
    cos = Math.cos(theta * conversion);

    for (radius = 0; radius < rSize; radius += 1) {
      x = Math.floor(xMid + rMax * radius / rSize * cos);
      y = Math.floor(yMid + rMax * radius / rSize * sin);
      i = (y * xSize + x) * 4;
      r = srcPixels[i + 0];
      g = srcPixels[i + 1];
      b = srcPixels[i + 2];
      a = srcPixels[i + 3];
      i = (theta + radius * xSize) * 4;
      dstPixels[i + 0] = r;
      dstPixels[i + 1] = g;
      dstPixels[i + 2] = b;
      dstPixels[i + 3] = a;
    }
  }
};

var FromPolar = function (src, dst, opt) {
  var srcPixels = src.data,
      dstPixels = dst.data,
      xSize = src.width,
      ySize = src.height,
      xMid = opt.polarCenterX || xSize / 2,
      yMid = opt.polarCenterY || ySize / 2,
      i,
      x,
      y,
      dx,
      dy,
      r = 0,
      g = 0,
      b = 0,
      a = 0;
  var rad,
      rMax = Math.sqrt(xMid * xMid + yMid * yMid);
  x = xSize - xMid;
  y = ySize - yMid;
  rad = Math.sqrt(x * x + y * y);
  rMax = rad > rMax ? rad : rMax;
  var rSize = ySize,
      tSize = xSize,
      radius,
      theta,
      phaseShift = opt.polarRotation || 0;
  var x1, y1;

  for (x = 0; x < xSize; x += 1) {
    for (y = 0; y < ySize; y += 1) {
      dx = x - xMid;
      dy = y - yMid;
      radius = Math.sqrt(dx * dx + dy * dy) * rSize / rMax;
      theta = (Math.atan2(dy, dx) * 180 / Math.PI + 360 + phaseShift) % 360;
      theta = theta * tSize / 360;
      x1 = Math.floor(theta);
      y1 = Math.floor(radius);
      i = (y1 * xSize + x1) * 4;
      r = srcPixels[i + 0];
      g = srcPixels[i + 1];
      b = srcPixels[i + 2];
      a = srcPixels[i + 3];
      i = (y * xSize + x) * 4;
      dstPixels[i + 0] = r;
      dstPixels[i + 1] = g;
      dstPixels[i + 2] = b;
      dstPixels[i + 3] = a;
    }
  }
};

const Kaleidoscope = function (imageData) {
  var xSize = imageData.width,
      ySize = imageData.height;
  var x, y, xoff, i, r, g, b, a, srcPos, dstPos;
  var power = Math.round(this.kaleidoscopePower());
  var angle = Math.round(this.kaleidoscopeAngle());
  var offset = Math.floor(xSize * (angle % 360) / 360);

  if (power < 1) {
    return;
  }

  var tempCanvas = _Util.Util.createCanvasElement();

  tempCanvas.width = xSize;
  tempCanvas.height = ySize;
  var scratchData = tempCanvas.getContext('2d').getImageData(0, 0, xSize, ySize);
  ToPolar(imageData, scratchData, {
    polarCenterX: xSize / 2,
    polarCenterY: ySize / 2
  });
  var minSectionSize = xSize / Math.pow(2, power);

  while (minSectionSize <= 8) {
    minSectionSize = minSectionSize * 2;
    power -= 1;
  }

  minSectionSize = Math.ceil(minSectionSize);
  var sectionSize = minSectionSize;
  var xStart = 0,
      xEnd = sectionSize,
      xDelta = 1;

  if (offset + minSectionSize > xSize) {
    xStart = sectionSize;
    xEnd = 0;
    xDelta = -1;
  }

  for (y = 0; y < ySize; y += 1) {
    for (x = xStart; x !== xEnd; x += xDelta) {
      xoff = Math.round(x + offset) % xSize;
      srcPos = (xSize * y + xoff) * 4;
      r = scratchData.data[srcPos + 0];
      g = scratchData.data[srcPos + 1];
      b = scratchData.data[srcPos + 2];
      a = scratchData.data[srcPos + 3];
      dstPos = (xSize * y + x) * 4;
      scratchData.data[dstPos + 0] = r;
      scratchData.data[dstPos + 1] = g;
      scratchData.data[dstPos + 2] = b;
      scratchData.data[dstPos + 3] = a;
    }
  }

  for (y = 0; y < ySize; y += 1) {
    sectionSize = Math.floor(minSectionSize);

    for (i = 0; i < power; i += 1) {
      for (x = 0; x < sectionSize + 1; x += 1) {
        srcPos = (xSize * y + x) * 4;
        r = scratchData.data[srcPos + 0];
        g = scratchData.data[srcPos + 1];
        b = scratchData.data[srcPos + 2];
        a = scratchData.data[srcPos + 3];
        dstPos = (xSize * y + sectionSize * 2 - x - 1) * 4;
        scratchData.data[dstPos + 0] = r;
        scratchData.data[dstPos + 1] = g;
        scratchData.data[dstPos + 2] = b;
        scratchData.data[dstPos + 3] = a;
      }

      sectionSize *= 2;
    }
  }

  FromPolar(scratchData, imageData, {
    polarRotation: 0
  });
};

exports.Kaleidoscope = Kaleidoscope;

_Factory.Factory.addGetterSetter(_Node.Node, 'kaleidoscopePower', 2, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'kaleidoscopeAngle', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Util.js":16,"../Validators.js":17}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Mask = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

function pixelAt(idata, x, y) {
  var idx = (y * idata.width + x) * 4;
  var d = [];
  d.push(idata.data[idx++], idata.data[idx++], idata.data[idx++], idata.data[idx++]);
  return d;
}

function rgbDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
}

function rgbMean(pTab) {
  var m = [0, 0, 0];

  for (var i = 0; i < pTab.length; i++) {
    m[0] += pTab[i][0];
    m[1] += pTab[i][1];
    m[2] += pTab[i][2];
  }

  m[0] /= pTab.length;
  m[1] /= pTab.length;
  m[2] /= pTab.length;
  return m;
}

function backgroundMask(idata, threshold) {
  var rgbv_no = pixelAt(idata, 0, 0);
  var rgbv_ne = pixelAt(idata, idata.width - 1, 0);
  var rgbv_so = pixelAt(idata, 0, idata.height - 1);
  var rgbv_se = pixelAt(idata, idata.width - 1, idata.height - 1);
  var thres = threshold || 10;

  if (rgbDistance(rgbv_no, rgbv_ne) < thres && rgbDistance(rgbv_ne, rgbv_se) < thres && rgbDistance(rgbv_se, rgbv_so) < thres && rgbDistance(rgbv_so, rgbv_no) < thres) {
    var mean = rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);
    var mask = [];

    for (var i = 0; i < idata.width * idata.height; i++) {
      var d = rgbDistance(mean, [idata.data[i * 4], idata.data[i * 4 + 1], idata.data[i * 4 + 2]]);
      mask[i] = d < thres ? 0 : 255;
    }

    return mask;
  }
}

function applyMask(idata, mask) {
  for (var i = 0; i < idata.width * idata.height; i++) {
    idata.data[4 * i + 3] = mask[i];
  }
}

function erodeMask(mask, sw, sh) {
  var weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side / 2);
  var maskResult = [];

  for (var y = 0; y < sh; y++) {
    for (var x = 0; x < sw; x++) {
      var so = y * sw + x;
      var a = 0;

      for (var cy = 0; cy < side; cy++) {
        for (var cx = 0; cx < side; cx++) {
          var scy = y + cy - halfSide;
          var scx = x + cx - halfSide;

          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            var srcOff = scy * sw + scx;
            var wt = weights[cy * side + cx];
            a += mask[srcOff] * wt;
          }
        }
      }

      maskResult[so] = a === 255 * 8 ? 255 : 0;
    }
  }

  return maskResult;
}

function dilateMask(mask, sw, sh) {
  var weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side / 2);
  var maskResult = [];

  for (var y = 0; y < sh; y++) {
    for (var x = 0; x < sw; x++) {
      var so = y * sw + x;
      var a = 0;

      for (var cy = 0; cy < side; cy++) {
        for (var cx = 0; cx < side; cx++) {
          var scy = y + cy - halfSide;
          var scx = x + cx - halfSide;

          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            var srcOff = scy * sw + scx;
            var wt = weights[cy * side + cx];
            a += mask[srcOff] * wt;
          }
        }
      }

      maskResult[so] = a >= 255 * 4 ? 255 : 0;
    }
  }

  return maskResult;
}

function smoothEdgeMask(mask, sw, sh) {
  var weights = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side / 2);
  var maskResult = [];

  for (var y = 0; y < sh; y++) {
    for (var x = 0; x < sw; x++) {
      var so = y * sw + x;
      var a = 0;

      for (var cy = 0; cy < side; cy++) {
        for (var cx = 0; cx < side; cx++) {
          var scy = y + cy - halfSide;
          var scx = x + cx - halfSide;

          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            var srcOff = scy * sw + scx;
            var wt = weights[cy * side + cx];
            a += mask[srcOff] * wt;
          }
        }
      }

      maskResult[so] = a;
    }
  }

  return maskResult;
}

const Mask = function (imageData) {
  var threshold = this.threshold(),
      mask = backgroundMask(imageData, threshold);

  if (mask) {
    mask = erodeMask(mask, imageData.width, imageData.height);
    mask = dilateMask(mask, imageData.width, imageData.height);
    mask = smoothEdgeMask(mask, imageData.width, imageData.height);
    applyMask(imageData, mask);
  }

  return imageData;
};

exports.Mask = Mask;

_Factory.Factory.addGetterSetter(_Node.Node, 'threshold', 0, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Noise = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const Noise = function (imageData) {
  var amount = this.noise() * 255,
      data = imageData.data,
      nPixels = data.length,
      half = amount / 2,
      i;

  for (i = 0; i < nPixels; i += 4) {
    data[i + 0] += half - 2 * half * Math.random();
    data[i + 1] += half - 2 * half * Math.random();
    data[i + 2] += half - 2 * half * Math.random();
  }
};

exports.Noise = Noise;

_Factory.Factory.addGetterSetter(_Node.Node, 'noise', 0.2, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Pixelate = void 0;

var _Factory = require("../Factory.js");

var _Util = require("../Util.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const Pixelate = function (imageData) {
  var pixelSize = Math.ceil(this.pixelSize()),
      width = imageData.width,
      height = imageData.height,
      x,
      y,
      i,
      red,
      green,
      blue,
      alpha,
      nBinsX = Math.ceil(width / pixelSize),
      nBinsY = Math.ceil(height / pixelSize),
      xBinStart,
      xBinEnd,
      yBinStart,
      yBinEnd,
      xBin,
      yBin,
      pixelsInBin,
      data = imageData.data;

  if (pixelSize <= 0) {
    _Util.Util.error('pixelSize value can not be <= 0');

    return;
  }

  for (xBin = 0; xBin < nBinsX; xBin += 1) {
    for (yBin = 0; yBin < nBinsY; yBin += 1) {
      red = 0;
      green = 0;
      blue = 0;
      alpha = 0;
      xBinStart = xBin * pixelSize;
      xBinEnd = xBinStart + pixelSize;
      yBinStart = yBin * pixelSize;
      yBinEnd = yBinStart + pixelSize;
      pixelsInBin = 0;

      for (x = xBinStart; x < xBinEnd; x += 1) {
        if (x >= width) {
          continue;
        }

        for (y = yBinStart; y < yBinEnd; y += 1) {
          if (y >= height) {
            continue;
          }

          i = (width * y + x) * 4;
          red += data[i + 0];
          green += data[i + 1];
          blue += data[i + 2];
          alpha += data[i + 3];
          pixelsInBin += 1;
        }
      }

      red = red / pixelsInBin;
      green = green / pixelsInBin;
      blue = blue / pixelsInBin;
      alpha = alpha / pixelsInBin;

      for (x = xBinStart; x < xBinEnd; x += 1) {
        if (x >= width) {
          continue;
        }

        for (y = yBinStart; y < yBinEnd; y += 1) {
          if (y >= height) {
            continue;
          }

          i = (width * y + x) * 4;
          data[i + 0] = red;
          data[i + 1] = green;
          data[i + 2] = blue;
          data[i + 3] = alpha;
        }
      }
    }
  }
};

exports.Pixelate = Pixelate;

_Factory.Factory.addGetterSetter(_Node.Node, 'pixelSize', 8, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Util.js":16,"../Validators.js":17}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Posterize = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const Posterize = function (imageData) {
  var levels = Math.round(this.levels() * 254) + 1,
      data = imageData.data,
      len = data.length,
      scale = 255 / levels,
      i;

  for (i = 0; i < len; i += 1) {
    data[i] = Math.floor(data[i] / scale) * scale;
  }
};

exports.Posterize = Posterize;

_Factory.Factory.addGetterSetter(_Node.Node, 'levels', 0.5, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RGB = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const RGB = function (imageData) {
  var data = imageData.data,
      nPixels = data.length,
      red = this.red(),
      green = this.green(),
      blue = this.blue(),
      i,
      brightness;

  for (i = 0; i < nPixels; i += 4) {
    brightness = (0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2]) / 255;
    data[i] = brightness * red;
    data[i + 1] = brightness * green;
    data[i + 2] = brightness * blue;
    data[i + 3] = data[i + 3];
  }
};

exports.RGB = RGB;

_Factory.Factory.addGetterSetter(_Node.Node, 'red', 0, function (val) {
  this._filterUpToDate = false;

  if (val > 255) {
    return 255;
  } else if (val < 0) {
    return 0;
  } else {
    return Math.round(val);
  }
});

_Factory.Factory.addGetterSetter(_Node.Node, 'green', 0, function (val) {
  this._filterUpToDate = false;

  if (val > 255) {
    return 255;
  } else if (val < 0) {
    return 0;
  } else {
    return Math.round(val);
  }
});

_Factory.Factory.addGetterSetter(_Node.Node, 'blue', 0, _Validators.RGBComponent, _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RGBA = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const RGBA = function (imageData) {
  var data = imageData.data,
      nPixels = data.length,
      red = this.red(),
      green = this.green(),
      blue = this.blue(),
      alpha = this.alpha(),
      i,
      ia;

  for (i = 0; i < nPixels; i += 4) {
    ia = 1 - alpha;
    data[i] = red * alpha + data[i] * ia;
    data[i + 1] = green * alpha + data[i + 1] * ia;
    data[i + 2] = blue * alpha + data[i + 2] * ia;
  }
};

exports.RGBA = RGBA;

_Factory.Factory.addGetterSetter(_Node.Node, 'red', 0, function (val) {
  this._filterUpToDate = false;

  if (val > 255) {
    return 255;
  } else if (val < 0) {
    return 0;
  } else {
    return Math.round(val);
  }
});

_Factory.Factory.addGetterSetter(_Node.Node, 'green', 0, function (val) {
  this._filterUpToDate = false;

  if (val > 255) {
    return 255;
  } else if (val < 0) {
    return 0;
  } else {
    return Math.round(val);
  }
});

_Factory.Factory.addGetterSetter(_Node.Node, 'blue', 0, _Validators.RGBComponent, _Factory.Factory.afterSetFilter);

_Factory.Factory.addGetterSetter(_Node.Node, 'alpha', 1, function (val) {
  this._filterUpToDate = false;

  if (val > 1) {
    return 1;
  } else if (val < 0) {
    return 0;
  } else {
    return val;
  }
});

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sepia = void 0;

const Sepia = function (imageData) {
  var data = imageData.data,
      nPixels = data.length,
      i,
      r,
      g,
      b;

  for (i = 0; i < nPixels; i += 4) {
    r = data[i + 0];
    g = data[i + 1];
    b = data[i + 2];
    data[i + 0] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
};

exports.Sepia = Sepia;

},{}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Solarize = void 0;

const Solarize = function (imageData) {
  var data = imageData.data,
      w = imageData.width,
      h = imageData.height,
      w4 = w * 4,
      y = h;

  do {
    var offsetY = (y - 1) * w4;
    var x = w;

    do {
      var offset = offsetY + (x - 1) * 4;
      var r = data[offset];
      var g = data[offset + 1];
      var b = data[offset + 2];

      if (r > 127) {
        r = 255 - r;
      }

      if (g > 127) {
        g = 255 - g;
      }

      if (b > 127) {
        b = 255 - b;
      }

      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
    } while (--x);
  } while (--y);
};

exports.Solarize = Solarize;

},{}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Threshold = void 0;

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Validators = require("../Validators.js");

const Threshold = function (imageData) {
  var level = this.threshold() * 255,
      data = imageData.data,
      len = data.length,
      i;

  for (i = 0; i < len; i += 1) {
    data[i] = data[i] < level ? 0 : 255;
  }
};

exports.Threshold = Threshold;

_Factory.Factory.addGetterSetter(_Node.Node, 'threshold', 0.5, (0, _Validators.getNumberValidator)(), _Factory.Factory.afterSetFilter);

},{"../Factory.js":6,"../Node.js":11,"../Validators.js":17}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _FullInternals = require("./_FullInternals.js");

var _default = _FullInternals.Konva;
exports.default = _default;

},{"./_FullInternals.js":19}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Arc = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Global = require("../Global.js");

var _Validators = require("../Validators.js");

class Arc extends _Shape.Shape {
  _sceneFunc(context) {
    var angle = _Global.Konva.getAngle(this.angle()),
        clockwise = this.clockwise();

    context.beginPath();
    context.arc(0, 0, this.outerRadius(), 0, angle, clockwise);
    context.arc(0, 0, this.innerRadius(), angle, 0, !clockwise);
    context.closePath();
    context.fillStrokeShape(this);
  }

  getWidth() {
    return this.outerRadius() * 2;
  }

  getHeight() {
    return this.outerRadius() * 2;
  }

  setWidth(width) {
    this.outerRadius(width / 2);
  }

  setHeight(height) {
    this.outerRadius(height / 2);
  }

  getSelfRect() {
    const innerRadius = this.innerRadius();
    const outerRadius = this.outerRadius();
    const clockwise = this.clockwise();

    const angle = _Global.Konva.getAngle(clockwise ? 360 - this.angle() : this.angle());

    const boundLeftRatio = Math.cos(Math.min(angle, Math.PI));
    const boundRightRatio = 1;
    const boundTopRatio = Math.sin(Math.min(Math.max(Math.PI, angle), 3 * Math.PI / 2));
    const boundBottomRatio = Math.sin(Math.min(angle, Math.PI / 2));
    const boundLeft = boundLeftRatio * (boundLeftRatio > 0 ? innerRadius : outerRadius);
    const boundRight = boundRightRatio * (boundRightRatio > 0 ? outerRadius : innerRadius);
    const boundTop = boundTopRatio * (boundTopRatio > 0 ? innerRadius : outerRadius);
    const boundBottom = boundBottomRatio * (boundBottomRatio > 0 ? outerRadius : innerRadius);
    return {
      x: boundLeft,
      y: clockwise ? -1 * boundBottom : boundTop,
      width: boundRight - boundLeft,
      height: boundBottom - boundTop
    };
  }

}

exports.Arc = Arc;
Arc.prototype._centroid = true;
Arc.prototype.className = 'Arc';
Arc.prototype._attrsAffectingSize = ['innerRadius', 'outerRadius'];
(0, _Global._registerNode)(Arc);

_Factory.Factory.addGetterSetter(Arc, 'innerRadius', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Arc, 'outerRadius', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Arc, 'angle', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Arc, 'clockwise', false, (0, _Validators.getBooleanValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Arrow = void 0;

var _Factory = require("../Factory.js");

var _Line = require("./Line.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

var _Path = require("./Path.js");

class Arrow extends _Line.Line {
  _sceneFunc(ctx) {
    super._sceneFunc(ctx);

    var PI2 = Math.PI * 2;
    var points = this.points();
    var tp = points;
    var fromTension = this.tension() !== 0 && points.length > 4;

    if (fromTension) {
      tp = this.getTensionPoints();
    }

    var length = this.pointerLength();
    var n = points.length;
    var dx, dy;

    if (fromTension) {
      const lp = [tp[tp.length - 4], tp[tp.length - 3], tp[tp.length - 2], tp[tp.length - 1], points[n - 2], points[n - 1]];

      const lastLength = _Path.Path.calcLength(tp[tp.length - 4], tp[tp.length - 3], 'C', lp);

      const previous = _Path.Path.getPointOnQuadraticBezier(Math.min(1, 1 - length / lastLength), lp[0], lp[1], lp[2], lp[3], lp[4], lp[5]);

      dx = points[n - 2] - previous.x;
      dy = points[n - 1] - previous.y;
    } else {
      dx = points[n - 2] - points[n - 4];
      dy = points[n - 1] - points[n - 3];
    }

    var radians = (Math.atan2(dy, dx) + PI2) % PI2;
    var width = this.pointerWidth();

    if (this.pointerAtEnding()) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(points[n - 2], points[n - 1]);
      ctx.rotate(radians);
      ctx.moveTo(0, 0);
      ctx.lineTo(-length, width / 2);
      ctx.lineTo(-length, -width / 2);
      ctx.closePath();
      ctx.restore();

      this.__fillStroke(ctx);
    }

    if (this.pointerAtBeginning()) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(points[0], points[1]);

      if (fromTension) {
        dx = (tp[0] + tp[2]) / 2 - points[0];
        dy = (tp[1] + tp[3]) / 2 - points[1];
      } else {
        dx = points[2] - points[0];
        dy = points[3] - points[1];
      }

      ctx.rotate((Math.atan2(-dy, -dx) + PI2) % PI2);
      ctx.moveTo(0, 0);
      ctx.lineTo(-length, width / 2);
      ctx.lineTo(-length, -width / 2);
      ctx.closePath();
      ctx.restore();

      this.__fillStroke(ctx);
    }
  }

  __fillStroke(ctx) {
    var isDashEnabled = this.dashEnabled();

    if (isDashEnabled) {
      this.attrs.dashEnabled = false;
      ctx.setLineDash([]);
    }

    ctx.fillStrokeShape(this);

    if (isDashEnabled) {
      this.attrs.dashEnabled = true;
    }
  }

  getSelfRect() {
    const lineRect = super.getSelfRect();
    const offset = this.pointerWidth() / 2;
    return {
      x: lineRect.x - offset,
      y: lineRect.y - offset,
      width: lineRect.width + offset * 2,
      height: lineRect.height + offset * 2
    };
  }

}

exports.Arrow = Arrow;
Arrow.prototype.className = 'Arrow';
(0, _Global._registerNode)(Arrow);

_Factory.Factory.addGetterSetter(Arrow, 'pointerLength', 10, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Arrow, 'pointerWidth', 10, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Arrow, 'pointerAtBeginning', false);

_Factory.Factory.addGetterSetter(Arrow, 'pointerAtEnding', true);

},{"../Factory.js":6,"../Global.js":8,"../Validators.js":17,"./Line.js":46,"./Path.js":47}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Circle = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

class Circle extends _Shape.Shape {
  _sceneFunc(context) {
    context.beginPath();
    context.arc(0, 0, this.attrs.radius || 0, 0, Math.PI * 2, false);
    context.closePath();
    context.fillStrokeShape(this);
  }

  getWidth() {
    return this.radius() * 2;
  }

  getHeight() {
    return this.radius() * 2;
  }

  setWidth(width) {
    if (this.radius() !== width / 2) {
      this.radius(width / 2);
    }
  }

  setHeight(height) {
    if (this.radius() !== height / 2) {
      this.radius(height / 2);
    }
  }

}

exports.Circle = Circle;
Circle.prototype._centroid = true;
Circle.prototype.className = 'Circle';
Circle.prototype._attrsAffectingSize = ['radius'];
(0, _Global._registerNode)(Circle);

_Factory.Factory.addGetterSetter(Circle, 'radius', 0, (0, _Validators.getNumberValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Ellipse = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

class Ellipse extends _Shape.Shape {
  _sceneFunc(context) {
    var rx = this.radiusX(),
        ry = this.radiusY();
    context.beginPath();
    context.save();

    if (rx !== ry) {
      context.scale(1, ry / rx);
    }

    context.arc(0, 0, rx, 0, Math.PI * 2, false);
    context.restore();
    context.closePath();
    context.fillStrokeShape(this);
  }

  getWidth() {
    return this.radiusX() * 2;
  }

  getHeight() {
    return this.radiusY() * 2;
  }

  setWidth(width) {
    this.radiusX(width / 2);
  }

  setHeight(height) {
    this.radiusY(height / 2);
  }

}

exports.Ellipse = Ellipse;
Ellipse.prototype.className = 'Ellipse';
Ellipse.prototype._centroid = true;
Ellipse.prototype._attrsAffectingSize = ['radiusX', 'radiusY'];
(0, _Global._registerNode)(Ellipse);

_Factory.Factory.addComponentsGetterSetter(Ellipse, 'radius', ['x', 'y']);

_Factory.Factory.addGetterSetter(Ellipse, 'radiusX', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Ellipse, 'radiusY', 0, (0, _Validators.getNumberValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Image = void 0;

var _Util = require("../Util.js");

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

class Image extends _Shape.Shape {
  constructor(attrs) {
    super(attrs);
    this.on('imageChange.konva', () => {
      this._setImageLoad();
    });

    this._setImageLoad();
  }

  _setImageLoad() {
    const image = this.image();

    if (image && image.complete) {
      return;
    }

    if (image && image.readyState === 4) {
      return;
    }

    if (image && image['addEventListener']) {
      image['addEventListener']('load', () => {
        this._requestDraw();
      });
    }
  }

  _useBufferCanvas() {
    return super._useBufferCanvas(true);
  }

  _sceneFunc(context) {
    const width = this.getWidth();
    const height = this.getHeight();
    const image = this.attrs.image;
    let params;

    if (image) {
      const cropWidth = this.attrs.cropWidth;
      const cropHeight = this.attrs.cropHeight;

      if (cropWidth && cropHeight) {
        params = [image, this.cropX(), this.cropY(), cropWidth, cropHeight, 0, 0, width, height];
      } else {
        params = [image, 0, 0, width, height];
      }
    }

    if (this.hasFill() || this.hasStroke()) {
      context.beginPath();
      context.rect(0, 0, width, height);
      context.closePath();
      context.fillStrokeShape(this);
    }

    if (image) {
      context.drawImage.apply(context, params);
    }
  }

  _hitFunc(context) {
    var width = this.width(),
        height = this.height();
    context.beginPath();
    context.rect(0, 0, width, height);
    context.closePath();
    context.fillStrokeShape(this);
  }

  getWidth() {
    var _a, _b;

    return (_a = this.attrs.width) !== null && _a !== void 0 ? _a : (_b = this.image()) === null || _b === void 0 ? void 0 : _b.width;
  }

  getHeight() {
    var _a, _b;

    return (_a = this.attrs.height) !== null && _a !== void 0 ? _a : (_b = this.image()) === null || _b === void 0 ? void 0 : _b.height;
  }

  static fromURL(url, callback, onError = null) {
    var img = _Util.Util.createImageElement();

    img.onload = function () {
      var image = new Image({
        image: img
      });
      callback(image);
    };

    img.onerror = onError;
    img.crossOrigin = 'Anonymous';
    img.src = url;
  }

}

exports.Image = Image;
Image.prototype.className = 'Image';
(0, _Global._registerNode)(Image);

_Factory.Factory.addGetterSetter(Image, 'image');

_Factory.Factory.addComponentsGetterSetter(Image, 'crop', ['x', 'y', 'width', 'height']);

_Factory.Factory.addGetterSetter(Image, 'cropX', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Image, 'cropY', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Image, 'cropWidth', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Image, 'cropHeight', 0, (0, _Validators.getNumberValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Util.js":16,"../Validators.js":17}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tag = exports.Label = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Group = require("../Group.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

var ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'padding', 'lineHeight', 'text', 'width', 'height'],
    CHANGE_KONVA = 'Change.konva',
    NONE = 'none',
    UP = 'up',
    RIGHT = 'right',
    DOWN = 'down',
    LEFT = 'left',
    attrChangeListLen = ATTR_CHANGE_LIST.length;

class Label extends _Group.Group {
  constructor(config) {
    super(config);
    this.on('add.konva', function (evt) {
      this._addListeners(evt.child);

      this._sync();
    });
  }

  getText() {
    return this.find('Text')[0];
  }

  getTag() {
    return this.find('Tag')[0];
  }

  _addListeners(text) {
    var that = this,
        n;

    var func = function () {
      that._sync();
    };

    for (n = 0; n < attrChangeListLen; n++) {
      text.on(ATTR_CHANGE_LIST[n] + CHANGE_KONVA, func);
    }
  }

  getWidth() {
    return this.getText().width();
  }

  getHeight() {
    return this.getText().height();
  }

  _sync() {
    var text = this.getText(),
        tag = this.getTag(),
        width,
        height,
        pointerDirection,
        pointerWidth,
        x,
        y,
        pointerHeight;

    if (text && tag) {
      width = text.width();
      height = text.height();
      pointerDirection = tag.pointerDirection();
      pointerWidth = tag.pointerWidth();
      pointerHeight = tag.pointerHeight();
      x = 0;
      y = 0;

      switch (pointerDirection) {
        case UP:
          x = width / 2;
          y = -1 * pointerHeight;
          break;

        case RIGHT:
          x = width + pointerWidth;
          y = height / 2;
          break;

        case DOWN:
          x = width / 2;
          y = height + pointerHeight;
          break;

        case LEFT:
          x = -1 * pointerWidth;
          y = height / 2;
          break;
      }

      tag.setAttrs({
        x: -1 * x,
        y: -1 * y,
        width: width,
        height: height
      });
      text.setAttrs({
        x: -1 * x,
        y: -1 * y
      });
    }
  }

}

exports.Label = Label;
Label.prototype.className = 'Label';
(0, _Global._registerNode)(Label);

class Tag extends _Shape.Shape {
  _sceneFunc(context) {
    var width = this.width(),
        height = this.height(),
        pointerDirection = this.pointerDirection(),
        pointerWidth = this.pointerWidth(),
        pointerHeight = this.pointerHeight(),
        cornerRadius = this.cornerRadius();
    let topLeft = 0;
    let topRight = 0;
    let bottomLeft = 0;
    let bottomRight = 0;

    if (typeof cornerRadius === 'number') {
      topLeft = topRight = bottomLeft = bottomRight = Math.min(cornerRadius, width / 2, height / 2);
    } else {
      topLeft = Math.min(cornerRadius[0] || 0, width / 2, height / 2);
      topRight = Math.min(cornerRadius[1] || 0, width / 2, height / 2);
      bottomRight = Math.min(cornerRadius[2] || 0, width / 2, height / 2);
      bottomLeft = Math.min(cornerRadius[3] || 0, width / 2, height / 2);
    }

    context.beginPath();
    context.moveTo(topLeft, 0);

    if (pointerDirection === UP) {
      context.lineTo((width - pointerWidth) / 2, 0);
      context.lineTo(width / 2, -1 * pointerHeight);
      context.lineTo((width + pointerWidth) / 2, 0);
    }

    context.lineTo(width - topRight, 0);
    context.arc(width - topRight, topRight, topRight, Math.PI * 3 / 2, 0, false);

    if (pointerDirection === RIGHT) {
      context.lineTo(width, (height - pointerHeight) / 2);
      context.lineTo(width + pointerWidth, height / 2);
      context.lineTo(width, (height + pointerHeight) / 2);
    }

    context.lineTo(width, height - bottomRight);
    context.arc(width - bottomRight, height - bottomRight, bottomRight, 0, Math.PI / 2, false);

    if (pointerDirection === DOWN) {
      context.lineTo((width + pointerWidth) / 2, height);
      context.lineTo(width / 2, height + pointerHeight);
      context.lineTo((width - pointerWidth) / 2, height);
    }

    context.lineTo(bottomLeft, height);
    context.arc(bottomLeft, height - bottomLeft, bottomLeft, Math.PI / 2, Math.PI, false);

    if (pointerDirection === LEFT) {
      context.lineTo(0, (height + pointerHeight) / 2);
      context.lineTo(-1 * pointerWidth, height / 2);
      context.lineTo(0, (height - pointerHeight) / 2);
    }

    context.lineTo(0, topLeft);
    context.arc(topLeft, topLeft, topLeft, Math.PI, Math.PI * 3 / 2, false);
    context.closePath();
    context.fillStrokeShape(this);
  }

  getSelfRect() {
    var x = 0,
        y = 0,
        pointerWidth = this.pointerWidth(),
        pointerHeight = this.pointerHeight(),
        direction = this.pointerDirection(),
        width = this.width(),
        height = this.height();

    if (direction === UP) {
      y -= pointerHeight;
      height += pointerHeight;
    } else if (direction === DOWN) {
      height += pointerHeight;
    } else if (direction === LEFT) {
      x -= pointerWidth * 1.5;
      width += pointerWidth;
    } else if (direction === RIGHT) {
      width += pointerWidth * 1.5;
    }

    return {
      x: x,
      y: y,
      width: width,
      height: height
    };
  }

}

exports.Tag = Tag;
Tag.prototype.className = 'Tag';
(0, _Global._registerNode)(Tag);

_Factory.Factory.addGetterSetter(Tag, 'pointerDirection', NONE);

_Factory.Factory.addGetterSetter(Tag, 'pointerWidth', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Tag, 'pointerHeight', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Tag, 'cornerRadius', 0, (0, _Validators.getNumberOrArrayOfNumbersValidator)(4));

},{"../Factory.js":6,"../Global.js":8,"../Group.js":9,"../Shape.js":13,"../Validators.js":17}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Line = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

function getControlPoints(x0, y0, x1, y1, x2, y2, t) {
  var d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)),
      d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
      fa = t * d01 / (d01 + d12),
      fb = t * d12 / (d01 + d12),
      p1x = x1 - fa * (x2 - x0),
      p1y = y1 - fa * (y2 - y0),
      p2x = x1 + fb * (x2 - x0),
      p2y = y1 + fb * (y2 - y0);
  return [p1x, p1y, p2x, p2y];
}

function expandPoints(p, tension) {
  var len = p.length,
      allPoints = [],
      n,
      cp;

  for (n = 2; n < len - 2; n += 2) {
    cp = getControlPoints(p[n - 2], p[n - 1], p[n], p[n + 1], p[n + 2], p[n + 3], tension);

    if (isNaN(cp[0])) {
      continue;
    }

    allPoints.push(cp[0]);
    allPoints.push(cp[1]);
    allPoints.push(p[n]);
    allPoints.push(p[n + 1]);
    allPoints.push(cp[2]);
    allPoints.push(cp[3]);
  }

  return allPoints;
}

class Line extends _Shape.Shape {
  constructor(config) {
    super(config);
    this.on('pointsChange.konva tensionChange.konva closedChange.konva bezierChange.konva', function () {
      this._clearCache('tensionPoints');
    });
  }

  _sceneFunc(context) {
    var points = this.points(),
        length = points.length,
        tension = this.tension(),
        closed = this.closed(),
        bezier = this.bezier(),
        tp,
        len,
        n;

    if (!length) {
      return;
    }

    context.beginPath();
    context.moveTo(points[0], points[1]);

    if (tension !== 0 && length > 4) {
      tp = this.getTensionPoints();
      len = tp.length;
      n = closed ? 0 : 4;

      if (!closed) {
        context.quadraticCurveTo(tp[0], tp[1], tp[2], tp[3]);
      }

      while (n < len - 2) {
        context.bezierCurveTo(tp[n++], tp[n++], tp[n++], tp[n++], tp[n++], tp[n++]);
      }

      if (!closed) {
        context.quadraticCurveTo(tp[len - 2], tp[len - 1], points[length - 2], points[length - 1]);
      }
    } else if (bezier) {
      n = 2;

      while (n < length) {
        context.bezierCurveTo(points[n++], points[n++], points[n++], points[n++], points[n++], points[n++]);
      }
    } else {
      for (n = 2; n < length; n += 2) {
        context.lineTo(points[n], points[n + 1]);
      }
    }

    if (closed) {
      context.closePath();
      context.fillStrokeShape(this);
    } else {
      context.strokeShape(this);
    }
  }

  getTensionPoints() {
    return this._getCache('tensionPoints', this._getTensionPoints);
  }

  _getTensionPoints() {
    if (this.closed()) {
      return this._getTensionPointsClosed();
    } else {
      return expandPoints(this.points(), this.tension());
    }
  }

  _getTensionPointsClosed() {
    var p = this.points(),
        len = p.length,
        tension = this.tension(),
        firstControlPoints = getControlPoints(p[len - 2], p[len - 1], p[0], p[1], p[2], p[3], tension),
        lastControlPoints = getControlPoints(p[len - 4], p[len - 3], p[len - 2], p[len - 1], p[0], p[1], tension),
        middle = expandPoints(p, tension),
        tp = [firstControlPoints[2], firstControlPoints[3]].concat(middle).concat([lastControlPoints[0], lastControlPoints[1], p[len - 2], p[len - 1], lastControlPoints[2], lastControlPoints[3], firstControlPoints[0], firstControlPoints[1], p[0], p[1]]);
    return tp;
  }

  getWidth() {
    return this.getSelfRect().width;
  }

  getHeight() {
    return this.getSelfRect().height;
  }

  getSelfRect() {
    var points = this.points();

    if (points.length < 4) {
      return {
        x: points[0] || 0,
        y: points[1] || 0,
        width: 0,
        height: 0
      };
    }

    if (this.tension() !== 0) {
      points = [points[0], points[1], ...this._getTensionPoints(), points[points.length - 2], points[points.length - 1]];
    } else {
      points = this.points();
    }

    var minX = points[0];
    var maxX = points[0];
    var minY = points[1];
    var maxY = points[1];
    var x, y;

    for (var i = 0; i < points.length / 2; i++) {
      x = points[i * 2];
      y = points[i * 2 + 1];
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

}

exports.Line = Line;
Line.prototype.className = 'Line';
Line.prototype._attrsAffectingSize = ['points', 'bezier', 'tension'];
(0, _Global._registerNode)(Line);

_Factory.Factory.addGetterSetter(Line, 'closed', false);

_Factory.Factory.addGetterSetter(Line, 'bezier', false);

_Factory.Factory.addGetterSetter(Line, 'tension', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Line, 'points', [], (0, _Validators.getNumberArrayValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],47:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Path = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Global = require("../Global.js");

class Path extends _Shape.Shape {
  constructor(config) {
    super(config);
    this.dataArray = [];
    this.pathLength = 0;
    this.dataArray = Path.parsePathData(this.data());
    this.pathLength = 0;

    for (var i = 0; i < this.dataArray.length; ++i) {
      this.pathLength += this.dataArray[i].pathLength;
    }

    this.on('dataChange.konva', function () {
      this.dataArray = Path.parsePathData(this.data());
      this.pathLength = 0;

      for (var i = 0; i < this.dataArray.length; ++i) {
        this.pathLength += this.dataArray[i].pathLength;
      }
    });
  }

  _sceneFunc(context) {
    var ca = this.dataArray;
    context.beginPath();
    var isClosed = false;

    for (var n = 0; n < ca.length; n++) {
      var c = ca[n].command;
      var p = ca[n].points;

      switch (c) {
        case 'L':
          context.lineTo(p[0], p[1]);
          break;

        case 'M':
          context.moveTo(p[0], p[1]);
          break;

        case 'C':
          context.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
          break;

        case 'Q':
          context.quadraticCurveTo(p[0], p[1], p[2], p[3]);
          break;

        case 'A':
          var cx = p[0],
              cy = p[1],
              rx = p[2],
              ry = p[3],
              theta = p[4],
              dTheta = p[5],
              psi = p[6],
              fs = p[7];
          var r = rx > ry ? rx : ry;
          var scaleX = rx > ry ? 1 : rx / ry;
          var scaleY = rx > ry ? ry / rx : 1;
          context.translate(cx, cy);
          context.rotate(psi);
          context.scale(scaleX, scaleY);
          context.arc(0, 0, r, theta, theta + dTheta, 1 - fs);
          context.scale(1 / scaleX, 1 / scaleY);
          context.rotate(-psi);
          context.translate(-cx, -cy);
          break;

        case 'z':
          isClosed = true;
          context.closePath();
          break;
      }
    }

    if (!isClosed && !this.hasFill()) {
      context.strokeShape(this);
    } else {
      context.fillStrokeShape(this);
    }
  }

  getSelfRect() {
    var points = [];
    this.dataArray.forEach(function (data) {
      if (data.command === 'A') {
        var start = data.points[4];
        var dTheta = data.points[5];
        var end = data.points[4] + dTheta;
        var inc = Math.PI / 180.0;

        if (Math.abs(start - end) < inc) {
          inc = Math.abs(start - end);
        }

        if (dTheta < 0) {
          for (let t = start - inc; t > end; t -= inc) {
            const point = Path.getPointOnEllipticalArc(data.points[0], data.points[1], data.points[2], data.points[3], t, 0);
            points.push(point.x, point.y);
          }
        } else {
          for (let t = start + inc; t < end; t += inc) {
            const point = Path.getPointOnEllipticalArc(data.points[0], data.points[1], data.points[2], data.points[3], t, 0);
            points.push(point.x, point.y);
          }
        }
      } else if (data.command === 'C') {
        for (let t = 0.0; t <= 1; t += 0.01) {
          const point = Path.getPointOnCubicBezier(t, data.start.x, data.start.y, data.points[0], data.points[1], data.points[2], data.points[3], data.points[4], data.points[5]);
          points.push(point.x, point.y);
        }
      } else {
        points = points.concat(data.points);
      }
    });
    var minX = points[0];
    var maxX = points[0];
    var minY = points[1];
    var maxY = points[1];
    var x, y;

    for (var i = 0; i < points.length / 2; i++) {
      x = points[i * 2];
      y = points[i * 2 + 1];

      if (!isNaN(x)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }

      if (!isNaN(y)) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  getLength() {
    return this.pathLength;
  }

  getPointAtLength(length) {
    var point,
        i = 0,
        ii = this.dataArray.length;

    if (!ii) {
      return null;
    }

    while (i < ii && length > this.dataArray[i].pathLength) {
      length -= this.dataArray[i].pathLength;
      ++i;
    }

    if (i === ii) {
      point = this.dataArray[i - 1].points.slice(-2);
      return {
        x: point[0],
        y: point[1]
      };
    }

    if (length < 0.01) {
      point = this.dataArray[i].points.slice(0, 2);
      return {
        x: point[0],
        y: point[1]
      };
    }

    var cp = this.dataArray[i];
    var p = cp.points;

    switch (cp.command) {
      case 'L':
        return Path.getPointOnLine(length, cp.start.x, cp.start.y, p[0], p[1]);

      case 'C':
        return Path.getPointOnCubicBezier(length / cp.pathLength, cp.start.x, cp.start.y, p[0], p[1], p[2], p[3], p[4], p[5]);

      case 'Q':
        return Path.getPointOnQuadraticBezier(length / cp.pathLength, cp.start.x, cp.start.y, p[0], p[1], p[2], p[3]);

      case 'A':
        var cx = p[0],
            cy = p[1],
            rx = p[2],
            ry = p[3],
            theta = p[4],
            dTheta = p[5],
            psi = p[6];
        theta += dTheta * length / cp.pathLength;
        return Path.getPointOnEllipticalArc(cx, cy, rx, ry, theta, psi);
    }

    return null;
  }

  static getLineLength(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }

  static getPointOnLine(dist, P1x, P1y, P2x, P2y, fromX, fromY) {
    if (fromX === undefined) {
      fromX = P1x;
    }

    if (fromY === undefined) {
      fromY = P1y;
    }

    var m = (P2y - P1y) / (P2x - P1x + 0.00000001);
    var run = Math.sqrt(dist * dist / (1 + m * m));

    if (P2x < P1x) {
      run *= -1;
    }

    var rise = m * run;
    var pt;

    if (P2x === P1x) {
      pt = {
        x: fromX,
        y: fromY + rise
      };
    } else if ((fromY - P1y) / (fromX - P1x + 0.00000001) === m) {
      pt = {
        x: fromX + run,
        y: fromY + rise
      };
    } else {
      var ix, iy;
      var len = this.getLineLength(P1x, P1y, P2x, P2y);
      var u = (fromX - P1x) * (P2x - P1x) + (fromY - P1y) * (P2y - P1y);
      u = u / (len * len);
      ix = P1x + u * (P2x - P1x);
      iy = P1y + u * (P2y - P1y);
      var pRise = this.getLineLength(fromX, fromY, ix, iy);
      var pRun = Math.sqrt(dist * dist - pRise * pRise);
      run = Math.sqrt(pRun * pRun / (1 + m * m));

      if (P2x < P1x) {
        run *= -1;
      }

      rise = m * run;
      pt = {
        x: ix + run,
        y: iy + rise
      };
    }

    return pt;
  }

  static getPointOnCubicBezier(pct, P1x, P1y, P2x, P2y, P3x, P3y, P4x, P4y) {
    function CB1(t) {
      return t * t * t;
    }

    function CB2(t) {
      return 3 * t * t * (1 - t);
    }

    function CB3(t) {
      return 3 * t * (1 - t) * (1 - t);
    }

    function CB4(t) {
      return (1 - t) * (1 - t) * (1 - t);
    }

    var x = P4x * CB1(pct) + P3x * CB2(pct) + P2x * CB3(pct) + P1x * CB4(pct);
    var y = P4y * CB1(pct) + P3y * CB2(pct) + P2y * CB3(pct) + P1y * CB4(pct);
    return {
      x: x,
      y: y
    };
  }

  static getPointOnQuadraticBezier(pct, P1x, P1y, P2x, P2y, P3x, P3y) {
    function QB1(t) {
      return t * t;
    }

    function QB2(t) {
      return 2 * t * (1 - t);
    }

    function QB3(t) {
      return (1 - t) * (1 - t);
    }

    var x = P3x * QB1(pct) + P2x * QB2(pct) + P1x * QB3(pct);
    var y = P3y * QB1(pct) + P2y * QB2(pct) + P1y * QB3(pct);
    return {
      x: x,
      y: y
    };
  }

  static getPointOnEllipticalArc(cx, cy, rx, ry, theta, psi) {
    var cosPsi = Math.cos(psi),
        sinPsi = Math.sin(psi);
    var pt = {
      x: rx * Math.cos(theta),
      y: ry * Math.sin(theta)
    };
    return {
      x: cx + (pt.x * cosPsi - pt.y * sinPsi),
      y: cy + (pt.x * sinPsi + pt.y * cosPsi)
    };
  }

  static parsePathData(data) {
    if (!data) {
      return [];
    }

    var cs = data;
    var cc = ['m', 'M', 'l', 'L', 'v', 'V', 'h', 'H', 'z', 'Z', 'c', 'C', 'q', 'Q', 't', 'T', 's', 'S', 'a', 'A'];
    cs = cs.replace(new RegExp(' ', 'g'), ',');

    for (var n = 0; n < cc.length; n++) {
      cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
    }

    var arr = cs.split('|');
    var ca = [];
    var coords = [];
    var cpx = 0;
    var cpy = 0;
    var re = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:e[-+]?\d+)?)/gi;
    var match;

    for (n = 1; n < arr.length; n++) {
      var str = arr[n];
      var c = str.charAt(0);
      str = str.slice(1);
      coords.length = 0;

      while (match = re.exec(str)) {
        coords.push(match[0]);
      }

      var p = [];

      for (var j = 0, jlen = coords.length; j < jlen; j++) {
        if (coords[j] === '00') {
          p.push(0, 0);
          continue;
        }

        var parsed = parseFloat(coords[j]);

        if (!isNaN(parsed)) {
          p.push(parsed);
        } else {
          p.push(0);
        }
      }

      while (p.length > 0) {
        if (isNaN(p[0])) {
          break;
        }

        var cmd = null;
        var points = [];
        var startX = cpx,
            startY = cpy;
        var prevCmd, ctlPtx, ctlPty;
        var rx, ry, psi, fa, fs, x1, y1;

        switch (c) {
          case 'l':
            cpx += p.shift();
            cpy += p.shift();
            cmd = 'L';
            points.push(cpx, cpy);
            break;

          case 'L':
            cpx = p.shift();
            cpy = p.shift();
            points.push(cpx, cpy);
            break;

          case 'm':
            var dx = p.shift();
            var dy = p.shift();
            cpx += dx;
            cpy += dy;
            cmd = 'M';

            if (ca.length > 2 && ca[ca.length - 1].command === 'z') {
              for (var idx = ca.length - 2; idx >= 0; idx--) {
                if (ca[idx].command === 'M') {
                  cpx = ca[idx].points[0] + dx;
                  cpy = ca[idx].points[1] + dy;
                  break;
                }
              }
            }

            points.push(cpx, cpy);
            c = 'l';
            break;

          case 'M':
            cpx = p.shift();
            cpy = p.shift();
            cmd = 'M';
            points.push(cpx, cpy);
            c = 'L';
            break;

          case 'h':
            cpx += p.shift();
            cmd = 'L';
            points.push(cpx, cpy);
            break;

          case 'H':
            cpx = p.shift();
            cmd = 'L';
            points.push(cpx, cpy);
            break;

          case 'v':
            cpy += p.shift();
            cmd = 'L';
            points.push(cpx, cpy);
            break;

          case 'V':
            cpy = p.shift();
            cmd = 'L';
            points.push(cpx, cpy);
            break;

          case 'C':
            points.push(p.shift(), p.shift(), p.shift(), p.shift());
            cpx = p.shift();
            cpy = p.shift();
            points.push(cpx, cpy);
            break;

          case 'c':
            points.push(cpx + p.shift(), cpy + p.shift(), cpx + p.shift(), cpy + p.shift());
            cpx += p.shift();
            cpy += p.shift();
            cmd = 'C';
            points.push(cpx, cpy);
            break;

          case 'S':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];

            if (prevCmd.command === 'C') {
              ctlPtx = cpx + (cpx - prevCmd.points[2]);
              ctlPty = cpy + (cpy - prevCmd.points[3]);
            }

            points.push(ctlPtx, ctlPty, p.shift(), p.shift());
            cpx = p.shift();
            cpy = p.shift();
            cmd = 'C';
            points.push(cpx, cpy);
            break;

          case 's':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];

            if (prevCmd.command === 'C') {
              ctlPtx = cpx + (cpx - prevCmd.points[2]);
              ctlPty = cpy + (cpy - prevCmd.points[3]);
            }

            points.push(ctlPtx, ctlPty, cpx + p.shift(), cpy + p.shift());
            cpx += p.shift();
            cpy += p.shift();
            cmd = 'C';
            points.push(cpx, cpy);
            break;

          case 'Q':
            points.push(p.shift(), p.shift());
            cpx = p.shift();
            cpy = p.shift();
            points.push(cpx, cpy);
            break;

          case 'q':
            points.push(cpx + p.shift(), cpy + p.shift());
            cpx += p.shift();
            cpy += p.shift();
            cmd = 'Q';
            points.push(cpx, cpy);
            break;

          case 'T':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];

            if (prevCmd.command === 'Q') {
              ctlPtx = cpx + (cpx - prevCmd.points[0]);
              ctlPty = cpy + (cpy - prevCmd.points[1]);
            }

            cpx = p.shift();
            cpy = p.shift();
            cmd = 'Q';
            points.push(ctlPtx, ctlPty, cpx, cpy);
            break;

          case 't':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];

            if (prevCmd.command === 'Q') {
              ctlPtx = cpx + (cpx - prevCmd.points[0]);
              ctlPty = cpy + (cpy - prevCmd.points[1]);
            }

            cpx += p.shift();
            cpy += p.shift();
            cmd = 'Q';
            points.push(ctlPtx, ctlPty, cpx, cpy);
            break;

          case 'A':
            rx = p.shift();
            ry = p.shift();
            psi = p.shift();
            fa = p.shift();
            fs = p.shift();
            x1 = cpx;
            y1 = cpy;
            cpx = p.shift();
            cpy = p.shift();
            cmd = 'A';
            points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
            break;

          case 'a':
            rx = p.shift();
            ry = p.shift();
            psi = p.shift();
            fa = p.shift();
            fs = p.shift();
            x1 = cpx;
            y1 = cpy;
            cpx += p.shift();
            cpy += p.shift();
            cmd = 'A';
            points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
            break;
        }

        ca.push({
          command: cmd || c,
          points: points,
          start: {
            x: startX,
            y: startY
          },
          pathLength: this.calcLength(startX, startY, cmd || c, points)
        });
      }

      if (c === 'z' || c === 'Z') {
        ca.push({
          command: 'z',
          points: [],
          start: undefined,
          pathLength: 0
        });
      }
    }

    return ca;
  }

  static calcLength(x, y, cmd, points) {
    var len, p1, p2, t;
    var path = Path;

    switch (cmd) {
      case 'L':
        return path.getLineLength(x, y, points[0], points[1]);

      case 'C':
        len = 0.0;
        p1 = path.getPointOnCubicBezier(0, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);

        for (t = 0.01; t <= 1; t += 0.01) {
          p2 = path.getPointOnCubicBezier(t, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);
          len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
          p1 = p2;
        }

        return len;

      case 'Q':
        len = 0.0;
        p1 = path.getPointOnQuadraticBezier(0, x, y, points[0], points[1], points[2], points[3]);

        for (t = 0.01; t <= 1; t += 0.01) {
          p2 = path.getPointOnQuadraticBezier(t, x, y, points[0], points[1], points[2], points[3]);
          len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
          p1 = p2;
        }

        return len;

      case 'A':
        len = 0.0;
        var start = points[4];
        var dTheta = points[5];
        var end = points[4] + dTheta;
        var inc = Math.PI / 180.0;

        if (Math.abs(start - end) < inc) {
          inc = Math.abs(start - end);
        }

        p1 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], start, 0);

        if (dTheta < 0) {
          for (t = start - inc; t > end; t -= inc) {
            p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
            len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
            p1 = p2;
          }
        } else {
          for (t = start + inc; t < end; t += inc) {
            p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
            len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
            p1 = p2;
          }
        }

        p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], end, 0);
        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
        return len;
    }

    return 0;
  }

  static convertEndpointToCenterParameterization(x1, y1, x2, y2, fa, fs, rx, ry, psiDeg) {
    var psi = psiDeg * (Math.PI / 180.0);
    var xp = Math.cos(psi) * (x1 - x2) / 2.0 + Math.sin(psi) * (y1 - y2) / 2.0;
    var yp = -1 * Math.sin(psi) * (x1 - x2) / 2.0 + Math.cos(psi) * (y1 - y2) / 2.0;
    var lambda = xp * xp / (rx * rx) + yp * yp / (ry * ry);

    if (lambda > 1) {
      rx *= Math.sqrt(lambda);
      ry *= Math.sqrt(lambda);
    }

    var f = Math.sqrt((rx * rx * (ry * ry) - rx * rx * (yp * yp) - ry * ry * (xp * xp)) / (rx * rx * (yp * yp) + ry * ry * (xp * xp)));

    if (fa === fs) {
      f *= -1;
    }

    if (isNaN(f)) {
      f = 0;
    }

    var cxp = f * rx * yp / ry;
    var cyp = f * -ry * xp / rx;
    var cx = (x1 + x2) / 2.0 + Math.cos(psi) * cxp - Math.sin(psi) * cyp;
    var cy = (y1 + y2) / 2.0 + Math.sin(psi) * cxp + Math.cos(psi) * cyp;

    var vMag = function (v) {
      return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    };

    var vRatio = function (u, v) {
      return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
    };

    var vAngle = function (u, v) {
      return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(vRatio(u, v));
    };

    var theta = vAngle([1, 0], [(xp - cxp) / rx, (yp - cyp) / ry]);
    var u = [(xp - cxp) / rx, (yp - cyp) / ry];
    var v = [(-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry];
    var dTheta = vAngle(u, v);

    if (vRatio(u, v) <= -1) {
      dTheta = Math.PI;
    }

    if (vRatio(u, v) >= 1) {
      dTheta = 0;
    }

    if (fs === 0 && dTheta > 0) {
      dTheta = dTheta - 2 * Math.PI;
    }

    if (fs === 1 && dTheta < 0) {
      dTheta = dTheta + 2 * Math.PI;
    }

    return [cx, cy, rx, ry, theta, dTheta, psi, fs];
  }

}

exports.Path = Path;
Path.prototype.className = 'Path';
Path.prototype._attrsAffectingSize = ['data'];
(0, _Global._registerNode)(Path);

_Factory.Factory.addGetterSetter(Path, 'data');

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rect = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Global = require("../Global.js");

var _Validators = require("../Validators.js");

class Rect extends _Shape.Shape {
  _sceneFunc(context) {
    var cornerRadius = this.cornerRadius(),
        width = this.width(),
        height = this.height();
    context.beginPath();

    if (!cornerRadius) {
      context.rect(0, 0, width, height);
    } else {
      let topLeft = 0;
      let topRight = 0;
      let bottomLeft = 0;
      let bottomRight = 0;

      if (typeof cornerRadius === 'number') {
        topLeft = topRight = bottomLeft = bottomRight = Math.min(cornerRadius, width / 2, height / 2);
      } else {
        topLeft = Math.min(cornerRadius[0] || 0, width / 2, height / 2);
        topRight = Math.min(cornerRadius[1] || 0, width / 2, height / 2);
        bottomRight = Math.min(cornerRadius[2] || 0, width / 2, height / 2);
        bottomLeft = Math.min(cornerRadius[3] || 0, width / 2, height / 2);
      }

      context.moveTo(topLeft, 0);
      context.lineTo(width - topRight, 0);
      context.arc(width - topRight, topRight, topRight, Math.PI * 3 / 2, 0, false);
      context.lineTo(width, height - bottomRight);
      context.arc(width - bottomRight, height - bottomRight, bottomRight, 0, Math.PI / 2, false);
      context.lineTo(bottomLeft, height);
      context.arc(bottomLeft, height - bottomLeft, bottomLeft, Math.PI / 2, Math.PI, false);
      context.lineTo(0, topLeft);
      context.arc(topLeft, topLeft, topLeft, Math.PI, Math.PI * 3 / 2, false);
    }

    context.closePath();
    context.fillStrokeShape(this);
  }

}

exports.Rect = Rect;
Rect.prototype.className = 'Rect';
(0, _Global._registerNode)(Rect);

_Factory.Factory.addGetterSetter(Rect, 'cornerRadius', 0, (0, _Validators.getNumberOrArrayOfNumbersValidator)(4));

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],49:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RegularPolygon = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

class RegularPolygon extends _Shape.Shape {
  _sceneFunc(context) {
    const points = this._getPoints();

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (var n = 1; n < points.length; n++) {
      context.lineTo(points[n].x, points[n].y);
    }

    context.closePath();
    context.fillStrokeShape(this);
  }

  _getPoints() {
    const sides = this.attrs.sides;
    const radius = this.attrs.radius || 0;
    const points = [];

    for (var n = 0; n < sides; n++) {
      points.push({
        x: radius * Math.sin(n * 2 * Math.PI / sides),
        y: -1 * radius * Math.cos(n * 2 * Math.PI / sides)
      });
    }

    return points;
  }

  getSelfRect() {
    const points = this._getPoints();

    var minX = points[0].x;
    var maxX = points[0].y;
    var minY = points[0].x;
    var maxY = points[0].y;
    points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  getWidth() {
    return this.radius() * 2;
  }

  getHeight() {
    return this.radius() * 2;
  }

  setWidth(width) {
    this.radius(width / 2);
  }

  setHeight(height) {
    this.radius(height / 2);
  }

}

exports.RegularPolygon = RegularPolygon;
RegularPolygon.prototype.className = 'RegularPolygon';
RegularPolygon.prototype._centroid = true;
RegularPolygon.prototype._attrsAffectingSize = ['radius'];
(0, _Global._registerNode)(RegularPolygon);

_Factory.Factory.addGetterSetter(RegularPolygon, 'radius', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(RegularPolygon, 'sides', 0, (0, _Validators.getNumberValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],50:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Ring = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

var PIx2 = Math.PI * 2;

class Ring extends _Shape.Shape {
  _sceneFunc(context) {
    context.beginPath();
    context.arc(0, 0, this.innerRadius(), 0, PIx2, false);
    context.moveTo(this.outerRadius(), 0);
    context.arc(0, 0, this.outerRadius(), PIx2, 0, true);
    context.closePath();
    context.fillStrokeShape(this);
  }

  getWidth() {
    return this.outerRadius() * 2;
  }

  getHeight() {
    return this.outerRadius() * 2;
  }

  setWidth(width) {
    this.outerRadius(width / 2);
  }

  setHeight(height) {
    this.outerRadius(height / 2);
  }

}

exports.Ring = Ring;
Ring.prototype.className = 'Ring';
Ring.prototype._centroid = true;
Ring.prototype._attrsAffectingSize = ['innerRadius', 'outerRadius'];
(0, _Global._registerNode)(Ring);

_Factory.Factory.addGetterSetter(Ring, 'innerRadius', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Ring, 'outerRadius', 0, (0, _Validators.getNumberValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],51:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sprite = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Animation = require("../Animation.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

class Sprite extends _Shape.Shape {
  constructor(config) {
    super(config);
    this._updated = true;
    this.anim = new _Animation.Animation(() => {
      var updated = this._updated;
      this._updated = false;
      return updated;
    });
    this.on('animationChange.konva', function () {
      this.frameIndex(0);
    });
    this.on('frameIndexChange.konva', function () {
      this._updated = true;
    });
    this.on('frameRateChange.konva', function () {
      if (!this.anim.isRunning()) {
        return;
      }

      clearInterval(this.interval);

      this._setInterval();
    });
  }

  _sceneFunc(context) {
    var anim = this.animation(),
        index = this.frameIndex(),
        ix4 = index * 4,
        set = this.animations()[anim],
        offsets = this.frameOffsets(),
        x = set[ix4 + 0],
        y = set[ix4 + 1],
        width = set[ix4 + 2],
        height = set[ix4 + 3],
        image = this.image();

    if (this.hasFill() || this.hasStroke()) {
      context.beginPath();
      context.rect(0, 0, width, height);
      context.closePath();
      context.fillStrokeShape(this);
    }

    if (image) {
      if (offsets) {
        var offset = offsets[anim],
            ix2 = index * 2;
        context.drawImage(image, x, y, width, height, offset[ix2 + 0], offset[ix2 + 1], width, height);
      } else {
        context.drawImage(image, x, y, width, height, 0, 0, width, height);
      }
    }
  }

  _hitFunc(context) {
    var anim = this.animation(),
        index = this.frameIndex(),
        ix4 = index * 4,
        set = this.animations()[anim],
        offsets = this.frameOffsets(),
        width = set[ix4 + 2],
        height = set[ix4 + 3];
    context.beginPath();

    if (offsets) {
      var offset = offsets[anim];
      var ix2 = index * 2;
      context.rect(offset[ix2 + 0], offset[ix2 + 1], width, height);
    } else {
      context.rect(0, 0, width, height);
    }

    context.closePath();
    context.fillShape(this);
  }

  _useBufferCanvas() {
    return super._useBufferCanvas(true);
  }

  _setInterval() {
    var that = this;
    this.interval = setInterval(function () {
      that._updateIndex();
    }, 1000 / this.frameRate());
  }

  start() {
    if (this.isRunning()) {
      return;
    }

    var layer = this.getLayer();
    this.anim.setLayers(layer);

    this._setInterval();

    this.anim.start();
  }

  stop() {
    this.anim.stop();
    clearInterval(this.interval);
  }

  isRunning() {
    return this.anim.isRunning();
  }

  _updateIndex() {
    var index = this.frameIndex(),
        animation = this.animation(),
        animations = this.animations(),
        anim = animations[animation],
        len = anim.length / 4;

    if (index < len - 1) {
      this.frameIndex(index + 1);
    } else {
      this.frameIndex(0);
    }
  }

}

exports.Sprite = Sprite;
Sprite.prototype.className = 'Sprite';
(0, _Global._registerNode)(Sprite);

_Factory.Factory.addGetterSetter(Sprite, 'animation');

_Factory.Factory.addGetterSetter(Sprite, 'animations');

_Factory.Factory.addGetterSetter(Sprite, 'frameOffsets');

_Factory.Factory.addGetterSetter(Sprite, 'image');

_Factory.Factory.addGetterSetter(Sprite, 'frameIndex', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Sprite, 'frameRate', 17, (0, _Validators.getNumberValidator)());

_Factory.Factory.backCompat(Sprite, {
  index: 'frameIndex',
  getIndex: 'getFrameIndex',
  setIndex: 'setFrameIndex'
});

},{"../Animation.js":1,"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],52:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Star = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

class Star extends _Shape.Shape {
  _sceneFunc(context) {
    var innerRadius = this.innerRadius(),
        outerRadius = this.outerRadius(),
        numPoints = this.numPoints();
    context.beginPath();
    context.moveTo(0, 0 - outerRadius);

    for (var n = 1; n < numPoints * 2; n++) {
      var radius = n % 2 === 0 ? outerRadius : innerRadius;
      var x = radius * Math.sin(n * Math.PI / numPoints);
      var y = -1 * radius * Math.cos(n * Math.PI / numPoints);
      context.lineTo(x, y);
    }

    context.closePath();
    context.fillStrokeShape(this);
  }

  getWidth() {
    return this.outerRadius() * 2;
  }

  getHeight() {
    return this.outerRadius() * 2;
  }

  setWidth(width) {
    this.outerRadius(width / 2);
  }

  setHeight(height) {
    this.outerRadius(height / 2);
  }

}

exports.Star = Star;
Star.prototype.className = 'Star';
Star.prototype._centroid = true;
Star.prototype._attrsAffectingSize = ['innerRadius', 'outerRadius'];
(0, _Global._registerNode)(Star);

_Factory.Factory.addGetterSetter(Star, 'numPoints', 5, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Star, 'innerRadius', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Star, 'outerRadius', 0, (0, _Validators.getNumberValidator)());

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],53:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Text = void 0;
exports.stringToArray = stringToArray;

var _Util = require("../Util.js");

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

function stringToArray(string) {
  return Array.from(string);
}

var AUTO = 'auto',
    CENTER = 'center',
    JUSTIFY = 'justify',
    CHANGE_KONVA = 'Change.konva',
    CONTEXT_2D = '2d',
    DASH = '-',
    LEFT = 'left',
    TEXT = 'text',
    TEXT_UPPER = 'Text',
    TOP = 'top',
    BOTTOM = 'bottom',
    MIDDLE = 'middle',
    NORMAL = 'normal',
    PX_SPACE = 'px ',
    SPACE = ' ',
    RIGHT = 'right',
    WORD = 'word',
    CHAR = 'char',
    NONE = 'none',
    ELLIPSIS = '…',
    ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'fontVariant', 'padding', 'align', 'verticalAlign', 'lineHeight', 'text', 'width', 'height', 'wrap', 'ellipsis', 'letterSpacing'],
    attrChangeListLen = ATTR_CHANGE_LIST.length;

function normalizeFontFamily(fontFamily) {
  return fontFamily.split(',').map(family => {
    family = family.trim();
    const hasSpace = family.indexOf(' ') >= 0;
    const hasQuotes = family.indexOf('"') >= 0 || family.indexOf("'") >= 0;

    if (hasSpace && !hasQuotes) {
      family = `"${family}"`;
    }

    return family;
  }).join(', ');
}

var dummyContext;

function getDummyContext() {
  if (dummyContext) {
    return dummyContext;
  }

  dummyContext = _Util.Util.createCanvasElement().getContext(CONTEXT_2D);
  return dummyContext;
}

function _fillFunc(context) {
  context.fillText(this._partialText, this._partialTextX, this._partialTextY);
}

function _strokeFunc(context) {
  context.strokeText(this._partialText, this._partialTextX, this._partialTextY);
}

function checkDefaultFill(config) {
  config = config || {};

  if (!config.fillLinearGradientColorStops && !config.fillRadialGradientColorStops && !config.fillPatternImage) {
    config.fill = config.fill || 'black';
  }

  return config;
}

class Text extends _Shape.Shape {
  constructor(config) {
    super(checkDefaultFill(config));
    this._partialTextX = 0;
    this._partialTextY = 0;

    for (var n = 0; n < attrChangeListLen; n++) {
      this.on(ATTR_CHANGE_LIST[n] + CHANGE_KONVA, this._setTextData);
    }

    this._setTextData();
  }

  _sceneFunc(context) {
    var textArr = this.textArr,
        textArrLen = textArr.length;

    if (!this.text()) {
      return;
    }

    var padding = this.padding(),
        fontSize = this.fontSize(),
        lineHeightPx = this.lineHeight() * fontSize,
        verticalAlign = this.verticalAlign(),
        alignY = 0,
        align = this.align(),
        totalWidth = this.getWidth(),
        letterSpacing = this.letterSpacing(),
        fill = this.fill(),
        textDecoration = this.textDecoration(),
        shouldUnderline = textDecoration.indexOf('underline') !== -1,
        shouldLineThrough = textDecoration.indexOf('line-through') !== -1,
        n;
    var translateY = 0;
    var translateY = lineHeightPx / 2;
    var lineTranslateX = 0;
    var lineTranslateY = 0;
    context.setAttr('font', this._getContextFont());
    context.setAttr('textBaseline', MIDDLE);
    context.setAttr('textAlign', LEFT);

    if (verticalAlign === MIDDLE) {
      alignY = (this.getHeight() - textArrLen * lineHeightPx - padding * 2) / 2;
    } else if (verticalAlign === BOTTOM) {
      alignY = this.getHeight() - textArrLen * lineHeightPx - padding * 2;
    }

    context.translate(padding, alignY + padding);

    for (n = 0; n < textArrLen; n++) {
      var lineTranslateX = 0;
      var lineTranslateY = 0;
      var obj = textArr[n],
          text = obj.text,
          width = obj.width,
          lastLine = obj.lastInParagraph,
          spacesNumber,
          oneWord,
          lineWidth;
      context.save();

      if (align === RIGHT) {
        lineTranslateX += totalWidth - width - padding * 2;
      } else if (align === CENTER) {
        lineTranslateX += (totalWidth - width - padding * 2) / 2;
      }

      if (shouldUnderline) {
        context.save();
        context.beginPath();
        context.moveTo(lineTranslateX, translateY + lineTranslateY + Math.round(fontSize / 2));
        spacesNumber = text.split(' ').length - 1;
        oneWord = spacesNumber === 0;
        lineWidth = align === JUSTIFY && lastLine && !oneWord ? totalWidth - padding * 2 : width;
        context.lineTo(lineTranslateX + Math.round(lineWidth), translateY + lineTranslateY + Math.round(fontSize / 2));
        context.lineWidth = fontSize / 15;
        context.strokeStyle = fill;
        context.stroke();
        context.restore();
      }

      if (shouldLineThrough) {
        context.save();
        context.beginPath();
        context.moveTo(lineTranslateX, translateY + lineTranslateY);
        spacesNumber = text.split(' ').length - 1;
        oneWord = spacesNumber === 0;
        lineWidth = align === JUSTIFY && lastLine && !oneWord ? totalWidth - padding * 2 : width;
        context.lineTo(lineTranslateX + Math.round(lineWidth), translateY + lineTranslateY);
        context.lineWidth = fontSize / 15;
        context.strokeStyle = fill;
        context.stroke();
        context.restore();
      }

      if (letterSpacing !== 0 || align === JUSTIFY) {
        spacesNumber = text.split(' ').length - 1;
        var array = stringToArray(text);

        for (var li = 0; li < array.length; li++) {
          var letter = array[li];

          if (letter === ' ' && !lastLine && align === JUSTIFY) {
            lineTranslateX += (totalWidth - padding * 2 - width) / spacesNumber;
          }

          this._partialTextX = lineTranslateX;
          this._partialTextY = translateY + lineTranslateY;
          this._partialText = letter;
          context.fillStrokeShape(this);
          lineTranslateX += this.measureSize(letter).width + letterSpacing;
        }
      } else {
        this._partialTextX = lineTranslateX;
        this._partialTextY = translateY + lineTranslateY;
        this._partialText = text;
        context.fillStrokeShape(this);
      }

      context.restore();

      if (textArrLen > 1) {
        translateY += lineHeightPx;
      }
    }
  }

  _hitFunc(context) {
    var width = this.getWidth(),
        height = this.getHeight();
    context.beginPath();
    context.rect(0, 0, width, height);
    context.closePath();
    context.fillStrokeShape(this);
  }

  setText(text) {
    var str = _Util.Util._isString(text) ? text : text === null || text === undefined ? '' : text + '';

    this._setAttr(TEXT, str);

    return this;
  }

  getWidth() {
    var isAuto = this.attrs.width === AUTO || this.attrs.width === undefined;
    return isAuto ? this.getTextWidth() + this.padding() * 2 : this.attrs.width;
  }

  getHeight() {
    var isAuto = this.attrs.height === AUTO || this.attrs.height === undefined;
    return isAuto ? this.fontSize() * this.textArr.length * this.lineHeight() + this.padding() * 2 : this.attrs.height;
  }

  getTextWidth() {
    return this.textWidth;
  }

  getTextHeight() {
    _Util.Util.warn('text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height.');

    return this.textHeight;
  }

  measureSize(text) {
    var _context = getDummyContext(),
        fontSize = this.fontSize(),
        metrics;

    _context.save();

    _context.font = this._getContextFont();
    metrics = _context.measureText(text);

    _context.restore();

    return {
      width: metrics.width,
      height: fontSize
    };
  }

  _getContextFont() {
    return this.fontStyle() + SPACE + this.fontVariant() + SPACE + (this.fontSize() + PX_SPACE) + normalizeFontFamily(this.fontFamily());
  }

  _addTextLine(line) {
    if (this.align() === JUSTIFY) {
      line = line.trim();
    }

    var width = this._getTextWidth(line);

    return this.textArr.push({
      text: line,
      width: width,
      lastInParagraph: false
    });
  }

  _getTextWidth(text) {
    var letterSpacing = this.letterSpacing();
    var length = text.length;
    return getDummyContext().measureText(text).width + (length ? letterSpacing * (length - 1) : 0);
  }

  _setTextData() {
    var lines = this.text().split('\n'),
        fontSize = +this.fontSize(),
        textWidth = 0,
        lineHeightPx = this.lineHeight() * fontSize,
        width = this.attrs.width,
        height = this.attrs.height,
        fixedWidth = width !== AUTO && width !== undefined,
        fixedHeight = height !== AUTO && height !== undefined,
        padding = this.padding(),
        maxWidth = width - padding * 2,
        maxHeightPx = height - padding * 2,
        currentHeightPx = 0,
        wrap = this.wrap(),
        shouldWrap = wrap !== NONE,
        wrapAtWord = wrap !== CHAR && shouldWrap,
        shouldAddEllipsis = this.ellipsis();
    this.textArr = [];
    getDummyContext().font = this._getContextFont();
    var additionalWidth = shouldAddEllipsis ? this._getTextWidth(ELLIPSIS) : 0;

    for (var i = 0, max = lines.length; i < max; ++i) {
      var line = lines[i];

      var lineWidth = this._getTextWidth(line);

      if (fixedWidth && lineWidth > maxWidth) {
        while (line.length > 0) {
          var low = 0,
              high = line.length,
              match = '',
              matchWidth = 0;

          while (low < high) {
            var mid = low + high >>> 1,
                substr = line.slice(0, mid + 1),
                substrWidth = this._getTextWidth(substr) + additionalWidth;

            if (substrWidth <= maxWidth) {
              low = mid + 1;
              match = substr;
              matchWidth = substrWidth;
            } else {
              high = mid;
            }
          }

          if (match) {
            if (wrapAtWord) {
              var wrapIndex;
              var nextChar = line[match.length];
              var nextIsSpaceOrDash = nextChar === SPACE || nextChar === DASH;

              if (nextIsSpaceOrDash && matchWidth <= maxWidth) {
                wrapIndex = match.length;
              } else {
                wrapIndex = Math.max(match.lastIndexOf(SPACE), match.lastIndexOf(DASH)) + 1;
              }

              if (wrapIndex > 0) {
                low = wrapIndex;
                match = match.slice(0, low);
                matchWidth = this._getTextWidth(match);
              }
            }

            match = match.trimRight();

            this._addTextLine(match);

            textWidth = Math.max(textWidth, matchWidth);
            currentHeightPx += lineHeightPx;

            if (!shouldWrap || fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx) {
              var lastLine = this.textArr[this.textArr.length - 1];

              if (lastLine) {
                if (shouldAddEllipsis) {
                  var haveSpace = this._getTextWidth(lastLine.text + ELLIPSIS) < maxWidth;

                  if (!haveSpace) {
                    lastLine.text = lastLine.text.slice(0, lastLine.text.length - 3);
                  }

                  this.textArr.splice(this.textArr.length - 1, 1);

                  this._addTextLine(lastLine.text + ELLIPSIS);
                }
              }

              break;
            }

            line = line.slice(low);
            line = line.trimLeft();

            if (line.length > 0) {
              lineWidth = this._getTextWidth(line);

              if (lineWidth <= maxWidth) {
                this._addTextLine(line);

                currentHeightPx += lineHeightPx;
                textWidth = Math.max(textWidth, lineWidth);
                break;
              }
            }
          } else {
            break;
          }
        }
      } else {
        this._addTextLine(line);

        currentHeightPx += lineHeightPx;
        textWidth = Math.max(textWidth, lineWidth);
      }

      if (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx) {
        break;
      }

      if (this.textArr[this.textArr.length - 1]) {
        this.textArr[this.textArr.length - 1].lastInParagraph = true;
      }
    }

    this.textHeight = fontSize;
    this.textWidth = textWidth;
  }

  getStrokeScaleEnabled() {
    return true;
  }

}

exports.Text = Text;
Text.prototype._fillFunc = _fillFunc;
Text.prototype._strokeFunc = _strokeFunc;
Text.prototype.className = TEXT_UPPER;
Text.prototype._attrsAffectingSize = ['text', 'fontSize', 'padding', 'wrap', 'lineHeight', 'letterSpacing'];
(0, _Global._registerNode)(Text);

_Factory.Factory.overWriteSetter(Text, 'width', (0, _Validators.getNumberOrAutoValidator)());

_Factory.Factory.overWriteSetter(Text, 'height', (0, _Validators.getNumberOrAutoValidator)());

_Factory.Factory.addGetterSetter(Text, 'fontFamily', 'Arial');

_Factory.Factory.addGetterSetter(Text, 'fontSize', 12, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Text, 'fontStyle', NORMAL);

_Factory.Factory.addGetterSetter(Text, 'fontVariant', NORMAL);

_Factory.Factory.addGetterSetter(Text, 'padding', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Text, 'align', LEFT);

_Factory.Factory.addGetterSetter(Text, 'verticalAlign', TOP);

_Factory.Factory.addGetterSetter(Text, 'lineHeight', 1, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Text, 'wrap', WORD);

_Factory.Factory.addGetterSetter(Text, 'ellipsis', false, (0, _Validators.getBooleanValidator)());

_Factory.Factory.addGetterSetter(Text, 'letterSpacing', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Text, 'text', '', (0, _Validators.getStringValidator)());

_Factory.Factory.addGetterSetter(Text, 'textDecoration', '');

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Util.js":16,"../Validators.js":17}],54:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextPath = void 0;

var _Util = require("../Util.js");

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Path = require("./Path.js");

var _Text = require("./Text.js");

var _Validators = require("../Validators.js");

var _Global = require("../Global.js");

var EMPTY_STRING = '',
    NORMAL = 'normal';

function _fillFunc(context) {
  context.fillText(this.partialText, 0, 0);
}

function _strokeFunc(context) {
  context.strokeText(this.partialText, 0, 0);
}

class TextPath extends _Shape.Shape {
  constructor(config) {
    super(config);
    this.dummyCanvas = _Util.Util.createCanvasElement();
    this.dataArray = [];
    this.dataArray = _Path.Path.parsePathData(this.attrs.data);
    this.on('dataChange.konva', function () {
      this.dataArray = _Path.Path.parsePathData(this.attrs.data);

      this._setTextData();
    });
    this.on('textChange.konva alignChange.konva letterSpacingChange.konva kerningFuncChange.konva fontSizeChange.konva fontFamilyChange.konva', this._setTextData);

    this._setTextData();
  }

  _sceneFunc(context) {
    context.setAttr('font', this._getContextFont());
    context.setAttr('textBaseline', this.textBaseline());
    context.setAttr('textAlign', 'left');
    context.save();
    var textDecoration = this.textDecoration();
    var fill = this.fill();
    var fontSize = this.fontSize();
    var glyphInfo = this.glyphInfo;

    if (textDecoration === 'underline') {
      context.beginPath();
    }

    for (var i = 0; i < glyphInfo.length; i++) {
      context.save();
      var p0 = glyphInfo[i].p0;
      context.translate(p0.x, p0.y);
      context.rotate(glyphInfo[i].rotation);
      this.partialText = glyphInfo[i].text;
      context.fillStrokeShape(this);

      if (textDecoration === 'underline') {
        if (i === 0) {
          context.moveTo(0, fontSize / 2 + 1);
        }

        context.lineTo(fontSize, fontSize / 2 + 1);
      }

      context.restore();
    }

    if (textDecoration === 'underline') {
      context.strokeStyle = fill;
      context.lineWidth = fontSize / 20;
      context.stroke();
    }

    context.restore();
  }

  _hitFunc(context) {
    context.beginPath();
    var glyphInfo = this.glyphInfo;

    if (glyphInfo.length >= 1) {
      var p0 = glyphInfo[0].p0;
      context.moveTo(p0.x, p0.y);
    }

    for (var i = 0; i < glyphInfo.length; i++) {
      var p1 = glyphInfo[i].p1;
      context.lineTo(p1.x, p1.y);
    }

    context.setAttr('lineWidth', this.fontSize());
    context.setAttr('strokeStyle', this.colorKey);
    context.stroke();
  }

  getTextWidth() {
    return this.textWidth;
  }

  getTextHeight() {
    _Util.Util.warn('text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height.');

    return this.textHeight;
  }

  setText(text) {
    return _Text.Text.prototype.setText.call(this, text);
  }

  _getContextFont() {
    return _Text.Text.prototype._getContextFont.call(this);
  }

  _getTextSize(text) {
    var dummyCanvas = this.dummyCanvas;

    var _context = dummyCanvas.getContext('2d');

    _context.save();

    _context.font = this._getContextFont();

    var metrics = _context.measureText(text);

    _context.restore();

    return {
      width: metrics.width,
      height: parseInt(this.attrs.fontSize, 10)
    };
  }

  _setTextData() {
    var that = this;

    var size = this._getTextSize(this.attrs.text);

    var letterSpacing = this.letterSpacing();
    var align = this.align();
    var kerningFunc = this.kerningFunc();
    this.textWidth = size.width;
    this.textHeight = size.height;
    var textFullWidth = Math.max(this.textWidth + ((this.attrs.text || '').length - 1) * letterSpacing, 0);
    this.glyphInfo = [];
    var fullPathWidth = 0;

    for (var l = 0; l < that.dataArray.length; l++) {
      if (that.dataArray[l].pathLength > 0) {
        fullPathWidth += that.dataArray[l].pathLength;
      }
    }

    var offset = 0;

    if (align === 'center') {
      offset = Math.max(0, fullPathWidth / 2 - textFullWidth / 2);
    }

    if (align === 'right') {
      offset = Math.max(0, fullPathWidth - textFullWidth);
    }

    var charArr = (0, _Text.stringToArray)(this.text());
    var spacesNumber = this.text().split(' ').length - 1;
    var p0, p1, pathCmd;
    var pIndex = -1;
    var currentT = 0;

    var getNextPathSegment = function () {
      currentT = 0;
      var pathData = that.dataArray;

      for (var j = pIndex + 1; j < pathData.length; j++) {
        if (pathData[j].pathLength > 0) {
          pIndex = j;
          return pathData[j];
        } else if (pathData[j].command === 'M') {
          p0 = {
            x: pathData[j].points[0],
            y: pathData[j].points[1]
          };
        }
      }

      return {};
    };

    var findSegmentToFitCharacter = function (c) {
      var glyphWidth = that._getTextSize(c).width + letterSpacing;

      if (c === ' ' && align === 'justify') {
        glyphWidth += (fullPathWidth - textFullWidth) / spacesNumber;
      }

      var currLen = 0;
      var attempts = 0;
      p1 = undefined;

      while (Math.abs(glyphWidth - currLen) / glyphWidth > 0.01 && attempts < 20) {
        attempts++;
        var cumulativePathLength = currLen;

        while (pathCmd === undefined) {
          pathCmd = getNextPathSegment();

          if (pathCmd && cumulativePathLength + pathCmd.pathLength < glyphWidth) {
            cumulativePathLength += pathCmd.pathLength;
            pathCmd = undefined;
          }
        }

        if (pathCmd === {} || p0 === undefined) {
          return undefined;
        }

        var needNewSegment = false;

        switch (pathCmd.command) {
          case 'L':
            if (_Path.Path.getLineLength(p0.x, p0.y, pathCmd.points[0], pathCmd.points[1]) > glyphWidth) {
              p1 = _Path.Path.getPointOnLine(glyphWidth, p0.x, p0.y, pathCmd.points[0], pathCmd.points[1], p0.x, p0.y);
            } else {
              pathCmd = undefined;
            }

            break;

          case 'A':
            var start = pathCmd.points[4];
            var dTheta = pathCmd.points[5];
            var end = pathCmd.points[4] + dTheta;

            if (currentT === 0) {
              currentT = start + 0.00000001;
            } else if (glyphWidth > currLen) {
              currentT += Math.PI / 180.0 * dTheta / Math.abs(dTheta);
            } else {
              currentT -= Math.PI / 360.0 * dTheta / Math.abs(dTheta);
            }

            if (dTheta < 0 && currentT < end || dTheta >= 0 && currentT > end) {
              currentT = end;
              needNewSegment = true;
            }

            p1 = _Path.Path.getPointOnEllipticalArc(pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], currentT, pathCmd.points[6]);
            break;

          case 'C':
            if (currentT === 0) {
              if (glyphWidth > pathCmd.pathLength) {
                currentT = 0.00000001;
              } else {
                currentT = glyphWidth / pathCmd.pathLength;
              }
            } else if (glyphWidth > currLen) {
              currentT += (glyphWidth - currLen) / pathCmd.pathLength / 2;
            } else {
              currentT = Math.max(currentT - (currLen - glyphWidth) / pathCmd.pathLength / 2, 0);
            }

            if (currentT > 1.0) {
              currentT = 1.0;
              needNewSegment = true;
            }

            p1 = _Path.Path.getPointOnCubicBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], pathCmd.points[4], pathCmd.points[5]);
            break;

          case 'Q':
            if (currentT === 0) {
              currentT = glyphWidth / pathCmd.pathLength;
            } else if (glyphWidth > currLen) {
              currentT += (glyphWidth - currLen) / pathCmd.pathLength;
            } else {
              currentT -= (currLen - glyphWidth) / pathCmd.pathLength;
            }

            if (currentT > 1.0) {
              currentT = 1.0;
              needNewSegment = true;
            }

            p1 = _Path.Path.getPointOnQuadraticBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3]);
            break;
        }

        if (p1 !== undefined) {
          currLen = _Path.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);
        }

        if (needNewSegment) {
          needNewSegment = false;
          pathCmd = undefined;
        }
      }
    };

    var testChar = 'C';
    var glyphWidth = that._getTextSize(testChar).width + letterSpacing;
    var lettersInOffset = offset / glyphWidth - 1;

    for (var k = 0; k < lettersInOffset; k++) {
      findSegmentToFitCharacter(testChar);

      if (p0 === undefined || p1 === undefined) {
        break;
      }

      p0 = p1;
    }

    for (var i = 0; i < charArr.length; i++) {
      findSegmentToFitCharacter(charArr[i]);

      if (p0 === undefined || p1 === undefined) {
        break;
      }

      var width = _Path.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);

      var kern = 0;

      if (kerningFunc) {
        try {
          kern = kerningFunc(charArr[i - 1], charArr[i]) * this.fontSize();
        } catch (e) {
          kern = 0;
        }
      }

      p0.x += kern;
      p1.x += kern;
      this.textWidth += kern;

      var midpoint = _Path.Path.getPointOnLine(kern + width / 2.0, p0.x, p0.y, p1.x, p1.y);

      var rotation = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      this.glyphInfo.push({
        transposeX: midpoint.x,
        transposeY: midpoint.y,
        text: charArr[i],
        rotation: rotation,
        p0: p0,
        p1: p1
      });
      p0 = p1;
    }
  }

  getSelfRect() {
    if (!this.glyphInfo.length) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }

    var points = [];
    this.glyphInfo.forEach(function (info) {
      points.push(info.p0.x);
      points.push(info.p0.y);
      points.push(info.p1.x);
      points.push(info.p1.y);
    });
    var minX = points[0] || 0;
    var maxX = points[0] || 0;
    var minY = points[1] || 0;
    var maxY = points[1] || 0;
    var x, y;

    for (var i = 0; i < points.length / 2; i++) {
      x = points[i * 2];
      y = points[i * 2 + 1];
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    var fontSize = this.fontSize();
    return {
      x: minX - fontSize / 2,
      y: minY - fontSize / 2,
      width: maxX - minX + fontSize,
      height: maxY - minY + fontSize
    };
  }

}

exports.TextPath = TextPath;
TextPath.prototype._fillFunc = _fillFunc;
TextPath.prototype._strokeFunc = _strokeFunc;
TextPath.prototype._fillFuncHit = _fillFunc;
TextPath.prototype._strokeFuncHit = _strokeFunc;
TextPath.prototype.className = 'TextPath';
TextPath.prototype._attrsAffectingSize = ['text', 'fontSize', 'data'];
(0, _Global._registerNode)(TextPath);

_Factory.Factory.addGetterSetter(TextPath, 'data');

_Factory.Factory.addGetterSetter(TextPath, 'fontFamily', 'Arial');

_Factory.Factory.addGetterSetter(TextPath, 'fontSize', 12, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(TextPath, 'fontStyle', NORMAL);

_Factory.Factory.addGetterSetter(TextPath, 'align', 'left');

_Factory.Factory.addGetterSetter(TextPath, 'letterSpacing', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(TextPath, 'textBaseline', 'middle');

_Factory.Factory.addGetterSetter(TextPath, 'fontVariant', NORMAL);

_Factory.Factory.addGetterSetter(TextPath, 'text', EMPTY_STRING);

_Factory.Factory.addGetterSetter(TextPath, 'textDecoration', null);

_Factory.Factory.addGetterSetter(TextPath, 'kerningFunc', null);

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Util.js":16,"../Validators.js":17,"./Path.js":47,"./Text.js":53}],55:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transformer = void 0;

var _Util = require("../Util.js");

var _Factory = require("../Factory.js");

var _Node = require("../Node.js");

var _Shape = require("../Shape.js");

var _Rect = require("./Rect.js");

var _Group = require("../Group.js");

var _Global = require("../Global.js");

var _Validators = require("../Validators.js");

var EVENTS_NAME = 'tr-konva';
var ATTR_CHANGE_LIST = ['resizeEnabledChange', 'rotateAnchorOffsetChange', 'rotateEnabledChange', 'enabledAnchorsChange', 'anchorSizeChange', 'borderEnabledChange', 'borderStrokeChange', 'borderStrokeWidthChange', 'borderDashChange', 'anchorStrokeChange', 'anchorStrokeWidthChange', 'anchorFillChange', 'anchorCornerRadiusChange', 'ignoreStrokeChange'].map(e => e + `.${EVENTS_NAME}`).join(' ');
var NODES_RECT = 'nodesRect';
var TRANSFORM_CHANGE_STR = ['widthChange', 'heightChange', 'scaleXChange', 'scaleYChange', 'skewXChange', 'skewYChange', 'rotationChange', 'offsetXChange', 'offsetYChange', 'transformsEnabledChange', 'strokeWidthChange'];
var ANGLES = {
  'top-left': -45,
  'top-center': 0,
  'top-right': 45,
  'middle-right': -90,
  'middle-left': 90,
  'bottom-left': -135,
  'bottom-center': 180,
  'bottom-right': 135
};
const TOUCH_DEVICE = ('ontouchstart' in _Global.Konva._global);

function getCursor(anchorName, rad) {
  if (anchorName === 'rotater') {
    return 'crosshair';
  }

  rad += _Util.Util.degToRad(ANGLES[anchorName] || 0);
  var angle = (_Util.Util.radToDeg(rad) % 360 + 360) % 360;

  if (_Util.Util._inRange(angle, 315 + 22.5, 360) || _Util.Util._inRange(angle, 0, 22.5)) {
    return 'ns-resize';
  } else if (_Util.Util._inRange(angle, 45 - 22.5, 45 + 22.5)) {
    return 'nesw-resize';
  } else if (_Util.Util._inRange(angle, 90 - 22.5, 90 + 22.5)) {
    return 'ew-resize';
  } else if (_Util.Util._inRange(angle, 135 - 22.5, 135 + 22.5)) {
    return 'nwse-resize';
  } else if (_Util.Util._inRange(angle, 180 - 22.5, 180 + 22.5)) {
    return 'ns-resize';
  } else if (_Util.Util._inRange(angle, 225 - 22.5, 225 + 22.5)) {
    return 'nesw-resize';
  } else if (_Util.Util._inRange(angle, 270 - 22.5, 270 + 22.5)) {
    return 'ew-resize';
  } else if (_Util.Util._inRange(angle, 315 - 22.5, 315 + 22.5)) {
    return 'nwse-resize';
  } else {
    _Util.Util.error('Transformer has unknown angle for cursor detection: ' + angle);

    return 'pointer';
  }
}

var ANCHORS_NAMES = ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'];
var MAX_SAFE_INTEGER = 100000000;

function getCenter(shape) {
  return {
    x: shape.x + shape.width / 2 * Math.cos(shape.rotation) + shape.height / 2 * Math.sin(-shape.rotation),
    y: shape.y + shape.height / 2 * Math.cos(shape.rotation) + shape.width / 2 * Math.sin(shape.rotation)
  };
}

function rotateAroundPoint(shape, angleRad, point) {
  const x = point.x + (shape.x - point.x) * Math.cos(angleRad) - (shape.y - point.y) * Math.sin(angleRad);
  const y = point.y + (shape.x - point.x) * Math.sin(angleRad) + (shape.y - point.y) * Math.cos(angleRad);
  return Object.assign(Object.assign({}, shape), {
    rotation: shape.rotation + angleRad,
    x,
    y
  });
}

function rotateAroundCenter(shape, deltaRad) {
  const center = getCenter(shape);
  return rotateAroundPoint(shape, deltaRad, center);
}

function getSnap(snaps, newRotationRad, tol) {
  let snapped = newRotationRad;

  for (let i = 0; i < snaps.length; i++) {
    const angle = _Global.Konva.getAngle(snaps[i]);

    const absDiff = Math.abs(angle - newRotationRad) % (Math.PI * 2);
    const dif = Math.min(absDiff, Math.PI * 2 - absDiff);

    if (dif < tol) {
      snapped = angle;
    }
  }

  return snapped;
}

class Transformer extends _Group.Group {
  constructor(config) {
    super(config);
    this._transforming = false;

    this._createElements();

    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this.update = this.update.bind(this);
    this.on(ATTR_CHANGE_LIST, this.update);

    if (this.getNode()) {
      this.update();
    }
  }

  attachTo(node) {
    this.setNode(node);
    return this;
  }

  setNode(node) {
    _Util.Util.warn('tr.setNode(shape), tr.node(shape) and tr.attachTo(shape) methods are deprecated. Please use tr.nodes(nodesArray) instead.');

    return this.setNodes([node]);
  }

  getNode() {
    return this._nodes && this._nodes[0];
  }

  _getEventNamespace() {
    return EVENTS_NAME + this._id;
  }

  setNodes(nodes = []) {
    if (this._nodes && this._nodes.length) {
      this.detach();
    }

    this._nodes = nodes;

    if (nodes.length === 1 && this.useSingleNodeRotation()) {
      this.rotation(nodes[0].getAbsoluteRotation());
    } else {
      this.rotation(0);
    }

    this._nodes.forEach(node => {
      const onChange = () => {
        if (this.nodes().length === 1 && this.useSingleNodeRotation()) {
          this.rotation(this.nodes()[0].getAbsoluteRotation());
        }

        this._resetTransformCache();

        if (!this._transforming && !this.isDragging()) {
          this.update();
        }
      };

      const additionalEvents = node._attrsAffectingSize.map(prop => prop + 'Change.' + this._getEventNamespace()).join(' ');

      node.on(additionalEvents, onChange);
      node.on(TRANSFORM_CHANGE_STR.map(e => e + `.${this._getEventNamespace()}`).join(' '), onChange);
      node.on(`absoluteTransformChange.${this._getEventNamespace()}`, onChange);

      this._proxyDrag(node);
    });

    this._resetTransformCache();

    var elementsCreated = !!this.findOne('.top-left');

    if (elementsCreated) {
      this.update();
    }

    return this;
  }

  _proxyDrag(node) {
    let lastPos;
    node.on(`dragstart.${this._getEventNamespace()}`, e => {
      lastPos = node.getAbsolutePosition();

      if (!this.isDragging() && node !== this.findOne('.back')) {
        this.startDrag(e, false);
      }
    });
    node.on(`dragmove.${this._getEventNamespace()}`, e => {
      if (!lastPos) {
        return;
      }

      const abs = node.getAbsolutePosition();
      const dx = abs.x - lastPos.x;
      const dy = abs.y - lastPos.y;
      this.nodes().forEach(otherNode => {
        if (otherNode === node) {
          return;
        }

        if (otherNode.isDragging()) {
          return;
        }

        const otherAbs = otherNode.getAbsolutePosition();
        otherNode.setAbsolutePosition({
          x: otherAbs.x + dx,
          y: otherAbs.y + dy
        });
        otherNode.startDrag(e);
      });
      lastPos = null;
    });
  }

  getNodes() {
    return this._nodes || [];
  }

  getActiveAnchor() {
    return this._movingAnchorName;
  }

  detach() {
    if (this._nodes) {
      this._nodes.forEach(node => {
        node.off('.' + this._getEventNamespace());
      });
    }

    this._nodes = [];

    this._resetTransformCache();
  }

  _resetTransformCache() {
    this._clearCache(NODES_RECT);

    this._clearCache('transform');

    this._clearSelfAndDescendantCache('absoluteTransform');
  }

  _getNodeRect() {
    return this._getCache(NODES_RECT, this.__getNodeRect);
  }

  __getNodeShape(node, rot = this.rotation(), relative) {
    var rect = node.getClientRect({
      skipTransform: true,
      skipShadow: true,
      skipStroke: this.ignoreStroke()
    });
    var absScale = node.getAbsoluteScale(relative);
    var absPos = node.getAbsolutePosition(relative);
    var dx = rect.x * absScale.x - node.offsetX() * absScale.x;
    var dy = rect.y * absScale.y - node.offsetY() * absScale.y;
    const rotation = (_Global.Konva.getAngle(node.getAbsoluteRotation()) + Math.PI * 2) % (Math.PI * 2);
    const box = {
      x: absPos.x + dx * Math.cos(rotation) + dy * Math.sin(-rotation),
      y: absPos.y + dy * Math.cos(rotation) + dx * Math.sin(rotation),
      width: rect.width * absScale.x,
      height: rect.height * absScale.y,
      rotation: rotation
    };
    return rotateAroundPoint(box, -_Global.Konva.getAngle(rot), {
      x: 0,
      y: 0
    });
  }

  __getNodeRect() {
    var node = this.getNode();

    if (!node) {
      return {
        x: -MAX_SAFE_INTEGER,
        y: -MAX_SAFE_INTEGER,
        width: 0,
        height: 0,
        rotation: 0
      };
    }

    const totalPoints = [];
    this.nodes().map(node => {
      const box = node.getClientRect({
        skipTransform: true,
        skipShadow: true,
        skipStroke: this.ignoreStroke()
      });
      var points = [{
        x: box.x,
        y: box.y
      }, {
        x: box.x + box.width,
        y: box.y
      }, {
        x: box.x + box.width,
        y: box.y + box.height
      }, {
        x: box.x,
        y: box.y + box.height
      }];
      var trans = node.getAbsoluteTransform();
      points.forEach(function (point) {
        var transformed = trans.point(point);
        totalPoints.push(transformed);
      });
    });
    const tr = new _Util.Transform();
    tr.rotate(-_Global.Konva.getAngle(this.rotation()));
    var minX, minY, maxX, maxY;
    totalPoints.forEach(function (point) {
      var transformed = tr.point(point);

      if (minX === undefined) {
        minX = maxX = transformed.x;
        minY = maxY = transformed.y;
      }

      minX = Math.min(minX, transformed.x);
      minY = Math.min(minY, transformed.y);
      maxX = Math.max(maxX, transformed.x);
      maxY = Math.max(maxY, transformed.y);
    });
    tr.invert();
    const p = tr.point({
      x: minX,
      y: minY
    });
    return {
      x: p.x,
      y: p.y,
      width: maxX - minX,
      height: maxY - minY,
      rotation: _Global.Konva.getAngle(this.rotation())
    };
  }

  getX() {
    return this._getNodeRect().x;
  }

  getY() {
    return this._getNodeRect().y;
  }

  getWidth() {
    return this._getNodeRect().width;
  }

  getHeight() {
    return this._getNodeRect().height;
  }

  _createElements() {
    this._createBack();

    ANCHORS_NAMES.forEach(function (name) {
      this._createAnchor(name);
    }.bind(this));

    this._createAnchor('rotater');
  }

  _createAnchor(name) {
    var anchor = new _Rect.Rect({
      stroke: 'rgb(0, 161, 255)',
      fill: 'white',
      strokeWidth: 1,
      name: name + ' _anchor',
      dragDistance: 0,
      draggable: true,
      hitStrokeWidth: TOUCH_DEVICE ? 10 : 'auto'
    });
    var self = this;
    anchor.on('mousedown touchstart', function (e) {
      self._handleMouseDown(e);
    });
    anchor.on('dragstart', e => {
      anchor.stopDrag();
      e.cancelBubble = true;
    });
    anchor.on('dragend', e => {
      e.cancelBubble = true;
    });
    anchor.on('mouseenter', () => {
      var rad = _Global.Konva.getAngle(this.rotation());

      var cursor = getCursor(name, rad);
      anchor.getStage().content && (anchor.getStage().content.style.cursor = cursor);
      this._cursorChange = true;
    });
    anchor.on('mouseout', () => {
      anchor.getStage().content && (anchor.getStage().content.style.cursor = '');
      this._cursorChange = false;
    });
    this.add(anchor);
  }

  _createBack() {
    var back = new _Shape.Shape({
      name: 'back',
      width: 0,
      height: 0,
      draggable: true,

      sceneFunc(ctx) {
        var tr = this.getParent();
        var padding = tr.padding();
        ctx.beginPath();
        ctx.rect(-padding, -padding, this.width() + padding * 2, this.height() + padding * 2);
        ctx.moveTo(this.width() / 2, -padding);

        if (tr.rotateEnabled()) {
          ctx.lineTo(this.width() / 2, -tr.rotateAnchorOffset() * _Util.Util._sign(this.height()) - padding);
        }

        ctx.fillStrokeShape(this);
      },

      hitFunc: (ctx, shape) => {
        if (!this.shouldOverdrawWholeArea()) {
          return;
        }

        var padding = this.padding();
        ctx.beginPath();
        ctx.rect(-padding, -padding, shape.width() + padding * 2, shape.height() + padding * 2);
        ctx.fillStrokeShape(shape);
      }
    });
    this.add(back);

    this._proxyDrag(back);

    back.on('dragstart', e => {
      e.cancelBubble = true;
    });
    back.on('dragmove', e => {
      e.cancelBubble = true;
    });
    back.on('dragend', e => {
      e.cancelBubble = true;
    });
    this.on('dragmove', e => {
      this.update();
    });
  }

  _handleMouseDown(e) {
    this._movingAnchorName = e.target.name().split(' ')[0];

    var attrs = this._getNodeRect();

    var width = attrs.width;
    var height = attrs.height;
    var hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
    this.sin = Math.abs(height / hypotenuse);
    this.cos = Math.abs(width / hypotenuse);

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this._handleMouseMove);
      window.addEventListener('touchmove', this._handleMouseMove);
      window.addEventListener('mouseup', this._handleMouseUp, true);
      window.addEventListener('touchend', this._handleMouseUp, true);
    }

    this._transforming = true;
    var ap = e.target.getAbsolutePosition();
    var pos = e.target.getStage().getPointerPosition();
    this._anchorDragOffset = {
      x: pos.x - ap.x,
      y: pos.y - ap.y
    };

    this._fire('transformstart', {
      evt: e.evt,
      target: this.getNode()
    });

    this._nodes.forEach(target => {
      target._fire('transformstart', {
        evt: e.evt,
        target
      });
    });
  }

  _handleMouseMove(e) {
    var x, y, newHypotenuse;
    var anchorNode = this.findOne('.' + this._movingAnchorName);
    var stage = anchorNode.getStage();
    stage.setPointersPositions(e);
    const pp = stage.getPointerPosition();
    let newNodePos = {
      x: pp.x - this._anchorDragOffset.x,
      y: pp.y - this._anchorDragOffset.y
    };
    const oldAbs = anchorNode.getAbsolutePosition();

    if (this.anchorDragBoundFunc()) {
      newNodePos = this.anchorDragBoundFunc()(oldAbs, newNodePos, e);
    }

    anchorNode.setAbsolutePosition(newNodePos);
    const newAbs = anchorNode.getAbsolutePosition();

    if (oldAbs.x === newAbs.x && oldAbs.y === newAbs.y) {
      return;
    }

    if (this._movingAnchorName === 'rotater') {
      var attrs = this._getNodeRect();

      x = anchorNode.x() - attrs.width / 2;
      y = -anchorNode.y() + attrs.height / 2;
      let delta = Math.atan2(-y, x) + Math.PI / 2;

      if (attrs.height < 0) {
        delta -= Math.PI;
      }

      var oldRotation = _Global.Konva.getAngle(this.rotation());

      const newRotation = oldRotation + delta;

      const tol = _Global.Konva.getAngle(this.rotationSnapTolerance());

      const snappedRot = getSnap(this.rotationSnaps(), newRotation, tol);
      const diff = snappedRot - attrs.rotation;
      const shape = rotateAroundCenter(attrs, diff);

      this._fitNodesInto(shape, e);

      return;
    }

    var keepProportion = this.keepRatio() || e.shiftKey;
    var centeredScaling = this.centeredScaling() || e.altKey;

    if (this._movingAnchorName === 'top-left') {
      if (keepProportion) {
        var comparePoint = centeredScaling ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne('.bottom-right').x(),
          y: this.findOne('.bottom-right').y()
        };
        newHypotenuse = Math.sqrt(Math.pow(comparePoint.x - anchorNode.x(), 2) + Math.pow(comparePoint.y - anchorNode.y(), 2));
        var reverseX = this.findOne('.top-left').x() > comparePoint.x ? -1 : 1;
        var reverseY = this.findOne('.top-left').y() > comparePoint.y ? -1 : 1;
        x = newHypotenuse * this.cos * reverseX;
        y = newHypotenuse * this.sin * reverseY;
        this.findOne('.top-left').x(comparePoint.x - x);
        this.findOne('.top-left').y(comparePoint.y - y);
      }
    } else if (this._movingAnchorName === 'top-center') {
      this.findOne('.top-left').y(anchorNode.y());
    } else if (this._movingAnchorName === 'top-right') {
      if (keepProportion) {
        var comparePoint = centeredScaling ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne('.bottom-left').x(),
          y: this.findOne('.bottom-left').y()
        };
        newHypotenuse = Math.sqrt(Math.pow(anchorNode.x() - comparePoint.x, 2) + Math.pow(comparePoint.y - anchorNode.y(), 2));
        var reverseX = this.findOne('.top-right').x() < comparePoint.x ? -1 : 1;
        var reverseY = this.findOne('.top-right').y() > comparePoint.y ? -1 : 1;
        x = newHypotenuse * this.cos * reverseX;
        y = newHypotenuse * this.sin * reverseY;
        this.findOne('.top-right').x(comparePoint.x + x);
        this.findOne('.top-right').y(comparePoint.y - y);
      }

      var pos = anchorNode.position();
      this.findOne('.top-left').y(pos.y);
      this.findOne('.bottom-right').x(pos.x);
    } else if (this._movingAnchorName === 'middle-left') {
      this.findOne('.top-left').x(anchorNode.x());
    } else if (this._movingAnchorName === 'middle-right') {
      this.findOne('.bottom-right').x(anchorNode.x());
    } else if (this._movingAnchorName === 'bottom-left') {
      if (keepProportion) {
        var comparePoint = centeredScaling ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne('.top-right').x(),
          y: this.findOne('.top-right').y()
        };
        newHypotenuse = Math.sqrt(Math.pow(comparePoint.x - anchorNode.x(), 2) + Math.pow(anchorNode.y() - comparePoint.y, 2));
        var reverseX = comparePoint.x < anchorNode.x() ? -1 : 1;
        var reverseY = anchorNode.y() < comparePoint.y ? -1 : 1;
        x = newHypotenuse * this.cos * reverseX;
        y = newHypotenuse * this.sin * reverseY;
        anchorNode.x(comparePoint.x - x);
        anchorNode.y(comparePoint.y + y);
      }

      pos = anchorNode.position();
      this.findOne('.top-left').x(pos.x);
      this.findOne('.bottom-right').y(pos.y);
    } else if (this._movingAnchorName === 'bottom-center') {
      this.findOne('.bottom-right').y(anchorNode.y());
    } else if (this._movingAnchorName === 'bottom-right') {
      if (keepProportion) {
        var comparePoint = centeredScaling ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne('.top-left').x(),
          y: this.findOne('.top-left').y()
        };
        newHypotenuse = Math.sqrt(Math.pow(anchorNode.x() - comparePoint.x, 2) + Math.pow(anchorNode.y() - comparePoint.y, 2));
        var reverseX = this.findOne('.bottom-right').x() < comparePoint.x ? -1 : 1;
        var reverseY = this.findOne('.bottom-right').y() < comparePoint.y ? -1 : 1;
        x = newHypotenuse * this.cos * reverseX;
        y = newHypotenuse * this.sin * reverseY;
        this.findOne('.bottom-right').x(comparePoint.x + x);
        this.findOne('.bottom-right').y(comparePoint.y + y);
      }
    } else {
      console.error(new Error('Wrong position argument of selection resizer: ' + this._movingAnchorName));
    }

    var centeredScaling = this.centeredScaling() || e.altKey;

    if (centeredScaling) {
      var topLeft = this.findOne('.top-left');
      var bottomRight = this.findOne('.bottom-right');
      var topOffsetX = topLeft.x();
      var topOffsetY = topLeft.y();
      var bottomOffsetX = this.getWidth() - bottomRight.x();
      var bottomOffsetY = this.getHeight() - bottomRight.y();
      bottomRight.move({
        x: -topOffsetX,
        y: -topOffsetY
      });
      topLeft.move({
        x: bottomOffsetX,
        y: bottomOffsetY
      });
    }

    var absPos = this.findOne('.top-left').getAbsolutePosition();
    x = absPos.x;
    y = absPos.y;
    var width = this.findOne('.bottom-right').x() - this.findOne('.top-left').x();
    var height = this.findOne('.bottom-right').y() - this.findOne('.top-left').y();

    this._fitNodesInto({
      x: x,
      y: y,
      width: width,
      height: height,
      rotation: _Global.Konva.getAngle(this.rotation())
    }, e);
  }

  _handleMouseUp(e) {
    this._removeEvents(e);
  }

  getAbsoluteTransform() {
    return this.getTransform();
  }

  _removeEvents(e) {
    if (this._transforming) {
      this._transforming = false;

      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', this._handleMouseMove);
        window.removeEventListener('touchmove', this._handleMouseMove);
        window.removeEventListener('mouseup', this._handleMouseUp, true);
        window.removeEventListener('touchend', this._handleMouseUp, true);
      }

      var node = this.getNode();

      this._fire('transformend', {
        evt: e,
        target: node
      });

      if (node) {
        this._nodes.forEach(target => {
          target._fire('transformend', {
            evt: e,
            target
          });
        });
      }

      this._movingAnchorName = null;
    }
  }

  _fitNodesInto(newAttrs, evt) {
    var oldAttrs = this._getNodeRect();

    const minSize = 1;

    if (_Util.Util._inRange(newAttrs.width, -this.padding() * 2 - minSize, minSize)) {
      this.update();
      return;
    }

    if (_Util.Util._inRange(newAttrs.height, -this.padding() * 2 - minSize, minSize)) {
      this.update();
      return;
    }

    const allowNegativeScale = this.flipEnabled();
    var t = new _Util.Transform();
    t.rotate(_Global.Konva.getAngle(this.rotation()));

    if (this._movingAnchorName && newAttrs.width < 0 && this._movingAnchorName.indexOf('left') >= 0) {
      const offset = t.point({
        x: -this.padding() * 2,
        y: 0
      });
      newAttrs.x += offset.x;
      newAttrs.y += offset.y;
      newAttrs.width += this.padding() * 2;
      this._movingAnchorName = this._movingAnchorName.replace('left', 'right');
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;

      if (!allowNegativeScale) {
        this.update();
        return;
      }
    } else if (this._movingAnchorName && newAttrs.width < 0 && this._movingAnchorName.indexOf('right') >= 0) {
      const offset = t.point({
        x: this.padding() * 2,
        y: 0
      });
      this._movingAnchorName = this._movingAnchorName.replace('right', 'left');
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;
      newAttrs.width += this.padding() * 2;

      if (!allowNegativeScale) {
        this.update();
        return;
      }
    }

    if (this._movingAnchorName && newAttrs.height < 0 && this._movingAnchorName.indexOf('top') >= 0) {
      const offset = t.point({
        x: 0,
        y: -this.padding() * 2
      });
      newAttrs.x += offset.x;
      newAttrs.y += offset.y;
      this._movingAnchorName = this._movingAnchorName.replace('top', 'bottom');
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;
      newAttrs.height += this.padding() * 2;

      if (!allowNegativeScale) {
        this.update();
        return;
      }
    } else if (this._movingAnchorName && newAttrs.height < 0 && this._movingAnchorName.indexOf('bottom') >= 0) {
      const offset = t.point({
        x: 0,
        y: this.padding() * 2
      });
      this._movingAnchorName = this._movingAnchorName.replace('bottom', 'top');
      this._anchorDragOffset.x -= offset.x;
      this._anchorDragOffset.y -= offset.y;
      newAttrs.height += this.padding() * 2;

      if (!allowNegativeScale) {
        this.update();
        return;
      }
    }

    if (this.boundBoxFunc()) {
      const bounded = this.boundBoxFunc()(oldAttrs, newAttrs);

      if (bounded) {
        newAttrs = bounded;
      } else {
        _Util.Util.warn('boundBoxFunc returned falsy. You should return new bound rect from it!');
      }
    }

    const baseSize = 10000000;
    const oldTr = new _Util.Transform();
    oldTr.translate(oldAttrs.x, oldAttrs.y);
    oldTr.rotate(oldAttrs.rotation);
    oldTr.scale(oldAttrs.width / baseSize, oldAttrs.height / baseSize);
    const newTr = new _Util.Transform();
    newTr.translate(newAttrs.x, newAttrs.y);
    newTr.rotate(newAttrs.rotation);
    newTr.scale(newAttrs.width / baseSize, newAttrs.height / baseSize);
    const delta = newTr.multiply(oldTr.invert());

    this._nodes.forEach(node => {
      var _a;

      const parentTransform = node.getParent().getAbsoluteTransform();
      const localTransform = node.getTransform().copy();
      localTransform.translate(node.offsetX(), node.offsetY());
      const newLocalTransform = new _Util.Transform();
      newLocalTransform.multiply(parentTransform.copy().invert()).multiply(delta).multiply(parentTransform).multiply(localTransform);
      const attrs = newLocalTransform.decompose();
      node.setAttrs(attrs);

      this._fire('transform', {
        evt: evt,
        target: node
      });

      node._fire('transform', {
        evt: evt,
        target: node
      });

      (_a = node.getLayer()) === null || _a === void 0 ? void 0 : _a.batchDraw();
    });

    this.rotation(_Util.Util._getRotation(newAttrs.rotation));

    this._resetTransformCache();

    this.update();
    this.getLayer().batchDraw();
  }

  forceUpdate() {
    this._resetTransformCache();

    this.update();
  }

  _batchChangeChild(selector, attrs) {
    const anchor = this.findOne(selector);
    anchor.setAttrs(attrs);
  }

  update() {
    var _a;

    var attrs = this._getNodeRect();

    this.rotation(_Util.Util._getRotation(attrs.rotation));
    var width = attrs.width;
    var height = attrs.height;
    var enabledAnchors = this.enabledAnchors();
    var resizeEnabled = this.resizeEnabled();
    var padding = this.padding();
    var anchorSize = this.anchorSize();
    this.find('._anchor').forEach(node => {
      node.setAttrs({
        width: anchorSize,
        height: anchorSize,
        offsetX: anchorSize / 2,
        offsetY: anchorSize / 2,
        stroke: this.anchorStroke(),
        strokeWidth: this.anchorStrokeWidth(),
        fill: this.anchorFill(),
        cornerRadius: this.anchorCornerRadius()
      });
    });

    this._batchChangeChild('.top-left', {
      x: 0,
      y: 0,
      offsetX: anchorSize / 2 + padding,
      offsetY: anchorSize / 2 + padding,
      visible: resizeEnabled && enabledAnchors.indexOf('top-left') >= 0
    });

    this._batchChangeChild('.top-center', {
      x: width / 2,
      y: 0,
      offsetY: anchorSize / 2 + padding,
      visible: resizeEnabled && enabledAnchors.indexOf('top-center') >= 0
    });

    this._batchChangeChild('.top-right', {
      x: width,
      y: 0,
      offsetX: anchorSize / 2 - padding,
      offsetY: anchorSize / 2 + padding,
      visible: resizeEnabled && enabledAnchors.indexOf('top-right') >= 0
    });

    this._batchChangeChild('.middle-left', {
      x: 0,
      y: height / 2,
      offsetX: anchorSize / 2 + padding,
      visible: resizeEnabled && enabledAnchors.indexOf('middle-left') >= 0
    });

    this._batchChangeChild('.middle-right', {
      x: width,
      y: height / 2,
      offsetX: anchorSize / 2 - padding,
      visible: resizeEnabled && enabledAnchors.indexOf('middle-right') >= 0
    });

    this._batchChangeChild('.bottom-left', {
      x: 0,
      y: height,
      offsetX: anchorSize / 2 + padding,
      offsetY: anchorSize / 2 - padding,
      visible: resizeEnabled && enabledAnchors.indexOf('bottom-left') >= 0
    });

    this._batchChangeChild('.bottom-center', {
      x: width / 2,
      y: height,
      offsetY: anchorSize / 2 - padding,
      visible: resizeEnabled && enabledAnchors.indexOf('bottom-center') >= 0
    });

    this._batchChangeChild('.bottom-right', {
      x: width,
      y: height,
      offsetX: anchorSize / 2 - padding,
      offsetY: anchorSize / 2 - padding,
      visible: resizeEnabled && enabledAnchors.indexOf('bottom-right') >= 0
    });

    this._batchChangeChild('.rotater', {
      x: width / 2,
      y: -this.rotateAnchorOffset() * _Util.Util._sign(height) - padding,
      visible: this.rotateEnabled()
    });

    this._batchChangeChild('.back', {
      width: width,
      height: height,
      visible: this.borderEnabled(),
      stroke: this.borderStroke(),
      strokeWidth: this.borderStrokeWidth(),
      dash: this.borderDash(),
      x: 0,
      y: 0
    });

    (_a = this.getLayer()) === null || _a === void 0 ? void 0 : _a.batchDraw();
  }

  isTransforming() {
    return this._transforming;
  }

  stopTransform() {
    if (this._transforming) {
      this._removeEvents();

      var anchorNode = this.findOne('.' + this._movingAnchorName);

      if (anchorNode) {
        anchorNode.stopDrag();
      }
    }
  }

  destroy() {
    if (this.getStage() && this._cursorChange) {
      this.getStage().content && (this.getStage().content.style.cursor = '');
    }

    _Group.Group.prototype.destroy.call(this);

    this.detach();

    this._removeEvents();

    return this;
  }

  toObject() {
    return _Node.Node.prototype.toObject.call(this);
  }

}

exports.Transformer = Transformer;

function validateAnchors(val) {
  if (!(val instanceof Array)) {
    _Util.Util.warn('enabledAnchors value should be an array');
  }

  if (val instanceof Array) {
    val.forEach(function (name) {
      if (ANCHORS_NAMES.indexOf(name) === -1) {
        _Util.Util.warn('Unknown anchor name: ' + name + '. Available names are: ' + ANCHORS_NAMES.join(', '));
      }
    });
  }

  return val || [];
}

Transformer.prototype.className = 'Transformer';
(0, _Global._registerNode)(Transformer);

_Factory.Factory.addGetterSetter(Transformer, 'enabledAnchors', ANCHORS_NAMES, validateAnchors);

_Factory.Factory.addGetterSetter(Transformer, 'flipEnabled', true, (0, _Validators.getBooleanValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'resizeEnabled', true);

_Factory.Factory.addGetterSetter(Transformer, 'anchorSize', 10, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'rotateEnabled', true);

_Factory.Factory.addGetterSetter(Transformer, 'rotationSnaps', []);

_Factory.Factory.addGetterSetter(Transformer, 'rotateAnchorOffset', 50, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'rotationSnapTolerance', 5, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'borderEnabled', true);

_Factory.Factory.addGetterSetter(Transformer, 'anchorStroke', 'rgb(0, 161, 255)');

_Factory.Factory.addGetterSetter(Transformer, 'anchorStrokeWidth', 1, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'anchorFill', 'white');

_Factory.Factory.addGetterSetter(Transformer, 'anchorCornerRadius', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'borderStroke', 'rgb(0, 161, 255)');

_Factory.Factory.addGetterSetter(Transformer, 'borderStrokeWidth', 1, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'borderDash');

_Factory.Factory.addGetterSetter(Transformer, 'keepRatio', true);

_Factory.Factory.addGetterSetter(Transformer, 'centeredScaling', false);

_Factory.Factory.addGetterSetter(Transformer, 'ignoreStroke', false);

_Factory.Factory.addGetterSetter(Transformer, 'padding', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Transformer, 'node');

_Factory.Factory.addGetterSetter(Transformer, 'nodes');

_Factory.Factory.addGetterSetter(Transformer, 'boundBoxFunc');

_Factory.Factory.addGetterSetter(Transformer, 'anchorDragBoundFunc');

_Factory.Factory.addGetterSetter(Transformer, 'shouldOverdrawWholeArea', false);

_Factory.Factory.addGetterSetter(Transformer, 'useSingleNodeRotation', true);

_Factory.Factory.backCompat(Transformer, {
  lineEnabled: 'borderEnabled',
  rotateHandlerOffset: 'rotateAnchorOffset',
  enabledHandlers: 'enabledAnchors'
});

},{"../Factory.js":6,"../Global.js":8,"../Group.js":9,"../Node.js":11,"../Shape.js":13,"../Util.js":16,"../Validators.js":17,"./Rect.js":48}],56:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Wedge = void 0;

var _Factory = require("../Factory.js");

var _Shape = require("../Shape.js");

var _Global = require("../Global.js");

var _Validators = require("../Validators.js");

class Wedge extends _Shape.Shape {
  _sceneFunc(context) {
    context.beginPath();
    context.arc(0, 0, this.radius(), 0, _Global.Konva.getAngle(this.angle()), this.clockwise());
    context.lineTo(0, 0);
    context.closePath();
    context.fillStrokeShape(this);
  }

  getWidth() {
    return this.radius() * 2;
  }

  getHeight() {
    return this.radius() * 2;
  }

  setWidth(width) {
    this.radius(width / 2);
  }

  setHeight(height) {
    this.radius(height / 2);
  }

}

exports.Wedge = Wedge;
Wedge.prototype.className = 'Wedge';
Wedge.prototype._centroid = true;
Wedge.prototype._attrsAffectingSize = ['radius'];
(0, _Global._registerNode)(Wedge);

_Factory.Factory.addGetterSetter(Wedge, 'radius', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Wedge, 'angle', 0, (0, _Validators.getNumberValidator)());

_Factory.Factory.addGetterSetter(Wedge, 'clockwise', false);

_Factory.Factory.backCompat(Wedge, {
  angleDeg: 'angle',
  getAngleDeg: 'getAngle',
  setAngleDeg: 'setAngle'
});

},{"../Factory.js":6,"../Global.js":8,"../Shape.js":13,"../Validators.js":17}],57:[function(require,module,exports){
(function (global){(function (){
/*!
 * matter-js 0.18.0 by @liabru
 * http://brm.io/matter-js/
 * License MIT
 * 
 * The MIT License (MIT)
 * 
 * Copyright (c) Liam Brummitt and contributors.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Matter", [], factory);
	else if(typeof exports === 'object')
		exports["Matter"] = factory();
	else
		root["Matter"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 21);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/**
* The `Matter.Common` module contains utility functions that are common to all modules.
*
* @class Common
*/

var Common = {};

module.exports = Common;

(function() {

    Common._nextId = 0;
    Common._seed = 0;
    Common._nowStartTime = +(new Date());
    Common._warnedOnce = {};
    Common._decomp = null;
    
    /**
     * Extends the object in the first argument using the object in the second argument.
     * @method extend
     * @param {} obj
     * @param {boolean} deep
     * @return {} obj extended
     */
    Common.extend = function(obj, deep) {
        var argsStart,
            args,
            deepClone;

        if (typeof deep === 'boolean') {
            argsStart = 2;
            deepClone = deep;
        } else {
            argsStart = 1;
            deepClone = true;
        }

        for (var i = argsStart; i < arguments.length; i++) {
            var source = arguments[i];

            if (source) {
                for (var prop in source) {
                    if (deepClone && source[prop] && source[prop].constructor === Object) {
                        if (!obj[prop] || obj[prop].constructor === Object) {
                            obj[prop] = obj[prop] || {};
                            Common.extend(obj[prop], deepClone, source[prop]);
                        } else {
                            obj[prop] = source[prop];
                        }
                    } else {
                        obj[prop] = source[prop];
                    }
                }
            }
        }
        
        return obj;
    };

    /**
     * Creates a new clone of the object, if deep is true references will also be cloned.
     * @method clone
     * @param {} obj
     * @param {bool} deep
     * @return {} obj cloned
     */
    Common.clone = function(obj, deep) {
        return Common.extend({}, deep, obj);
    };

    /**
     * Returns the list of keys for the given object.
     * @method keys
     * @param {} obj
     * @return {string[]} keys
     */
    Common.keys = function(obj) {
        if (Object.keys)
            return Object.keys(obj);

        // avoid hasOwnProperty for performance
        var keys = [];
        for (var key in obj)
            keys.push(key);
        return keys;
    };

    /**
     * Returns the list of values for the given object.
     * @method values
     * @param {} obj
     * @return {array} Array of the objects property values
     */
    Common.values = function(obj) {
        var values = [];
        
        if (Object.keys) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                values.push(obj[keys[i]]);
            }
            return values;
        }
        
        // avoid hasOwnProperty for performance
        for (var key in obj)
            values.push(obj[key]);
        return values;
    };

    /**
     * Gets a value from `base` relative to the `path` string.
     * @method get
     * @param {} obj The base object
     * @param {string} path The path relative to `base`, e.g. 'Foo.Bar.baz'
     * @param {number} [begin] Path slice begin
     * @param {number} [end] Path slice end
     * @return {} The object at the given path
     */
    Common.get = function(obj, path, begin, end) {
        path = path.split('.').slice(begin, end);

        for (var i = 0; i < path.length; i += 1) {
            obj = obj[path[i]];
        }

        return obj;
    };

    /**
     * Sets a value on `base` relative to the given `path` string.
     * @method set
     * @param {} obj The base object
     * @param {string} path The path relative to `base`, e.g. 'Foo.Bar.baz'
     * @param {} val The value to set
     * @param {number} [begin] Path slice begin
     * @param {number} [end] Path slice end
     * @return {} Pass through `val` for chaining
     */
    Common.set = function(obj, path, val, begin, end) {
        var parts = path.split('.').slice(begin, end);
        Common.get(obj, path, 0, -1)[parts[parts.length - 1]] = val;
        return val;
    };

    /**
     * Shuffles the given array in-place.
     * The function uses a seeded random generator.
     * @method shuffle
     * @param {array} array
     * @return {array} array shuffled randomly
     */
    Common.shuffle = function(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Common.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };

    /**
     * Randomly chooses a value from a list with equal probability.
     * The function uses a seeded random generator.
     * @method choose
     * @param {array} choices
     * @return {object} A random choice object from the array
     */
    Common.choose = function(choices) {
        return choices[Math.floor(Common.random() * choices.length)];
    };

    /**
     * Returns true if the object is a HTMLElement, otherwise false.
     * @method isElement
     * @param {object} obj
     * @return {boolean} True if the object is a HTMLElement, otherwise false
     */
    Common.isElement = function(obj) {
        if (typeof HTMLElement !== 'undefined') {
            return obj instanceof HTMLElement;
        }

        return !!(obj && obj.nodeType && obj.nodeName);
    };

    /**
     * Returns true if the object is an array.
     * @method isArray
     * @param {object} obj
     * @return {boolean} True if the object is an array, otherwise false
     */
    Common.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    /**
     * Returns true if the object is a function.
     * @method isFunction
     * @param {object} obj
     * @return {boolean} True if the object is a function, otherwise false
     */
    Common.isFunction = function(obj) {
        return typeof obj === "function";
    };

    /**
     * Returns true if the object is a plain object.
     * @method isPlainObject
     * @param {object} obj
     * @return {boolean} True if the object is a plain object, otherwise false
     */
    Common.isPlainObject = function(obj) {
        return typeof obj === 'object' && obj.constructor === Object;
    };

    /**
     * Returns true if the object is a string.
     * @method isString
     * @param {object} obj
     * @return {boolean} True if the object is a string, otherwise false
     */
    Common.isString = function(obj) {
        return toString.call(obj) === '[object String]';
    };
    
    /**
     * Returns the given value clamped between a minimum and maximum value.
     * @method clamp
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @return {number} The value clamped between min and max inclusive
     */
    Common.clamp = function(value, min, max) {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    };
    
    /**
     * Returns the sign of the given value.
     * @method sign
     * @param {number} value
     * @return {number} -1 if negative, +1 if 0 or positive
     */
    Common.sign = function(value) {
        return value < 0 ? -1 : 1;
    };
    
    /**
     * Returns the current timestamp since the time origin (e.g. from page load).
     * The result is in milliseconds and will use high-resolution timing if available.
     * @method now
     * @return {number} the current timestamp in milliseconds
     */
    Common.now = function() {
        if (typeof window !== 'undefined' && window.performance) {
            if (window.performance.now) {
                return window.performance.now();
            } else if (window.performance.webkitNow) {
                return window.performance.webkitNow();
            }
        }

        if (Date.now) {
            return Date.now();
        }

        return (new Date()) - Common._nowStartTime;
    };
    
    /**
     * Returns a random value between a minimum and a maximum value inclusive.
     * The function uses a seeded random generator.
     * @method random
     * @param {number} min
     * @param {number} max
     * @return {number} A random number between min and max inclusive
     */
    Common.random = function(min, max) {
        min = (typeof min !== "undefined") ? min : 0;
        max = (typeof max !== "undefined") ? max : 1;
        return min + _seededRandom() * (max - min);
    };

    var _seededRandom = function() {
        // https://en.wikipedia.org/wiki/Linear_congruential_generator
        Common._seed = (Common._seed * 9301 + 49297) % 233280;
        return Common._seed / 233280;
    };

    /**
     * Converts a CSS hex colour string into an integer.
     * @method colorToNumber
     * @param {string} colorString
     * @return {number} An integer representing the CSS hex string
     */
    Common.colorToNumber = function(colorString) {
        colorString = colorString.replace('#','');

        if (colorString.length == 3) {
            colorString = colorString.charAt(0) + colorString.charAt(0)
                        + colorString.charAt(1) + colorString.charAt(1)
                        + colorString.charAt(2) + colorString.charAt(2);
        }

        return parseInt(colorString, 16);
    };

    /**
     * The console logging level to use, where each level includes all levels above and excludes the levels below.
     * The default level is 'debug' which shows all console messages.  
     *
     * Possible level values are:
     * - 0 = None
     * - 1 = Debug
     * - 2 = Info
     * - 3 = Warn
     * - 4 = Error
     * @property Common.logLevel
     * @type {Number}
     * @default 1
     */
    Common.logLevel = 1;

    /**
     * Shows a `console.log` message only if the current `Common.logLevel` allows it.
     * The message will be prefixed with 'matter-js' to make it easily identifiable.
     * @method log
     * @param ...objs {} The objects to log.
     */
    Common.log = function() {
        if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
            console.log.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    /**
     * Shows a `console.info` message only if the current `Common.logLevel` allows it.
     * The message will be prefixed with 'matter-js' to make it easily identifiable.
     * @method info
     * @param ...objs {} The objects to log.
     */
    Common.info = function() {
        if (console && Common.logLevel > 0 && Common.logLevel <= 2) {
            console.info.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    /**
     * Shows a `console.warn` message only if the current `Common.logLevel` allows it.
     * The message will be prefixed with 'matter-js' to make it easily identifiable.
     * @method warn
     * @param ...objs {} The objects to log.
     */
    Common.warn = function() {
        if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
            console.warn.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    /**
     * Uses `Common.warn` to log the given message one time only.
     * @method warnOnce
     * @param ...objs {} The objects to log.
     */
    Common.warnOnce = function() {
        var message = Array.prototype.slice.call(arguments).join(' ');

        if (!Common._warnedOnce[message]) {
            Common.warn(message);
            Common._warnedOnce[message] = true;
        }
    };

    /**
     * Shows a deprecated console warning when the function on the given object is called.
     * The target function will be replaced with a new function that first shows the warning
     * and then calls the original function.
     * @method deprecated
     * @param {object} obj The object or module
     * @param {string} name The property name of the function on obj
     * @param {string} warning The one-time message to show if the function is called
     */
    Common.deprecated = function(obj, prop, warning) {
        obj[prop] = Common.chain(function() {
            Common.warnOnce('🔅 deprecated 🔅', warning);
        }, obj[prop]);
    };

    /**
     * Returns the next unique sequential ID.
     * @method nextId
     * @return {Number} Unique sequential ID
     */
    Common.nextId = function() {
        return Common._nextId++;
    };

    /**
     * A cross browser compatible indexOf implementation.
     * @method indexOf
     * @param {array} haystack
     * @param {object} needle
     * @return {number} The position of needle in haystack, otherwise -1.
     */
    Common.indexOf = function(haystack, needle) {
        if (haystack.indexOf)
            return haystack.indexOf(needle);

        for (var i = 0; i < haystack.length; i++) {
            if (haystack[i] === needle)
                return i;
        }

        return -1;
    };

    /**
     * A cross browser compatible array map implementation.
     * @method map
     * @param {array} list
     * @param {function} func
     * @return {array} Values from list transformed by func.
     */
    Common.map = function(list, func) {
        if (list.map) {
            return list.map(func);
        }

        var mapped = [];

        for (var i = 0; i < list.length; i += 1) {
            mapped.push(func(list[i]));
        }

        return mapped;
    };

    /**
     * Takes a directed graph and returns the partially ordered set of vertices in topological order.
     * Circular dependencies are allowed.
     * @method topologicalSort
     * @param {object} graph
     * @return {array} Partially ordered set of vertices in topological order.
     */
    Common.topologicalSort = function(graph) {
        // https://github.com/mgechev/javascript-algorithms
        // Copyright (c) Minko Gechev (MIT license)
        // Modifications: tidy formatting and naming
        var result = [],
            visited = [],
            temp = [];

        for (var node in graph) {
            if (!visited[node] && !temp[node]) {
                Common._topologicalSort(node, visited, temp, graph, result);
            }
        }

        return result;
    };

    Common._topologicalSort = function(node, visited, temp, graph, result) {
        var neighbors = graph[node] || [];
        temp[node] = true;

        for (var i = 0; i < neighbors.length; i += 1) {
            var neighbor = neighbors[i];

            if (temp[neighbor]) {
                // skip circular dependencies
                continue;
            }

            if (!visited[neighbor]) {
                Common._topologicalSort(neighbor, visited, temp, graph, result);
            }
        }

        temp[node] = false;
        visited[node] = true;

        result.push(node);
    };

    /**
     * Takes _n_ functions as arguments and returns a new function that calls them in order.
     * The arguments applied when calling the new function will also be applied to every function passed.
     * The value of `this` refers to the last value returned in the chain that was not `undefined`.
     * Therefore if a passed function does not return a value, the previously returned value is maintained.
     * After all passed functions have been called the new function returns the last returned value (if any).
     * If any of the passed functions are a chain, then the chain will be flattened.
     * @method chain
     * @param ...funcs {function} The functions to chain.
     * @return {function} A new function that calls the passed functions in order.
     */
    Common.chain = function() {
        var funcs = [];

        for (var i = 0; i < arguments.length; i += 1) {
            var func = arguments[i];

            if (func._chained) {
                // flatten already chained functions
                funcs.push.apply(funcs, func._chained);
            } else {
                funcs.push(func);
            }
        }

        var chain = function() {
            // https://github.com/GoogleChrome/devtools-docs/issues/53#issuecomment-51941358
            var lastResult,
                args = new Array(arguments.length);

            for (var i = 0, l = arguments.length; i < l; i++) {
                args[i] = arguments[i];
            }

            for (i = 0; i < funcs.length; i += 1) {
                var result = funcs[i].apply(lastResult, args);

                if (typeof result !== 'undefined') {
                    lastResult = result;
                }
            }

            return lastResult;
        };

        chain._chained = funcs;

        return chain;
    };

    /**
     * Chains a function to excute before the original function on the given `path` relative to `base`.
     * See also docs for `Common.chain`.
     * @method chainPathBefore
     * @param {} base The base object
     * @param {string} path The path relative to `base`
     * @param {function} func The function to chain before the original
     * @return {function} The chained function that replaced the original
     */
    Common.chainPathBefore = function(base, path, func) {
        return Common.set(base, path, Common.chain(
            func,
            Common.get(base, path)
        ));
    };

    /**
     * Chains a function to excute after the original function on the given `path` relative to `base`.
     * See also docs for `Common.chain`.
     * @method chainPathAfter
     * @param {} base The base object
     * @param {string} path The path relative to `base`
     * @param {function} func The function to chain after the original
     * @return {function} The chained function that replaced the original
     */
    Common.chainPathAfter = function(base, path, func) {
        return Common.set(base, path, Common.chain(
            Common.get(base, path),
            func
        ));
    };

    /**
     * Provide the [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module to enable
     * concave vertex decomposition support when using `Bodies.fromVertices` e.g. `Common.setDecomp(require('poly-decomp'))`.
     * @method setDecomp
     * @param {} decomp The [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module.
     */
    Common.setDecomp = function(decomp) {
        Common._decomp = decomp;
    };

    /**
     * Returns the [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module provided through `Common.setDecomp`,
     * otherwise returns the global `decomp` if set.
     * @method getDecomp
     * @return {} The [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module if provided.
     */
    Common.getDecomp = function() {
        // get user provided decomp if set
        var decomp = Common._decomp;

        try {
            // otherwise from window global
            if (!decomp && typeof window !== 'undefined') {
                decomp = window.decomp;
            }
    
            // otherwise from node global
            if (!decomp && typeof global !== 'undefined') {
                decomp = global.decomp;
            }
        } catch (e) {
            // decomp not available
            decomp = null;
        }

        return decomp;
    };
})();


/***/ }),
/* 1 */
/***/ (function(module, exports) {

/**
* The `Matter.Bounds` module contains methods for creating and manipulating axis-aligned bounding boxes (AABB).
*
* @class Bounds
*/

var Bounds = {};

module.exports = Bounds;

(function() {

    /**
     * Creates a new axis-aligned bounding box (AABB) for the given vertices.
     * @method create
     * @param {vertices} vertices
     * @return {bounds} A new bounds object
     */
    Bounds.create = function(vertices) {
        var bounds = { 
            min: { x: 0, y: 0 }, 
            max: { x: 0, y: 0 }
        };

        if (vertices)
            Bounds.update(bounds, vertices);
        
        return bounds;
    };

    /**
     * Updates bounds using the given vertices and extends the bounds given a velocity.
     * @method update
     * @param {bounds} bounds
     * @param {vertices} vertices
     * @param {vector} velocity
     */
    Bounds.update = function(bounds, vertices, velocity) {
        bounds.min.x = Infinity;
        bounds.max.x = -Infinity;
        bounds.min.y = Infinity;
        bounds.max.y = -Infinity;

        for (var i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
            if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
            if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
            if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
        }
        
        if (velocity) {
            if (velocity.x > 0) {
                bounds.max.x += velocity.x;
            } else {
                bounds.min.x += velocity.x;
            }
            
            if (velocity.y > 0) {
                bounds.max.y += velocity.y;
            } else {
                bounds.min.y += velocity.y;
            }
        }
    };

    /**
     * Returns true if the bounds contains the given point.
     * @method contains
     * @param {bounds} bounds
     * @param {vector} point
     * @return {boolean} True if the bounds contain the point, otherwise false
     */
    Bounds.contains = function(bounds, point) {
        return point.x >= bounds.min.x && point.x <= bounds.max.x 
               && point.y >= bounds.min.y && point.y <= bounds.max.y;
    };

    /**
     * Returns true if the two bounds intersect.
     * @method overlaps
     * @param {bounds} boundsA
     * @param {bounds} boundsB
     * @return {boolean} True if the bounds overlap, otherwise false
     */
    Bounds.overlaps = function(boundsA, boundsB) {
        return (boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x
                && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y);
    };

    /**
     * Translates the bounds by the given vector.
     * @method translate
     * @param {bounds} bounds
     * @param {vector} vector
     */
    Bounds.translate = function(bounds, vector) {
        bounds.min.x += vector.x;
        bounds.max.x += vector.x;
        bounds.min.y += vector.y;
        bounds.max.y += vector.y;
    };

    /**
     * Shifts the bounds to the given position.
     * @method shift
     * @param {bounds} bounds
     * @param {vector} position
     */
    Bounds.shift = function(bounds, position) {
        var deltaX = bounds.max.x - bounds.min.x,
            deltaY = bounds.max.y - bounds.min.y;
            
        bounds.min.x = position.x;
        bounds.max.x = position.x + deltaX;
        bounds.min.y = position.y;
        bounds.max.y = position.y + deltaY;
    };
    
})();


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/**
* The `Matter.Vector` module contains methods for creating and manipulating vectors.
* Vectors are the basis of all the geometry related operations in the engine.
* A `Matter.Vector` object is of the form `{ x: 0, y: 0 }`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Vector
*/

// TODO: consider params for reusing vector objects

var Vector = {};

module.exports = Vector;

(function() {

    /**
     * Creates a new vector.
     * @method create
     * @param {number} x
     * @param {number} y
     * @return {vector} A new vector
     */
    Vector.create = function(x, y) {
        return { x: x || 0, y: y || 0 };
    };

    /**
     * Returns a new vector with `x` and `y` copied from the given `vector`.
     * @method clone
     * @param {vector} vector
     * @return {vector} A new cloned vector
     */
    Vector.clone = function(vector) {
        return { x: vector.x, y: vector.y };
    };

    /**
     * Returns the magnitude (length) of a vector.
     * @method magnitude
     * @param {vector} vector
     * @return {number} The magnitude of the vector
     */
    Vector.magnitude = function(vector) {
        return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
    };

    /**
     * Returns the magnitude (length) of a vector (therefore saving a `sqrt` operation).
     * @method magnitudeSquared
     * @param {vector} vector
     * @return {number} The squared magnitude of the vector
     */
    Vector.magnitudeSquared = function(vector) {
        return (vector.x * vector.x) + (vector.y * vector.y);
    };

    /**
     * Rotates the vector about (0, 0) by specified angle.
     * @method rotate
     * @param {vector} vector
     * @param {number} angle
     * @param {vector} [output]
     * @return {vector} The vector rotated about (0, 0)
     */
    Vector.rotate = function(vector, angle, output) {
        var cos = Math.cos(angle), sin = Math.sin(angle);
        if (!output) output = {};
        var x = vector.x * cos - vector.y * sin;
        output.y = vector.x * sin + vector.y * cos;
        output.x = x;
        return output;
    };

    /**
     * Rotates the vector about a specified point by specified angle.
     * @method rotateAbout
     * @param {vector} vector
     * @param {number} angle
     * @param {vector} point
     * @param {vector} [output]
     * @return {vector} A new vector rotated about the point
     */
    Vector.rotateAbout = function(vector, angle, point, output) {
        var cos = Math.cos(angle), sin = Math.sin(angle);
        if (!output) output = {};
        var x = point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin);
        output.y = point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos);
        output.x = x;
        return output;
    };

    /**
     * Normalises a vector (such that its magnitude is `1`).
     * @method normalise
     * @param {vector} vector
     * @return {vector} A new vector normalised
     */
    Vector.normalise = function(vector) {
        var magnitude = Vector.magnitude(vector);
        if (magnitude === 0)
            return { x: 0, y: 0 };
        return { x: vector.x / magnitude, y: vector.y / magnitude };
    };

    /**
     * Returns the dot-product of two vectors.
     * @method dot
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @return {number} The dot product of the two vectors
     */
    Vector.dot = function(vectorA, vectorB) {
        return (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y);
    };

    /**
     * Returns the cross-product of two vectors.
     * @method cross
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @return {number} The cross product of the two vectors
     */
    Vector.cross = function(vectorA, vectorB) {
        return (vectorA.x * vectorB.y) - (vectorA.y * vectorB.x);
    };

    /**
     * Returns the cross-product of three vectors.
     * @method cross3
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @param {vector} vectorC
     * @return {number} The cross product of the three vectors
     */
    Vector.cross3 = function(vectorA, vectorB, vectorC) {
        return (vectorB.x - vectorA.x) * (vectorC.y - vectorA.y) - (vectorB.y - vectorA.y) * (vectorC.x - vectorA.x);
    };

    /**
     * Adds the two vectors.
     * @method add
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @param {vector} [output]
     * @return {vector} A new vector of vectorA and vectorB added
     */
    Vector.add = function(vectorA, vectorB, output) {
        if (!output) output = {};
        output.x = vectorA.x + vectorB.x;
        output.y = vectorA.y + vectorB.y;
        return output;
    };

    /**
     * Subtracts the two vectors.
     * @method sub
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @param {vector} [output]
     * @return {vector} A new vector of vectorA and vectorB subtracted
     */
    Vector.sub = function(vectorA, vectorB, output) {
        if (!output) output = {};
        output.x = vectorA.x - vectorB.x;
        output.y = vectorA.y - vectorB.y;
        return output;
    };

    /**
     * Multiplies a vector and a scalar.
     * @method mult
     * @param {vector} vector
     * @param {number} scalar
     * @return {vector} A new vector multiplied by scalar
     */
    Vector.mult = function(vector, scalar) {
        return { x: vector.x * scalar, y: vector.y * scalar };
    };

    /**
     * Divides a vector and a scalar.
     * @method div
     * @param {vector} vector
     * @param {number} scalar
     * @return {vector} A new vector divided by scalar
     */
    Vector.div = function(vector, scalar) {
        return { x: vector.x / scalar, y: vector.y / scalar };
    };

    /**
     * Returns the perpendicular vector. Set `negate` to true for the perpendicular in the opposite direction.
     * @method perp
     * @param {vector} vector
     * @param {bool} [negate=false]
     * @return {vector} The perpendicular vector
     */
    Vector.perp = function(vector, negate) {
        negate = negate === true ? -1 : 1;
        return { x: negate * -vector.y, y: negate * vector.x };
    };

    /**
     * Negates both components of a vector such that it points in the opposite direction.
     * @method neg
     * @param {vector} vector
     * @return {vector} The negated vector
     */
    Vector.neg = function(vector) {
        return { x: -vector.x, y: -vector.y };
    };

    /**
     * Returns the angle between the vector `vectorB - vectorA` and the x-axis in radians.
     * @method angle
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @return {number} The angle in radians
     */
    Vector.angle = function(vectorA, vectorB) {
        return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
    };

    /**
     * Temporary vector pool (not thread-safe).
     * @property _temp
     * @type {vector[]}
     * @private
     */
    Vector._temp = [
        Vector.create(), Vector.create(), 
        Vector.create(), Vector.create(), 
        Vector.create(), Vector.create()
    ];

})();

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Vertices` module contains methods for creating and manipulating sets of vertices.
* A set of vertices is an array of `Matter.Vector` with additional indexing properties inserted by `Vertices.create`.
* A `Matter.Body` maintains a set of vertices to represent the shape of the object (its convex hull).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Vertices
*/

var Vertices = {};

module.exports = Vertices;

var Vector = __webpack_require__(2);
var Common = __webpack_require__(0);

(function() {

    /**
     * Creates a new set of `Matter.Body` compatible vertices.
     * The `points` argument accepts an array of `Matter.Vector` points orientated around the origin `(0, 0)`, for example:
     *
     *     [{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]
     *
     * The `Vertices.create` method returns a new array of vertices, which are similar to Matter.Vector objects,
     * but with some additional references required for efficient collision detection routines.
     *
     * Vertices must be specified in clockwise order.
     *
     * Note that the `body` argument is not optional, a `Matter.Body` reference must be provided.
     *
     * @method create
     * @param {vector[]} points
     * @param {body} body
     */
    Vertices.create = function(points, body) {
        var vertices = [];

        for (var i = 0; i < points.length; i++) {
            var point = points[i],
                vertex = {
                    x: point.x,
                    y: point.y,
                    index: i,
                    body: body,
                    isInternal: false
                };

            vertices.push(vertex);
        }

        return vertices;
    };

    /**
     * Parses a string containing ordered x y pairs separated by spaces (and optionally commas), 
     * into a `Matter.Vertices` object for the given `Matter.Body`.
     * For parsing SVG paths, see `Svg.pathToVertices`.
     * @method fromPath
     * @param {string} path
     * @param {body} body
     * @return {vertices} vertices
     */
    Vertices.fromPath = function(path, body) {
        var pathPattern = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/ig,
            points = [];

        path.replace(pathPattern, function(match, x, y) {
            points.push({ x: parseFloat(x), y: parseFloat(y) });
        });

        return Vertices.create(points, body);
    };

    /**
     * Returns the centre (centroid) of the set of vertices.
     * @method centre
     * @param {vertices} vertices
     * @return {vector} The centre point
     */
    Vertices.centre = function(vertices) {
        var area = Vertices.area(vertices, true),
            centre = { x: 0, y: 0 },
            cross,
            temp,
            j;

        for (var i = 0; i < vertices.length; i++) {
            j = (i + 1) % vertices.length;
            cross = Vector.cross(vertices[i], vertices[j]);
            temp = Vector.mult(Vector.add(vertices[i], vertices[j]), cross);
            centre = Vector.add(centre, temp);
        }

        return Vector.div(centre, 6 * area);
    };

    /**
     * Returns the average (mean) of the set of vertices.
     * @method mean
     * @param {vertices} vertices
     * @return {vector} The average point
     */
    Vertices.mean = function(vertices) {
        var average = { x: 0, y: 0 };

        for (var i = 0; i < vertices.length; i++) {
            average.x += vertices[i].x;
            average.y += vertices[i].y;
        }

        return Vector.div(average, vertices.length);
    };

    /**
     * Returns the area of the set of vertices.
     * @method area
     * @param {vertices} vertices
     * @param {bool} signed
     * @return {number} The area
     */
    Vertices.area = function(vertices, signed) {
        var area = 0,
            j = vertices.length - 1;

        for (var i = 0; i < vertices.length; i++) {
            area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
            j = i;
        }

        if (signed)
            return area / 2;

        return Math.abs(area) / 2;
    };

    /**
     * Returns the moment of inertia (second moment of area) of the set of vertices given the total mass.
     * @method inertia
     * @param {vertices} vertices
     * @param {number} mass
     * @return {number} The polygon's moment of inertia
     */
    Vertices.inertia = function(vertices, mass) {
        var numerator = 0,
            denominator = 0,
            v = vertices,
            cross,
            j;

        // find the polygon's moment of inertia, using second moment of area
        // from equations at http://www.physicsforums.com/showthread.php?t=25293
        for (var n = 0; n < v.length; n++) {
            j = (n + 1) % v.length;
            cross = Math.abs(Vector.cross(v[j], v[n]));
            numerator += cross * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
            denominator += cross;
        }

        return (mass / 6) * (numerator / denominator);
    };

    /**
     * Translates the set of vertices in-place.
     * @method translate
     * @param {vertices} vertices
     * @param {vector} vector
     * @param {number} scalar
     */
    Vertices.translate = function(vertices, vector, scalar) {
        scalar = typeof scalar !== 'undefined' ? scalar : 1;

        var verticesLength = vertices.length,
            translateX = vector.x * scalar,
            translateY = vector.y * scalar,
            i;
        
        for (i = 0; i < verticesLength; i++) {
            vertices[i].x += translateX;
            vertices[i].y += translateY;
        }

        return vertices;
    };

    /**
     * Rotates the set of vertices in-place.
     * @method rotate
     * @param {vertices} vertices
     * @param {number} angle
     * @param {vector} point
     */
    Vertices.rotate = function(vertices, angle, point) {
        if (angle === 0)
            return;

        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            pointX = point.x,
            pointY = point.y,
            verticesLength = vertices.length,
            vertex,
            dx,
            dy,
            i;

        for (i = 0; i < verticesLength; i++) {
            vertex = vertices[i];
            dx = vertex.x - pointX;
            dy = vertex.y - pointY;
            vertex.x = pointX + (dx * cos - dy * sin);
            vertex.y = pointY + (dx * sin + dy * cos);
        }

        return vertices;
    };

    /**
     * Returns `true` if the `point` is inside the set of `vertices`.
     * @method contains
     * @param {vertices} vertices
     * @param {vector} point
     * @return {boolean} True if the vertices contains point, otherwise false
     */
    Vertices.contains = function(vertices, point) {
        var pointX = point.x,
            pointY = point.y,
            verticesLength = vertices.length,
            vertex = vertices[verticesLength - 1],
            nextVertex;

        for (var i = 0; i < verticesLength; i++) {
            nextVertex = vertices[i];

            if ((pointX - vertex.x) * (nextVertex.y - vertex.y) 
                + (pointY - vertex.y) * (vertex.x - nextVertex.x) > 0) {
                return false;
            }

            vertex = nextVertex;
        }

        return true;
    };

    /**
     * Scales the vertices from a point (default is centre) in-place.
     * @method scale
     * @param {vertices} vertices
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {vector} point
     */
    Vertices.scale = function(vertices, scaleX, scaleY, point) {
        if (scaleX === 1 && scaleY === 1)
            return vertices;

        point = point || Vertices.centre(vertices);

        var vertex,
            delta;

        for (var i = 0; i < vertices.length; i++) {
            vertex = vertices[i];
            delta = Vector.sub(vertex, point);
            vertices[i].x = point.x + delta.x * scaleX;
            vertices[i].y = point.y + delta.y * scaleY;
        }

        return vertices;
    };

    /**
     * Chamfers a set of vertices by giving them rounded corners, returns a new set of vertices.
     * The radius parameter is a single number or an array to specify the radius for each vertex.
     * @method chamfer
     * @param {vertices} vertices
     * @param {number[]} radius
     * @param {number} quality
     * @param {number} qualityMin
     * @param {number} qualityMax
     */
    Vertices.chamfer = function(vertices, radius, quality, qualityMin, qualityMax) {
        if (typeof radius === 'number') {
            radius = [radius];
        } else {
            radius = radius || [8];
        }

        // quality defaults to -1, which is auto
        quality = (typeof quality !== 'undefined') ? quality : -1;
        qualityMin = qualityMin || 2;
        qualityMax = qualityMax || 14;

        var newVertices = [];

        for (var i = 0; i < vertices.length; i++) {
            var prevVertex = vertices[i - 1 >= 0 ? i - 1 : vertices.length - 1],
                vertex = vertices[i],
                nextVertex = vertices[(i + 1) % vertices.length],
                currentRadius = radius[i < radius.length ? i : radius.length - 1];

            if (currentRadius === 0) {
                newVertices.push(vertex);
                continue;
            }

            var prevNormal = Vector.normalise({ 
                x: vertex.y - prevVertex.y, 
                y: prevVertex.x - vertex.x
            });

            var nextNormal = Vector.normalise({ 
                x: nextVertex.y - vertex.y, 
                y: vertex.x - nextVertex.x
            });

            var diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2)),
                radiusVector = Vector.mult(Common.clone(prevNormal), currentRadius),
                midNormal = Vector.normalise(Vector.mult(Vector.add(prevNormal, nextNormal), 0.5)),
                scaledVertex = Vector.sub(vertex, Vector.mult(midNormal, diagonalRadius));

            var precision = quality;

            if (quality === -1) {
                // automatically decide precision
                precision = Math.pow(currentRadius, 0.32) * 1.75;
            }

            precision = Common.clamp(precision, qualityMin, qualityMax);

            // use an even value for precision, more likely to reduce axes by using symmetry
            if (precision % 2 === 1)
                precision += 1;

            var alpha = Math.acos(Vector.dot(prevNormal, nextNormal)),
                theta = alpha / precision;

            for (var j = 0; j < precision; j++) {
                newVertices.push(Vector.add(Vector.rotate(radiusVector, theta * j), scaledVertex));
            }
        }

        return newVertices;
    };

    /**
     * Sorts the input vertices into clockwise order in place.
     * @method clockwiseSort
     * @param {vertices} vertices
     * @return {vertices} vertices
     */
    Vertices.clockwiseSort = function(vertices) {
        var centre = Vertices.mean(vertices);

        vertices.sort(function(vertexA, vertexB) {
            return Vector.angle(centre, vertexA) - Vector.angle(centre, vertexB);
        });

        return vertices;
    };

    /**
     * Returns true if the vertices form a convex shape (vertices must be in clockwise order).
     * @method isConvex
     * @param {vertices} vertices
     * @return {bool} `true` if the `vertices` are convex, `false` if not (or `null` if not computable).
     */
    Vertices.isConvex = function(vertices) {
        // http://paulbourke.net/geometry/polygonmesh/
        // Copyright (c) Paul Bourke (use permitted)

        var flag = 0,
            n = vertices.length,
            i,
            j,
            k,
            z;

        if (n < 3)
            return null;

        for (i = 0; i < n; i++) {
            j = (i + 1) % n;
            k = (i + 2) % n;
            z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
            z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);

            if (z < 0) {
                flag |= 1;
            } else if (z > 0) {
                flag |= 2;
            }

            if (flag === 3) {
                return false;
            }
        }

        if (flag !== 0){
            return true;
        } else {
            return null;
        }
    };

    /**
     * Returns the convex hull of the input vertices as a new array of points.
     * @method hull
     * @param {vertices} vertices
     * @return [vertex] vertices
     */
    Vertices.hull = function(vertices) {
        // http://geomalgorithms.com/a10-_hull-1.html

        var upper = [],
            lower = [], 
            vertex,
            i;

        // sort vertices on x-axis (y-axis for ties)
        vertices = vertices.slice(0);
        vertices.sort(function(vertexA, vertexB) {
            var dx = vertexA.x - vertexB.x;
            return dx !== 0 ? dx : vertexA.y - vertexB.y;
        });

        // build lower hull
        for (i = 0; i < vertices.length; i += 1) {
            vertex = vertices[i];

            while (lower.length >= 2 
                   && Vector.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
                lower.pop();
            }

            lower.push(vertex);
        }

        // build upper hull
        for (i = vertices.length - 1; i >= 0; i -= 1) {
            vertex = vertices[i];

            while (upper.length >= 2 
                   && Vector.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
                upper.pop();
            }

            upper.push(vertex);
        }

        // concatenation of the lower and upper hulls gives the convex hull
        // omit last points because they are repeated at the beginning of the other list
        upper.pop();
        lower.pop();

        return upper.concat(lower);
    };

})();


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Events` module contains methods to fire and listen to events on other objects.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Events
*/

var Events = {};

module.exports = Events;

var Common = __webpack_require__(0);

(function() {

    /**
     * Subscribes a callback function to the given object's `eventName`.
     * @method on
     * @param {} object
     * @param {string} eventNames
     * @param {function} callback
     */
    Events.on = function(object, eventNames, callback) {
        var names = eventNames.split(' '),
            name;

        for (var i = 0; i < names.length; i++) {
            name = names[i];
            object.events = object.events || {};
            object.events[name] = object.events[name] || [];
            object.events[name].push(callback);
        }

        return callback;
    };

    /**
     * Removes the given event callback. If no callback, clears all callbacks in `eventNames`. If no `eventNames`, clears all events.
     * @method off
     * @param {} object
     * @param {string} eventNames
     * @param {function} callback
     */
    Events.off = function(object, eventNames, callback) {
        if (!eventNames) {
            object.events = {};
            return;
        }

        // handle Events.off(object, callback)
        if (typeof eventNames === 'function') {
            callback = eventNames;
            eventNames = Common.keys(object.events).join(' ');
        }

        var names = eventNames.split(' ');

        for (var i = 0; i < names.length; i++) {
            var callbacks = object.events[names[i]],
                newCallbacks = [];

            if (callback && callbacks) {
                for (var j = 0; j < callbacks.length; j++) {
                    if (callbacks[j] !== callback)
                        newCallbacks.push(callbacks[j]);
                }
            }

            object.events[names[i]] = newCallbacks;
        }
    };

    /**
     * Fires all the callbacks subscribed to the given object's `eventName`, in the order they subscribed, if any.
     * @method trigger
     * @param {} object
     * @param {string} eventNames
     * @param {} event
     */
    Events.trigger = function(object, eventNames, event) {
        var names,
            name,
            callbacks,
            eventClone;

        var events = object.events;
        
        if (events && Common.keys(events).length > 0) {
            if (!event)
                event = {};

            names = eventNames.split(' ');

            for (var i = 0; i < names.length; i++) {
                name = names[i];
                callbacks = events[name];

                if (callbacks) {
                    eventClone = Common.clone(event, false);
                    eventClone.name = name;
                    eventClone.source = object;

                    for (var j = 0; j < callbacks.length; j++) {
                        callbacks[j].apply(object, [eventClone]);
                    }
                }
            }
        }
    };

})();


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/**
* A composite is a collection of `Matter.Body`, `Matter.Constraint` and other `Matter.Composite` objects.
*
* They are a container that can represent complex objects made of multiple parts, even if they are not physically connected.
* A composite could contain anything from a single body all the way up to a whole world.
* 
* When making any changes to composites, use the included functions rather than changing their properties directly.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composite
*/

var Composite = {};

module.exports = Composite;

var Events = __webpack_require__(4);
var Common = __webpack_require__(0);
var Bounds = __webpack_require__(1);
var Body = __webpack_require__(6);

(function() {

    /**
     * Creates a new composite. The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properites section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {} [options]
     * @return {composite} A new composite
     */
    Composite.create = function(options) {
        return Common.extend({ 
            id: Common.nextId(),
            type: 'composite',
            parent: null,
            isModified: false,
            bodies: [], 
            constraints: [], 
            composites: [],
            label: 'Composite',
            plugin: {},
            cache: {
                allBodies: null,
                allConstraints: null,
                allComposites: null
            }
        }, options);
    };

    /**
     * Sets the composite's `isModified` flag. 
     * If `updateParents` is true, all parents will be set (default: false).
     * If `updateChildren` is true, all children will be set (default: false).
     * @private
     * @method setModified
     * @param {composite} composite
     * @param {boolean} isModified
     * @param {boolean} [updateParents=false]
     * @param {boolean} [updateChildren=false]
     */
    Composite.setModified = function(composite, isModified, updateParents, updateChildren) {
        composite.isModified = isModified;

        if (isModified && composite.cache) {
            composite.cache.allBodies = null;
            composite.cache.allConstraints = null;
            composite.cache.allComposites = null;
        }

        if (updateParents && composite.parent) {
            Composite.setModified(composite.parent, isModified, updateParents, updateChildren);
        }

        if (updateChildren) {
            for (var i = 0; i < composite.composites.length; i++) {
                var childComposite = composite.composites[i];
                Composite.setModified(childComposite, isModified, updateParents, updateChildren);
            }
        }
    };

    /**
     * Generic single or multi-add function. Adds a single or an array of body(s), constraint(s) or composite(s) to the given composite.
     * Triggers `beforeAdd` and `afterAdd` events on the `composite`.
     * @method add
     * @param {composite} composite
     * @param {object|array} object A single or an array of body(s), constraint(s) or composite(s)
     * @return {composite} The original composite with the objects added
     */
    Composite.add = function(composite, object) {
        var objects = [].concat(object);

        Events.trigger(composite, 'beforeAdd', { object: object });

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            switch (obj.type) {

            case 'body':
                // skip adding compound parts
                if (obj.parent !== obj) {
                    Common.warn('Composite.add: skipped adding a compound body part (you must add its parent instead)');
                    break;
                }

                Composite.addBody(composite, obj);
                break;
            case 'constraint':
                Composite.addConstraint(composite, obj);
                break;
            case 'composite':
                Composite.addComposite(composite, obj);
                break;
            case 'mouseConstraint':
                Composite.addConstraint(composite, obj.constraint);
                break;

            }
        }

        Events.trigger(composite, 'afterAdd', { object: object });

        return composite;
    };

    /**
     * Generic remove function. Removes one or many body(s), constraint(s) or a composite(s) to the given composite.
     * Optionally searching its children recursively.
     * Triggers `beforeRemove` and `afterRemove` events on the `composite`.
     * @method remove
     * @param {composite} composite
     * @param {object|array} object
     * @param {boolean} [deep=false]
     * @return {composite} The original composite with the objects removed
     */
    Composite.remove = function(composite, object, deep) {
        var objects = [].concat(object);

        Events.trigger(composite, 'beforeRemove', { object: object });

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            switch (obj.type) {

            case 'body':
                Composite.removeBody(composite, obj, deep);
                break;
            case 'constraint':
                Composite.removeConstraint(composite, obj, deep);
                break;
            case 'composite':
                Composite.removeComposite(composite, obj, deep);
                break;
            case 'mouseConstraint':
                Composite.removeConstraint(composite, obj.constraint);
                break;

            }
        }

        Events.trigger(composite, 'afterRemove', { object: object });

        return composite;
    };

    /**
     * Adds a composite to the given composite.
     * @private
     * @method addComposite
     * @param {composite} compositeA
     * @param {composite} compositeB
     * @return {composite} The original compositeA with the objects from compositeB added
     */
    Composite.addComposite = function(compositeA, compositeB) {
        compositeA.composites.push(compositeB);
        compositeB.parent = compositeA;
        Composite.setModified(compositeA, true, true, false);
        return compositeA;
    };

    /**
     * Removes a composite from the given composite, and optionally searching its children recursively.
     * @private
     * @method removeComposite
     * @param {composite} compositeA
     * @param {composite} compositeB
     * @param {boolean} [deep=false]
     * @return {composite} The original compositeA with the composite removed
     */
    Composite.removeComposite = function(compositeA, compositeB, deep) {
        var position = Common.indexOf(compositeA.composites, compositeB);
        if (position !== -1) {
            Composite.removeCompositeAt(compositeA, position);
        }

        if (deep) {
            for (var i = 0; i < compositeA.composites.length; i++){
                Composite.removeComposite(compositeA.composites[i], compositeB, true);
            }
        }

        return compositeA;
    };

    /**
     * Removes a composite from the given composite.
     * @private
     * @method removeCompositeAt
     * @param {composite} composite
     * @param {number} position
     * @return {composite} The original composite with the composite removed
     */
    Composite.removeCompositeAt = function(composite, position) {
        composite.composites.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Adds a body to the given composite.
     * @private
     * @method addBody
     * @param {composite} composite
     * @param {body} body
     * @return {composite} The original composite with the body added
     */
    Composite.addBody = function(composite, body) {
        composite.bodies.push(body);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Removes a body from the given composite, and optionally searching its children recursively.
     * @private
     * @method removeBody
     * @param {composite} composite
     * @param {body} body
     * @param {boolean} [deep=false]
     * @return {composite} The original composite with the body removed
     */
    Composite.removeBody = function(composite, body, deep) {
        var position = Common.indexOf(composite.bodies, body);
        if (position !== -1) {
            Composite.removeBodyAt(composite, position);
        }

        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeBody(composite.composites[i], body, true);
            }
        }

        return composite;
    };

    /**
     * Removes a body from the given composite.
     * @private
     * @method removeBodyAt
     * @param {composite} composite
     * @param {number} position
     * @return {composite} The original composite with the body removed
     */
    Composite.removeBodyAt = function(composite, position) {
        composite.bodies.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Adds a constraint to the given composite.
     * @private
     * @method addConstraint
     * @param {composite} composite
     * @param {constraint} constraint
     * @return {composite} The original composite with the constraint added
     */
    Composite.addConstraint = function(composite, constraint) {
        composite.constraints.push(constraint);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Removes a constraint from the given composite, and optionally searching its children recursively.
     * @private
     * @method removeConstraint
     * @param {composite} composite
     * @param {constraint} constraint
     * @param {boolean} [deep=false]
     * @return {composite} The original composite with the constraint removed
     */
    Composite.removeConstraint = function(composite, constraint, deep) {
        var position = Common.indexOf(composite.constraints, constraint);
        if (position !== -1) {
            Composite.removeConstraintAt(composite, position);
        }

        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeConstraint(composite.composites[i], constraint, true);
            }
        }

        return composite;
    };

    /**
     * Removes a body from the given composite.
     * @private
     * @method removeConstraintAt
     * @param {composite} composite
     * @param {number} position
     * @return {composite} The original composite with the constraint removed
     */
    Composite.removeConstraintAt = function(composite, position) {
        composite.constraints.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Removes all bodies, constraints and composites from the given composite.
     * Optionally clearing its children recursively.
     * @method clear
     * @param {composite} composite
     * @param {boolean} keepStatic
     * @param {boolean} [deep=false]
     */
    Composite.clear = function(composite, keepStatic, deep) {
        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.clear(composite.composites[i], keepStatic, true);
            }
        }
        
        if (keepStatic) {
            composite.bodies = composite.bodies.filter(function(body) { return body.isStatic; });
        } else {
            composite.bodies.length = 0;
        }

        composite.constraints.length = 0;
        composite.composites.length = 0;

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Returns all bodies in the given composite, including all bodies in its children, recursively.
     * @method allBodies
     * @param {composite} composite
     * @return {body[]} All the bodies
     */
    Composite.allBodies = function(composite) {
        if (composite.cache && composite.cache.allBodies) {
            return composite.cache.allBodies;
        }

        var bodies = [].concat(composite.bodies);

        for (var i = 0; i < composite.composites.length; i++)
            bodies = bodies.concat(Composite.allBodies(composite.composites[i]));

        if (composite.cache) {
            composite.cache.allBodies = bodies;
        }

        return bodies;
    };

    /**
     * Returns all constraints in the given composite, including all constraints in its children, recursively.
     * @method allConstraints
     * @param {composite} composite
     * @return {constraint[]} All the constraints
     */
    Composite.allConstraints = function(composite) {
        if (composite.cache && composite.cache.allConstraints) {
            return composite.cache.allConstraints;
        }

        var constraints = [].concat(composite.constraints);

        for (var i = 0; i < composite.composites.length; i++)
            constraints = constraints.concat(Composite.allConstraints(composite.composites[i]));

        if (composite.cache) {
            composite.cache.allConstraints = constraints;
        }

        return constraints;
    };

    /**
     * Returns all composites in the given composite, including all composites in its children, recursively.
     * @method allComposites
     * @param {composite} composite
     * @return {composite[]} All the composites
     */
    Composite.allComposites = function(composite) {
        if (composite.cache && composite.cache.allComposites) {
            return composite.cache.allComposites;
        }

        var composites = [].concat(composite.composites);

        for (var i = 0; i < composite.composites.length; i++)
            composites = composites.concat(Composite.allComposites(composite.composites[i]));

        if (composite.cache) {
            composite.cache.allComposites = composites;
        }

        return composites;
    };

    /**
     * Searches the composite recursively for an object matching the type and id supplied, null if not found.
     * @method get
     * @param {composite} composite
     * @param {number} id
     * @param {string} type
     * @return {object} The requested object, if found
     */
    Composite.get = function(composite, id, type) {
        var objects,
            object;

        switch (type) {
        case 'body':
            objects = Composite.allBodies(composite);
            break;
        case 'constraint':
            objects = Composite.allConstraints(composite);
            break;
        case 'composite':
            objects = Composite.allComposites(composite).concat(composite);
            break;
        }

        if (!objects)
            return null;

        object = objects.filter(function(object) { 
            return object.id.toString() === id.toString(); 
        });

        return object.length === 0 ? null : object[0];
    };

    /**
     * Moves the given object(s) from compositeA to compositeB (equal to a remove followed by an add).
     * @method move
     * @param {compositeA} compositeA
     * @param {object[]} objects
     * @param {compositeB} compositeB
     * @return {composite} Returns compositeA
     */
    Composite.move = function(compositeA, objects, compositeB) {
        Composite.remove(compositeA, objects);
        Composite.add(compositeB, objects);
        return compositeA;
    };

    /**
     * Assigns new ids for all objects in the composite, recursively.
     * @method rebase
     * @param {composite} composite
     * @return {composite} Returns composite
     */
    Composite.rebase = function(composite) {
        var objects = Composite.allBodies(composite)
            .concat(Composite.allConstraints(composite))
            .concat(Composite.allComposites(composite));

        for (var i = 0; i < objects.length; i++) {
            objects[i].id = Common.nextId();
        }

        return composite;
    };

    /**
     * Translates all children in the composite by a given vector relative to their current positions, 
     * without imparting any velocity.
     * @method translate
     * @param {composite} composite
     * @param {vector} translation
     * @param {bool} [recursive=true]
     */
    Composite.translate = function(composite, translation, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            Body.translate(bodies[i], translation);
        }

        return composite;
    };

    /**
     * Rotates all children in the composite by a given angle about the given point, without imparting any angular velocity.
     * @method rotate
     * @param {composite} composite
     * @param {number} rotation
     * @param {vector} point
     * @param {bool} [recursive=true]
     */
    Composite.rotate = function(composite, rotation, point, recursive) {
        var cos = Math.cos(rotation),
            sin = Math.sin(rotation),
            bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.position.x - point.x,
                dy = body.position.y - point.y;
                
            Body.setPosition(body, {
                x: point.x + (dx * cos - dy * sin),
                y: point.y + (dx * sin + dy * cos)
            });

            Body.rotate(body, rotation);
        }

        return composite;
    };

    /**
     * Scales all children in the composite, including updating physical properties (mass, area, axes, inertia), from a world-space point.
     * @method scale
     * @param {composite} composite
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {vector} point
     * @param {bool} [recursive=true]
     */
    Composite.scale = function(composite, scaleX, scaleY, point, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.position.x - point.x,
                dy = body.position.y - point.y;
                
            Body.setPosition(body, {
                x: point.x + dx * scaleX,
                y: point.y + dy * scaleY
            });

            Body.scale(body, scaleX, scaleY);
        }

        return composite;
    };

    /**
     * Returns the union of the bounds of all of the composite's bodies.
     * @method bounds
     * @param {composite} composite The composite.
     * @returns {bounds} The composite bounds.
     */
    Composite.bounds = function(composite) {
        var bodies = Composite.allBodies(composite),
            vertices = [];

        for (var i = 0; i < bodies.length; i += 1) {
            var body = bodies[i];
            vertices.push(body.bounds.min, body.bounds.max);
        }

        return Bounds.create(vertices);
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired when a call to `Composite.add` is made, before objects have been added.
    *
    * @event beforeAdd
    * @param {} event An event object
    * @param {} event.object The object(s) to be added (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a call to `Composite.add` is made, after objects have been added.
    *
    * @event afterAdd
    * @param {} event An event object
    * @param {} event.object The object(s) that have been added (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a call to `Composite.remove` is made, before objects have been removed.
    *
    * @event beforeRemove
    * @param {} event An event object
    * @param {} event.object The object(s) to be removed (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a call to `Composite.remove` is made, after objects have been removed.
    *
    * @event afterRemove
    * @param {} event An event object
    * @param {} event.object The object(s) that have been removed (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` uniquely identifying number generated in `Composite.create` by `Common.nextId`.
     *
     * @property id
     * @type number
     */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "composite"
     * @readOnly
     */

    /**
     * An arbitrary `String` name to help the user identify and manage composites.
     *
     * @property label
     * @type string
     * @default "Composite"
     */

    /**
     * A flag that specifies whether the composite has been modified during the current step.
     * This is automatically managed when bodies, constraints or composites are added or removed.
     *
     * @property isModified
     * @type boolean
     * @default false
     */

    /**
     * The `Composite` that is the parent of this composite. It is automatically managed by the `Matter.Composite` methods.
     *
     * @property parent
     * @type composite
     * @default null
     */

    /**
     * An array of `Body` that are _direct_ children of this composite.
     * To add or remove bodies you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
     * If you wish to recursively find all descendants, you should use the `Composite.allBodies` method.
     *
     * @property bodies
     * @type body[]
     * @default []
     */

    /**
     * An array of `Constraint` that are _direct_ children of this composite.
     * To add or remove constraints you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
     * If you wish to recursively find all descendants, you should use the `Composite.allConstraints` method.
     *
     * @property constraints
     * @type constraint[]
     * @default []
     */

    /**
     * An array of `Composite` that are _direct_ children of this composite.
     * To add or remove composites you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
     * If you wish to recursively find all descendants, you should use the `Composite.allComposites` method.
     *
     * @property composites
     * @type composite[]
     * @default []
     */

    /**
     * An object reserved for storing plugin-specific properties.
     *
     * @property plugin
     * @type {}
     */

    /**
     * An object used for storing cached results for performance reasons.
     * This is used internally only and is automatically managed.
     *
     * @private
     * @property cache
     * @type {}
     */

})();


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Body` module contains methods for creating and manipulating body models.
* A `Matter.Body` is a rigid body that can be simulated by a `Matter.Engine`.
* Factories for commonly used body configurations (such as rectangles, circles and other polygons) can be found in the module `Matter.Bodies`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

* @class Body
*/

var Body = {};

module.exports = Body;

var Vertices = __webpack_require__(3);
var Vector = __webpack_require__(2);
var Sleeping = __webpack_require__(7);
var Render = __webpack_require__(16);
var Common = __webpack_require__(0);
var Bounds = __webpack_require__(1);
var Axes = __webpack_require__(11);

(function() {

    Body._inertiaScale = 4;
    Body._nextCollidingGroupId = 1;
    Body._nextNonCollidingGroupId = -1;
    Body._nextCategory = 0x0001;

    /**
     * Creates a new rigid body model. The options parameter is an object that specifies any properties you wish to override the defaults.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * Vertices must be specified in clockwise order.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {} options
     * @return {body} body
     */
    Body.create = function(options) {
        var defaults = {
            id: Common.nextId(),
            type: 'body',
            label: 'Body',
            parts: [],
            plugin: {},
            angle: 0,
            vertices: Vertices.fromPath('L 0 0 L 40 0 L 40 40 L 0 40'),
            position: { x: 0, y: 0 },
            force: { x: 0, y: 0 },
            torque: 0,
            positionImpulse: { x: 0, y: 0 },
            constraintImpulse: { x: 0, y: 0, angle: 0 },
            totalContacts: 0,
            speed: 0,
            angularSpeed: 0,
            velocity: { x: 0, y: 0 },
            angularVelocity: 0,
            isSensor: false,
            isStatic: false,
            isSleeping: false,
            motion: 0,
            sleepThreshold: 60,
            density: 0.001,
            restitution: 0,
            friction: 0.1,
            frictionStatic: 0.5,
            frictionAir: 0.01,
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            },
            slop: 0.05,
            timeScale: 1,
            render: {
                visible: true,
                opacity: 1,
                strokeStyle: null,
                fillStyle: null,
                lineWidth: null,
                sprite: {
                    xScale: 1,
                    yScale: 1,
                    xOffset: 0,
                    yOffset: 0
                }
            },
            events: null,
            bounds: null,
            chamfer: null,
            circleRadius: 0,
            positionPrev: null,
            anglePrev: 0,
            parent: null,
            axes: null,
            area: 0,
            mass: 0,
            inertia: 0,
            _original: null
        };

        var body = Common.extend(defaults, options);

        _initProperties(body, options);

        return body;
    };

    /**
     * Returns the next unique group index for which bodies will collide.
     * If `isNonColliding` is `true`, returns the next unique group index for which bodies will _not_ collide.
     * See `body.collisionFilter` for more information.
     * @method nextGroup
     * @param {bool} [isNonColliding=false]
     * @return {Number} Unique group index
     */
    Body.nextGroup = function(isNonColliding) {
        if (isNonColliding)
            return Body._nextNonCollidingGroupId--;

        return Body._nextCollidingGroupId++;
    };

    /**
     * Returns the next unique category bitfield (starting after the initial default category `0x0001`).
     * There are 32 available. See `body.collisionFilter` for more information.
     * @method nextCategory
     * @return {Number} Unique category bitfield
     */
    Body.nextCategory = function() {
        Body._nextCategory = Body._nextCategory << 1;
        return Body._nextCategory;
    };

    /**
     * Initialises body properties.
     * @method _initProperties
     * @private
     * @param {body} body
     * @param {} [options]
     */
    var _initProperties = function(body, options) {
        options = options || {};

        // init required properties (order is important)
        Body.set(body, {
            bounds: body.bounds || Bounds.create(body.vertices),
            positionPrev: body.positionPrev || Vector.clone(body.position),
            anglePrev: body.anglePrev || body.angle,
            vertices: body.vertices,
            parts: body.parts || [body],
            isStatic: body.isStatic,
            isSleeping: body.isSleeping,
            parent: body.parent || body
        });

        Vertices.rotate(body.vertices, body.angle, body.position);
        Axes.rotate(body.axes, body.angle);
        Bounds.update(body.bounds, body.vertices, body.velocity);

        // allow options to override the automatically calculated properties
        Body.set(body, {
            axes: options.axes || body.axes,
            area: options.area || body.area,
            mass: options.mass || body.mass,
            inertia: options.inertia || body.inertia
        });

        // render properties
        var defaultFillStyle = (body.isStatic ? '#14151f' : Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1'])),
            defaultStrokeStyle = body.isStatic ? '#555' : '#ccc',
            defaultLineWidth = body.isStatic && body.render.fillStyle === null ? 1 : 0;
        body.render.fillStyle = body.render.fillStyle || defaultFillStyle;
        body.render.strokeStyle = body.render.strokeStyle || defaultStrokeStyle;
        body.render.lineWidth = body.render.lineWidth || defaultLineWidth;
        body.render.sprite.xOffset += -(body.bounds.min.x - body.position.x) / (body.bounds.max.x - body.bounds.min.x);
        body.render.sprite.yOffset += -(body.bounds.min.y - body.position.y) / (body.bounds.max.y - body.bounds.min.y);
    };

    /**
     * Given a property and a value (or map of), sets the property(s) on the body, using the appropriate setter functions if they exist.
     * Prefer to use the actual setter functions in performance critical situations.
     * @method set
     * @param {body} body
     * @param {} settings A property name (or map of properties and values) to set on the body.
     * @param {} value The value to set if `settings` is a single property name.
     */
    Body.set = function(body, settings, value) {
        var property;

        if (typeof settings === 'string') {
            property = settings;
            settings = {};
            settings[property] = value;
        }

        for (property in settings) {
            if (!Object.prototype.hasOwnProperty.call(settings, property))
                continue;

            value = settings[property];
            switch (property) {

            case 'isStatic':
                Body.setStatic(body, value);
                break;
            case 'isSleeping':
                Sleeping.set(body, value);
                break;
            case 'mass':
                Body.setMass(body, value);
                break;
            case 'density':
                Body.setDensity(body, value);
                break;
            case 'inertia':
                Body.setInertia(body, value);
                break;
            case 'vertices':
                Body.setVertices(body, value);
                break;
            case 'position':
                Body.setPosition(body, value);
                break;
            case 'angle':
                Body.setAngle(body, value);
                break;
            case 'velocity':
                Body.setVelocity(body, value);
                break;
            case 'angularVelocity':
                Body.setAngularVelocity(body, value);
                break;
            case 'parts':
                Body.setParts(body, value);
                break;
            case 'centre':
                Body.setCentre(body, value);
                break;
            default:
                body[property] = value;

            }
        }
    };

    /**
     * Sets the body as static, including isStatic flag and setting mass and inertia to Infinity.
     * @method setStatic
     * @param {body} body
     * @param {bool} isStatic
     */
    Body.setStatic = function(body, isStatic) {
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.isStatic = isStatic;

            if (isStatic) {
                part._original = {
                    restitution: part.restitution,
                    friction: part.friction,
                    mass: part.mass,
                    inertia: part.inertia,
                    density: part.density,
                    inverseMass: part.inverseMass,
                    inverseInertia: part.inverseInertia
                };

                part.restitution = 0;
                part.friction = 1;
                part.mass = part.inertia = part.density = Infinity;
                part.inverseMass = part.inverseInertia = 0;

                part.positionPrev.x = part.position.x;
                part.positionPrev.y = part.position.y;
                part.anglePrev = part.angle;
                part.angularVelocity = 0;
                part.speed = 0;
                part.angularSpeed = 0;
                part.motion = 0;
            } else if (part._original) {
                part.restitution = part._original.restitution;
                part.friction = part._original.friction;
                part.mass = part._original.mass;
                part.inertia = part._original.inertia;
                part.density = part._original.density;
                part.inverseMass = part._original.inverseMass;
                part.inverseInertia = part._original.inverseInertia;

                part._original = null;
            }
        }
    };

    /**
     * Sets the mass of the body. Inverse mass, density and inertia are automatically updated to reflect the change.
     * @method setMass
     * @param {body} body
     * @param {number} mass
     */
    Body.setMass = function(body, mass) {
        var moment = body.inertia / (body.mass / 6);
        body.inertia = moment * (mass / 6);
        body.inverseInertia = 1 / body.inertia;

        body.mass = mass;
        body.inverseMass = 1 / body.mass;
        body.density = body.mass / body.area;
    };

    /**
     * Sets the density of the body. Mass and inertia are automatically updated to reflect the change.
     * @method setDensity
     * @param {body} body
     * @param {number} density
     */
    Body.setDensity = function(body, density) {
        Body.setMass(body, density * body.area);
        body.density = density;
    };

    /**
     * Sets the moment of inertia (i.e. second moment of area) of the body. 
     * Inverse inertia is automatically updated to reflect the change. Mass is not changed.
     * @method setInertia
     * @param {body} body
     * @param {number} inertia
     */
    Body.setInertia = function(body, inertia) {
        body.inertia = inertia;
        body.inverseInertia = 1 / body.inertia;
    };

    /**
     * Sets the body's vertices and updates body properties accordingly, including inertia, area and mass (with respect to `body.density`).
     * Vertices will be automatically transformed to be orientated around their centre of mass as the origin.
     * They are then automatically translated to world space based on `body.position`.
     *
     * The `vertices` argument should be passed as an array of `Matter.Vector` points (or a `Matter.Vertices` array).
     * Vertices must form a convex hull, concave hulls are not supported.
     *
     * @method setVertices
     * @param {body} body
     * @param {vector[]} vertices
     */
    Body.setVertices = function(body, vertices) {
        // change vertices
        if (vertices[0].body === body) {
            body.vertices = vertices;
        } else {
            body.vertices = Vertices.create(vertices, body);
        }

        // update properties
        body.axes = Axes.fromVertices(body.vertices);
        body.area = Vertices.area(body.vertices);
        Body.setMass(body, body.density * body.area);

        // orient vertices around the centre of mass at origin (0, 0)
        var centre = Vertices.centre(body.vertices);
        Vertices.translate(body.vertices, centre, -1);

        // update inertia while vertices are at origin (0, 0)
        Body.setInertia(body, Body._inertiaScale * Vertices.inertia(body.vertices, body.mass));

        // update geometry
        Vertices.translate(body.vertices, body.position);
        Bounds.update(body.bounds, body.vertices, body.velocity);
    };

    /**
     * Sets the parts of the `body` and updates mass, inertia and centroid.
     * Each part will have its parent set to `body`.
     * By default the convex hull will be automatically computed and set on `body`, unless `autoHull` is set to `false.`
     * Note that this method will ensure that the first part in `body.parts` will always be the `body`.
     * @method setParts
     * @param {body} body
     * @param [body] parts
     * @param {bool} [autoHull=true]
     */
    Body.setParts = function(body, parts, autoHull) {
        var i;

        // add all the parts, ensuring that the first part is always the parent body
        parts = parts.slice(0);
        body.parts.length = 0;
        body.parts.push(body);
        body.parent = body;

        for (i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part !== body) {
                part.parent = body;
                body.parts.push(part);
            }
        }

        if (body.parts.length === 1)
            return;

        autoHull = typeof autoHull !== 'undefined' ? autoHull : true;

        // find the convex hull of all parts to set on the parent body
        if (autoHull) {
            var vertices = [];
            for (i = 0; i < parts.length; i++) {
                vertices = vertices.concat(parts[i].vertices);
            }

            Vertices.clockwiseSort(vertices);

            var hull = Vertices.hull(vertices),
                hullCentre = Vertices.centre(hull);

            Body.setVertices(body, hull);
            Vertices.translate(body.vertices, hullCentre);
        }

        // sum the properties of all compound parts of the parent body
        var total = Body._totalProperties(body);

        body.area = total.area;
        body.parent = body;
        body.position.x = total.centre.x;
        body.position.y = total.centre.y;
        body.positionPrev.x = total.centre.x;
        body.positionPrev.y = total.centre.y;

        Body.setMass(body, total.mass);
        Body.setInertia(body, total.inertia);
        Body.setPosition(body, total.centre);
    };

    /**
     * Set the centre of mass of the body. 
     * The `centre` is a vector in world-space unless `relative` is set, in which case it is a translation.
     * The centre of mass is the point the body rotates about and can be used to simulate non-uniform density.
     * This is equal to moving `body.position` but not the `body.vertices`.
     * Invalid if the `centre` falls outside the body's convex hull.
     * @method setCentre
     * @param {body} body
     * @param {vector} centre
     * @param {bool} relative
     */
    Body.setCentre = function(body, centre, relative) {
        if (!relative) {
            body.positionPrev.x = centre.x - (body.position.x - body.positionPrev.x);
            body.positionPrev.y = centre.y - (body.position.y - body.positionPrev.y);
            body.position.x = centre.x;
            body.position.y = centre.y;
        } else {
            body.positionPrev.x += centre.x;
            body.positionPrev.y += centre.y;
            body.position.x += centre.x;
            body.position.y += centre.y;
        }
    };

    /**
     * Sets the position of the body instantly. Velocity, angle, force etc. are unchanged.
     * @method setPosition
     * @param {body} body
     * @param {vector} position
     */
    Body.setPosition = function(body, position) {
        var delta = Vector.sub(position, body.position);
        body.positionPrev.x += delta.x;
        body.positionPrev.y += delta.y;

        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.position.x += delta.x;
            part.position.y += delta.y;
            Vertices.translate(part.vertices, delta);
            Bounds.update(part.bounds, part.vertices, body.velocity);
        }
    };

    /**
     * Sets the angle of the body instantly. Angular velocity, position, force etc. are unchanged.
     * @method setAngle
     * @param {body} body
     * @param {number} angle
     */
    Body.setAngle = function(body, angle) {
        var delta = angle - body.angle;
        body.anglePrev += delta;

        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.angle += delta;
            Vertices.rotate(part.vertices, delta, body.position);
            Axes.rotate(part.axes, delta);
            Bounds.update(part.bounds, part.vertices, body.velocity);
            if (i > 0) {
                Vector.rotateAbout(part.position, delta, body.position, part.position);
            }
        }
    };

    /**
     * Sets the linear velocity of the body instantly. Position, angle, force etc. are unchanged. See also `Body.applyForce`.
     * @method setVelocity
     * @param {body} body
     * @param {vector} velocity
     */
    Body.setVelocity = function(body, velocity) {
        body.positionPrev.x = body.position.x - velocity.x;
        body.positionPrev.y = body.position.y - velocity.y;
        body.velocity.x = velocity.x;
        body.velocity.y = velocity.y;
        body.speed = Vector.magnitude(body.velocity);
    };

    /**
     * Sets the angular velocity of the body instantly. Position, angle, force etc. are unchanged. See also `Body.applyForce`.
     * @method setAngularVelocity
     * @param {body} body
     * @param {number} velocity
     */
    Body.setAngularVelocity = function(body, velocity) {
        body.anglePrev = body.angle - velocity;
        body.angularVelocity = velocity;
        body.angularSpeed = Math.abs(body.angularVelocity);
    };

    /**
     * Moves a body by a given vector relative to its current position, without imparting any velocity.
     * @method translate
     * @param {body} body
     * @param {vector} translation
     */
    Body.translate = function(body, translation) {
        Body.setPosition(body, Vector.add(body.position, translation));
    };

    /**
     * Rotates a body by a given angle relative to its current angle, without imparting any angular velocity.
     * @method rotate
     * @param {body} body
     * @param {number} rotation
     * @param {vector} [point]
     */
    Body.rotate = function(body, rotation, point) {
        if (!point) {
            Body.setAngle(body, body.angle + rotation);
        } else {
            var cos = Math.cos(rotation),
                sin = Math.sin(rotation),
                dx = body.position.x - point.x,
                dy = body.position.y - point.y;
                
            Body.setPosition(body, {
                x: point.x + (dx * cos - dy * sin),
                y: point.y + (dx * sin + dy * cos)
            });

            Body.setAngle(body, body.angle + rotation);
        }
    };

    /**
     * Scales the body, including updating physical properties (mass, area, axes, inertia), from a world-space point (default is body centre).
     * @method scale
     * @param {body} body
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {vector} [point]
     */
    Body.scale = function(body, scaleX, scaleY, point) {
        var totalArea = 0,
            totalInertia = 0;

        point = point || body.position;

        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];

            // scale vertices
            Vertices.scale(part.vertices, scaleX, scaleY, point);

            // update properties
            part.axes = Axes.fromVertices(part.vertices);
            part.area = Vertices.area(part.vertices);
            Body.setMass(part, body.density * part.area);

            // update inertia (requires vertices to be at origin)
            Vertices.translate(part.vertices, { x: -part.position.x, y: -part.position.y });
            Body.setInertia(part, Body._inertiaScale * Vertices.inertia(part.vertices, part.mass));
            Vertices.translate(part.vertices, { x: part.position.x, y: part.position.y });

            if (i > 0) {
                totalArea += part.area;
                totalInertia += part.inertia;
            }

            // scale position
            part.position.x = point.x + (part.position.x - point.x) * scaleX;
            part.position.y = point.y + (part.position.y - point.y) * scaleY;

            // update bounds
            Bounds.update(part.bounds, part.vertices, body.velocity);
        }

        // handle parent body
        if (body.parts.length > 1) {
            body.area = totalArea;

            if (!body.isStatic) {
                Body.setMass(body, body.density * totalArea);
                Body.setInertia(body, totalInertia);
            }
        }

        // handle circles
        if (body.circleRadius) { 
            if (scaleX === scaleY) {
                body.circleRadius *= scaleX;
            } else {
                // body is no longer a circle
                body.circleRadius = null;
            }
        }
    };

    /**
     * Performs a simulation step for the given `body`, including updating position and angle using Verlet integration.
     * @method update
     * @param {body} body
     * @param {number} deltaTime
     * @param {number} timeScale
     * @param {number} correction
     */
    Body.update = function(body, deltaTime, timeScale, correction) {
        var deltaTimeSquared = Math.pow(deltaTime * timeScale * body.timeScale, 2);

        // from the previous step
        var frictionAir = 1 - body.frictionAir * timeScale * body.timeScale,
            velocityPrevX = body.position.x - body.positionPrev.x,
            velocityPrevY = body.position.y - body.positionPrev.y;

        // update velocity with Verlet integration
        body.velocity.x = (velocityPrevX * frictionAir * correction) + (body.force.x / body.mass) * deltaTimeSquared;
        body.velocity.y = (velocityPrevY * frictionAir * correction) + (body.force.y / body.mass) * deltaTimeSquared;

        body.positionPrev.x = body.position.x;
        body.positionPrev.y = body.position.y;
        body.position.x += body.velocity.x;
        body.position.y += body.velocity.y;

        // update angular velocity with Verlet integration
        body.angularVelocity = ((body.angle - body.anglePrev) * frictionAir * correction) + (body.torque / body.inertia) * deltaTimeSquared;
        body.anglePrev = body.angle;
        body.angle += body.angularVelocity;

        // track speed and acceleration
        body.speed = Vector.magnitude(body.velocity);
        body.angularSpeed = Math.abs(body.angularVelocity);

        // transform the body geometry
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];

            Vertices.translate(part.vertices, body.velocity);
            
            if (i > 0) {
                part.position.x += body.velocity.x;
                part.position.y += body.velocity.y;
            }

            if (body.angularVelocity !== 0) {
                Vertices.rotate(part.vertices, body.angularVelocity, body.position);
                Axes.rotate(part.axes, body.angularVelocity);
                if (i > 0) {
                    Vector.rotateAbout(part.position, body.angularVelocity, body.position, part.position);
                }
            }

            Bounds.update(part.bounds, part.vertices, body.velocity);
        }
    };

    /**
     * Applies a force to a body from a given world-space position, including resulting torque.
     * @method applyForce
     * @param {body} body
     * @param {vector} position
     * @param {vector} force
     */
    Body.applyForce = function(body, position, force) {
        body.force.x += force.x;
        body.force.y += force.y;
        var offset = { x: position.x - body.position.x, y: position.y - body.position.y };
        body.torque += offset.x * force.y - offset.y * force.x;
    };

    /**
     * Returns the sums of the properties of all compound parts of the parent body.
     * @method _totalProperties
     * @private
     * @param {body} body
     * @return {}
     */
    Body._totalProperties = function(body) {
        // from equations at:
        // https://ecourses.ou.edu/cgi-bin/ebook.cgi?doc=&topic=st&chap_sec=07.2&page=theory
        // http://output.to/sideway/default.asp?qno=121100087

        var properties = {
            mass: 0,
            area: 0,
            inertia: 0,
            centre: { x: 0, y: 0 }
        };

        // sum the properties of all compound parts of the parent body
        for (var i = body.parts.length === 1 ? 0 : 1; i < body.parts.length; i++) {
            var part = body.parts[i],
                mass = part.mass !== Infinity ? part.mass : 1;

            properties.mass += mass;
            properties.area += part.area;
            properties.inertia += part.inertia;
            properties.centre = Vector.add(properties.centre, Vector.mult(part.position, mass));
        }

        properties.centre = Vector.div(properties.centre, properties.mass);

        return properties;
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired when a body starts sleeping (where `this` is the body).
    *
    * @event sleepStart
    * @this {body} The body that has started sleeping
    * @param {} event An event object
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a body ends sleeping (where `this` is the body).
    *
    * @event sleepEnd
    * @this {body} The body that has ended sleeping
    * @param {} event An event object
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` uniquely identifying number generated in `Body.create` by `Common.nextId`.
     *
     * @property id
     * @type number
     */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "body"
     * @readOnly
     */

    /**
     * An arbitrary `String` name to help the user identify and manage bodies.
     *
     * @property label
     * @type string
     * @default "Body"
     */

    /**
     * An array of bodies that make up this body. 
     * The first body in the array must always be a self reference to the current body instance.
     * All bodies in the `parts` array together form a single rigid compound body.
     * Parts are allowed to overlap, have gaps or holes or even form concave bodies.
     * Parts themselves should never be added to a `World`, only the parent body should be.
     * Use `Body.setParts` when setting parts to ensure correct updates of all properties.
     *
     * @property parts
     * @type body[]
     */

    /**
     * An object reserved for storing plugin-specific properties.
     *
     * @property plugin
     * @type {}
     */

    /**
     * A self reference if the body is _not_ a part of another body.
     * Otherwise this is a reference to the body that this is a part of.
     * See `body.parts`.
     *
     * @property parent
     * @type body
     */

    /**
     * A `Number` specifying the angle of the body, in radians.
     *
     * @property angle
     * @type number
     * @default 0
     */

    /**
     * An array of `Vector` objects that specify the convex hull of the rigid body.
     * These should be provided about the origin `(0, 0)`. E.g.
     *
     *     [{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]
     *
     * When passed via `Body.create`, the vertices are translated relative to `body.position` (i.e. world-space, and constantly updated by `Body.update` during simulation).
     * The `Vector` objects are also augmented with additional properties required for efficient collision detection. 
     *
     * Other properties such as `inertia` and `bounds` are automatically calculated from the passed vertices (unless provided via `options`).
     * Concave hulls are not currently supported. The module `Matter.Vertices` contains useful methods for working with vertices.
     *
     * @property vertices
     * @type vector[]
     */

    /**
     * A `Vector` that specifies the current world-space position of the body.
     *
     * @property position
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Vector` that specifies the force to apply in the current step. It is zeroed after every `Body.update`. See also `Body.applyForce`.
     *
     * @property force
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Number` that specifies the torque (turning force) to apply in the current step. It is zeroed after every `Body.update`.
     *
     * @property torque
     * @type number
     * @default 0
     */

    /**
     * A `Number` that _measures_ the current speed of the body after the last `Body.update`. It is read-only and always positive (it's the magnitude of `body.velocity`).
     *
     * @readOnly
     * @property speed
     * @type number
     * @default 0
     */

    /**
     * A `Number` that _measures_ the current angular speed of the body after the last `Body.update`. It is read-only and always positive (it's the magnitude of `body.angularVelocity`).
     *
     * @readOnly
     * @property angularSpeed
     * @type number
     * @default 0
     */

    /**
     * A `Vector` that _measures_ the current velocity of the body after the last `Body.update`. It is read-only. 
     * If you need to modify a body's velocity directly, you should either apply a force or simply change the body's `position` (as the engine uses position-Verlet integration).
     *
     * @readOnly
     * @property velocity
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Number` that _measures_ the current angular velocity of the body after the last `Body.update`. It is read-only. 
     * If you need to modify a body's angular velocity directly, you should apply a torque or simply change the body's `angle` (as the engine uses position-Verlet integration).
     *
     * @readOnly
     * @property angularVelocity
     * @type number
     * @default 0
     */

    /**
     * A flag that indicates whether a body is considered static. A static body can never change position or angle and is completely fixed.
     * If you need to set a body as static after its creation, you should use `Body.setStatic` as this requires more than just setting this flag.
     *
     * @property isStatic
     * @type boolean
     * @default false
     */

    /**
     * A flag that indicates whether a body is a sensor. Sensor triggers collision events, but doesn't react with colliding body physically.
     *
     * @property isSensor
     * @type boolean
     * @default false
     */

    /**
     * A flag that indicates whether the body is considered sleeping. A sleeping body acts similar to a static body, except it is only temporary and can be awoken.
     * If you need to set a body as sleeping, you should use `Sleeping.set` as this requires more than just setting this flag.
     *
     * @property isSleeping
     * @type boolean
     * @default false
     */

    /**
     * A `Number` that _measures_ the amount of movement a body currently has (a combination of `speed` and `angularSpeed`). It is read-only and always positive.
     * It is used and updated by the `Matter.Sleeping` module during simulation to decide if a body has come to rest.
     *
     * @readOnly
     * @property motion
     * @type number
     * @default 0
     */

    /**
     * A `Number` that defines the number of updates in which this body must have near-zero velocity before it is set as sleeping by the `Matter.Sleeping` module (if sleeping is enabled by the engine).
     *
     * @property sleepThreshold
     * @type number
     * @default 60
     */

    /**
     * A `Number` that defines the density of the body, that is its mass per unit area.
     * If you pass the density via `Body.create` the `mass` property is automatically calculated for you based on the size (area) of the object.
     * This is generally preferable to simply setting mass and allows for more intuitive definition of materials (e.g. rock has a higher density than wood).
     *
     * @property density
     * @type number
     * @default 0.001
     */

    /**
     * A `Number` that defines the mass of the body, although it may be more appropriate to specify the `density` property instead.
     * If you modify this value, you must also modify the `body.inverseMass` property (`1 / mass`).
     *
     * @property mass
     * @type number
     */

    /**
     * A `Number` that defines the inverse mass of the body (`1 / mass`).
     * If you modify this value, you must also modify the `body.mass` property.
     *
     * @property inverseMass
     * @type number
     */

    /**
     * A `Number` that defines the moment of inertia (i.e. second moment of area) of the body.
     * It is automatically calculated from the given convex hull (`vertices` array) and density in `Body.create`.
     * If you modify this value, you must also modify the `body.inverseInertia` property (`1 / inertia`).
     *
     * @property inertia
     * @type number
     */

    /**
     * A `Number` that defines the inverse moment of inertia of the body (`1 / inertia`).
     * If you modify this value, you must also modify the `body.inertia` property.
     *
     * @property inverseInertia
     * @type number
     */

    /**
     * A `Number` that defines the restitution (elasticity) of the body. The value is always positive and is in the range `(0, 1)`.
     * A value of `0` means collisions may be perfectly inelastic and no bouncing may occur. 
     * A value of `0.8` means the body may bounce back with approximately 80% of its kinetic energy.
     * Note that collision response is based on _pairs_ of bodies, and that `restitution` values are _combined_ with the following formula:
     *
     *     Math.max(bodyA.restitution, bodyB.restitution)
     *
     * @property restitution
     * @type number
     * @default 0
     */

    /**
     * A `Number` that defines the friction of the body. The value is always positive and is in the range `(0, 1)`.
     * A value of `0` means that the body may slide indefinitely.
     * A value of `1` means the body may come to a stop almost instantly after a force is applied.
     *
     * The effects of the value may be non-linear. 
     * High values may be unstable depending on the body.
     * The engine uses a Coulomb friction model including static and kinetic friction.
     * Note that collision response is based on _pairs_ of bodies, and that `friction` values are _combined_ with the following formula:
     *
     *     Math.min(bodyA.friction, bodyB.friction)
     *
     * @property friction
     * @type number
     * @default 0.1
     */

    /**
     * A `Number` that defines the static friction of the body (in the Coulomb friction model). 
     * A value of `0` means the body will never 'stick' when it is nearly stationary and only dynamic `friction` is used.
     * The higher the value (e.g. `10`), the more force it will take to initially get the body moving when nearly stationary.
     * This value is multiplied with the `friction` property to make it easier to change `friction` and maintain an appropriate amount of static friction.
     *
     * @property frictionStatic
     * @type number
     * @default 0.5
     */

    /**
     * A `Number` that defines the air friction of the body (air resistance). 
     * A value of `0` means the body will never slow as it moves through space.
     * The higher the value, the faster a body slows when moving through space.
     * The effects of the value are non-linear. 
     *
     * @property frictionAir
     * @type number
     * @default 0.01
     */

    /**
     * An `Object` that specifies the collision filtering properties of this body.
     *
     * Collisions between two bodies will obey the following rules:
     * - If the two bodies have the same non-zero value of `collisionFilter.group`,
     *   they will always collide if the value is positive, and they will never collide
     *   if the value is negative.
     * - If the two bodies have different values of `collisionFilter.group` or if one
     *   (or both) of the bodies has a value of 0, then the category/mask rules apply as follows:
     *
     * Each body belongs to a collision category, given by `collisionFilter.category`. This
     * value is used as a bit field and the category should have only one bit set, meaning that
     * the value of this property is a power of two in the range [1, 2^31]. Thus, there are 32
     * different collision categories available.
     *
     * Each body also defines a collision bitmask, given by `collisionFilter.mask` which specifies
     * the categories it collides with (the value is the bitwise AND value of all these categories).
     *
     * Using the category/mask rules, two bodies `A` and `B` collide if each includes the other's
     * category in its mask, i.e. `(categoryA & maskB) !== 0` and `(categoryB & maskA) !== 0`
     * are both true.
     *
     * @property collisionFilter
     * @type object
     */

    /**
     * An Integer `Number`, that specifies the collision group this body belongs to.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter.group
     * @type object
     * @default 0
     */

    /**
     * A bit field that specifies the collision category this body belongs to.
     * The category value should have only one bit set, for example `0x0001`.
     * This means there are up to 32 unique collision categories available.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter.category
     * @type object
     * @default 1
     */

    /**
     * A bit mask that specifies the collision categories this body may collide with.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter.mask
     * @type object
     * @default -1
     */

    /**
     * A `Number` that specifies a tolerance on how far a body is allowed to 'sink' or rotate into other bodies.
     * Avoid changing this value unless you understand the purpose of `slop` in physics engines.
     * The default should generally suffice, although very large bodies may require larger values for stable stacking.
     *
     * @property slop
     * @type number
     * @default 0.05
     */

    /**
     * A `Number` that allows per-body time scaling, e.g. a force-field where bodies inside are in slow-motion, while others are at full speed.
     *
     * @property timeScale
     * @type number
     * @default 1
     */

    /**
     * An `Object` that defines the rendering properties to be consumed by the module `Matter.Render`.
     *
     * @property render
     * @type object
     */

    /**
     * A flag that indicates if the body should be rendered.
     *
     * @property render.visible
     * @type boolean
     * @default true
     */

    /**
     * Sets the opacity to use when rendering.
     *
     * @property render.opacity
     * @type number
     * @default 1
    */

    /**
     * An `Object` that defines the sprite properties to use when rendering, if any.
     *
     * @property render.sprite
     * @type object
     */

    /**
     * An `String` that defines the path to the image to use as the sprite texture, if any.
     *
     * @property render.sprite.texture
     * @type string
     */
     
    /**
     * A `Number` that defines the scaling in the x-axis for the sprite, if any.
     *
     * @property render.sprite.xScale
     * @type number
     * @default 1
     */

    /**
     * A `Number` that defines the scaling in the y-axis for the sprite, if any.
     *
     * @property render.sprite.yScale
     * @type number
     * @default 1
     */

    /**
      * A `Number` that defines the offset in the x-axis for the sprite (normalised by texture width).
      *
      * @property render.sprite.xOffset
      * @type number
      * @default 0
      */

    /**
      * A `Number` that defines the offset in the y-axis for the sprite (normalised by texture height).
      *
      * @property render.sprite.yOffset
      * @type number
      * @default 0
      */

    /**
     * A `Number` that defines the line width to use when rendering the body outline (if a sprite is not defined).
     * A value of `0` means no outline will be rendered.
     *
     * @property render.lineWidth
     * @type number
     * @default 0
     */

    /**
     * A `String` that defines the fill style to use when rendering the body (if a sprite is not defined).
     * It is the same as when using a canvas, so it accepts CSS style property values.
     *
     * @property render.fillStyle
     * @type string
     * @default a random colour
     */

    /**
     * A `String` that defines the stroke style to use when rendering the body outline (if a sprite is not defined).
     * It is the same as when using a canvas, so it accepts CSS style property values.
     *
     * @property render.strokeStyle
     * @type string
     * @default a random colour
     */

    /**
     * An array of unique axis vectors (edge normals) used for collision detection.
     * These are automatically calculated from the given convex hull (`vertices` array) in `Body.create`.
     * They are constantly updated by `Body.update` during the simulation.
     *
     * @property axes
     * @type vector[]
     */
     
    /**
     * A `Number` that _measures_ the area of the body's convex hull, calculated at creation by `Body.create`.
     *
     * @property area
     * @type string
     * @default 
     */

    /**
     * A `Bounds` object that defines the AABB region for the body.
     * It is automatically calculated from the given convex hull (`vertices` array) in `Body.create` and constantly updated by `Body.update` during simulation.
     *
     * @property bounds
     * @type bounds
     */

})();


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Sleeping` module contains methods to manage the sleeping state of bodies.
*
* @class Sleeping
*/

var Sleeping = {};

module.exports = Sleeping;

var Events = __webpack_require__(4);

(function() {

    Sleeping._motionWakeThreshold = 0.18;
    Sleeping._motionSleepThreshold = 0.08;
    Sleeping._minBias = 0.9;

    /**
     * Puts bodies to sleep or wakes them up depending on their motion.
     * @method update
     * @param {body[]} bodies
     * @param {number} timeScale
     */
    Sleeping.update = function(bodies, timeScale) {
        var timeFactor = timeScale * timeScale * timeScale;

        // update bodies sleeping status
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                motion = body.speed * body.speed + body.angularSpeed * body.angularSpeed;

            // wake up bodies if they have a force applied
            if (body.force.x !== 0 || body.force.y !== 0) {
                Sleeping.set(body, false);
                continue;
            }

            var minMotion = Math.min(body.motion, motion),
                maxMotion = Math.max(body.motion, motion);
        
            // biased average motion estimation between frames
            body.motion = Sleeping._minBias * minMotion + (1 - Sleeping._minBias) * maxMotion;
            
            if (body.sleepThreshold > 0 && body.motion < Sleeping._motionSleepThreshold * timeFactor) {
                body.sleepCounter += 1;
                
                if (body.sleepCounter >= body.sleepThreshold)
                    Sleeping.set(body, true);
            } else if (body.sleepCounter > 0) {
                body.sleepCounter -= 1;
            }
        }
    };

    /**
     * Given a set of colliding pairs, wakes the sleeping bodies involved.
     * @method afterCollisions
     * @param {pair[]} pairs
     * @param {number} timeScale
     */
    Sleeping.afterCollisions = function(pairs, timeScale) {
        var timeFactor = timeScale * timeScale * timeScale;

        // wake up bodies involved in collisions
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            
            // don't wake inactive pairs
            if (!pair.isActive)
                continue;

            var collision = pair.collision,
                bodyA = collision.bodyA.parent, 
                bodyB = collision.bodyB.parent;
        
            // don't wake if at least one body is static
            if ((bodyA.isSleeping && bodyB.isSleeping) || bodyA.isStatic || bodyB.isStatic)
                continue;
        
            if (bodyA.isSleeping || bodyB.isSleeping) {
                var sleepingBody = (bodyA.isSleeping && !bodyA.isStatic) ? bodyA : bodyB,
                    movingBody = sleepingBody === bodyA ? bodyB : bodyA;

                if (!sleepingBody.isStatic && movingBody.motion > Sleeping._motionWakeThreshold * timeFactor) {
                    Sleeping.set(sleepingBody, false);
                }
            }
        }
    };
  
    /**
     * Set a body as sleeping or awake.
     * @method set
     * @param {body} body
     * @param {boolean} isSleeping
     */
    Sleeping.set = function(body, isSleeping) {
        var wasSleeping = body.isSleeping;

        if (isSleeping) {
            body.isSleeping = true;
            body.sleepCounter = body.sleepThreshold;

            body.positionImpulse.x = 0;
            body.positionImpulse.y = 0;

            body.positionPrev.x = body.position.x;
            body.positionPrev.y = body.position.y;

            body.anglePrev = body.angle;
            body.speed = 0;
            body.angularSpeed = 0;
            body.motion = 0;

            if (!wasSleeping) {
                Events.trigger(body, 'sleepStart');
            }
        } else {
            body.isSleeping = false;
            body.sleepCounter = 0;

            if (wasSleeping) {
                Events.trigger(body, 'sleepEnd');
            }
        }
    };

})();


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Collision` module contains methods for detecting collisions between a given pair of bodies.
*
* For efficient detection between a list of bodies, see `Matter.Detector` and `Matter.Query`.
*
* See `Matter.Engine` for collision events.
*
* @class Collision
*/

var Collision = {};

module.exports = Collision;

var Vertices = __webpack_require__(3);
var Pair = __webpack_require__(9);

(function() {
    var _supports = [];

    var _overlapAB = {
        overlap: 0,
        axis: null
    };

    var _overlapBA = {
        overlap: 0,
        axis: null
    };

    /**
     * Creates a new collision record.
     * @method create
     * @param {body} bodyA The first body part represented by the collision record
     * @param {body} bodyB The second body part represented by the collision record
     * @return {collision} A new collision record
     */
    Collision.create = function(bodyA, bodyB) {
        return { 
            pair: null,
            collided: false,
            bodyA: bodyA,
            bodyB: bodyB,
            parentA: bodyA.parent,
            parentB: bodyB.parent,
            depth: 0,
            normal: { x: 0, y: 0 },
            tangent: { x: 0, y: 0 },
            penetration: { x: 0, y: 0 },
            supports: []
        };
    };

    /**
     * Detect collision between two bodies.
     * @method collides
     * @param {body} bodyA
     * @param {body} bodyB
     * @param {pairs} [pairs] Optionally reuse collision records from existing pairs.
     * @return {collision|null} A collision record if detected, otherwise null
     */
    Collision.collides = function(bodyA, bodyB, pairs) {
        Collision._overlapAxes(_overlapAB, bodyA.vertices, bodyB.vertices, bodyA.axes);

        if (_overlapAB.overlap <= 0) {
            return null;
        }

        Collision._overlapAxes(_overlapBA, bodyB.vertices, bodyA.vertices, bodyB.axes);

        if (_overlapBA.overlap <= 0) {
            return null;
        }

        // reuse collision records for gc efficiency
        var pair = pairs && pairs.table[Pair.id(bodyA, bodyB)],
            collision;

        if (!pair) {
            collision = Collision.create(bodyA, bodyB);
            collision.collided = true;
            collision.bodyA = bodyA.id < bodyB.id ? bodyA : bodyB;
            collision.bodyB = bodyA.id < bodyB.id ? bodyB : bodyA;
            collision.parentA = collision.bodyA.parent;
            collision.parentB = collision.bodyB.parent;
        } else {
            collision = pair.collision;
        }

        bodyA = collision.bodyA;
        bodyB = collision.bodyB;

        var minOverlap;

        if (_overlapAB.overlap < _overlapBA.overlap) {
            minOverlap = _overlapAB;
        } else {
            minOverlap = _overlapBA;
        }

        var normal = collision.normal,
            supports = collision.supports,
            minAxis = minOverlap.axis,
            minAxisX = minAxis.x,
            minAxisY = minAxis.y;

        // ensure normal is facing away from bodyA
        if (minAxisX * (bodyB.position.x - bodyA.position.x) + minAxisY * (bodyB.position.y - bodyA.position.y) < 0) {
            normal.x = minAxisX;
            normal.y = minAxisY;
        } else {
            normal.x = -minAxisX;
            normal.y = -minAxisY;
        }
        
        collision.tangent.x = -normal.y;
        collision.tangent.y = normal.x;

        collision.depth = minOverlap.overlap;

        collision.penetration.x = normal.x * collision.depth;
        collision.penetration.y = normal.y * collision.depth;

        // find support points, there is always either exactly one or two
        var supportsB = Collision._findSupports(bodyA, bodyB, normal, 1),
            supportCount = 0;

        // find the supports from bodyB that are inside bodyA
        if (Vertices.contains(bodyA.vertices, supportsB[0])) {
            supports[supportCount++] = supportsB[0];
        }

        if (Vertices.contains(bodyA.vertices, supportsB[1])) {
            supports[supportCount++] = supportsB[1];
        }

        // find the supports from bodyA that are inside bodyB
        if (supportCount < 2) {
            var supportsA = Collision._findSupports(bodyB, bodyA, normal, -1);

            if (Vertices.contains(bodyB.vertices, supportsA[0])) {
                supports[supportCount++] = supportsA[0];
            }

            if (supportCount < 2 && Vertices.contains(bodyB.vertices, supportsA[1])) {
                supports[supportCount++] = supportsA[1];
            }
        }

        // account for the edge case of overlapping but no vertex containment
        if (supportCount === 0) {
            supports[supportCount++] = supportsB[0];
        }

        // update supports array size
        supports.length = supportCount;

        return collision;
    };

    /**
     * Find the overlap between two sets of vertices.
     * @method _overlapAxes
     * @private
     * @param {object} result
     * @param {vertices} verticesA
     * @param {vertices} verticesB
     * @param {axes} axes
     */
    Collision._overlapAxes = function(result, verticesA, verticesB, axes) {
        var verticesALength = verticesA.length,
            verticesBLength = verticesB.length,
            verticesAX = verticesA[0].x,
            verticesAY = verticesA[0].y,
            verticesBX = verticesB[0].x,
            verticesBY = verticesB[0].y,
            axesLength = axes.length,
            overlapMin = Number.MAX_VALUE,
            overlapAxisNumber = 0,
            overlap,
            overlapAB,
            overlapBA,
            dot,
            i,
            j;

        for (i = 0; i < axesLength; i++) {
            var axis = axes[i],
                axisX = axis.x,
                axisY = axis.y,
                minA = verticesAX * axisX + verticesAY * axisY,
                minB = verticesBX * axisX + verticesBY * axisY,
                maxA = minA,
                maxB = minB;
            
            for (j = 1; j < verticesALength; j += 1) {
                dot = verticesA[j].x * axisX + verticesA[j].y * axisY;

                if (dot > maxA) { 
                    maxA = dot;
                } else if (dot < minA) { 
                    minA = dot;
                }
            }

            for (j = 1; j < verticesBLength; j += 1) {
                dot = verticesB[j].x * axisX + verticesB[j].y * axisY;

                if (dot > maxB) { 
                    maxB = dot;
                } else if (dot < minB) { 
                    minB = dot;
                }
            }

            overlapAB = maxA - minB;
            overlapBA = maxB - minA;
            overlap = overlapAB < overlapBA ? overlapAB : overlapBA;

            if (overlap < overlapMin) {
                overlapMin = overlap;
                overlapAxisNumber = i;

                if (overlap <= 0) {
                    // can not be intersecting
                    break;
                }
            } 
        }

        result.axis = axes[overlapAxisNumber];
        result.overlap = overlapMin;
    };

    /**
     * Projects vertices on an axis and returns an interval.
     * @method _projectToAxis
     * @private
     * @param {} projection
     * @param {} vertices
     * @param {} axis
     */
    Collision._projectToAxis = function(projection, vertices, axis) {
        var min = vertices[0].x * axis.x + vertices[0].y * axis.y,
            max = min;

        for (var i = 1; i < vertices.length; i += 1) {
            var dot = vertices[i].x * axis.x + vertices[i].y * axis.y;

            if (dot > max) { 
                max = dot; 
            } else if (dot < min) { 
                min = dot; 
            }
        }

        projection.min = min;
        projection.max = max;
    };

    /**
     * Finds supporting vertices given two bodies along a given direction using hill-climbing.
     * @method _findSupports
     * @private
     * @param {body} bodyA
     * @param {body} bodyB
     * @param {vector} normal
     * @param {number} direction
     * @return [vector]
     */
    Collision._findSupports = function(bodyA, bodyB, normal, direction) {
        var vertices = bodyB.vertices,
            verticesLength = vertices.length,
            bodyAPositionX = bodyA.position.x,
            bodyAPositionY = bodyA.position.y,
            normalX = normal.x * direction,
            normalY = normal.y * direction,
            nearestDistance = Number.MAX_VALUE,
            vertexA,
            vertexB,
            vertexC,
            distance,
            j;

        // find deepest vertex relative to the axis
        for (j = 0; j < verticesLength; j += 1) {
            vertexB = vertices[j];
            distance = normalX * (bodyAPositionX - vertexB.x) + normalY * (bodyAPositionY - vertexB.y);

            // convex hill-climbing
            if (distance < nearestDistance) {
                nearestDistance = distance;
                vertexA = vertexB;
            }
        }

        // measure next vertex
        vertexC = vertices[(verticesLength + vertexA.index - 1) % verticesLength];
        nearestDistance = normalX * (bodyAPositionX - vertexC.x) + normalY * (bodyAPositionY - vertexC.y);

        // compare with previous vertex
        vertexB = vertices[(vertexA.index + 1) % verticesLength];
        if (normalX * (bodyAPositionX - vertexB.x) + normalY * (bodyAPositionY - vertexB.y) < nearestDistance) {
            _supports[0] = vertexA;
            _supports[1] = vertexB;

            return _supports;
        }

        _supports[0] = vertexA;
        _supports[1] = vertexC;

        return _supports;
    };

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * A reference to the pair using this collision record, if there is one.
     *
     * @property pair
     * @type {pair|null}
     * @default null
     */

    /**
     * A flag that indicates if the bodies were colliding when the collision was last updated.
     * 
     * @property collided
     * @type boolean
     * @default false
     */

    /**
     * The first body part represented by the collision (see also `collision.parentA`).
     * 
     * @property bodyA
     * @type body
     */

    /**
     * The second body part represented by the collision (see also `collision.parentB`).
     * 
     * @property bodyB
     * @type body
     */

    /**
     * The first body represented by the collision (i.e. `collision.bodyA.parent`).
     * 
     * @property parentA
     * @type body
     */

    /**
     * The second body represented by the collision (i.e. `collision.bodyB.parent`).
     * 
     * @property parentB
     * @type body
     */

    /**
     * A `Number` that represents the minimum separating distance between the bodies along the collision normal.
     *
     * @readOnly
     * @property depth
     * @type number
     * @default 0
     */

    /**
     * A normalised `Vector` that represents the direction between the bodies that provides the minimum separating distance.
     *
     * @property normal
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A normalised `Vector` that is the tangent direction to the collision normal.
     *
     * @property tangent
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Vector` that represents the direction and depth of the collision.
     *
     * @property penetration
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * An array of body vertices that represent the support points in the collision.
     * These are the deepest vertices (along the collision normal) of each body that are contained by the other body's vertices.
     *
     * @property supports
     * @type vector[]
     * @default []
     */

})();


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Pair` module contains methods for creating and manipulating collision pairs.
*
* @class Pair
*/

var Pair = {};

module.exports = Pair;

var Contact = __webpack_require__(17);

(function() {
    
    /**
     * Creates a pair.
     * @method create
     * @param {collision} collision
     * @param {number} timestamp
     * @return {pair} A new pair
     */
    Pair.create = function(collision, timestamp) {
        var bodyA = collision.bodyA,
            bodyB = collision.bodyB;

        var pair = {
            id: Pair.id(bodyA, bodyB),
            bodyA: bodyA,
            bodyB: bodyB,
            collision: collision,
            contacts: [],
            activeContacts: [],
            separation: 0,
            isActive: true,
            confirmedActive: true,
            isSensor: bodyA.isSensor || bodyB.isSensor,
            timeCreated: timestamp,
            timeUpdated: timestamp,
            inverseMass: 0,
            friction: 0,
            frictionStatic: 0,
            restitution: 0,
            slop: 0
        };

        Pair.update(pair, collision, timestamp);

        return pair;
    };

    /**
     * Updates a pair given a collision.
     * @method update
     * @param {pair} pair
     * @param {collision} collision
     * @param {number} timestamp
     */
    Pair.update = function(pair, collision, timestamp) {
        var contacts = pair.contacts,
            supports = collision.supports,
            activeContacts = pair.activeContacts,
            parentA = collision.parentA,
            parentB = collision.parentB,
            parentAVerticesLength = parentA.vertices.length;
        
        pair.isActive = true;
        pair.timeUpdated = timestamp;
        pair.collision = collision;
        pair.separation = collision.depth;
        pair.inverseMass = parentA.inverseMass + parentB.inverseMass;
        pair.friction = parentA.friction < parentB.friction ? parentA.friction : parentB.friction;
        pair.frictionStatic = parentA.frictionStatic > parentB.frictionStatic ? parentA.frictionStatic : parentB.frictionStatic;
        pair.restitution = parentA.restitution > parentB.restitution ? parentA.restitution : parentB.restitution;
        pair.slop = parentA.slop > parentB.slop ? parentA.slop : parentB.slop;

        collision.pair = pair;
        activeContacts.length = 0;
        
        for (var i = 0; i < supports.length; i++) {
            var support = supports[i],
                contactId = support.body === parentA ? support.index : parentAVerticesLength + support.index,
                contact = contacts[contactId];

            if (contact) {
                activeContacts.push(contact);
            } else {
                activeContacts.push(contacts[contactId] = Contact.create(support));
            }
        }
    };
    
    /**
     * Set a pair as active or inactive.
     * @method setActive
     * @param {pair} pair
     * @param {bool} isActive
     * @param {number} timestamp
     */
    Pair.setActive = function(pair, isActive, timestamp) {
        if (isActive) {
            pair.isActive = true;
            pair.timeUpdated = timestamp;
        } else {
            pair.isActive = false;
            pair.activeContacts.length = 0;
        }
    };

    /**
     * Get the id for the given pair.
     * @method id
     * @param {body} bodyA
     * @param {body} bodyB
     * @return {string} Unique pairId
     */
    Pair.id = function(bodyA, bodyB) {
        if (bodyA.id < bodyB.id) {
            return 'A' + bodyA.id + 'B' + bodyB.id;
        } else {
            return 'A' + bodyB.id + 'B' + bodyA.id;
        }
    };

})();


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Constraint` module contains methods for creating and manipulating constraints.
* Constraints are used for specifying that a fixed distance must be maintained between two bodies (or a body and a fixed world-space position).
* The stiffness of constraints can be modified to create springs or elastic.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Constraint
*/

var Constraint = {};

module.exports = Constraint;

var Vertices = __webpack_require__(3);
var Vector = __webpack_require__(2);
var Sleeping = __webpack_require__(7);
var Bounds = __webpack_require__(1);
var Axes = __webpack_require__(11);
var Common = __webpack_require__(0);

(function() {

    Constraint._warming = 0.4;
    Constraint._torqueDampen = 1;
    Constraint._minLength = 0.000001;

    /**
     * Creates a new constraint.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * To simulate a revolute constraint (or pin joint) set `length: 0` and a high `stiffness` value (e.g. `0.7` or above).
     * If the constraint is unstable, try lowering the `stiffness` value and / or increasing `engine.constraintIterations`.
     * For compound bodies, constraints must be applied to the parent body (not one of its parts).
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {} options
     * @return {constraint} constraint
     */
    Constraint.create = function(options) {
        var constraint = options;

        // if bodies defined but no points, use body centre
        if (constraint.bodyA && !constraint.pointA)
            constraint.pointA = { x: 0, y: 0 };
        if (constraint.bodyB && !constraint.pointB)
            constraint.pointB = { x: 0, y: 0 };

        // calculate static length using initial world space points
        var initialPointA = constraint.bodyA ? Vector.add(constraint.bodyA.position, constraint.pointA) : constraint.pointA,
            initialPointB = constraint.bodyB ? Vector.add(constraint.bodyB.position, constraint.pointB) : constraint.pointB,
            length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));
    
        constraint.length = typeof constraint.length !== 'undefined' ? constraint.length : length;

        // option defaults
        constraint.id = constraint.id || Common.nextId();
        constraint.label = constraint.label || 'Constraint';
        constraint.type = 'constraint';
        constraint.stiffness = constraint.stiffness || (constraint.length > 0 ? 1 : 0.7);
        constraint.damping = constraint.damping || 0;
        constraint.angularStiffness = constraint.angularStiffness || 0;
        constraint.angleA = constraint.bodyA ? constraint.bodyA.angle : constraint.angleA;
        constraint.angleB = constraint.bodyB ? constraint.bodyB.angle : constraint.angleB;
        constraint.plugin = {};

        // render
        var render = {
            visible: true,
            lineWidth: 2,
            strokeStyle: '#ffffff',
            type: 'line',
            anchors: true
        };

        if (constraint.length === 0 && constraint.stiffness > 0.1) {
            render.type = 'pin';
            render.anchors = false;
        } else if (constraint.stiffness < 0.9) {
            render.type = 'spring';
        }

        constraint.render = Common.extend(render, constraint.render);

        return constraint;
    };

    /**
     * Prepares for solving by constraint warming.
     * @private
     * @method preSolveAll
     * @param {body[]} bodies
     */
    Constraint.preSolveAll = function(bodies) {
        for (var i = 0; i < bodies.length; i += 1) {
            var body = bodies[i],
                impulse = body.constraintImpulse;

            if (body.isStatic || (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0)) {
                continue;
            }

            body.position.x += impulse.x;
            body.position.y += impulse.y;
            body.angle += impulse.angle;
        }
    };

    /**
     * Solves all constraints in a list of collisions.
     * @private
     * @method solveAll
     * @param {constraint[]} constraints
     * @param {number} timeScale
     */
    Constraint.solveAll = function(constraints, timeScale) {
        // Solve fixed constraints first.
        for (var i = 0; i < constraints.length; i += 1) {
            var constraint = constraints[i],
                fixedA = !constraint.bodyA || (constraint.bodyA && constraint.bodyA.isStatic),
                fixedB = !constraint.bodyB || (constraint.bodyB && constraint.bodyB.isStatic);

            if (fixedA || fixedB) {
                Constraint.solve(constraints[i], timeScale);
            }
        }

        // Solve free constraints last.
        for (i = 0; i < constraints.length; i += 1) {
            constraint = constraints[i];
            fixedA = !constraint.bodyA || (constraint.bodyA && constraint.bodyA.isStatic);
            fixedB = !constraint.bodyB || (constraint.bodyB && constraint.bodyB.isStatic);

            if (!fixedA && !fixedB) {
                Constraint.solve(constraints[i], timeScale);
            }
        }
    };

    /**
     * Solves a distance constraint with Gauss-Siedel method.
     * @private
     * @method solve
     * @param {constraint} constraint
     * @param {number} timeScale
     */
    Constraint.solve = function(constraint, timeScale) {
        var bodyA = constraint.bodyA,
            bodyB = constraint.bodyB,
            pointA = constraint.pointA,
            pointB = constraint.pointB;

        if (!bodyA && !bodyB)
            return;

        // update reference angle
        if (bodyA && !bodyA.isStatic) {
            Vector.rotate(pointA, bodyA.angle - constraint.angleA, pointA);
            constraint.angleA = bodyA.angle;
        }
        
        // update reference angle
        if (bodyB && !bodyB.isStatic) {
            Vector.rotate(pointB, bodyB.angle - constraint.angleB, pointB);
            constraint.angleB = bodyB.angle;
        }

        var pointAWorld = pointA,
            pointBWorld = pointB;

        if (bodyA) pointAWorld = Vector.add(bodyA.position, pointA);
        if (bodyB) pointBWorld = Vector.add(bodyB.position, pointB);

        if (!pointAWorld || !pointBWorld)
            return;

        var delta = Vector.sub(pointAWorld, pointBWorld),
            currentLength = Vector.magnitude(delta);

        // prevent singularity
        if (currentLength < Constraint._minLength) {
            currentLength = Constraint._minLength;
        }

        // solve distance constraint with Gauss-Siedel method
        var difference = (currentLength - constraint.length) / currentLength,
            stiffness = constraint.stiffness < 1 ? constraint.stiffness * timeScale : constraint.stiffness,
            force = Vector.mult(delta, difference * stiffness),
            massTotal = (bodyA ? bodyA.inverseMass : 0) + (bodyB ? bodyB.inverseMass : 0),
            inertiaTotal = (bodyA ? bodyA.inverseInertia : 0) + (bodyB ? bodyB.inverseInertia : 0),
            resistanceTotal = massTotal + inertiaTotal,
            torque,
            share,
            normal,
            normalVelocity,
            relativeVelocity;

        if (constraint.damping) {
            var zero = Vector.create();
            normal = Vector.div(delta, currentLength);

            relativeVelocity = Vector.sub(
                bodyB && Vector.sub(bodyB.position, bodyB.positionPrev) || zero,
                bodyA && Vector.sub(bodyA.position, bodyA.positionPrev) || zero
            );

            normalVelocity = Vector.dot(normal, relativeVelocity);
        }

        if (bodyA && !bodyA.isStatic) {
            share = bodyA.inverseMass / massTotal;

            // keep track of applied impulses for post solving
            bodyA.constraintImpulse.x -= force.x * share;
            bodyA.constraintImpulse.y -= force.y * share;

            // apply forces
            bodyA.position.x -= force.x * share;
            bodyA.position.y -= force.y * share;

            // apply damping
            if (constraint.damping) {
                bodyA.positionPrev.x -= constraint.damping * normal.x * normalVelocity * share;
                bodyA.positionPrev.y -= constraint.damping * normal.y * normalVelocity * share;
            }

            // apply torque
            torque = (Vector.cross(pointA, force) / resistanceTotal) * Constraint._torqueDampen * bodyA.inverseInertia * (1 - constraint.angularStiffness);
            bodyA.constraintImpulse.angle -= torque;
            bodyA.angle -= torque;
        }

        if (bodyB && !bodyB.isStatic) {
            share = bodyB.inverseMass / massTotal;

            // keep track of applied impulses for post solving
            bodyB.constraintImpulse.x += force.x * share;
            bodyB.constraintImpulse.y += force.y * share;
            
            // apply forces
            bodyB.position.x += force.x * share;
            bodyB.position.y += force.y * share;

            // apply damping
            if (constraint.damping) {
                bodyB.positionPrev.x += constraint.damping * normal.x * normalVelocity * share;
                bodyB.positionPrev.y += constraint.damping * normal.y * normalVelocity * share;
            }

            // apply torque
            torque = (Vector.cross(pointB, force) / resistanceTotal) * Constraint._torqueDampen * bodyB.inverseInertia * (1 - constraint.angularStiffness);
            bodyB.constraintImpulse.angle += torque;
            bodyB.angle += torque;
        }

    };

    /**
     * Performs body updates required after solving constraints.
     * @private
     * @method postSolveAll
     * @param {body[]} bodies
     */
    Constraint.postSolveAll = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                impulse = body.constraintImpulse;

            if (body.isStatic || (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0)) {
                continue;
            }

            Sleeping.set(body, false);

            // update geometry and reset
            for (var j = 0; j < body.parts.length; j++) {
                var part = body.parts[j];
                
                Vertices.translate(part.vertices, impulse);

                if (j > 0) {
                    part.position.x += impulse.x;
                    part.position.y += impulse.y;
                }

                if (impulse.angle !== 0) {
                    Vertices.rotate(part.vertices, impulse.angle, body.position);
                    Axes.rotate(part.axes, impulse.angle);
                    if (j > 0) {
                        Vector.rotateAbout(part.position, impulse.angle, body.position, part.position);
                    }
                }

                Bounds.update(part.bounds, part.vertices, body.velocity);
            }

            // dampen the cached impulse for warming next step
            impulse.angle *= Constraint._warming;
            impulse.x *= Constraint._warming;
            impulse.y *= Constraint._warming;
        }
    };

    /**
     * Returns the world-space position of `constraint.pointA`, accounting for `constraint.bodyA`.
     * @method pointAWorld
     * @param {constraint} constraint
     * @returns {vector} the world-space position
     */
    Constraint.pointAWorld = function(constraint) {
        return {
            x: (constraint.bodyA ? constraint.bodyA.position.x : 0) + constraint.pointA.x,
            y: (constraint.bodyA ? constraint.bodyA.position.y : 0) + constraint.pointA.y
        };
    };

    /**
     * Returns the world-space position of `constraint.pointB`, accounting for `constraint.bodyB`.
     * @method pointBWorld
     * @param {constraint} constraint
     * @returns {vector} the world-space position
     */
    Constraint.pointBWorld = function(constraint) {
        return {
            x: (constraint.bodyB ? constraint.bodyB.position.x : 0) + constraint.pointB.x,
            y: (constraint.bodyB ? constraint.bodyB.position.y : 0) + constraint.pointB.y
        };
    };

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` uniquely identifying number generated in `Composite.create` by `Common.nextId`.
     *
     * @property id
     * @type number
     */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "constraint"
     * @readOnly
     */

    /**
     * An arbitrary `String` name to help the user identify and manage bodies.
     *
     * @property label
     * @type string
     * @default "Constraint"
     */

    /**
     * An `Object` that defines the rendering properties to be consumed by the module `Matter.Render`.
     *
     * @property render
     * @type object
     */

    /**
     * A flag that indicates if the constraint should be rendered.
     *
     * @property render.visible
     * @type boolean
     * @default true
     */

    /**
     * A `Number` that defines the line width to use when rendering the constraint outline.
     * A value of `0` means no outline will be rendered.
     *
     * @property render.lineWidth
     * @type number
     * @default 2
     */

    /**
     * A `String` that defines the stroke style to use when rendering the constraint outline.
     * It is the same as when using a canvas, so it accepts CSS style property values.
     *
     * @property render.strokeStyle
     * @type string
     * @default a random colour
     */

    /**
     * A `String` that defines the constraint rendering type. 
     * The possible values are 'line', 'pin', 'spring'.
     * An appropriate render type will be automatically chosen unless one is given in options.
     *
     * @property render.type
     * @type string
     * @default 'line'
     */

    /**
     * A `Boolean` that defines if the constraint's anchor points should be rendered.
     *
     * @property render.anchors
     * @type boolean
     * @default true
     */

    /**
     * The first possible `Body` that this constraint is attached to.
     *
     * @property bodyA
     * @type body
     * @default null
     */

    /**
     * The second possible `Body` that this constraint is attached to.
     *
     * @property bodyB
     * @type body
     * @default null
     */

    /**
     * A `Vector` that specifies the offset of the constraint from center of the `constraint.bodyA` if defined, otherwise a world-space position.
     *
     * @property pointA
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Vector` that specifies the offset of the constraint from center of the `constraint.bodyB` if defined, otherwise a world-space position.
     *
     * @property pointB
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Number` that specifies the stiffness of the constraint, i.e. the rate at which it returns to its resting `constraint.length`.
     * A value of `1` means the constraint should be very stiff.
     * A value of `0.2` means the constraint acts like a soft spring.
     *
     * @property stiffness
     * @type number
     * @default 1
     */

    /**
     * A `Number` that specifies the damping of the constraint, 
     * i.e. the amount of resistance applied to each body based on their velocities to limit the amount of oscillation.
     * Damping will only be apparent when the constraint also has a very low `stiffness`.
     * A value of `0.1` means the constraint will apply heavy damping, resulting in little to no oscillation.
     * A value of `0` means the constraint will apply no damping.
     *
     * @property damping
     * @type number
     * @default 0
     */

    /**
     * A `Number` that specifies the target resting length of the constraint. 
     * It is calculated automatically in `Constraint.create` from initial positions of the `constraint.bodyA` and `constraint.bodyB`.
     *
     * @property length
     * @type number
     */

    /**
     * An object reserved for storing plugin-specific properties.
     *
     * @property plugin
     * @type {}
     */

})();


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Axes` module contains methods for creating and manipulating sets of axes.
*
* @class Axes
*/

var Axes = {};

module.exports = Axes;

var Vector = __webpack_require__(2);
var Common = __webpack_require__(0);

(function() {

    /**
     * Creates a new set of axes from the given vertices.
     * @method fromVertices
     * @param {vertices} vertices
     * @return {axes} A new axes from the given vertices
     */
    Axes.fromVertices = function(vertices) {
        var axes = {};

        // find the unique axes, using edge normal gradients
        for (var i = 0; i < vertices.length; i++) {
            var j = (i + 1) % vertices.length, 
                normal = Vector.normalise({ 
                    x: vertices[j].y - vertices[i].y, 
                    y: vertices[i].x - vertices[j].x
                }),
                gradient = (normal.y === 0) ? Infinity : (normal.x / normal.y);
            
            // limit precision
            gradient = gradient.toFixed(3).toString();
            axes[gradient] = normal;
        }

        return Common.values(axes);
    };

    /**
     * Rotates a set of axes by the given angle.
     * @method rotate
     * @param {axes} axes
     * @param {number} angle
     */
    Axes.rotate = function(axes, angle) {
        if (angle === 0)
            return;
        
        var cos = Math.cos(angle),
            sin = Math.sin(angle);

        for (var i = 0; i < axes.length; i++) {
            var axis = axes[i],
                xx;
            xx = axis.x * cos - axis.y * sin;
            axis.y = axis.x * sin + axis.y * cos;
            axis.x = xx;
        }
    };

})();


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Bodies` module contains factory methods for creating rigid body models 
* with commonly used body configurations (such as rectangles, circles and other polygons).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Bodies
*/

// TODO: true circle bodies

var Bodies = {};

module.exports = Bodies;

var Vertices = __webpack_require__(3);
var Common = __webpack_require__(0);
var Body = __webpack_require__(6);
var Bounds = __webpack_require__(1);
var Vector = __webpack_require__(2);

(function() {

    /**
     * Creates a new rigid body model with a rectangle hull. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method rectangle
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {object} [options]
     * @return {body} A new rectangle body
     */
    Bodies.rectangle = function(x, y, width, height, options) {
        options = options || {};

        var rectangle = { 
            label: 'Rectangle Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath('L 0 0 L ' + width + ' 0 L ' + width + ' ' + height + ' L 0 ' + height)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            rectangle.vertices = Vertices.chamfer(rectangle.vertices, chamfer.radius, 
                chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, rectangle, options));
    };
    
    /**
     * Creates a new rigid body model with a trapezoid hull. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method trapezoid
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} slope
     * @param {object} [options]
     * @return {body} A new trapezoid body
     */
    Bodies.trapezoid = function(x, y, width, height, slope, options) {
        options = options || {};

        slope *= 0.5;
        var roof = (1 - (slope * 2)) * width;
        
        var x1 = width * slope,
            x2 = x1 + roof,
            x3 = x2 + x1,
            verticesPath;

        if (slope < 0.5) {
            verticesPath = 'L 0 0 L ' + x1 + ' ' + (-height) + ' L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
        } else {
            verticesPath = 'L 0 0 L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
        }

        var trapezoid = { 
            label: 'Trapezoid Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(verticesPath)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            trapezoid.vertices = Vertices.chamfer(trapezoid.vertices, chamfer.radius, 
                chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, trapezoid, options));
    };

    /**
     * Creates a new rigid body model with a circle hull. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method circle
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {object} [options]
     * @param {number} [maxSides]
     * @return {body} A new circle body
     */
    Bodies.circle = function(x, y, radius, options, maxSides) {
        options = options || {};

        var circle = {
            label: 'Circle Body',
            circleRadius: radius
        };
        
        // approximate circles with polygons until true circles implemented in SAT
        maxSides = maxSides || 25;
        var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

        // optimisation: always use even number of sides (half the number of unique axes)
        if (sides % 2 === 1)
            sides += 1;

        return Bodies.polygon(x, y, sides, radius, Common.extend({}, circle, options));
    };

    /**
     * Creates a new rigid body model with a regular polygon hull with the given number of sides. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method polygon
     * @param {number} x
     * @param {number} y
     * @param {number} sides
     * @param {number} radius
     * @param {object} [options]
     * @return {body} A new regular polygon body
     */
    Bodies.polygon = function(x, y, sides, radius, options) {
        options = options || {};

        if (sides < 3)
            return Bodies.circle(x, y, radius, options);

        var theta = 2 * Math.PI / sides,
            path = '',
            offset = theta * 0.5;

        for (var i = 0; i < sides; i += 1) {
            var angle = offset + (i * theta),
                xx = Math.cos(angle) * radius,
                yy = Math.sin(angle) * radius;

            path += 'L ' + xx.toFixed(3) + ' ' + yy.toFixed(3) + ' ';
        }

        var polygon = { 
            label: 'Polygon Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(path)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            polygon.vertices = Vertices.chamfer(polygon.vertices, chamfer.radius, 
                chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, polygon, options));
    };

    /**
     * Utility to create a compound body based on set(s) of vertices.
     * 
     * _Note:_ To optionally enable automatic concave vertices decomposition the [poly-decomp](https://github.com/schteppe/poly-decomp.js) 
     * package must be first installed and provided see `Common.setDecomp`, otherwise the convex hull of each vertex set will be used.
     * 
     * The resulting vertices are reorientated about their centre of mass,
     * and offset such that `body.position` corresponds to this point.
     * 
     * The resulting offset may be found if needed by subtracting `body.bounds` from the original input bounds.
     * To later move the centre of mass see `Body.setCentre`.
     * 
     * Note that automatic conconcave decomposition results are not always optimal. 
     * For best results, simplify the input vertices as much as possible first.
     * By default this function applies some addtional simplification to help.
     * 
     * Some outputs may also require further manual processing afterwards to be robust.
     * In particular some parts may need to be overlapped to avoid collision gaps.
     * Thin parts and sharp points should be avoided or removed where possible.
     *
     * The options parameter object specifies any `Matter.Body` properties you wish to override the defaults.
     * 
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method fromVertices
     * @param {number} x
     * @param {number} y
     * @param {array} vertexSets One or more arrays of vertex points e.g. `[[{ x: 0, y: 0 }...], ...]`.
     * @param {object} [options] The body options.
     * @param {bool} [flagInternal=false] Optionally marks internal edges with `isInternal`.
     * @param {number} [removeCollinear=0.01] Threshold when simplifying vertices along the same edge.
     * @param {number} [minimumArea=10] Threshold when removing small parts.
     * @param {number} [removeDuplicatePoints=0.01] Threshold when simplifying nearby vertices.
     * @return {body}
     */
    Bodies.fromVertices = function(x, y, vertexSets, options, flagInternal, removeCollinear, minimumArea, removeDuplicatePoints) {
        var decomp = Common.getDecomp(),
            canDecomp,
            body,
            parts,
            isConvex,
            isConcave,
            vertices,
            i,
            j,
            k,
            v,
            z;

        // check decomp is as expected
        canDecomp = Boolean(decomp && decomp.quickDecomp);

        options = options || {};
        parts = [];

        flagInternal = typeof flagInternal !== 'undefined' ? flagInternal : false;
        removeCollinear = typeof removeCollinear !== 'undefined' ? removeCollinear : 0.01;
        minimumArea = typeof minimumArea !== 'undefined' ? minimumArea : 10;
        removeDuplicatePoints = typeof removeDuplicatePoints !== 'undefined' ? removeDuplicatePoints : 0.01;

        // ensure vertexSets is an array of arrays
        if (!Common.isArray(vertexSets[0])) {
            vertexSets = [vertexSets];
        }

        for (v = 0; v < vertexSets.length; v += 1) {
            vertices = vertexSets[v];
            isConvex = Vertices.isConvex(vertices);
            isConcave = !isConvex;

            if (isConcave && !canDecomp) {
                Common.warnOnce(
                    'Bodies.fromVertices: Install the \'poly-decomp\' library and use Common.setDecomp or provide \'decomp\' as a global to decompose concave vertices.'
                );
            }

            if (isConvex || !canDecomp) {
                if (isConvex) {
                    vertices = Vertices.clockwiseSort(vertices);
                } else {
                    // fallback to convex hull when decomposition is not possible
                    vertices = Vertices.hull(vertices);
                }

                parts.push({
                    position: { x: x, y: y },
                    vertices: vertices
                });
            } else {
                // initialise a decomposition
                var concave = vertices.map(function(vertex) {
                    return [vertex.x, vertex.y];
                });

                // vertices are concave and simple, we can decompose into parts
                decomp.makeCCW(concave);
                if (removeCollinear !== false)
                    decomp.removeCollinearPoints(concave, removeCollinear);
                if (removeDuplicatePoints !== false && decomp.removeDuplicatePoints)
                    decomp.removeDuplicatePoints(concave, removeDuplicatePoints);

                // use the quick decomposition algorithm (Bayazit)
                var decomposed = decomp.quickDecomp(concave);

                // for each decomposed chunk
                for (i = 0; i < decomposed.length; i++) {
                    var chunk = decomposed[i];

                    // convert vertices into the correct structure
                    var chunkVertices = chunk.map(function(vertices) {
                        return {
                            x: vertices[0],
                            y: vertices[1]
                        };
                    });

                    // skip small chunks
                    if (minimumArea > 0 && Vertices.area(chunkVertices) < minimumArea)
                        continue;

                    // create a compound part
                    parts.push({
                        position: Vertices.centre(chunkVertices),
                        vertices: chunkVertices
                    });
                }
            }
        }

        // create body parts
        for (i = 0; i < parts.length; i++) {
            parts[i] = Body.create(Common.extend(parts[i], options));
        }

        // flag internal edges (coincident part edges)
        if (flagInternal) {
            var coincident_max_dist = 5;

            for (i = 0; i < parts.length; i++) {
                var partA = parts[i];

                for (j = i + 1; j < parts.length; j++) {
                    var partB = parts[j];

                    if (Bounds.overlaps(partA.bounds, partB.bounds)) {
                        var pav = partA.vertices,
                            pbv = partB.vertices;

                        // iterate vertices of both parts
                        for (k = 0; k < partA.vertices.length; k++) {
                            for (z = 0; z < partB.vertices.length; z++) {
                                // find distances between the vertices
                                var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])),
                                    db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));

                                // if both vertices are very close, consider the edge concident (internal)
                                if (da < coincident_max_dist && db < coincident_max_dist) {
                                    pav[k].isInternal = true;
                                    pbv[z].isInternal = true;
                                }
                            }
                        }

                    }
                }
            }
        }

        if (parts.length > 1) {
            // create the parent body to be returned, that contains generated compound parts
            body = Body.create(Common.extend({ parts: parts.slice(0) }, options));

            // offset such that body.position is at the centre off mass
            Body.setPosition(body, { x: x, y: y });

            return body;
        } else {
            return parts[0];
        }
    };

})();


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Mouse` module contains methods for creating and manipulating mouse inputs.
*
* @class Mouse
*/

var Mouse = {};

module.exports = Mouse;

var Common = __webpack_require__(0);

(function() {

    /**
     * Creates a mouse input.
     * @method create
     * @param {HTMLElement} element
     * @return {mouse} A new mouse
     */
    Mouse.create = function(element) {
        var mouse = {};

        if (!element) {
            Common.log('Mouse.create: element was undefined, defaulting to document.body', 'warn');
        }
        
        mouse.element = element || document.body;
        mouse.absolute = { x: 0, y: 0 };
        mouse.position = { x: 0, y: 0 };
        mouse.mousedownPosition = { x: 0, y: 0 };
        mouse.mouseupPosition = { x: 0, y: 0 };
        mouse.offset = { x: 0, y: 0 };
        mouse.scale = { x: 1, y: 1 };
        mouse.wheelDelta = 0;
        mouse.button = -1;
        mouse.pixelRatio = parseInt(mouse.element.getAttribute('data-pixel-ratio'), 10) || 1;

        mouse.sourceEvents = {
            mousemove: null,
            mousedown: null,
            mouseup: null,
            mousewheel: null
        };
        
        mouse.mousemove = function(event) { 
            var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                mouse.button = 0;
                event.preventDefault();
            }

            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.sourceEvents.mousemove = event;
        };
        
        mouse.mousedown = function(event) {
            var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                mouse.button = 0;
                event.preventDefault();
            } else {
                mouse.button = event.button;
            }

            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.mousedownPosition.x = mouse.position.x;
            mouse.mousedownPosition.y = mouse.position.y;
            mouse.sourceEvents.mousedown = event;
        };
        
        mouse.mouseup = function(event) {
            var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                event.preventDefault();
            }
            
            mouse.button = -1;
            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.mouseupPosition.x = mouse.position.x;
            mouse.mouseupPosition.y = mouse.position.y;
            mouse.sourceEvents.mouseup = event;
        };

        mouse.mousewheel = function(event) {
            mouse.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
            event.preventDefault();
        };

        Mouse.setElement(mouse, mouse.element);

        return mouse;
    };

    /**
     * Sets the element the mouse is bound to (and relative to).
     * @method setElement
     * @param {mouse} mouse
     * @param {HTMLElement} element
     */
    Mouse.setElement = function(mouse, element) {
        mouse.element = element;

        element.addEventListener('mousemove', mouse.mousemove);
        element.addEventListener('mousedown', mouse.mousedown);
        element.addEventListener('mouseup', mouse.mouseup);
        
        element.addEventListener('mousewheel', mouse.mousewheel);
        element.addEventListener('DOMMouseScroll', mouse.mousewheel);

        element.addEventListener('touchmove', mouse.mousemove);
        element.addEventListener('touchstart', mouse.mousedown);
        element.addEventListener('touchend', mouse.mouseup);
    };

    /**
     * Clears all captured source events.
     * @method clearSourceEvents
     * @param {mouse} mouse
     */
    Mouse.clearSourceEvents = function(mouse) {
        mouse.sourceEvents.mousemove = null;
        mouse.sourceEvents.mousedown = null;
        mouse.sourceEvents.mouseup = null;
        mouse.sourceEvents.mousewheel = null;
        mouse.wheelDelta = 0;
    };

    /**
     * Sets the mouse position offset.
     * @method setOffset
     * @param {mouse} mouse
     * @param {vector} offset
     */
    Mouse.setOffset = function(mouse, offset) {
        mouse.offset.x = offset.x;
        mouse.offset.y = offset.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };

    /**
     * Sets the mouse position scale.
     * @method setScale
     * @param {mouse} mouse
     * @param {vector} scale
     */
    Mouse.setScale = function(mouse, scale) {
        mouse.scale.x = scale.x;
        mouse.scale.y = scale.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };
    
    /**
     * Gets the mouse position relative to an element given a screen pixel ratio.
     * @method _getRelativeMousePosition
     * @private
     * @param {} event
     * @param {} element
     * @param {number} pixelRatio
     * @return {}
     */
    Mouse._getRelativeMousePosition = function(event, element, pixelRatio) {
        var elementBounds = element.getBoundingClientRect(),
            rootNode = (document.documentElement || document.body.parentNode || document.body),
            scrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : rootNode.scrollLeft,
            scrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : rootNode.scrollTop,
            touches = event.changedTouches,
            x, y;
        
        if (touches) {
            x = touches[0].pageX - elementBounds.left - scrollX;
            y = touches[0].pageY - elementBounds.top - scrollY;
        } else {
            x = event.pageX - elementBounds.left - scrollX;
            y = event.pageY - elementBounds.top - scrollY;
        }

        return { 
            x: x / (element.clientWidth / (element.width || element.clientWidth) * pixelRatio),
            y: y / (element.clientHeight / (element.height || element.clientHeight) * pixelRatio)
        };
    };

})();


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Detector` module contains methods for efficiently detecting collisions between a list of bodies using a broadphase algorithm.
*
* @class Detector
*/

var Detector = {};

module.exports = Detector;

var Common = __webpack_require__(0);
var Collision = __webpack_require__(8);

(function() {

    /**
     * Creates a new collision detector.
     * @method create
     * @param {} options
     * @return {detector} A new collision detector
     */
    Detector.create = function(options) {
        var defaults = {
            bodies: [],
            pairs: null
        };

        return Common.extend(defaults, options);
    };

    /**
     * Sets the list of bodies in the detector.
     * @method setBodies
     * @param {detector} detector
     * @param {body[]} bodies
     */
    Detector.setBodies = function(detector, bodies) {
        detector.bodies = bodies.slice(0);
    };

    /**
     * Clears the detector including its list of bodies.
     * @method clear
     * @param {detector} detector
     */
    Detector.clear = function(detector) {
        detector.bodies = [];
    };

    /**
     * Efficiently finds all collisions among all the bodies in `detector.bodies` using a broadphase algorithm.
     * 
     * _Note:_ The specific ordering of collisions returned is not guaranteed between releases and may change for performance reasons.
     * If a specific ordering is required then apply a sort to the resulting array.
     * @method collisions
     * @param {detector} detector
     * @return {collision[]} collisions
     */
    Detector.collisions = function(detector) {
        var collisions = [],
            pairs = detector.pairs,
            bodies = detector.bodies,
            bodiesLength = bodies.length,
            canCollide = Detector.canCollide,
            collides = Collision.collides,
            i,
            j;

        bodies.sort(Detector._compareBoundsX);

        for (i = 0; i < bodiesLength; i++) {
            var bodyA = bodies[i],
                boundsA = bodyA.bounds,
                boundXMax = bodyA.bounds.max.x,
                boundYMax = bodyA.bounds.max.y,
                boundYMin = bodyA.bounds.min.y,
                bodyAStatic = bodyA.isStatic || bodyA.isSleeping,
                partsALength = bodyA.parts.length,
                partsASingle = partsALength === 1;

            for (j = i + 1; j < bodiesLength; j++) {
                var bodyB = bodies[j],
                    boundsB = bodyB.bounds;

                if (boundsB.min.x > boundXMax) {
                    break;
                }

                if (boundYMax < boundsB.min.y || boundYMin > boundsB.max.y) {
                    continue;
                }

                if (bodyAStatic && (bodyB.isStatic || bodyB.isSleeping)) {
                    continue;
                }

                if (!canCollide(bodyA.collisionFilter, bodyB.collisionFilter)) {
                    continue;
                }

                var partsBLength = bodyB.parts.length;

                if (partsASingle && partsBLength === 1) {
                    var collision = collides(bodyA, bodyB, pairs);

                    if (collision) {
                        collisions.push(collision);
                    }
                } else {
                    var partsAStart = partsALength > 1 ? 1 : 0,
                        partsBStart = partsBLength > 1 ? 1 : 0;
                    
                    for (var k = partsAStart; k < partsALength; k++) {
                        var partA = bodyA.parts[k],
                            boundsA = partA.bounds;

                        for (var z = partsBStart; z < partsBLength; z++) {
                            var partB = bodyB.parts[z],
                                boundsB = partB.bounds;

                            if (boundsA.min.x > boundsB.max.x || boundsA.max.x < boundsB.min.x
                                || boundsA.max.y < boundsB.min.y || boundsA.min.y > boundsB.max.y) {
                                continue;
                            }

                            var collision = collides(partA, partB, pairs);

                            if (collision) {
                                collisions.push(collision);
                            }
                        }
                    }
                }
            }
        }

        return collisions;
    };

    /**
     * Returns `true` if both supplied collision filters will allow a collision to occur.
     * See `body.collisionFilter` for more information.
     * @method canCollide
     * @param {} filterA
     * @param {} filterB
     * @return {bool} `true` if collision can occur
     */
    Detector.canCollide = function(filterA, filterB) {
        if (filterA.group === filterB.group && filterA.group !== 0)
            return filterA.group > 0;

        return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
    };

    /**
     * The comparison function used in the broadphase algorithm.
     * Returns the signed delta of the bodies bounds on the x-axis.
     * @private
     * @method _sortCompare
     * @param {body} bodyA
     * @param {body} bodyB
     * @return {number} The signed delta used for sorting
     */
    Detector._compareBoundsX = function(bodyA, bodyB) {
        return bodyA.bounds.min.x - bodyB.bounds.min.x;
    };

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * The array of `Matter.Body` between which the detector finds collisions.
     * 
     * _Note:_ The order of bodies in this array _is not fixed_ and will be continually managed by the detector.
     * @property bodies
     * @type body[]
     * @default []
     */

    /**
     * Optional. A `Matter.Pairs` object from which previous collision objects may be reused. Intended for internal `Matter.Engine` usage.
     * @property pairs
     * @type {pairs|null}
     * @default null
     */

})();


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Plugin` module contains functions for registering and installing plugins on modules.
*
* @class Plugin
*/

var Plugin = {};

module.exports = Plugin;

var Common = __webpack_require__(0);

(function() {

    Plugin._registry = {};

    /**
     * Registers a plugin object so it can be resolved later by name.
     * @method register
     * @param plugin {} The plugin to register.
     * @return {object} The plugin.
     */
    Plugin.register = function(plugin) {
        if (!Plugin.isPlugin(plugin)) {
            Common.warn('Plugin.register:', Plugin.toString(plugin), 'does not implement all required fields.');
        }

        if (plugin.name in Plugin._registry) {
            var registered = Plugin._registry[plugin.name],
                pluginVersion = Plugin.versionParse(plugin.version).number,
                registeredVersion = Plugin.versionParse(registered.version).number;

            if (pluginVersion > registeredVersion) {
                Common.warn('Plugin.register:', Plugin.toString(registered), 'was upgraded to', Plugin.toString(plugin));
                Plugin._registry[plugin.name] = plugin;
            } else if (pluginVersion < registeredVersion) {
                Common.warn('Plugin.register:', Plugin.toString(registered), 'can not be downgraded to', Plugin.toString(plugin));
            } else if (plugin !== registered) {
                Common.warn('Plugin.register:', Plugin.toString(plugin), 'is already registered to different plugin object');
            }
        } else {
            Plugin._registry[plugin.name] = plugin;
        }

        return plugin;
    };

    /**
     * Resolves a dependency to a plugin object from the registry if it exists. 
     * The `dependency` may contain a version, but only the name matters when resolving.
     * @method resolve
     * @param dependency {string} The dependency.
     * @return {object} The plugin if resolved, otherwise `undefined`.
     */
    Plugin.resolve = function(dependency) {
        return Plugin._registry[Plugin.dependencyParse(dependency).name];
    };

    /**
     * Returns a pretty printed plugin name and version.
     * @method toString
     * @param plugin {} The plugin.
     * @return {string} Pretty printed plugin name and version.
     */
    Plugin.toString = function(plugin) {
        return typeof plugin === 'string' ? plugin : (plugin.name || 'anonymous') + '@' + (plugin.version || plugin.range || '0.0.0');
    };

    /**
     * Returns `true` if the object meets the minimum standard to be considered a plugin.
     * This means it must define the following properties:
     * - `name`
     * - `version`
     * - `install`
     * @method isPlugin
     * @param obj {} The obj to test.
     * @return {boolean} `true` if the object can be considered a plugin otherwise `false`.
     */
    Plugin.isPlugin = function(obj) {
        return obj && obj.name && obj.version && obj.install;
    };

    /**
     * Returns `true` if a plugin with the given `name` been installed on `module`.
     * @method isUsed
     * @param module {} The module.
     * @param name {string} The plugin name.
     * @return {boolean} `true` if a plugin with the given `name` been installed on `module`, otherwise `false`.
     */
    Plugin.isUsed = function(module, name) {
        return module.used.indexOf(name) > -1;
    };

    /**
     * Returns `true` if `plugin.for` is applicable to `module` by comparing against `module.name` and `module.version`.
     * If `plugin.for` is not specified then it is assumed to be applicable.
     * The value of `plugin.for` is a string of the format `'module-name'` or `'module-name@version'`.
     * @method isFor
     * @param plugin {} The plugin.
     * @param module {} The module.
     * @return {boolean} `true` if `plugin.for` is applicable to `module`, otherwise `false`.
     */
    Plugin.isFor = function(plugin, module) {
        var parsed = plugin.for && Plugin.dependencyParse(plugin.for);
        return !plugin.for || (module.name === parsed.name && Plugin.versionSatisfies(module.version, parsed.range));
    };

    /**
     * Installs the plugins by calling `plugin.install` on each plugin specified in `plugins` if passed, otherwise `module.uses`.
     * For installing plugins on `Matter` see the convenience function `Matter.use`.
     * Plugins may be specified either by their name or a reference to the plugin object.
     * Plugins themselves may specify further dependencies, but each plugin is installed only once.
     * Order is important, a topological sort is performed to find the best resulting order of installation.
     * This sorting attempts to satisfy every dependency's requested ordering, but may not be exact in all cases.
     * This function logs the resulting status of each dependency in the console, along with any warnings.
     * - A green tick ✅ indicates a dependency was resolved and installed.
     * - An orange diamond 🔶 indicates a dependency was resolved but a warning was thrown for it or one if its dependencies.
     * - A red cross ❌ indicates a dependency could not be resolved.
     * Avoid calling this function multiple times on the same module unless you intend to manually control installation order.
     * @method use
     * @param module {} The module install plugins on.
     * @param [plugins=module.uses] {} The plugins to install on module (optional, defaults to `module.uses`).
     */
    Plugin.use = function(module, plugins) {
        module.uses = (module.uses || []).concat(plugins || []);

        if (module.uses.length === 0) {
            Common.warn('Plugin.use:', Plugin.toString(module), 'does not specify any dependencies to install.');
            return;
        }

        var dependencies = Plugin.dependencies(module),
            sortedDependencies = Common.topologicalSort(dependencies),
            status = [];

        for (var i = 0; i < sortedDependencies.length; i += 1) {
            if (sortedDependencies[i] === module.name) {
                continue;
            }

            var plugin = Plugin.resolve(sortedDependencies[i]);

            if (!plugin) {
                status.push('❌ ' + sortedDependencies[i]);
                continue;
            }

            if (Plugin.isUsed(module, plugin.name)) {
                continue;
            }

            if (!Plugin.isFor(plugin, module)) {
                Common.warn('Plugin.use:', Plugin.toString(plugin), 'is for', plugin.for, 'but installed on', Plugin.toString(module) + '.');
                plugin._warned = true;
            }

            if (plugin.install) {
                plugin.install(module);
            } else {
                Common.warn('Plugin.use:', Plugin.toString(plugin), 'does not specify an install function.');
                plugin._warned = true;
            }

            if (plugin._warned) {
                status.push('🔶 ' + Plugin.toString(plugin));
                delete plugin._warned;
            } else {
                status.push('✅ ' + Plugin.toString(plugin));
            }

            module.used.push(plugin.name);
        }

        if (status.length > 0) {
            Common.info(status.join('  '));
        }
    };

    /**
     * Recursively finds all of a module's dependencies and returns a flat dependency graph.
     * @method dependencies
     * @param module {} The module.
     * @return {object} A dependency graph.
     */
    Plugin.dependencies = function(module, tracked) {
        var parsedBase = Plugin.dependencyParse(module),
            name = parsedBase.name;

        tracked = tracked || {};

        if (name in tracked) {
            return;
        }

        module = Plugin.resolve(module) || module;

        tracked[name] = Common.map(module.uses || [], function(dependency) {
            if (Plugin.isPlugin(dependency)) {
                Plugin.register(dependency);
            }

            var parsed = Plugin.dependencyParse(dependency),
                resolved = Plugin.resolve(dependency);

            if (resolved && !Plugin.versionSatisfies(resolved.version, parsed.range)) {
                Common.warn(
                    'Plugin.dependencies:', Plugin.toString(resolved), 'does not satisfy',
                    Plugin.toString(parsed), 'used by', Plugin.toString(parsedBase) + '.'
                );

                resolved._warned = true;
                module._warned = true;
            } else if (!resolved) {
                Common.warn(
                    'Plugin.dependencies:', Plugin.toString(dependency), 'used by',
                    Plugin.toString(parsedBase), 'could not be resolved.'
                );

                module._warned = true;
            }

            return parsed.name;
        });

        for (var i = 0; i < tracked[name].length; i += 1) {
            Plugin.dependencies(tracked[name][i], tracked);
        }

        return tracked;
    };

    /**
     * Parses a dependency string into its components.
     * The `dependency` is a string of the format `'module-name'` or `'module-name@version'`.
     * See documentation for `Plugin.versionParse` for a description of the format.
     * This function can also handle dependencies that are already resolved (e.g. a module object).
     * @method dependencyParse
     * @param dependency {string} The dependency of the format `'module-name'` or `'module-name@version'`.
     * @return {object} The dependency parsed into its components.
     */
    Plugin.dependencyParse = function(dependency) {
        if (Common.isString(dependency)) {
            var pattern = /^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-+]+)?))?$/;

            if (!pattern.test(dependency)) {
                Common.warn('Plugin.dependencyParse:', dependency, 'is not a valid dependency string.');
            }

            return {
                name: dependency.split('@')[0],
                range: dependency.split('@')[1] || '*'
            };
        }

        return {
            name: dependency.name,
            range: dependency.range || dependency.version
        };
    };

    /**
     * Parses a version string into its components.  
     * Versions are strictly of the format `x.y.z` (as in [semver](http://semver.org/)).
     * Versions may optionally have a prerelease tag in the format `x.y.z-alpha`.
     * Ranges are a strict subset of [npm ranges](https://docs.npmjs.com/misc/semver#advanced-range-syntax).
     * Only the following range types are supported:
     * - Tilde ranges e.g. `~1.2.3`
     * - Caret ranges e.g. `^1.2.3`
     * - Greater than ranges e.g. `>1.2.3`
     * - Greater than or equal ranges e.g. `>=1.2.3`
     * - Exact version e.g. `1.2.3`
     * - Any version `*`
     * @method versionParse
     * @param range {string} The version string.
     * @return {object} The version range parsed into its components.
     */
    Plugin.versionParse = function(range) {
        var pattern = /^(\*)|(\^|~|>=|>)?\s*((\d+)\.(\d+)\.(\d+))(-[0-9A-Za-z-+]+)?$/;

        if (!pattern.test(range)) {
            Common.warn('Plugin.versionParse:', range, 'is not a valid version or range.');
        }

        var parts = pattern.exec(range);
        var major = Number(parts[4]);
        var minor = Number(parts[5]);
        var patch = Number(parts[6]);

        return {
            isRange: Boolean(parts[1] || parts[2]),
            version: parts[3],
            range: range,
            operator: parts[1] || parts[2] || '',
            major: major,
            minor: minor,
            patch: patch,
            parts: [major, minor, patch],
            prerelease: parts[7],
            number: major * 1e8 + minor * 1e4 + patch
        };
    };

    /**
     * Returns `true` if `version` satisfies the given `range`.
     * See documentation for `Plugin.versionParse` for a description of the format.
     * If a version or range is not specified, then any version (`*`) is assumed to satisfy.
     * @method versionSatisfies
     * @param version {string} The version string.
     * @param range {string} The range string.
     * @return {boolean} `true` if `version` satisfies `range`, otherwise `false`.
     */
    Plugin.versionSatisfies = function(version, range) {
        range = range || '*';

        var r = Plugin.versionParse(range),
            v = Plugin.versionParse(version);

        if (r.isRange) {
            if (r.operator === '*' || version === '*') {
                return true;
            }

            if (r.operator === '>') {
                return v.number > r.number;
            }

            if (r.operator === '>=') {
                return v.number >= r.number;
            }

            if (r.operator === '~') {
                return v.major === r.major && v.minor === r.minor && v.patch >= r.patch;
            }

            if (r.operator === '^') {
                if (r.major > 0) {
                    return v.major === r.major && v.number >= r.number;
                }

                if (r.minor > 0) {
                    return v.minor === r.minor && v.patch >= r.patch;
                }

                return v.patch === r.patch;
            }
        }

        return version === range || version === '*';
    };

})();


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Render` module is a simple canvas based renderer for visualising instances of `Matter.Engine`.
* It is intended for development and debugging purposes, but may also be suitable for simple games.
* It includes a number of drawing options including wireframe, vector with support for sprites and viewports.
*
* @class Render
*/

var Render = {};

module.exports = Render;

var Common = __webpack_require__(0);
var Composite = __webpack_require__(5);
var Bounds = __webpack_require__(1);
var Events = __webpack_require__(4);
var Vector = __webpack_require__(2);
var Mouse = __webpack_require__(13);

(function() {

    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
                                      || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };

        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    Render._goodFps = 30;
    Render._goodDelta = 1000 / 60;

    /**
     * Creates a new renderer. The options parameter is an object that specifies any properties you wish to override the defaults.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {object} [options]
     * @return {render} A new renderer
     */
    Render.create = function(options) {
        var defaults = {
            controller: Render,
            engine: null,
            element: null,
            canvas: null,
            mouse: null,
            frameRequestId: null,
            timing: {
                historySize: 60,
                delta: 0,
                deltaHistory: [],
                lastTime: 0,
                lastTimestamp: 0,
                lastElapsed: 0,
                timestampElapsed: 0,
                timestampElapsedHistory: [],
                engineDeltaHistory: [],
                engineElapsedHistory: [],
                elapsedHistory: []
            },
            options: {
                width: 800,
                height: 600,
                pixelRatio: 1,
                background: '#14151f',
                wireframeBackground: '#14151f',
                hasBounds: !!options.bounds,
                enabled: true,
                wireframes: true,
                showSleeping: true,
                showDebug: false,
                showStats: false,
                showPerformance: false,
                showBounds: false,
                showVelocity: false,
                showCollisions: false,
                showSeparations: false,
                showAxes: false,
                showPositions: false,
                showAngleIndicator: false,
                showIds: false,
                showVertexNumbers: false,
                showConvexHulls: false,
                showInternalEdges: false,
                showMousePosition: false
            }
        };

        var render = Common.extend(defaults, options);

        if (render.canvas) {
            render.canvas.width = render.options.width || render.canvas.width;
            render.canvas.height = render.options.height || render.canvas.height;
        }

        render.mouse = options.mouse;
        render.engine = options.engine;
        render.canvas = render.canvas || _createCanvas(render.options.width, render.options.height);
        render.context = render.canvas.getContext('2d');
        render.textures = {};

        render.bounds = render.bounds || {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: render.canvas.width,
                y: render.canvas.height
            }
        };

        // for temporary back compatibility only
        render.options.showBroadphase = false;

        if (render.options.pixelRatio !== 1) {
            Render.setPixelRatio(render, render.options.pixelRatio);
        }

        if (Common.isElement(render.element)) {
            render.element.appendChild(render.canvas);
        } else if (!render.canvas.parentNode) {
            Common.log('Render.create: options.element was undefined, render.canvas was created but not appended', 'warn');
        }

        return render;
    };

    /**
     * Continuously updates the render canvas on the `requestAnimationFrame` event.
     * @method run
     * @param {render} render
     */
    Render.run = function(render) {
        (function loop(time){
            render.frameRequestId = _requestAnimationFrame(loop);
            
            _updateTiming(render, time);

            Render.world(render, time);

            if (render.options.showStats || render.options.showDebug) {
                Render.stats(render, render.context, time);
            }

            if (render.options.showPerformance || render.options.showDebug) {
                Render.performance(render, render.context, time);
            }
        })();
    };

    /**
     * Ends execution of `Render.run` on the given `render`, by canceling the animation frame request event loop.
     * @method stop
     * @param {render} render
     */
    Render.stop = function(render) {
        _cancelAnimationFrame(render.frameRequestId);
    };

    /**
     * Sets the pixel ratio of the renderer and updates the canvas.
     * To automatically detect the correct ratio, pass the string `'auto'` for `pixelRatio`.
     * @method setPixelRatio
     * @param {render} render
     * @param {number} pixelRatio
     */
    Render.setPixelRatio = function(render, pixelRatio) {
        var options = render.options,
            canvas = render.canvas;

        if (pixelRatio === 'auto') {
            pixelRatio = _getPixelRatio(canvas);
        }

        options.pixelRatio = pixelRatio;
        canvas.setAttribute('data-pixel-ratio', pixelRatio);
        canvas.width = options.width * pixelRatio;
        canvas.height = options.height * pixelRatio;
        canvas.style.width = options.width + 'px';
        canvas.style.height = options.height + 'px';
    };

    /**
     * Positions and sizes the viewport around the given object bounds.
     * Objects must have at least one of the following properties:
     * - `object.bounds`
     * - `object.position`
     * - `object.min` and `object.max`
     * - `object.x` and `object.y`
     * @method lookAt
     * @param {render} render
     * @param {object[]} objects
     * @param {vector} [padding]
     * @param {bool} [center=true]
     */
    Render.lookAt = function(render, objects, padding, center) {
        center = typeof center !== 'undefined' ? center : true;
        objects = Common.isArray(objects) ? objects : [objects];
        padding = padding || {
            x: 0,
            y: 0
        };

        // find bounds of all objects
        var bounds = {
            min: { x: Infinity, y: Infinity },
            max: { x: -Infinity, y: -Infinity }
        };

        for (var i = 0; i < objects.length; i += 1) {
            var object = objects[i],
                min = object.bounds ? object.bounds.min : (object.min || object.position || object),
                max = object.bounds ? object.bounds.max : (object.max || object.position || object);

            if (min && max) {
                if (min.x < bounds.min.x)
                    bounds.min.x = min.x;

                if (max.x > bounds.max.x)
                    bounds.max.x = max.x;

                if (min.y < bounds.min.y)
                    bounds.min.y = min.y;

                if (max.y > bounds.max.y)
                    bounds.max.y = max.y;
            }
        }

        // find ratios
        var width = (bounds.max.x - bounds.min.x) + 2 * padding.x,
            height = (bounds.max.y - bounds.min.y) + 2 * padding.y,
            viewHeight = render.canvas.height,
            viewWidth = render.canvas.width,
            outerRatio = viewWidth / viewHeight,
            innerRatio = width / height,
            scaleX = 1,
            scaleY = 1;

        // find scale factor
        if (innerRatio > outerRatio) {
            scaleY = innerRatio / outerRatio;
        } else {
            scaleX = outerRatio / innerRatio;
        }

        // enable bounds
        render.options.hasBounds = true;

        // position and size
        render.bounds.min.x = bounds.min.x;
        render.bounds.max.x = bounds.min.x + width * scaleX;
        render.bounds.min.y = bounds.min.y;
        render.bounds.max.y = bounds.min.y + height * scaleY;

        // center
        if (center) {
            render.bounds.min.x += width * 0.5 - (width * scaleX) * 0.5;
            render.bounds.max.x += width * 0.5 - (width * scaleX) * 0.5;
            render.bounds.min.y += height * 0.5 - (height * scaleY) * 0.5;
            render.bounds.max.y += height * 0.5 - (height * scaleY) * 0.5;
        }

        // padding
        render.bounds.min.x -= padding.x;
        render.bounds.max.x -= padding.x;
        render.bounds.min.y -= padding.y;
        render.bounds.max.y -= padding.y;

        // update mouse
        if (render.mouse) {
            Mouse.setScale(render.mouse, {
                x: (render.bounds.max.x - render.bounds.min.x) / render.canvas.width,
                y: (render.bounds.max.y - render.bounds.min.y) / render.canvas.height
            });

            Mouse.setOffset(render.mouse, render.bounds.min);
        }
    };

    /**
     * Applies viewport transforms based on `render.bounds` to a render context.
     * @method startViewTransform
     * @param {render} render
     */
    Render.startViewTransform = function(render) {
        var boundsWidth = render.bounds.max.x - render.bounds.min.x,
            boundsHeight = render.bounds.max.y - render.bounds.min.y,
            boundsScaleX = boundsWidth / render.options.width,
            boundsScaleY = boundsHeight / render.options.height;

        render.context.setTransform(
            render.options.pixelRatio / boundsScaleX, 0, 0, 
            render.options.pixelRatio / boundsScaleY, 0, 0
        );
        
        render.context.translate(-render.bounds.min.x, -render.bounds.min.y);
    };

    /**
     * Resets all transforms on the render context.
     * @method endViewTransform
     * @param {render} render
     */
    Render.endViewTransform = function(render) {
        render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
    };

    /**
     * Renders the given `engine`'s `Matter.World` object.
     * This is the entry point for all rendering and should be called every time the scene changes.
     * @method world
     * @param {render} render
     */
    Render.world = function(render, time) {
        var startTime = Common.now(),
            engine = render.engine,
            world = engine.world,
            canvas = render.canvas,
            context = render.context,
            options = render.options,
            timing = render.timing;

        var allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world),
            background = options.wireframes ? options.wireframeBackground : options.background,
            bodies = [],
            constraints = [],
            i;

        var event = {
            timestamp: engine.timing.timestamp
        };

        Events.trigger(render, 'beforeRender', event);

        // apply background if it has changed
        if (render.currentBackground !== background)
            _applyBackground(render, background);

        // clear the canvas with a transparent fill, to allow the canvas background to show
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = "transparent";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = 'source-over';

        // handle bounds
        if (options.hasBounds) {
            // filter out bodies that are not in view
            for (i = 0; i < allBodies.length; i++) {
                var body = allBodies[i];
                if (Bounds.overlaps(body.bounds, render.bounds))
                    bodies.push(body);
            }

            // filter out constraints that are not in view
            for (i = 0; i < allConstraints.length; i++) {
                var constraint = allConstraints[i],
                    bodyA = constraint.bodyA,
                    bodyB = constraint.bodyB,
                    pointAWorld = constraint.pointA,
                    pointBWorld = constraint.pointB;

                if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
                if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);

                if (!pointAWorld || !pointBWorld)
                    continue;

                if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
                    constraints.push(constraint);
            }

            // transform the view
            Render.startViewTransform(render);

            // update mouse
            if (render.mouse) {
                Mouse.setScale(render.mouse, {
                    x: (render.bounds.max.x - render.bounds.min.x) / render.options.width,
                    y: (render.bounds.max.y - render.bounds.min.y) / render.options.height
                });

                Mouse.setOffset(render.mouse, render.bounds.min);
            }
        } else {
            constraints = allConstraints;
            bodies = allBodies;

            if (render.options.pixelRatio !== 1) {
                render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
            }
        }

        if (!options.wireframes || (engine.enableSleeping && options.showSleeping)) {
            // fully featured rendering of bodies
            Render.bodies(render, bodies, context);
        } else {
            if (options.showConvexHulls)
                Render.bodyConvexHulls(render, bodies, context);

            // optimised method for wireframes only
            Render.bodyWireframes(render, bodies, context);
        }

        if (options.showBounds)
            Render.bodyBounds(render, bodies, context);

        if (options.showAxes || options.showAngleIndicator)
            Render.bodyAxes(render, bodies, context);

        if (options.showPositions)
            Render.bodyPositions(render, bodies, context);

        if (options.showVelocity)
            Render.bodyVelocity(render, bodies, context);

        if (options.showIds)
            Render.bodyIds(render, bodies, context);

        if (options.showSeparations)
            Render.separations(render, engine.pairs.list, context);

        if (options.showCollisions)
            Render.collisions(render, engine.pairs.list, context);

        if (options.showVertexNumbers)
            Render.vertexNumbers(render, bodies, context);

        if (options.showMousePosition)
            Render.mousePosition(render, render.mouse, context);

        Render.constraints(constraints, context);

        if (options.hasBounds) {
            // revert view transforms
            Render.endViewTransform(render);
        }

        Events.trigger(render, 'afterRender', event);

        // log the time elapsed computing this update
        timing.lastElapsed = Common.now() - startTime;
    };

    /**
     * Renders statistics about the engine and world useful for debugging.
     * @private
     * @method stats
     * @param {render} render
     * @param {RenderingContext} context
     * @param {Number} time
     */
    Render.stats = function(render, context, time) {
        var engine = render.engine,
            world = engine.world,
            bodies = Composite.allBodies(world),
            parts = 0,
            width = 55,
            height = 44,
            x = 0,
            y = 0;
        
        // count parts
        for (var i = 0; i < bodies.length; i += 1) {
            parts += bodies[i].parts.length;
        }

        // sections
        var sections = {
            'Part': parts,
            'Body': bodies.length,
            'Cons': Composite.allConstraints(world).length,
            'Comp': Composite.allComposites(world).length,
            'Pair': engine.pairs.list.length
        };

        // background
        context.fillStyle = '#0e0f19';
        context.fillRect(x, y, width * 5.5, height);

        context.font = '12px Arial';
        context.textBaseline = 'top';
        context.textAlign = 'right';

        // sections
        for (var key in sections) {
            var section = sections[key];
            // label
            context.fillStyle = '#aaa';
            context.fillText(key, x + width, y + 8);

            // value
            context.fillStyle = '#eee';
            context.fillText(section, x + width, y + 26);

            x += width;
        }
    };

    /**
     * Renders engine and render performance information.
     * @private
     * @method performance
     * @param {render} render
     * @param {RenderingContext} context
     */
    Render.performance = function(render, context) {
        var engine = render.engine,
            timing = render.timing,
            deltaHistory = timing.deltaHistory,
            elapsedHistory = timing.elapsedHistory,
            timestampElapsedHistory = timing.timestampElapsedHistory,
            engineDeltaHistory = timing.engineDeltaHistory,
            engineElapsedHistory = timing.engineElapsedHistory,
            lastEngineDelta = engine.timing.lastDelta;
        
        var deltaMean = _mean(deltaHistory),
            elapsedMean = _mean(elapsedHistory),
            engineDeltaMean = _mean(engineDeltaHistory),
            engineElapsedMean = _mean(engineElapsedHistory),
            timestampElapsedMean = _mean(timestampElapsedHistory),
            rateMean = (timestampElapsedMean / deltaMean) || 0,
            fps = (1000 / deltaMean) || 0;

        var graphHeight = 4,
            gap = 12,
            width = 60,
            height = 34,
            x = 10,
            y = 69;

        // background
        context.fillStyle = '#0e0f19';
        context.fillRect(0, 50, gap * 4 + width * 5 + 22, height);

        // show FPS
        Render.status(
            context, x, y, width, graphHeight, deltaHistory.length, 
            Math.round(fps) + ' fps', 
            fps / Render._goodFps,
            function(i) { return (deltaHistory[i] / deltaMean) - 1; }
        );

        // show engine delta
        Render.status(
            context, x + gap + width, y, width, graphHeight, engineDeltaHistory.length,
            lastEngineDelta.toFixed(2) + ' dt', 
            Render._goodDelta / lastEngineDelta,
            function(i) { return (engineDeltaHistory[i] / engineDeltaMean) - 1; }
        );

        // show engine update time
        Render.status(
            context, x + (gap + width) * 2, y, width, graphHeight, engineElapsedHistory.length,
            engineElapsedMean.toFixed(2) + ' ut', 
            1 - (engineElapsedMean / Render._goodFps),
            function(i) { return (engineElapsedHistory[i] / engineElapsedMean) - 1; }
        );

        // show render time
        Render.status(
            context, x + (gap + width) * 3, y, width, graphHeight, elapsedHistory.length,
            elapsedMean.toFixed(2) + ' rt', 
            1 - (elapsedMean / Render._goodFps),
            function(i) { return (elapsedHistory[i] / elapsedMean) - 1; }
        );

        // show effective speed
        Render.status(
            context, x + (gap + width) * 4, y, width, graphHeight, timestampElapsedHistory.length, 
            rateMean.toFixed(2) + ' x', 
            rateMean * rateMean * rateMean,
            function(i) { return (((timestampElapsedHistory[i] / deltaHistory[i]) / rateMean) || 0) - 1; }
        );
    };

    /**
     * Renders a label, indicator and a chart.
     * @private
     * @method status
     * @param {RenderingContext} context
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} count
     * @param {string} label
     * @param {string} indicator
     * @param {function} plotY
     */
    Render.status = function(context, x, y, width, height, count, label, indicator, plotY) {
        // background
        context.strokeStyle = '#888';
        context.fillStyle = '#444';
        context.lineWidth = 1;
        context.fillRect(x, y + 7, width, 1);

        // chart
        context.beginPath();
        context.moveTo(x, y + 7 - height * Common.clamp(0.4 * plotY(0), -2, 2));
        for (var i = 0; i < width; i += 1) {
            context.lineTo(x + i, y + 7 - (i < count ? height * Common.clamp(0.4 * plotY(i), -2, 2) : 0));
        }
        context.stroke();

        // indicator
        context.fillStyle = 'hsl(' + Common.clamp(25 + 95 * indicator, 0, 120) + ',100%,60%)';
        context.fillRect(x, y - 7, 4, 4);

        // label
        context.font = '12px Arial';
        context.textBaseline = 'middle';
        context.textAlign = 'right';
        context.fillStyle = '#eee';
        context.fillText(label, x + width, y - 5);
    };

    /**
     * Description
     * @private
     * @method constraints
     * @param {constraint[]} constraints
     * @param {RenderingContext} context
     */
    Render.constraints = function(constraints, context) {
        var c = context;

        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];

            if (!constraint.render.visible || !constraint.pointA || !constraint.pointB)
                continue;

            var bodyA = constraint.bodyA,
                bodyB = constraint.bodyB,
                start,
                end;

            if (bodyA) {
                start = Vector.add(bodyA.position, constraint.pointA);
            } else {
                start = constraint.pointA;
            }

            if (constraint.render.type === 'pin') {
                c.beginPath();
                c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
                c.closePath();
            } else {
                if (bodyB) {
                    end = Vector.add(bodyB.position, constraint.pointB);
                } else {
                    end = constraint.pointB;
                }

                c.beginPath();
                c.moveTo(start.x, start.y);

                if (constraint.render.type === 'spring') {
                    var delta = Vector.sub(end, start),
                        normal = Vector.perp(Vector.normalise(delta)),
                        coils = Math.ceil(Common.clamp(constraint.length / 5, 12, 20)),
                        offset;

                    for (var j = 1; j < coils; j += 1) {
                        offset = j % 2 === 0 ? 1 : -1;

                        c.lineTo(
                            start.x + delta.x * (j / coils) + normal.x * offset * 4,
                            start.y + delta.y * (j / coils) + normal.y * offset * 4
                        );
                    }
                }

                c.lineTo(end.x, end.y);
            }

            if (constraint.render.lineWidth) {
                c.lineWidth = constraint.render.lineWidth;
                c.strokeStyle = constraint.render.strokeStyle;
                c.stroke();
            }

            if (constraint.render.anchors) {
                c.fillStyle = constraint.render.strokeStyle;
                c.beginPath();
                c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
                c.arc(end.x, end.y, 3, 0, 2 * Math.PI);
                c.closePath();
                c.fill();
            }
        }
    };

    /**
     * Description
     * @private
     * @method bodies
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodies = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            showInternalEdges = options.showInternalEdges || !options.wireframes,
            body,
            part,
            i,
            k;

        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // handle compound parts
            for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                part = body.parts[k];

                if (!part.render.visible)
                    continue;

                if (options.showSleeping && body.isSleeping) {
                    c.globalAlpha = 0.5 * part.render.opacity;
                } else if (part.render.opacity !== 1) {
                    c.globalAlpha = part.render.opacity;
                }

                if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
                    // part sprite
                    var sprite = part.render.sprite,
                        texture = _getTexture(render, sprite.texture);

                    c.translate(part.position.x, part.position.y);
                    c.rotate(part.angle);

                    c.drawImage(
                        texture,
                        texture.width * -sprite.xOffset * sprite.xScale,
                        texture.height * -sprite.yOffset * sprite.yScale,
                        texture.width * sprite.xScale,
                        texture.height * sprite.yScale
                    );

                    // revert translation, hopefully faster than save / restore
                    c.rotate(-part.angle);
                    c.translate(-part.position.x, -part.position.y);
                } else {
                    // part polygon
                    if (part.circleRadius) {
                        c.beginPath();
                        c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
                    } else {
                        c.beginPath();
                        c.moveTo(part.vertices[0].x, part.vertices[0].y);

                        for (var j = 1; j < part.vertices.length; j++) {
                            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                                c.lineTo(part.vertices[j].x, part.vertices[j].y);
                            } else {
                                c.moveTo(part.vertices[j].x, part.vertices[j].y);
                            }

                            if (part.vertices[j].isInternal && !showInternalEdges) {
                                c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                            }
                        }

                        c.lineTo(part.vertices[0].x, part.vertices[0].y);
                        c.closePath();
                    }

                    if (!options.wireframes) {
                        c.fillStyle = part.render.fillStyle;

                        if (part.render.lineWidth) {
                            c.lineWidth = part.render.lineWidth;
                            c.strokeStyle = part.render.strokeStyle;
                            c.stroke();
                        }

                        c.fill();
                    } else {
                        c.lineWidth = 1;
                        c.strokeStyle = '#bbb';
                        c.stroke();
                    }
                }

                c.globalAlpha = 1;
            }
        }
    };

    /**
     * Optimised method for drawing body wireframes in one pass
     * @private
     * @method bodyWireframes
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyWireframes = function(render, bodies, context) {
        var c = context,
            showInternalEdges = render.options.showInternalEdges,
            body,
            part,
            i,
            j,
            k;

        c.beginPath();

        // render all bodies
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // handle compound parts
            for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                part = body.parts[k];

                c.moveTo(part.vertices[0].x, part.vertices[0].y);

                for (j = 1; j < part.vertices.length; j++) {
                    if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                        c.lineTo(part.vertices[j].x, part.vertices[j].y);
                    } else {
                        c.moveTo(part.vertices[j].x, part.vertices[j].y);
                    }

                    if (part.vertices[j].isInternal && !showInternalEdges) {
                        c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                    }
                }

                c.lineTo(part.vertices[0].x, part.vertices[0].y);
            }
        }

        c.lineWidth = 1;
        c.strokeStyle = '#bbb';
        c.stroke();
    };

    /**
     * Optimised method for drawing body convex hull wireframes in one pass
     * @private
     * @method bodyConvexHulls
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyConvexHulls = function(render, bodies, context) {
        var c = context,
            body,
            part,
            i,
            j,
            k;

        c.beginPath();

        // render convex hulls
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible || body.parts.length === 1)
                continue;

            c.moveTo(body.vertices[0].x, body.vertices[0].y);

            for (j = 1; j < body.vertices.length; j++) {
                c.lineTo(body.vertices[j].x, body.vertices[j].y);
            }

            c.lineTo(body.vertices[0].x, body.vertices[0].y);
        }

        c.lineWidth = 1;
        c.strokeStyle = 'rgba(255,255,255,0.2)';
        c.stroke();
    };

    /**
     * Renders body vertex numbers.
     * @private
     * @method vertexNumbers
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.vertexNumbers = function(render, bodies, context) {
        var c = context,
            i,
            j,
            k;

        for (i = 0; i < bodies.length; i++) {
            var parts = bodies[i].parts;
            for (k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
                var part = parts[k];
                for (j = 0; j < part.vertices.length; j++) {
                    c.fillStyle = 'rgba(255,255,255,0.2)';
                    c.fillText(i + '_' + j, part.position.x + (part.vertices[j].x - part.position.x) * 0.8, part.position.y + (part.vertices[j].y - part.position.y) * 0.8);
                }
            }
        }
    };

    /**
     * Renders mouse position.
     * @private
     * @method mousePosition
     * @param {render} render
     * @param {mouse} mouse
     * @param {RenderingContext} context
     */
    Render.mousePosition = function(render, mouse, context) {
        var c = context;
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.fillText(mouse.position.x + '  ' + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
    };

    /**
     * Draws body bounds
     * @private
     * @method bodyBounds
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyBounds = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options;

        c.beginPath();

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.render.visible) {
                var parts = bodies[i].parts;
                for (var j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    var part = parts[j];
                    c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
                }
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,255,255,0.08)';
        } else {
            c.strokeStyle = 'rgba(0,0,0,0.1)';
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Draws body angle indicators and axes
     * @private
     * @method bodyAxes
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyAxes = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            part,
            i,
            j,
            k;

        c.beginPath();

        for (i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                parts = body.parts;

            if (!body.render.visible)
                continue;

            if (options.showAxes) {
                // render all axes
                for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    part = parts[j];
                    for (k = 0; k < part.axes.length; k++) {
                        var axis = part.axes[k];
                        c.moveTo(part.position.x, part.position.y);
                        c.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
                    }
                }
            } else {
                for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    part = parts[j];
                    for (k = 0; k < part.axes.length; k++) {
                        // render a single axis indicator
                        c.moveTo(part.position.x, part.position.y);
                        c.lineTo((part.vertices[0].x + part.vertices[part.vertices.length-1].x) / 2,
                            (part.vertices[0].y + part.vertices[part.vertices.length-1].y) / 2);
                    }
                }
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'indianred';
            c.lineWidth = 1;
        } else {
            c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            c.globalCompositeOperation = 'overlay';
            c.lineWidth = 2;
        }

        c.stroke();
        c.globalCompositeOperation = 'source-over';
    };

    /**
     * Draws body positions
     * @private
     * @method bodyPositions
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyPositions = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            body,
            part,
            i,
            k;

        c.beginPath();

        // render current positions
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // handle compound parts
            for (k = 0; k < body.parts.length; k++) {
                part = body.parts[k];
                c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
                c.closePath();
            }
        }

        if (options.wireframes) {
            c.fillStyle = 'indianred';
        } else {
            c.fillStyle = 'rgba(0,0,0,0.5)';
        }
        c.fill();

        c.beginPath();

        // render previous positions
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];
            if (body.render.visible) {
                c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
                c.closePath();
            }
        }

        c.fillStyle = 'rgba(255,165,0,0.8)';
        c.fill();
    };

    /**
     * Draws body velocity
     * @private
     * @method bodyVelocity
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyVelocity = function(render, bodies, context) {
        var c = context;

        c.beginPath();

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (!body.render.visible)
                continue;

            c.moveTo(body.position.x, body.position.y);
            c.lineTo(body.position.x + (body.position.x - body.positionPrev.x) * 2, body.position.y + (body.position.y - body.positionPrev.y) * 2);
        }

        c.lineWidth = 3;
        c.strokeStyle = 'cornflowerblue';
        c.stroke();
    };

    /**
     * Draws body ids
     * @private
     * @method bodyIds
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyIds = function(render, bodies, context) {
        var c = context,
            i,
            j;

        for (i = 0; i < bodies.length; i++) {
            if (!bodies[i].render.visible)
                continue;

            var parts = bodies[i].parts;
            for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                var part = parts[j];
                c.font = "12px Arial";
                c.fillStyle = 'rgba(255,255,255,0.5)';
                c.fillText(part.id, part.position.x + 10, part.position.y - 10);
            }
        }
    };

    /**
     * Description
     * @private
     * @method collisions
     * @param {render} render
     * @param {pair[]} pairs
     * @param {RenderingContext} context
     */
    Render.collisions = function(render, pairs, context) {
        var c = context,
            options = render.options,
            pair,
            collision,
            corrected,
            bodyA,
            bodyB,
            i,
            j;

        c.beginPath();

        // render collision positions
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;
            for (j = 0; j < pair.activeContacts.length; j++) {
                var contact = pair.activeContacts[j],
                    vertex = contact.vertex;
                c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
            }
        }

        if (options.wireframes) {
            c.fillStyle = 'rgba(255,255,255,0.7)';
        } else {
            c.fillStyle = 'orange';
        }
        c.fill();

        c.beginPath();

        // render collision normals
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;

            if (pair.activeContacts.length > 0) {
                var normalPosX = pair.activeContacts[0].vertex.x,
                    normalPosY = pair.activeContacts[0].vertex.y;

                if (pair.activeContacts.length === 2) {
                    normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                    normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
                }

                if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                    c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
                } else {
                    c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
                }

                c.lineTo(normalPosX, normalPosY);
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,165,0,0.7)';
        } else {
            c.strokeStyle = 'orange';
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Description
     * @private
     * @method separations
     * @param {render} render
     * @param {pair[]} pairs
     * @param {RenderingContext} context
     */
    Render.separations = function(render, pairs, context) {
        var c = context,
            options = render.options,
            pair,
            collision,
            corrected,
            bodyA,
            bodyB,
            i,
            j;

        c.beginPath();

        // render separations
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            var k = 1;

            if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
            if (bodyB.isStatic) k = 0;

            c.moveTo(bodyB.position.x, bodyB.position.y);
            c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);

            k = 1;

            if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
            if (bodyA.isStatic) k = 0;

            c.moveTo(bodyA.position.x, bodyA.position.y);
            c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,165,0,0.5)';
        } else {
            c.strokeStyle = 'orange';
        }
        c.stroke();
    };

    /**
     * Description
     * @private
     * @method inspector
     * @param {inspector} inspector
     * @param {RenderingContext} context
     */
    Render.inspector = function(inspector, context) {
        var engine = inspector.engine,
            selected = inspector.selected,
            render = inspector.render,
            options = render.options,
            bounds;

        if (options.hasBounds) {
            var boundsWidth = render.bounds.max.x - render.bounds.min.x,
                boundsHeight = render.bounds.max.y - render.bounds.min.y,
                boundsScaleX = boundsWidth / render.options.width,
                boundsScaleY = boundsHeight / render.options.height;

            context.scale(1 / boundsScaleX, 1 / boundsScaleY);
            context.translate(-render.bounds.min.x, -render.bounds.min.y);
        }

        for (var i = 0; i < selected.length; i++) {
            var item = selected[i].data;

            context.translate(0.5, 0.5);
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255,165,0,0.9)';
            context.setLineDash([1,2]);

            switch (item.type) {

            case 'body':

                // render body selections
                bounds = item.bounds;
                context.beginPath();
                context.rect(Math.floor(bounds.min.x - 3), Math.floor(bounds.min.y - 3),
                    Math.floor(bounds.max.x - bounds.min.x + 6), Math.floor(bounds.max.y - bounds.min.y + 6));
                context.closePath();
                context.stroke();

                break;

            case 'constraint':

                // render constraint selections
                var point = item.pointA;
                if (item.bodyA)
                    point = item.pointB;
                context.beginPath();
                context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                context.closePath();
                context.stroke();

                break;

            }

            context.setLineDash([]);
            context.translate(-0.5, -0.5);
        }

        // render selection region
        if (inspector.selectStart !== null) {
            context.translate(0.5, 0.5);
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255,165,0,0.6)';
            context.fillStyle = 'rgba(255,165,0,0.1)';
            bounds = inspector.selectBounds;
            context.beginPath();
            context.rect(Math.floor(bounds.min.x), Math.floor(bounds.min.y),
                Math.floor(bounds.max.x - bounds.min.x), Math.floor(bounds.max.y - bounds.min.y));
            context.closePath();
            context.stroke();
            context.fill();
            context.translate(-0.5, -0.5);
        }

        if (options.hasBounds)
            context.setTransform(1, 0, 0, 1, 0, 0);
    };

    /**
     * Updates render timing.
     * @method _updateTiming
     * @private
     * @param {render} render
     * @param {number} time
     */
    var _updateTiming = function(render, time) {
        var engine = render.engine,
            timing = render.timing,
            historySize = timing.historySize,
            timestamp = engine.timing.timestamp;

        timing.delta = time - timing.lastTime || Render._goodDelta;
        timing.lastTime = time;

        timing.timestampElapsed = timestamp - timing.lastTimestamp || 0;
        timing.lastTimestamp = timestamp;

        timing.deltaHistory.unshift(timing.delta);
        timing.deltaHistory.length = Math.min(timing.deltaHistory.length, historySize);

        timing.engineDeltaHistory.unshift(engine.timing.lastDelta);
        timing.engineDeltaHistory.length = Math.min(timing.engineDeltaHistory.length, historySize);

        timing.timestampElapsedHistory.unshift(timing.timestampElapsed);
        timing.timestampElapsedHistory.length = Math.min(timing.timestampElapsedHistory.length, historySize);

        timing.engineElapsedHistory.unshift(engine.timing.lastElapsed);
        timing.engineElapsedHistory.length = Math.min(timing.engineElapsedHistory.length, historySize);

        timing.elapsedHistory.unshift(timing.lastElapsed);
        timing.elapsedHistory.length = Math.min(timing.elapsedHistory.length, historySize);
    };

    /**
     * Returns the mean value of the given numbers.
     * @method _mean
     * @private
     * @param {Number[]} values
     * @return {Number} the mean of given values
     */
    var _mean = function(values) {
        var result = 0;
        for (var i = 0; i < values.length; i += 1) {
            result += values[i];
        }
        return (result / values.length) || 0;
    };

    /**
     * @method _createCanvas
     * @private
     * @param {} width
     * @param {} height
     * @return canvas
     */
    var _createCanvas = function(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = function() { return false; };
        canvas.onselectstart = function() { return false; };
        return canvas;
    };

    /**
     * Gets the pixel ratio of the canvas.
     * @method _getPixelRatio
     * @private
     * @param {HTMLElement} canvas
     * @return {Number} pixel ratio
     */
    var _getPixelRatio = function(canvas) {
        var context = canvas.getContext('2d'),
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                                      || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                                      || context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStorePixelRatio;
    };

    /**
     * Gets the requested texture (an Image) via its path
     * @method _getTexture
     * @private
     * @param {render} render
     * @param {string} imagePath
     * @return {Image} texture
     */
    var _getTexture = function(render, imagePath) {
        var image = render.textures[imagePath];

        if (image)
            return image;

        image = render.textures[imagePath] = new Image();
        image.src = imagePath;

        return image;
    };

    /**
     * Applies the background to the canvas using CSS.
     * @method applyBackground
     * @private
     * @param {render} render
     * @param {string} background
     */
    var _applyBackground = function(render, background) {
        var cssBackground = background;

        if (/(jpg|gif|png)$/.test(background))
            cssBackground = 'url(' + background + ')';

        render.canvas.style.background = cssBackground;
        render.canvas.style.backgroundSize = "contain";
        render.currentBackground = background;
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired before rendering
    *
    * @event beforeRender
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after rendering
    *
    * @event afterRender
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * A back-reference to the `Matter.Render` module.
     *
     * @property controller
     * @type render
     */

    /**
     * A reference to the `Matter.Engine` instance to be used.
     *
     * @property engine
     * @type engine
     */

    /**
     * A reference to the element where the canvas is to be inserted (if `render.canvas` has not been specified)
     *
     * @property element
     * @type HTMLElement
     * @default null
     */

    /**
     * The canvas element to render to. If not specified, one will be created if `render.element` has been specified.
     *
     * @property canvas
     * @type HTMLCanvasElement
     * @default null
     */

    /**
     * A `Bounds` object that specifies the drawing view region.
     * Rendering will be automatically transformed and scaled to fit within the canvas size (`render.options.width` and `render.options.height`).
     * This allows for creating views that can pan or zoom around the scene.
     * You must also set `render.options.hasBounds` to `true` to enable bounded rendering.
     *
     * @property bounds
     * @type bounds
     */

    /**
     * The 2d rendering context from the `render.canvas` element.
     *
     * @property context
     * @type CanvasRenderingContext2D
     */

    /**
     * The sprite texture cache.
     *
     * @property textures
     * @type {}
     */

    /**
     * The mouse to render if `render.options.showMousePosition` is enabled.
     *
     * @property mouse
     * @type mouse
     * @default null
     */

    /**
     * The configuration options of the renderer.
     *
     * @property options
     * @type {}
     */

    /**
     * The target width in pixels of the `render.canvas` to be created.
     * See also the `options.pixelRatio` property to change render quality.
     *
     * @property options.width
     * @type number
     * @default 800
     */

    /**
     * The target height in pixels of the `render.canvas` to be created.
     * See also the `options.pixelRatio` property to change render quality.
     *
     * @property options.height
     * @type number
     * @default 600
     */

    /**
     * The [pixel ratio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) to use when rendering.
     *
     * @property options.pixelRatio
     * @type number
     * @default 1
     */

    /**
     * A CSS background color string to use when `render.options.wireframes` is disabled.
     * This may be also set to `'transparent'` or equivalent.
     *
     * @property options.background
     * @type string
     * @default '#14151f'
     */

    /**
     * A CSS background color string to use when `render.options.wireframes` is enabled.
     * This may be also set to `'transparent'` or equivalent.
     *
     * @property options.wireframeBackground
     * @type string
     * @default '#14151f'
     */

    /**
     * A flag that specifies if `render.bounds` should be used when rendering.
     *
     * @property options.hasBounds
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable all debug information overlays together.  
     * This includes and has priority over the values of:
     *
     * - `render.options.showStats`
     * - `render.options.showPerformance`
     *
     * @property options.showDebug
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the engine stats info overlay.  
     * From left to right, the values shown are:
     *
     * - body parts total
     * - body total
     * - constraints total
     * - composites total
     * - collision pairs total
     *
     * @property options.showStats
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable performance charts.  
     * From left to right, the values shown are:
     *
     * - average render frequency (e.g. 60 fps)
     * - exact engine delta time used for last update (e.g. 16.66ms)
     * - average engine execution duration (e.g. 5.00ms)
     * - average render execution duration (e.g. 0.40ms)
     * - average effective play speed (e.g. '1.00x' is 'real-time')
     *
     * Each value is recorded over a fixed sample of past frames (60 frames).
     *
     * A chart shown below each value indicates the variance from the average over the sample.
     * The more stable or fixed the value is the flatter the chart will appear.
     *
     * @property options.showPerformance
     * @type boolean
     * @default false
     */
    
    /**
     * A flag to enable or disable rendering entirely.
     *
     * @property options.enabled
     * @type boolean
     * @default false
     */

    /**
     * A flag to toggle wireframe rendering otherwise solid fill rendering is used.
     *
     * @property options.wireframes
     * @type boolean
     * @default true
     */

    /**
     * A flag to enable or disable sleeping bodies indicators.
     *
     * @property options.showSleeping
     * @type boolean
     * @default true
     */

    /**
     * A flag to enable or disable the debug information overlay.
     *
     * @property options.showDebug
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the collision broadphase debug overlay.
     *
     * @deprecated no longer implemented
     * @property options.showBroadphase
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body bounds debug overlay.
     *
     * @property options.showBounds
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body velocity debug overlay.
     *
     * @property options.showVelocity
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body collisions debug overlay.
     *
     * @property options.showCollisions
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the collision resolver separations debug overlay.
     *
     * @property options.showSeparations
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body axes debug overlay.
     *
     * @property options.showAxes
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body positions debug overlay.
     *
     * @property options.showPositions
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body angle debug overlay.
     *
     * @property options.showAngleIndicator
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body and part ids debug overlay.
     *
     * @property options.showIds
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body vertex numbers debug overlay.
     *
     * @property options.showVertexNumbers
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body convex hulls debug overlay.
     *
     * @property options.showConvexHulls
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the body internal edges debug overlay.
     *
     * @property options.showInternalEdges
     * @type boolean
     * @default false
     */

    /**
     * A flag to enable or disable the mouse position debug overlay.
     *
     * @property options.showMousePosition
     * @type boolean
     * @default false
     */

})();


/***/ }),
/* 17 */
/***/ (function(module, exports) {

/**
* The `Matter.Contact` module contains methods for creating and manipulating collision contacts.
*
* @class Contact
*/

var Contact = {};

module.exports = Contact;

(function() {

    /**
     * Creates a new contact.
     * @method create
     * @param {vertex} vertex
     * @return {contact} A new contact
     */
    Contact.create = function(vertex) {
        return {
            vertex: vertex,
            normalImpulse: 0,
            tangentImpulse: 0
        };
    };

})();


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Engine` module contains methods for creating and manipulating engines.
* An engine is a controller that manages updating the simulation of the world.
* See `Matter.Runner` for an optional game loop utility.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Engine
*/

var Engine = {};

module.exports = Engine;

var Sleeping = __webpack_require__(7);
var Resolver = __webpack_require__(19);
var Detector = __webpack_require__(14);
var Pairs = __webpack_require__(20);
var Events = __webpack_require__(4);
var Composite = __webpack_require__(5);
var Constraint = __webpack_require__(10);
var Common = __webpack_require__(0);
var Body = __webpack_require__(6);

(function() {

    /**
     * Creates a new engine. The options parameter is an object that specifies any properties you wish to override the defaults.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {object} [options]
     * @return {engine} engine
     */
    Engine.create = function(options) {
        options = options || {};

        var defaults = {
            positionIterations: 6,
            velocityIterations: 4,
            constraintIterations: 2,
            enableSleeping: false,
            events: [],
            plugin: {},
            gravity: {
                x: 0,
                y: 1,
                scale: 0.001
            },
            timing: {
                timestamp: 0,
                timeScale: 1,
                lastDelta: 0,
                lastElapsed: 0
            }
        };

        var engine = Common.extend(defaults, options);

        engine.world = options.world || Composite.create({ label: 'World' });
        engine.pairs = options.pairs || Pairs.create();
        engine.detector = options.detector || Detector.create();

        // for temporary back compatibility only
        engine.grid = { buckets: [] };
        engine.world.gravity = engine.gravity;
        engine.broadphase = engine.grid;
        engine.metrics = {};
        
        return engine;
    };

    /**
     * Moves the simulation forward in time by `delta` ms.
     * The `correction` argument is an optional `Number` that specifies the time correction factor to apply to the update.
     * This can help improve the accuracy of the simulation in cases where `delta` is changing between updates.
     * The value of `correction` is defined as `delta / lastDelta`, i.e. the percentage change of `delta` over the last step.
     * Therefore the value is always `1` (no correction) when `delta` constant (or when no correction is desired, which is the default).
     * See the paper on <a href="http://lonesock.net/article/verlet.html">Time Corrected Verlet</a> for more information.
     *
     * Triggers `beforeUpdate` and `afterUpdate` events.
     * Triggers `collisionStart`, `collisionActive` and `collisionEnd` events.
     * @method update
     * @param {engine} engine
     * @param {number} [delta=16.666]
     * @param {number} [correction=1]
     */
    Engine.update = function(engine, delta, correction) {
        var startTime = Common.now();

        delta = delta || 1000 / 60;
        correction = correction || 1;

        var world = engine.world,
            detector = engine.detector,
            pairs = engine.pairs,
            timing = engine.timing,
            timestamp = timing.timestamp,
            i;

        // increment timestamp
        timing.timestamp += delta * timing.timeScale;
        timing.lastDelta = delta * timing.timeScale;

        // create an event object
        var event = {
            timestamp: timing.timestamp
        };

        Events.trigger(engine, 'beforeUpdate', event);

        // get all bodies and all constraints in the world
        var allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world);

        // update the detector bodies if they have changed
        if (world.isModified) {
            Detector.setBodies(detector, allBodies);
        }

        // reset all composite modified flags
        if (world.isModified) {
            Composite.setModified(world, false, false, true);
        }

        // update sleeping if enabled
        if (engine.enableSleeping)
            Sleeping.update(allBodies, timing.timeScale);

        // apply gravity to all bodies
        Engine._bodiesApplyGravity(allBodies, engine.gravity);

        // update all body position and rotation by integration
        Engine._bodiesUpdate(allBodies, delta, timing.timeScale, correction, world.bounds);

        // update all constraints (first pass)
        Constraint.preSolveAll(allBodies);
        for (i = 0; i < engine.constraintIterations; i++) {
            Constraint.solveAll(allConstraints, timing.timeScale);
        }
        Constraint.postSolveAll(allBodies);

        // find all collisions
        detector.pairs = engine.pairs;
        var collisions = Detector.collisions(detector);

        // update collision pairs
        Pairs.update(pairs, collisions, timestamp);

        // wake up bodies involved in collisions
        if (engine.enableSleeping)
            Sleeping.afterCollisions(pairs.list, timing.timeScale);

        // trigger collision events
        if (pairs.collisionStart.length > 0)
            Events.trigger(engine, 'collisionStart', { pairs: pairs.collisionStart });

        // iteratively resolve position between collisions
        Resolver.preSolvePosition(pairs.list);
        for (i = 0; i < engine.positionIterations; i++) {
            Resolver.solvePosition(pairs.list, timing.timeScale);
        }
        Resolver.postSolvePosition(allBodies);

        // update all constraints (second pass)
        Constraint.preSolveAll(allBodies);
        for (i = 0; i < engine.constraintIterations; i++) {
            Constraint.solveAll(allConstraints, timing.timeScale);
        }
        Constraint.postSolveAll(allBodies);

        // iteratively resolve velocity between collisions
        Resolver.preSolveVelocity(pairs.list);
        for (i = 0; i < engine.velocityIterations; i++) {
            Resolver.solveVelocity(pairs.list, timing.timeScale);
        }

        // trigger collision events
        if (pairs.collisionActive.length > 0)
            Events.trigger(engine, 'collisionActive', { pairs: pairs.collisionActive });

        if (pairs.collisionEnd.length > 0)
            Events.trigger(engine, 'collisionEnd', { pairs: pairs.collisionEnd });

        // clear force buffers
        Engine._bodiesClearForces(allBodies);

        Events.trigger(engine, 'afterUpdate', event);

        // log the time elapsed computing this update
        engine.timing.lastElapsed = Common.now() - startTime;

        return engine;
    };
    
    /**
     * Merges two engines by keeping the configuration of `engineA` but replacing the world with the one from `engineB`.
     * @method merge
     * @param {engine} engineA
     * @param {engine} engineB
     */
    Engine.merge = function(engineA, engineB) {
        Common.extend(engineA, engineB);
        
        if (engineB.world) {
            engineA.world = engineB.world;

            Engine.clear(engineA);

            var bodies = Composite.allBodies(engineA.world);

            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                Sleeping.set(body, false);
                body.id = Common.nextId();
            }
        }
    };

    /**
     * Clears the engine pairs and detector.
     * @method clear
     * @param {engine} engine
     */
    Engine.clear = function(engine) {
        Pairs.clear(engine.pairs);
        Detector.clear(engine.detector);
    };

    /**
     * Zeroes the `body.force` and `body.torque` force buffers.
     * @method _bodiesClearForces
     * @private
     * @param {body[]} bodies
     */
    Engine._bodiesClearForces = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            // reset force buffers
            body.force.x = 0;
            body.force.y = 0;
            body.torque = 0;
        }
    };

    /**
     * Applys a mass dependant force to all given bodies.
     * @method _bodiesApplyGravity
     * @private
     * @param {body[]} bodies
     * @param {vector} gravity
     */
    Engine._bodiesApplyGravity = function(bodies, gravity) {
        var gravityScale = typeof gravity.scale !== 'undefined' ? gravity.scale : 0.001;

        if ((gravity.x === 0 && gravity.y === 0) || gravityScale === 0) {
            return;
        }
        
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            // apply gravity
            body.force.y += body.mass * gravity.y * gravityScale;
            body.force.x += body.mass * gravity.x * gravityScale;
        }
    };

    /**
     * Applys `Body.update` to all given `bodies`.
     * @method _bodiesUpdate
     * @private
     * @param {body[]} bodies
     * @param {number} deltaTime 
     * The amount of time elapsed between updates
     * @param {number} timeScale
     * @param {number} correction 
     * The Verlet correction factor (deltaTime / lastDeltaTime)
     * @param {bounds} worldBounds
     */
    Engine._bodiesUpdate = function(bodies, deltaTime, timeScale, correction, worldBounds) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            Body.update(body, deltaTime, timeScale, correction);
        }
    };

    /**
     * A deprecated alias for `Runner.run`, use `Matter.Runner.run(engine)` instead and see `Matter.Runner` for more information.
     * @deprecated use Matter.Runner.run(engine) instead
     * @method run
     * @param {engine} engine
     */

    /**
    * Fired just before an update
    *
    * @event beforeUpdate
    * @param {object} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {engine} event.source The source object of the event
    * @param {string} event.name The name of the event
    */

    /**
    * Fired after engine update and all collision events
    *
    * @event afterUpdate
    * @param {object} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {engine} event.source The source object of the event
    * @param {string} event.name The name of the event
    */

    /**
    * Fired after engine update, provides a list of all pairs that have started to collide in the current tick (if any)
    *
    * @event collisionStart
    * @param {object} event An event object
    * @param {pair[]} event.pairs List of affected pairs
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {engine} event.source The source object of the event
    * @param {string} event.name The name of the event
    */

    /**
    * Fired after engine update, provides a list of all pairs that are colliding in the current tick (if any)
    *
    * @event collisionActive
    * @param {object} event An event object
    * @param {pair[]} event.pairs List of affected pairs
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {engine} event.source The source object of the event
    * @param {string} event.name The name of the event
    */

    /**
    * Fired after engine update, provides a list of all pairs that have ended collision in the current tick (if any)
    *
    * @event collisionEnd
    * @param {object} event An event object
    * @param {pair[]} event.pairs List of affected pairs
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {engine} event.source The source object of the event
    * @param {string} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` that specifies the number of position iterations to perform each update.
     * The higher the value, the higher quality the simulation will be at the expense of performance.
     *
     * @property positionIterations
     * @type number
     * @default 6
     */

    /**
     * An integer `Number` that specifies the number of velocity iterations to perform each update.
     * The higher the value, the higher quality the simulation will be at the expense of performance.
     *
     * @property velocityIterations
     * @type number
     * @default 4
     */

    /**
     * An integer `Number` that specifies the number of constraint iterations to perform each update.
     * The higher the value, the higher quality the simulation will be at the expense of performance.
     * The default value of `2` is usually very adequate.
     *
     * @property constraintIterations
     * @type number
     * @default 2
     */

    /**
     * A flag that specifies whether the engine should allow sleeping via the `Matter.Sleeping` module.
     * Sleeping can improve stability and performance, but often at the expense of accuracy.
     *
     * @property enableSleeping
     * @type boolean
     * @default false
     */

    /**
     * An `Object` containing properties regarding the timing systems of the engine. 
     *
     * @property timing
     * @type object
     */

    /**
     * A `Number` that specifies the global scaling factor of time for all bodies.
     * A value of `0` freezes the simulation.
     * A value of `0.1` gives a slow-motion effect.
     * A value of `1.2` gives a speed-up effect.
     *
     * @property timing.timeScale
     * @type number
     * @default 1
     */

    /**
     * A `Number` that specifies the current simulation-time in milliseconds starting from `0`. 
     * It is incremented on every `Engine.update` by the given `delta` argument. 
     *
     * @property timing.timestamp
     * @type number
     * @default 0
     */

    /**
     * A `Number` that represents the total execution time elapsed during the last `Engine.update` in milliseconds.
     * It is updated by timing from the start of the last `Engine.update` call until it ends.
     *
     * This value will also include the total execution time of all event handlers directly or indirectly triggered by the engine update.
     *
     * @property timing.lastElapsed
     * @type number
     * @default 0
     */

    /**
     * A `Number` that represents the `delta` value used in the last engine update.
     *
     * @property timing.lastDelta
     * @type number
     * @default 0
     */

    /**
     * A `Matter.Detector` instance.
     *
     * @property detector
     * @type detector
     * @default a Matter.Detector instance
     */

    /**
     * A `Matter.Grid` instance.
     *
     * @deprecated replaced by `engine.detector`
     * @property grid
     * @type grid
     * @default a Matter.Grid instance
     */

    /**
     * Replaced by and now alias for `engine.grid`.
     *
     * @deprecated replaced by `engine.detector`
     * @property broadphase
     * @type grid
     * @default a Matter.Grid instance
     */

    /**
     * The root `Matter.Composite` instance that will contain all bodies, constraints and other composites to be simulated by this engine.
     *
     * @property world
     * @type composite
     * @default a Matter.Composite instance
     */

    /**
     * An object reserved for storing plugin-specific properties.
     *
     * @property plugin
     * @type {}
     */

    /**
     * The gravity to apply on all bodies in `engine.world`.
     *
     * @property gravity
     * @type object
     */

    /**
     * The gravity x component.
     *
     * @property gravity.x
     * @type object
     * @default 0
     */

    /**
     * The gravity y component.
     *
     * @property gravity.y
     * @type object
     * @default 1
     */

    /**
     * The gravity scale factor.
     *
     * @property gravity.scale
     * @type object
     * @default 0.001
     */

})();


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Resolver` module contains methods for resolving collision pairs.
*
* @class Resolver
*/

var Resolver = {};

module.exports = Resolver;

var Vertices = __webpack_require__(3);
var Bounds = __webpack_require__(1);

(function() {

    Resolver._restingThresh = 4;
    Resolver._restingThreshTangent = 6;
    Resolver._positionDampen = 0.9;
    Resolver._positionWarming = 0.8;
    Resolver._frictionNormalMultiplier = 5;

    /**
     * Prepare pairs for position solving.
     * @method preSolvePosition
     * @param {pair[]} pairs
     */
    Resolver.preSolvePosition = function(pairs) {
        var i,
            pair,
            activeCount,
            pairsLength = pairs.length;

        // find total contacts on each body
        for (i = 0; i < pairsLength; i++) {
            pair = pairs[i];
            
            if (!pair.isActive)
                continue;
            
            activeCount = pair.activeContacts.length;
            pair.collision.parentA.totalContacts += activeCount;
            pair.collision.parentB.totalContacts += activeCount;
        }
    };

    /**
     * Find a solution for pair positions.
     * @method solvePosition
     * @param {pair[]} pairs
     * @param {number} timeScale
     */
    Resolver.solvePosition = function(pairs, timeScale) {
        var i,
            pair,
            collision,
            bodyA,
            bodyB,
            normal,
            contactShare,
            positionImpulse,
            positionDampen = Resolver._positionDampen,
            pairsLength = pairs.length;

        // find impulses required to resolve penetration
        for (i = 0; i < pairsLength; i++) {
            pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;

            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;

            // get current separation between body edges involved in collision
            pair.separation = 
                normal.x * (bodyB.positionImpulse.x + collision.penetration.x - bodyA.positionImpulse.x)
                + normal.y * (bodyB.positionImpulse.y + collision.penetration.y - bodyA.positionImpulse.y);
        }
        
        for (i = 0; i < pairsLength; i++) {
            pair = pairs[i];

            if (!pair.isActive || pair.isSensor)
                continue;
            
            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;
            positionImpulse = (pair.separation - pair.slop) * timeScale;

            if (bodyA.isStatic || bodyB.isStatic)
                positionImpulse *= 2;
            
            if (!(bodyA.isStatic || bodyA.isSleeping)) {
                contactShare = positionDampen / bodyA.totalContacts;
                bodyA.positionImpulse.x += normal.x * positionImpulse * contactShare;
                bodyA.positionImpulse.y += normal.y * positionImpulse * contactShare;
            }

            if (!(bodyB.isStatic || bodyB.isSleeping)) {
                contactShare = positionDampen / bodyB.totalContacts;
                bodyB.positionImpulse.x -= normal.x * positionImpulse * contactShare;
                bodyB.positionImpulse.y -= normal.y * positionImpulse * contactShare;
            }
        }
    };

    /**
     * Apply position resolution.
     * @method postSolvePosition
     * @param {body[]} bodies
     */
    Resolver.postSolvePosition = function(bodies) {
        var positionWarming = Resolver._positionWarming,
            bodiesLength = bodies.length,
            verticesTranslate = Vertices.translate,
            boundsUpdate = Bounds.update;

        for (var i = 0; i < bodiesLength; i++) {
            var body = bodies[i],
                positionImpulse = body.positionImpulse,
                positionImpulseX = positionImpulse.x,
                positionImpulseY = positionImpulse.y,
                velocity = body.velocity;

            // reset contact count
            body.totalContacts = 0;

            if (positionImpulseX !== 0 || positionImpulseY !== 0) {
                // update body geometry
                for (var j = 0; j < body.parts.length; j++) {
                    var part = body.parts[j];
                    verticesTranslate(part.vertices, positionImpulse);
                    boundsUpdate(part.bounds, part.vertices, velocity);
                    part.position.x += positionImpulseX;
                    part.position.y += positionImpulseY;
                }

                // move the body without changing velocity
                body.positionPrev.x += positionImpulseX;
                body.positionPrev.y += positionImpulseY;

                if (positionImpulseX * velocity.x + positionImpulseY * velocity.y < 0) {
                    // reset cached impulse if the body has velocity along it
                    positionImpulse.x = 0;
                    positionImpulse.y = 0;
                } else {
                    // warm the next iteration
                    positionImpulse.x *= positionWarming;
                    positionImpulse.y *= positionWarming;
                }
            }
        }
    };

    /**
     * Prepare pairs for velocity solving.
     * @method preSolveVelocity
     * @param {pair[]} pairs
     */
    Resolver.preSolveVelocity = function(pairs) {
        var pairsLength = pairs.length,
            i,
            j;
        
        for (i = 0; i < pairsLength; i++) {
            var pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;
            
            var contacts = pair.activeContacts,
                contactsLength = contacts.length,
                collision = pair.collision,
                bodyA = collision.parentA,
                bodyB = collision.parentB,
                normal = collision.normal,
                tangent = collision.tangent;
    
            // resolve each contact
            for (j = 0; j < contactsLength; j++) {
                var contact = contacts[j],
                    contactVertex = contact.vertex,
                    normalImpulse = contact.normalImpulse,
                    tangentImpulse = contact.tangentImpulse;
    
                if (normalImpulse !== 0 || tangentImpulse !== 0) {
                    // total impulse from contact
                    var impulseX = normal.x * normalImpulse + tangent.x * tangentImpulse,
                        impulseY = normal.y * normalImpulse + tangent.y * tangentImpulse;
                    
                    // apply impulse from contact
                    if (!(bodyA.isStatic || bodyA.isSleeping)) {
                        bodyA.positionPrev.x += impulseX * bodyA.inverseMass;
                        bodyA.positionPrev.y += impulseY * bodyA.inverseMass;
                        bodyA.anglePrev += bodyA.inverseInertia * (
                            (contactVertex.x - bodyA.position.x) * impulseY
                            - (contactVertex.y - bodyA.position.y) * impulseX
                        );
                    }
    
                    if (!(bodyB.isStatic || bodyB.isSleeping)) {
                        bodyB.positionPrev.x -= impulseX * bodyB.inverseMass;
                        bodyB.positionPrev.y -= impulseY * bodyB.inverseMass;
                        bodyB.anglePrev -= bodyB.inverseInertia * (
                            (contactVertex.x - bodyB.position.x) * impulseY 
                            - (contactVertex.y - bodyB.position.y) * impulseX
                        );
                    }
                }
            }
        }
    };

    /**
     * Find a solution for pair velocities.
     * @method solveVelocity
     * @param {pair[]} pairs
     * @param {number} timeScale
     */
    Resolver.solveVelocity = function(pairs, timeScale) {
        var timeScaleSquared = timeScale * timeScale,
            restingThresh = Resolver._restingThresh * timeScaleSquared,
            frictionNormalMultiplier = Resolver._frictionNormalMultiplier,
            restingThreshTangent = Resolver._restingThreshTangent * timeScaleSquared,
            NumberMaxValue = Number.MAX_VALUE,
            pairsLength = pairs.length,
            tangentImpulse,
            maxFriction,
            i,
            j;

        for (i = 0; i < pairsLength; i++) {
            var pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;
            
            var collision = pair.collision,
                bodyA = collision.parentA,
                bodyB = collision.parentB,
                bodyAVelocity = bodyA.velocity,
                bodyBVelocity = bodyB.velocity,
                normalX = collision.normal.x,
                normalY = collision.normal.y,
                tangentX = collision.tangent.x,
                tangentY = collision.tangent.y,
                contacts = pair.activeContacts,
                contactsLength = contacts.length,
                contactShare = 1 / contactsLength,
                inverseMassTotal = bodyA.inverseMass + bodyB.inverseMass,
                friction = pair.friction * pair.frictionStatic * frictionNormalMultiplier * timeScaleSquared;

            // update body velocities
            bodyAVelocity.x = bodyA.position.x - bodyA.positionPrev.x;
            bodyAVelocity.y = bodyA.position.y - bodyA.positionPrev.y;
            bodyBVelocity.x = bodyB.position.x - bodyB.positionPrev.x;
            bodyBVelocity.y = bodyB.position.y - bodyB.positionPrev.y;
            bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
            bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;

            // resolve each contact
            for (j = 0; j < contactsLength; j++) {
                var contact = contacts[j],
                    contactVertex = contact.vertex;

                var offsetAX = contactVertex.x - bodyA.position.x,
                    offsetAY = contactVertex.y - bodyA.position.y,
                    offsetBX = contactVertex.x - bodyB.position.x,
                    offsetBY = contactVertex.y - bodyB.position.y;
 
                var velocityPointAX = bodyAVelocity.x - offsetAY * bodyA.angularVelocity,
                    velocityPointAY = bodyAVelocity.y + offsetAX * bodyA.angularVelocity,
                    velocityPointBX = bodyBVelocity.x - offsetBY * bodyB.angularVelocity,
                    velocityPointBY = bodyBVelocity.y + offsetBX * bodyB.angularVelocity;

                var relativeVelocityX = velocityPointAX - velocityPointBX,
                    relativeVelocityY = velocityPointAY - velocityPointBY;

                var normalVelocity = normalX * relativeVelocityX + normalY * relativeVelocityY,
                    tangentVelocity = tangentX * relativeVelocityX + tangentY * relativeVelocityY;

                // coulomb friction
                var normalOverlap = pair.separation + normalVelocity;
                var normalForce = Math.min(normalOverlap, 1);
                normalForce = normalOverlap < 0 ? 0 : normalForce;
                
                var frictionLimit = normalForce * friction;

                if (tangentVelocity > frictionLimit || -tangentVelocity > frictionLimit) {
                    maxFriction = tangentVelocity > 0 ? tangentVelocity : -tangentVelocity;
                    tangentImpulse = pair.friction * (tangentVelocity > 0 ? 1 : -1) * timeScaleSquared;
                    
                    if (tangentImpulse < -maxFriction) {
                        tangentImpulse = -maxFriction;
                    } else if (tangentImpulse > maxFriction) {
                        tangentImpulse = maxFriction;
                    }
                } else {
                    tangentImpulse = tangentVelocity;
                    maxFriction = NumberMaxValue;
                }

                // account for mass, inertia and contact offset
                var oAcN = offsetAX * normalY - offsetAY * normalX,
                    oBcN = offsetBX * normalY - offsetBY * normalX,
                    share = contactShare / (inverseMassTotal + bodyA.inverseInertia * oAcN * oAcN + bodyB.inverseInertia * oBcN * oBcN);

                // raw impulses
                var normalImpulse = (1 + pair.restitution) * normalVelocity * share;
                tangentImpulse *= share;

                // handle high velocity and resting collisions separately
                if (normalVelocity * normalVelocity > restingThresh && normalVelocity < 0) {
                    // high normal velocity so clear cached contact normal impulse
                    contact.normalImpulse = 0;
                } else {
                    // solve resting collision constraints using Erin Catto's method (GDC08)
                    // impulse constraint tends to 0
                    var contactNormalImpulse = contact.normalImpulse;
                    contact.normalImpulse += normalImpulse;
                    contact.normalImpulse = Math.min(contact.normalImpulse, 0);
                    normalImpulse = contact.normalImpulse - contactNormalImpulse;
                }

                // handle high velocity and resting collisions separately
                if (tangentVelocity * tangentVelocity > restingThreshTangent) {
                    // high tangent velocity so clear cached contact tangent impulse
                    contact.tangentImpulse = 0;
                } else {
                    // solve resting collision constraints using Erin Catto's method (GDC08)
                    // tangent impulse tends to -tangentSpeed or +tangentSpeed
                    var contactTangentImpulse = contact.tangentImpulse;
                    contact.tangentImpulse += tangentImpulse;
                    if (contact.tangentImpulse < -maxFriction) contact.tangentImpulse = -maxFriction;
                    if (contact.tangentImpulse > maxFriction) contact.tangentImpulse = maxFriction;
                    tangentImpulse = contact.tangentImpulse - contactTangentImpulse;
                }

                // total impulse from contact
                var impulseX = normalX * normalImpulse + tangentX * tangentImpulse,
                    impulseY = normalY * normalImpulse + tangentY * tangentImpulse;
                
                // apply impulse from contact
                if (!(bodyA.isStatic || bodyA.isSleeping)) {
                    bodyA.positionPrev.x += impulseX * bodyA.inverseMass;
                    bodyA.positionPrev.y += impulseY * bodyA.inverseMass;
                    bodyA.anglePrev += (offsetAX * impulseY - offsetAY * impulseX) * bodyA.inverseInertia;
                }

                if (!(bodyB.isStatic || bodyB.isSleeping)) {
                    bodyB.positionPrev.x -= impulseX * bodyB.inverseMass;
                    bodyB.positionPrev.y -= impulseY * bodyB.inverseMass;
                    bodyB.anglePrev -= (offsetBX * impulseY - offsetBY * impulseX) * bodyB.inverseInertia;
                }
            }
        }
    };

})();


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Pairs` module contains methods for creating and manipulating collision pair sets.
*
* @class Pairs
*/

var Pairs = {};

module.exports = Pairs;

var Pair = __webpack_require__(9);
var Common = __webpack_require__(0);

(function() {

    /**
     * Creates a new pairs structure.
     * @method create
     * @param {object} options
     * @return {pairs} A new pairs structure
     */
    Pairs.create = function(options) {
        return Common.extend({ 
            table: {},
            list: [],
            collisionStart: [],
            collisionActive: [],
            collisionEnd: []
        }, options);
    };

    /**
     * Updates pairs given a list of collisions.
     * @method update
     * @param {object} pairs
     * @param {collision[]} collisions
     * @param {number} timestamp
     */
    Pairs.update = function(pairs, collisions, timestamp) {
        var pairsList = pairs.list,
            pairsListLength = pairsList.length,
            pairsTable = pairs.table,
            collisionsLength = collisions.length,
            collisionStart = pairs.collisionStart,
            collisionEnd = pairs.collisionEnd,
            collisionActive = pairs.collisionActive,
            collision,
            pairIndex,
            pair,
            i;

        // clear collision state arrays, but maintain old reference
        collisionStart.length = 0;
        collisionEnd.length = 0;
        collisionActive.length = 0;

        for (i = 0; i < pairsListLength; i++) {
            pairsList[i].confirmedActive = false;
        }

        for (i = 0; i < collisionsLength; i++) {
            collision = collisions[i];
            pair = collision.pair;

            if (pair) {
                // pair already exists (but may or may not be active)
                if (pair.isActive) {
                    // pair exists and is active
                    collisionActive.push(pair);
                } else {
                    // pair exists but was inactive, so a collision has just started again
                    collisionStart.push(pair);
                }

                // update the pair
                Pair.update(pair, collision, timestamp);
                pair.confirmedActive = true;
            } else {
                // pair did not exist, create a new pair
                pair = Pair.create(collision, timestamp);
                pairsTable[pair.id] = pair;

                // push the new pair
                collisionStart.push(pair);
                pairsList.push(pair);
            }
        }

        // find pairs that are no longer active
        var removePairIndex = [];
        pairsListLength = pairsList.length;

        for (i = 0; i < pairsListLength; i++) {
            pair = pairsList[i];
            
            if (!pair.confirmedActive) {
                Pair.setActive(pair, false, timestamp);
                collisionEnd.push(pair);

                if (!pair.collision.bodyA.isSleeping && !pair.collision.bodyB.isSleeping) {
                    removePairIndex.push(i);
                }
            }
        }

        // remove inactive pairs
        for (i = 0; i < removePairIndex.length; i++) {
            pairIndex = removePairIndex[i] - i;
            pair = pairsList[pairIndex];
            pairsList.splice(pairIndex, 1);
            delete pairsTable[pair.id];
        }
    };

    /**
     * Clears the given pairs structure.
     * @method clear
     * @param {pairs} pairs
     * @return {pairs} pairs
     */
    Pairs.clear = function(pairs) {
        pairs.table = {};
        pairs.list.length = 0;
        pairs.collisionStart.length = 0;
        pairs.collisionActive.length = 0;
        pairs.collisionEnd.length = 0;
        return pairs;
    };

})();


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var Matter = module.exports = __webpack_require__(22);

Matter.Axes = __webpack_require__(11);
Matter.Bodies = __webpack_require__(12);
Matter.Body = __webpack_require__(6);
Matter.Bounds = __webpack_require__(1);
Matter.Collision = __webpack_require__(8);
Matter.Common = __webpack_require__(0);
Matter.Composite = __webpack_require__(5);
Matter.Composites = __webpack_require__(23);
Matter.Constraint = __webpack_require__(10);
Matter.Contact = __webpack_require__(17);
Matter.Detector = __webpack_require__(14);
Matter.Engine = __webpack_require__(18);
Matter.Events = __webpack_require__(4);
Matter.Grid = __webpack_require__(24);
Matter.Mouse = __webpack_require__(13);
Matter.MouseConstraint = __webpack_require__(25);
Matter.Pair = __webpack_require__(9);
Matter.Pairs = __webpack_require__(20);
Matter.Plugin = __webpack_require__(15);
Matter.Query = __webpack_require__(26);
Matter.Render = __webpack_require__(16);
Matter.Resolver = __webpack_require__(19);
Matter.Runner = __webpack_require__(27);
Matter.SAT = __webpack_require__(28);
Matter.Sleeping = __webpack_require__(7);
Matter.Svg = __webpack_require__(29);
Matter.Vector = __webpack_require__(2);
Matter.Vertices = __webpack_require__(3);
Matter.World = __webpack_require__(30);

// temporary back compatibility
Matter.Engine.run = Matter.Runner.run;
Matter.Common.deprecated(Matter.Engine, 'run', 'Engine.run ➤ use Matter.Runner.run(engine) instead');


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter` module is the top level namespace. It also includes a function for installing plugins on top of the library.
*
* @class Matter
*/

var Matter = {};

module.exports = Matter;

var Plugin = __webpack_require__(15);
var Common = __webpack_require__(0);

(function() {

    /**
     * The library name.
     * @property name
     * @readOnly
     * @type {String}
     */
    Matter.name = 'matter-js';

    /**
     * The library version.
     * @property version
     * @readOnly
     * @type {String}
     */
    Matter.version =  true ? "0.18.0" : undefined;

    /**
     * A list of plugin dependencies to be installed. These are normally set and installed through `Matter.use`.
     * Alternatively you may set `Matter.uses` manually and install them by calling `Plugin.use(Matter)`.
     * @property uses
     * @type {Array}
     */
    Matter.uses = [];

    /**
     * The plugins that have been installed through `Matter.Plugin.install`. Read only.
     * @property used
     * @readOnly
     * @type {Array}
     */
    Matter.used = [];

    /**
     * Installs the given plugins on the `Matter` namespace.
     * This is a short-hand for `Plugin.use`, see it for more information.
     * Call this function once at the start of your code, with all of the plugins you wish to install as arguments.
     * Avoid calling this function multiple times unless you intend to manually control installation order.
     * @method use
     * @param ...plugin {Function} The plugin(s) to install on `base` (multi-argument).
     */
    Matter.use = function() {
        Plugin.use(Matter, Array.prototype.slice.call(arguments));
    };

    /**
     * Chains a function to excute before the original function on the given `path` relative to `Matter`.
     * See also docs for `Common.chain`.
     * @method before
     * @param {string} path The path relative to `Matter`
     * @param {function} func The function to chain before the original
     * @return {function} The chained function that replaced the original
     */
    Matter.before = function(path, func) {
        path = path.replace(/^Matter./, '');
        return Common.chainPathBefore(Matter, path, func);
    };

    /**
     * Chains a function to excute after the original function on the given `path` relative to `Matter`.
     * See also docs for `Common.chain`.
     * @method after
     * @param {string} path The path relative to `Matter`
     * @param {function} func The function to chain after the original
     * @return {function} The chained function that replaced the original
     */
    Matter.after = function(path, func) {
        path = path.replace(/^Matter./, '');
        return Common.chainPathAfter(Matter, path, func);
    };

})();


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Composites` module contains factory methods for creating composite bodies
* with commonly used configurations (such as stacks and chains).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composites
*/

var Composites = {};

module.exports = Composites;

var Composite = __webpack_require__(5);
var Constraint = __webpack_require__(10);
var Common = __webpack_require__(0);
var Body = __webpack_require__(6);
var Bodies = __webpack_require__(12);
var deprecated = Common.deprecated;

(function() {

    /**
     * Create a new composite containing bodies created in the callback in a grid arrangement.
     * This function uses the body's bounds to prevent overlaps.
     * @method stack
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns
     * @param {number} rows
     * @param {number} columnGap
     * @param {number} rowGap
     * @param {function} callback
     * @return {composite} A new composite containing objects created in the callback
     */
    Composites.stack = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
        var stack = Composite.create({ label: 'Stack' }),
            x = xx,
            y = yy,
            lastBody,
            i = 0;

        for (var row = 0; row < rows; row++) {
            var maxHeight = 0;
            
            for (var column = 0; column < columns; column++) {
                var body = callback(x, y, column, row, lastBody, i);
                    
                if (body) {
                    var bodyHeight = body.bounds.max.y - body.bounds.min.y,
                        bodyWidth = body.bounds.max.x - body.bounds.min.x; 

                    if (bodyHeight > maxHeight)
                        maxHeight = bodyHeight;
                    
                    Body.translate(body, { x: bodyWidth * 0.5, y: bodyHeight * 0.5 });

                    x = body.bounds.max.x + columnGap;

                    Composite.addBody(stack, body);
                    
                    lastBody = body;
                    i += 1;
                } else {
                    x += columnGap;
                }
            }
            
            y += maxHeight + rowGap;
            x = xx;
        }

        return stack;
    };
    
    /**
     * Chains all bodies in the given composite together using constraints.
     * @method chain
     * @param {composite} composite
     * @param {number} xOffsetA
     * @param {number} yOffsetA
     * @param {number} xOffsetB
     * @param {number} yOffsetB
     * @param {object} options
     * @return {composite} A new composite containing objects chained together with constraints
     */
    Composites.chain = function(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options) {
        var bodies = composite.bodies;
        
        for (var i = 1; i < bodies.length; i++) {
            var bodyA = bodies[i - 1],
                bodyB = bodies[i],
                bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y,
                bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x, 
                bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y,
                bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
        
            var defaults = {
                bodyA: bodyA,
                pointA: { x: bodyAWidth * xOffsetA, y: bodyAHeight * yOffsetA },
                bodyB: bodyB,
                pointB: { x: bodyBWidth * xOffsetB, y: bodyBHeight * yOffsetB }
            };
            
            var constraint = Common.extend(defaults, options);
        
            Composite.addConstraint(composite, Constraint.create(constraint));
        }

        composite.label += ' Chain';
        
        return composite;
    };

    /**
     * Connects bodies in the composite with constraints in a grid pattern, with optional cross braces.
     * @method mesh
     * @param {composite} composite
     * @param {number} columns
     * @param {number} rows
     * @param {boolean} crossBrace
     * @param {object} options
     * @return {composite} The composite containing objects meshed together with constraints
     */
    Composites.mesh = function(composite, columns, rows, crossBrace, options) {
        var bodies = composite.bodies,
            row,
            col,
            bodyA,
            bodyB,
            bodyC;
        
        for (row = 0; row < rows; row++) {
            for (col = 1; col < columns; col++) {
                bodyA = bodies[(col - 1) + (row * columns)];
                bodyB = bodies[col + (row * columns)];
                Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));
            }

            if (row > 0) {
                for (col = 0; col < columns; col++) {
                    bodyA = bodies[col + ((row - 1) * columns)];
                    bodyB = bodies[col + (row * columns)];
                    Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));

                    if (crossBrace && col > 0) {
                        bodyC = bodies[(col - 1) + ((row - 1) * columns)];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
                    }

                    if (crossBrace && col < columns - 1) {
                        bodyC = bodies[(col + 1) + ((row - 1) * columns)];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
                    }
                }
            }
        }

        composite.label += ' Mesh';
        
        return composite;
    };
    
    /**
     * Create a new composite containing bodies created in the callback in a pyramid arrangement.
     * This function uses the body's bounds to prevent overlaps.
     * @method pyramid
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns
     * @param {number} rows
     * @param {number} columnGap
     * @param {number} rowGap
     * @param {function} callback
     * @return {composite} A new composite containing objects created in the callback
     */
    Composites.pyramid = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
        return Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column, row, lastBody, i) {
            var actualRows = Math.min(rows, Math.ceil(columns / 2)),
                lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;
            
            if (row > actualRows)
                return;
            
            // reverse row order
            row = actualRows - row;
            
            var start = row,
                end = columns - 1 - row;

            if (column < start || column > end)
                return;
            
            // retroactively fix the first body's position, since width was unknown
            if (i === 1) {
                Body.translate(lastBody, { x: (column + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
            }

            var xOffset = lastBody ? column * lastBodyWidth : 0;
            
            return callback(xx + xOffset + column * columnGap, y, column, row, lastBody, i);
        });
    };

    /**
     * This has now moved to the [newtonsCradle example](https://github.com/liabru/matter-js/blob/master/examples/newtonsCradle.js), follow that instead as this function is deprecated here.
     * @deprecated moved to newtonsCradle example
     * @method newtonsCradle
     * @param {number} xx
     * @param {number} yy
     * @param {number} number
     * @param {number} size
     * @param {number} length
     * @return {composite} A new composite newtonsCradle body
     */
    Composites.newtonsCradle = function(xx, yy, number, size, length) {
        var newtonsCradle = Composite.create({ label: 'Newtons Cradle' });

        for (var i = 0; i < number; i++) {
            var separation = 1.9,
                circle = Bodies.circle(xx + i * (size * separation), yy + length, size, 
                    { inertia: Infinity, restitution: 1, friction: 0, frictionAir: 0.0001, slop: 1 }),
                constraint = Constraint.create({ pointA: { x: xx + i * (size * separation), y: yy }, bodyB: circle });

            Composite.addBody(newtonsCradle, circle);
            Composite.addConstraint(newtonsCradle, constraint);
        }

        return newtonsCradle;
    };

    deprecated(Composites, 'newtonsCradle', 'Composites.newtonsCradle ➤ moved to newtonsCradle example');
    
    /**
     * This has now moved to the [car example](https://github.com/liabru/matter-js/blob/master/examples/car.js), follow that instead as this function is deprecated here.
     * @deprecated moved to car example
     * @method car
     * @param {number} xx
     * @param {number} yy
     * @param {number} width
     * @param {number} height
     * @param {number} wheelSize
     * @return {composite} A new composite car body
     */
    Composites.car = function(xx, yy, width, height, wheelSize) {
        var group = Body.nextGroup(true),
            wheelBase = 20,
            wheelAOffset = -width * 0.5 + wheelBase,
            wheelBOffset = width * 0.5 - wheelBase,
            wheelYOffset = 0;
    
        var car = Composite.create({ label: 'Car' }),
            body = Bodies.rectangle(xx, yy, width, height, { 
                collisionFilter: {
                    group: group
                },
                chamfer: {
                    radius: height * 0.5
                },
                density: 0.0002
            });
    
        var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, { 
            collisionFilter: {
                group: group
            },
            friction: 0.8
        });
                    
        var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, { 
            collisionFilter: {
                group: group
            },
            friction: 0.8
        });
                    
        var axelA = Constraint.create({
            bodyB: body,
            pointB: { x: wheelAOffset, y: wheelYOffset },
            bodyA: wheelA,
            stiffness: 1,
            length: 0
        });
                        
        var axelB = Constraint.create({
            bodyB: body,
            pointB: { x: wheelBOffset, y: wheelYOffset },
            bodyA: wheelB,
            stiffness: 1,
            length: 0
        });
        
        Composite.addBody(car, body);
        Composite.addBody(car, wheelA);
        Composite.addBody(car, wheelB);
        Composite.addConstraint(car, axelA);
        Composite.addConstraint(car, axelB);

        return car;
    };

    deprecated(Composites, 'car', 'Composites.car ➤ moved to car example');

    /**
     * This has now moved to the [softBody example](https://github.com/liabru/matter-js/blob/master/examples/softBody.js)
     * and the [cloth example](https://github.com/liabru/matter-js/blob/master/examples/cloth.js), follow those instead as this function is deprecated here.
     * @deprecated moved to softBody and cloth examples
     * @method softBody
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns
     * @param {number} rows
     * @param {number} columnGap
     * @param {number} rowGap
     * @param {boolean} crossBrace
     * @param {number} particleRadius
     * @param {} particleOptions
     * @param {} constraintOptions
     * @return {composite} A new composite softBody
     */
    Composites.softBody = function(xx, yy, columns, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions) {
        particleOptions = Common.extend({ inertia: Infinity }, particleOptions);
        constraintOptions = Common.extend({ stiffness: 0.2, render: { type: 'line', anchors: false } }, constraintOptions);

        var softBody = Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y) {
            return Bodies.circle(x, y, particleRadius, particleOptions);
        });

        Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);

        softBody.label = 'Soft Body';

        return softBody;
    };

    deprecated(Composites, 'softBody', 'Composites.softBody ➤ moved to softBody and cloth examples');
})();


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

/**
* This module has now been replaced by `Matter.Detector`.
*
* All usage should be migrated to `Matter.Detector` or another alternative.
* For back-compatibility purposes this module will remain for a short term and then later removed in a future release.
*
* The `Matter.Grid` module contains methods for creating and manipulating collision broadphase grid structures.
*
* @class Grid
* @deprecated
*/

var Grid = {};

module.exports = Grid;

var Pair = __webpack_require__(9);
var Common = __webpack_require__(0);
var deprecated = Common.deprecated;

(function() {

    /**
     * Creates a new grid.
     * @deprecated replaced by Matter.Detector
     * @method create
     * @param {} options
     * @return {grid} A new grid
     */
    Grid.create = function(options) {
        var defaults = {
            buckets: {},
            pairs: {},
            pairsList: [],
            bucketWidth: 48,
            bucketHeight: 48
        };

        return Common.extend(defaults, options);
    };

    /**
     * The width of a single grid bucket.
     *
     * @property bucketWidth
     * @type number
     * @default 48
     */

    /**
     * The height of a single grid bucket.
     *
     * @property bucketHeight
     * @type number
     * @default 48
     */

    /**
     * Updates the grid.
     * @deprecated replaced by Matter.Detector
     * @method update
     * @param {grid} grid
     * @param {body[]} bodies
     * @param {engine} engine
     * @param {boolean} forceUpdate
     */
    Grid.update = function(grid, bodies, engine, forceUpdate) {
        var i, col, row,
            world = engine.world,
            buckets = grid.buckets,
            bucket,
            bucketId,
            gridChanged = false;

        for (i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isSleeping && !forceUpdate)
                continue;

            // temporary back compatibility bounds check
            if (world.bounds && (body.bounds.max.x < world.bounds.min.x || body.bounds.min.x > world.bounds.max.x
                || body.bounds.max.y < world.bounds.min.y || body.bounds.min.y > world.bounds.max.y))
                continue;

            var newRegion = Grid._getRegion(grid, body);

            // if the body has changed grid region
            if (!body.region || newRegion.id !== body.region.id || forceUpdate) {

                if (!body.region || forceUpdate)
                    body.region = newRegion;

                var union = Grid._regionUnion(newRegion, body.region);

                // update grid buckets affected by region change
                // iterate over the union of both regions
                for (col = union.startCol; col <= union.endCol; col++) {
                    for (row = union.startRow; row <= union.endRow; row++) {
                        bucketId = Grid._getBucketId(col, row);
                        bucket = buckets[bucketId];

                        var isInsideNewRegion = (col >= newRegion.startCol && col <= newRegion.endCol
                                                && row >= newRegion.startRow && row <= newRegion.endRow);

                        var isInsideOldRegion = (col >= body.region.startCol && col <= body.region.endCol
                                                && row >= body.region.startRow && row <= body.region.endRow);

                        // remove from old region buckets
                        if (!isInsideNewRegion && isInsideOldRegion) {
                            if (isInsideOldRegion) {
                                if (bucket)
                                    Grid._bucketRemoveBody(grid, bucket, body);
                            }
                        }

                        // add to new region buckets
                        if (body.region === newRegion || (isInsideNewRegion && !isInsideOldRegion) || forceUpdate) {
                            if (!bucket)
                                bucket = Grid._createBucket(buckets, bucketId);
                            Grid._bucketAddBody(grid, bucket, body);
                        }
                    }
                }

                // set the new region
                body.region = newRegion;

                // flag changes so we can update pairs
                gridChanged = true;
            }
        }

        // update pairs list only if pairs changed (i.e. a body changed region)
        if (gridChanged)
            grid.pairsList = Grid._createActivePairsList(grid);
    };

    deprecated(Grid, 'update', 'Grid.update ➤ replaced by Matter.Detector');

    /**
     * Clears the grid.
     * @deprecated replaced by Matter.Detector
     * @method clear
     * @param {grid} grid
     */
    Grid.clear = function(grid) {
        grid.buckets = {};
        grid.pairs = {};
        grid.pairsList = [];
    };

    deprecated(Grid, 'clear', 'Grid.clear ➤ replaced by Matter.Detector');

    /**
     * Finds the union of two regions.
     * @method _regionUnion
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} regionA
     * @param {} regionB
     * @return {} region
     */
    Grid._regionUnion = function(regionA, regionB) {
        var startCol = Math.min(regionA.startCol, regionB.startCol),
            endCol = Math.max(regionA.endCol, regionB.endCol),
            startRow = Math.min(regionA.startRow, regionB.startRow),
            endRow = Math.max(regionA.endRow, regionB.endRow);

        return Grid._createRegion(startCol, endCol, startRow, endRow);
    };

    /**
     * Gets the region a given body falls in for a given grid.
     * @method _getRegion
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} grid
     * @param {} body
     * @return {} region
     */
    Grid._getRegion = function(grid, body) {
        var bounds = body.bounds,
            startCol = Math.floor(bounds.min.x / grid.bucketWidth),
            endCol = Math.floor(bounds.max.x / grid.bucketWidth),
            startRow = Math.floor(bounds.min.y / grid.bucketHeight),
            endRow = Math.floor(bounds.max.y / grid.bucketHeight);

        return Grid._createRegion(startCol, endCol, startRow, endRow);
    };

    /**
     * Creates a region.
     * @method _createRegion
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} startCol
     * @param {} endCol
     * @param {} startRow
     * @param {} endRow
     * @return {} region
     */
    Grid._createRegion = function(startCol, endCol, startRow, endRow) {
        return { 
            id: startCol + ',' + endCol + ',' + startRow + ',' + endRow,
            startCol: startCol, 
            endCol: endCol, 
            startRow: startRow, 
            endRow: endRow 
        };
    };

    /**
     * Gets the bucket id at the given position.
     * @method _getBucketId
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} column
     * @param {} row
     * @return {string} bucket id
     */
    Grid._getBucketId = function(column, row) {
        return 'C' + column + 'R' + row;
    };

    /**
     * Creates a bucket.
     * @method _createBucket
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} buckets
     * @param {} bucketId
     * @return {} bucket
     */
    Grid._createBucket = function(buckets, bucketId) {
        var bucket = buckets[bucketId] = [];
        return bucket;
    };

    /**
     * Adds a body to a bucket.
     * @method _bucketAddBody
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} grid
     * @param {} bucket
     * @param {} body
     */
    Grid._bucketAddBody = function(grid, bucket, body) {
        var gridPairs = grid.pairs,
            pairId = Pair.id,
            bucketLength = bucket.length,
            i;

        // add new pairs
        for (i = 0; i < bucketLength; i++) {
            var bodyB = bucket[i];

            if (body.id === bodyB.id || (body.isStatic && bodyB.isStatic))
                continue;

            // keep track of the number of buckets the pair exists in
            // important for Grid.update to work
            var id = pairId(body, bodyB),
                pair = gridPairs[id];

            if (pair) {
                pair[2] += 1;
            } else {
                gridPairs[id] = [body, bodyB, 1];
            }
        }

        // add to bodies (after pairs, otherwise pairs with self)
        bucket.push(body);
    };

    /**
     * Removes a body from a bucket.
     * @method _bucketRemoveBody
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} grid
     * @param {} bucket
     * @param {} body
     */
    Grid._bucketRemoveBody = function(grid, bucket, body) {
        var gridPairs = grid.pairs,
            pairId = Pair.id,
            i;

        // remove from bucket
        bucket.splice(Common.indexOf(bucket, body), 1);

        var bucketLength = bucket.length;

        // update pair counts
        for (i = 0; i < bucketLength; i++) {
            // keep track of the number of buckets the pair exists in
            // important for _createActivePairsList to work
            var pair = gridPairs[pairId(body, bucket[i])];

            if (pair)
                pair[2] -= 1;
        }
    };

    /**
     * Generates a list of the active pairs in the grid.
     * @method _createActivePairsList
     * @deprecated replaced by Matter.Detector
     * @private
     * @param {} grid
     * @return [] pairs
     */
    Grid._createActivePairsList = function(grid) {
        var pair,
            gridPairs = grid.pairs,
            pairKeys = Common.keys(gridPairs),
            pairKeysLength = pairKeys.length,
            pairs = [],
            k;

        // iterate over grid.pairs
        for (k = 0; k < pairKeysLength; k++) {
            pair = gridPairs[pairKeys[k]];

            // if pair exists in at least one bucket
            // it is a pair that needs further collision testing so push it
            if (pair[2] > 0) {
                pairs.push(pair);
            } else {
                delete gridPairs[pairKeys[k]];
            }
        }

        return pairs;
    };
    
})();


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.MouseConstraint` module contains methods for creating mouse constraints.
* Mouse constraints are used for allowing user interaction, providing the ability to move bodies via the mouse or touch.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class MouseConstraint
*/

var MouseConstraint = {};

module.exports = MouseConstraint;

var Vertices = __webpack_require__(3);
var Sleeping = __webpack_require__(7);
var Mouse = __webpack_require__(13);
var Events = __webpack_require__(4);
var Detector = __webpack_require__(14);
var Constraint = __webpack_require__(10);
var Composite = __webpack_require__(5);
var Common = __webpack_require__(0);
var Bounds = __webpack_require__(1);

(function() {

    /**
     * Creates a new mouse constraint.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {engine} engine
     * @param {} options
     * @return {MouseConstraint} A new MouseConstraint
     */
    MouseConstraint.create = function(engine, options) {
        var mouse = (engine ? engine.mouse : null) || (options ? options.mouse : null);

        if (!mouse) {
            if (engine && engine.render && engine.render.canvas) {
                mouse = Mouse.create(engine.render.canvas);
            } else if (options && options.element) {
                mouse = Mouse.create(options.element);
            } else {
                mouse = Mouse.create();
                Common.warn('MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected');
            }
        }

        var constraint = Constraint.create({ 
            label: 'Mouse Constraint',
            pointA: mouse.position,
            pointB: { x: 0, y: 0 },
            length: 0.01, 
            stiffness: 0.1,
            angularStiffness: 1,
            render: {
                strokeStyle: '#90EE90',
                lineWidth: 3
            }
        });

        var defaults = {
            type: 'mouseConstraint',
            mouse: mouse,
            element: null,
            body: null,
            constraint: constraint,
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            }
        };

        var mouseConstraint = Common.extend(defaults, options);

        Events.on(engine, 'beforeUpdate', function() {
            var allBodies = Composite.allBodies(engine.world);
            MouseConstraint.update(mouseConstraint, allBodies);
            MouseConstraint._triggerEvents(mouseConstraint);
        });

        return mouseConstraint;
    };

    /**
     * Updates the given mouse constraint.
     * @private
     * @method update
     * @param {MouseConstraint} mouseConstraint
     * @param {body[]} bodies
     */
    MouseConstraint.update = function(mouseConstraint, bodies) {
        var mouse = mouseConstraint.mouse,
            constraint = mouseConstraint.constraint,
            body = mouseConstraint.body;

        if (mouse.button === 0) {
            if (!constraint.bodyB) {
                for (var i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (Bounds.contains(body.bounds, mouse.position) 
                            && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
                        for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices.contains(part.vertices, mouse.position)) {
                                constraint.pointA = mouse.position;
                                constraint.bodyB = mouseConstraint.body = body;
                                constraint.pointB = { x: mouse.position.x - body.position.x, y: mouse.position.y - body.position.y };
                                constraint.angleB = body.angle;

                                Sleeping.set(body, false);
                                Events.trigger(mouseConstraint, 'startdrag', { mouse: mouse, body: body });

                                break;
                            }
                        }
                    }
                }
            } else {
                Sleeping.set(constraint.bodyB, false);
                constraint.pointA = mouse.position;
            }
        } else {
            constraint.bodyB = mouseConstraint.body = null;
            constraint.pointB = null;

            if (body)
                Events.trigger(mouseConstraint, 'enddrag', { mouse: mouse, body: body });
        }
    };

    /**
     * Triggers mouse constraint events.
     * @method _triggerEvents
     * @private
     * @param {mouse} mouseConstraint
     */
    MouseConstraint._triggerEvents = function(mouseConstraint) {
        var mouse = mouseConstraint.mouse,
            mouseEvents = mouse.sourceEvents;

        if (mouseEvents.mousemove)
            Events.trigger(mouseConstraint, 'mousemove', { mouse: mouse });

        if (mouseEvents.mousedown)
            Events.trigger(mouseConstraint, 'mousedown', { mouse: mouse });

        if (mouseEvents.mouseup)
            Events.trigger(mouseConstraint, 'mouseup', { mouse: mouse });

        // reset the mouse state ready for the next step
        Mouse.clearSourceEvents(mouse);
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired when the mouse has moved (or a touch moves) during the last step
    *
    * @event mousemove
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the mouse is down (or a touch has started) during the last step
    *
    * @event mousedown
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the mouse is up (or a touch has ended) during the last step
    *
    * @event mouseup
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the user starts dragging a body
    *
    * @event startdrag
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {body} event.body The body being dragged
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the user ends dragging a body
    *
    * @event enddrag
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {body} event.body The body that has stopped being dragged
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "constraint"
     * @readOnly
     */

    /**
     * The `Mouse` instance in use. If not supplied in `MouseConstraint.create`, one will be created.
     *
     * @property mouse
     * @type mouse
     * @default mouse
     */

    /**
     * The `Body` that is currently being moved by the user, or `null` if no body.
     *
     * @property body
     * @type body
     * @default null
     */

    /**
     * The `Constraint` object that is used to move the body during interaction.
     *
     * @property constraint
     * @type constraint
     */

    /**
     * An `Object` that specifies the collision filter properties.
     * The collision filter allows the user to define which types of body this mouse constraint can interact with.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter
     * @type object
     */

})();


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Query` module contains methods for performing collision queries.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Query
*/

var Query = {};

module.exports = Query;

var Vector = __webpack_require__(2);
var Collision = __webpack_require__(8);
var Bounds = __webpack_require__(1);
var Bodies = __webpack_require__(12);
var Vertices = __webpack_require__(3);

(function() {

    /**
     * Returns a list of collisions between `body` and `bodies`.
     * @method collides
     * @param {body} body
     * @param {body[]} bodies
     * @return {collision[]} Collisions
     */
    Query.collides = function(body, bodies) {
        var collisions = [],
            bodiesLength = bodies.length,
            bounds = body.bounds,
            collides = Collision.collides,
            overlaps = Bounds.overlaps;

        for (var i = 0; i < bodiesLength; i++) {
            var bodyA = bodies[i],
                partsALength = bodyA.parts.length,
                partsAStart = partsALength === 1 ? 0 : 1;
            
            if (overlaps(bodyA.bounds, bounds)) {
                for (var j = partsAStart; j < partsALength; j++) {
                    var part = bodyA.parts[j];

                    if (overlaps(part.bounds, bounds)) {
                        var collision = collides(part, body);

                        if (collision) {
                            collisions.push(collision);
                            break;
                        }
                    }
                }
            }
        }

        return collisions;
    };

    /**
     * Casts a ray segment against a set of bodies and returns all collisions, ray width is optional. Intersection points are not provided.
     * @method ray
     * @param {body[]} bodies
     * @param {vector} startPoint
     * @param {vector} endPoint
     * @param {number} [rayWidth]
     * @return {collision[]} Collisions
     */
    Query.ray = function(bodies, startPoint, endPoint, rayWidth) {
        rayWidth = rayWidth || 1e-100;

        var rayAngle = Vector.angle(startPoint, endPoint),
            rayLength = Vector.magnitude(Vector.sub(startPoint, endPoint)),
            rayX = (endPoint.x + startPoint.x) * 0.5,
            rayY = (endPoint.y + startPoint.y) * 0.5,
            ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, { angle: rayAngle }),
            collisions = Query.collides(ray, bodies);

        for (var i = 0; i < collisions.length; i += 1) {
            var collision = collisions[i];
            collision.body = collision.bodyB = collision.bodyA;            
        }

        return collisions;
    };

    /**
     * Returns all bodies whose bounds are inside (or outside if set) the given set of bounds, from the given set of bodies.
     * @method region
     * @param {body[]} bodies
     * @param {bounds} bounds
     * @param {bool} [outside=false]
     * @return {body[]} The bodies matching the query
     */
    Query.region = function(bodies, bounds, outside) {
        var result = [];

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                overlaps = Bounds.overlaps(body.bounds, bounds);
            if ((overlaps && !outside) || (!overlaps && outside))
                result.push(body);
        }

        return result;
    };

    /**
     * Returns all bodies whose vertices contain the given point, from the given set of bodies.
     * @method point
     * @param {body[]} bodies
     * @param {vector} point
     * @return {body[]} The bodies matching the query
     */
    Query.point = function(bodies, point) {
        var result = [];

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            
            if (Bounds.contains(body.bounds, point)) {
                for (var j = body.parts.length === 1 ? 0 : 1; j < body.parts.length; j++) {
                    var part = body.parts[j];

                    if (Bounds.contains(part.bounds, point)
                        && Vertices.contains(part.vertices, point)) {
                        result.push(body);
                        break;
                    }
                }
            }
        }

        return result;
    };

})();


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Runner` module is an optional utility which provides a game loop, 
* that handles continuously updating a `Matter.Engine` for you within a browser.
* It is intended for development and debugging purposes, but may also be suitable for simple games.
* If you are using your own game loop instead, then you do not need the `Matter.Runner` module.
* Instead just call `Engine.update(engine, delta)` in your own loop.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Runner
*/

var Runner = {};

module.exports = Runner;

var Events = __webpack_require__(4);
var Engine = __webpack_require__(18);
var Common = __webpack_require__(0);

(function() {

    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
   
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    if (!_requestAnimationFrame) {
        var _frameTimeout;

        _requestAnimationFrame = function(callback){ 
            _frameTimeout = setTimeout(function() { 
                callback(Common.now()); 
            }, 1000 / 60);
        };

        _cancelAnimationFrame = function() {
            clearTimeout(_frameTimeout);
        };
    }

    /**
     * Creates a new Runner. The options parameter is an object that specifies any properties you wish to override the defaults.
     * @method create
     * @param {} options
     */
    Runner.create = function(options) {
        var defaults = {
            fps: 60,
            correction: 1,
            deltaSampleSize: 60,
            counterTimestamp: 0,
            frameCounter: 0,
            deltaHistory: [],
            timePrev: null,
            timeScalePrev: 1,
            frameRequestId: null,
            isFixed: false,
            enabled: true
        };

        var runner = Common.extend(defaults, options);

        runner.delta = runner.delta || 1000 / runner.fps;
        runner.deltaMin = runner.deltaMin || 1000 / runner.fps;
        runner.deltaMax = runner.deltaMax || 1000 / (runner.fps * 0.5);
        runner.fps = 1000 / runner.delta;

        return runner;
    };

    /**
     * Continuously ticks a `Matter.Engine` by calling `Runner.tick` on the `requestAnimationFrame` event.
     * @method run
     * @param {engine} engine
     */
    Runner.run = function(runner, engine) {
        // create runner if engine is first argument
        if (typeof runner.positionIterations !== 'undefined') {
            engine = runner;
            runner = Runner.create();
        }

        (function render(time){
            runner.frameRequestId = _requestAnimationFrame(render);

            if (time && runner.enabled) {
                Runner.tick(runner, engine, time);
            }
        })();

        return runner;
    };

    /**
     * A game loop utility that updates the engine and renderer by one step (a 'tick').
     * Features delta smoothing, time correction and fixed or dynamic timing.
     * Consider just `Engine.update(engine, delta)` if you're using your own loop.
     * @method tick
     * @param {runner} runner
     * @param {engine} engine
     * @param {number} time
     */
    Runner.tick = function(runner, engine, time) {
        var timing = engine.timing,
            correction = 1,
            delta;

        // create an event object
        var event = {
            timestamp: timing.timestamp
        };

        Events.trigger(runner, 'beforeTick', event);

        if (runner.isFixed) {
            // fixed timestep
            delta = runner.delta;
        } else {
            // dynamic timestep based on wall clock between calls
            delta = (time - runner.timePrev) || runner.delta;
            runner.timePrev = time;

            // optimistically filter delta over a few frames, to improve stability
            runner.deltaHistory.push(delta);
            runner.deltaHistory = runner.deltaHistory.slice(-runner.deltaSampleSize);
            delta = Math.min.apply(null, runner.deltaHistory);
            
            // limit delta
            delta = delta < runner.deltaMin ? runner.deltaMin : delta;
            delta = delta > runner.deltaMax ? runner.deltaMax : delta;

            // correction for delta
            correction = delta / runner.delta;

            // update engine timing object
            runner.delta = delta;
        }

        // time correction for time scaling
        if (runner.timeScalePrev !== 0)
            correction *= timing.timeScale / runner.timeScalePrev;

        if (timing.timeScale === 0)
            correction = 0;

        runner.timeScalePrev = timing.timeScale;
        runner.correction = correction;

        // fps counter
        runner.frameCounter += 1;
        if (time - runner.counterTimestamp >= 1000) {
            runner.fps = runner.frameCounter * ((time - runner.counterTimestamp) / 1000);
            runner.counterTimestamp = time;
            runner.frameCounter = 0;
        }

        Events.trigger(runner, 'tick', event);

        // update
        Events.trigger(runner, 'beforeUpdate', event);
        Engine.update(engine, delta, correction);
        Events.trigger(runner, 'afterUpdate', event);

        Events.trigger(runner, 'afterTick', event);
    };

    /**
     * Ends execution of `Runner.run` on the given `runner`, by canceling the animation frame request event loop.
     * If you wish to only temporarily pause the engine, see `engine.enabled` instead.
     * @method stop
     * @param {runner} runner
     */
    Runner.stop = function(runner) {
        _cancelAnimationFrame(runner.frameRequestId);
    };

    /**
     * Alias for `Runner.run`.
     * @method start
     * @param {runner} runner
     * @param {engine} engine
     */
    Runner.start = function(runner, engine) {
        Runner.run(runner, engine);
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired at the start of a tick, before any updates to the engine or timing
    *
    * @event beforeTick
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after engine timing updated, but just before update
    *
    * @event tick
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired at the end of a tick, after engine update and after rendering
    *
    * @event afterTick
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired before update
    *
    * @event beforeUpdate
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after update
    *
    * @event afterUpdate
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * A flag that specifies whether the runner is running or not.
     *
     * @property enabled
     * @type boolean
     * @default true
     */

    /**
     * A `Boolean` that specifies if the runner should use a fixed timestep (otherwise it is variable).
     * If timing is fixed, then the apparent simulation speed will change depending on the frame rate (but behaviour will be deterministic).
     * If the timing is variable, then the apparent simulation speed will be constant (approximately, but at the cost of determininism).
     *
     * @property isFixed
     * @type boolean
     * @default false
     */

    /**
     * A `Number` that specifies the time step between updates in milliseconds.
     * If `engine.timing.isFixed` is set to `true`, then `delta` is fixed.
     * If it is `false`, then `delta` can dynamically change to maintain the correct apparent simulation speed.
     *
     * @property delta
     * @type number
     * @default 1000 / 60
     */

})();


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

/**
* This module has now been replaced by `Matter.Collision`.
*
* All usage should be migrated to `Matter.Collision`.
* For back-compatibility purposes this module will remain for a short term and then later removed in a future release.
*
* The `Matter.SAT` module contains methods for detecting collisions using the Separating Axis Theorem.
*
* @class SAT
* @deprecated
*/

var SAT = {};

module.exports = SAT;

var Collision = __webpack_require__(8);
var Common = __webpack_require__(0);
var deprecated = Common.deprecated;

(function() {

    /**
     * Detect collision between two bodies using the Separating Axis Theorem.
     * @deprecated replaced by Collision.collides
     * @method collides
     * @param {body} bodyA
     * @param {body} bodyB
     * @return {collision} collision
     */
    SAT.collides = function(bodyA, bodyB) {
        return Collision.collides(bodyA, bodyB);
    };

    deprecated(SAT, 'collides', 'SAT.collides ➤ replaced by Collision.collides');

})();


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

/**
* The `Matter.Svg` module contains methods for converting SVG images into an array of vector points.
*
* To use this module you also need the SVGPathSeg polyfill: https://github.com/progers/pathseg
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Svg
*/

var Svg = {};

module.exports = Svg;

var Bounds = __webpack_require__(1);
var Common = __webpack_require__(0);

(function() {

    /**
     * Converts an SVG path into an array of vector points.
     * If the input path forms a concave shape, you must decompose the result into convex parts before use.
     * See `Bodies.fromVertices` which provides support for this.
     * Note that this function is not guaranteed to support complex paths (such as those with holes).
     * You must load the `pathseg.js` polyfill on newer browsers.
     * @method pathToVertices
     * @param {SVGPathElement} path
     * @param {Number} [sampleLength=15]
     * @return {Vector[]} points
     */
    Svg.pathToVertices = function(path, sampleLength) {
        if (typeof window !== 'undefined' && !('SVGPathSeg' in window)) {
            Common.warn('Svg.pathToVertices: SVGPathSeg not defined, a polyfill is required.');
        }

        // https://github.com/wout/svg.topoly.js/blob/master/svg.topoly.js
        var i, il, total, point, segment, segments, 
            segmentsQueue, lastSegment, 
            lastPoint, segmentIndex, points = [],
            lx, ly, length = 0, x = 0, y = 0;

        sampleLength = sampleLength || 15;

        var addPoint = function(px, py, pathSegType) {
            // all odd-numbered path types are relative except PATHSEG_CLOSEPATH (1)
            var isRelative = pathSegType % 2 === 1 && pathSegType > 1;

            // when the last point doesn't equal the current point add the current point
            if (!lastPoint || px != lastPoint.x || py != lastPoint.y) {
                if (lastPoint && isRelative) {
                    lx = lastPoint.x;
                    ly = lastPoint.y;
                } else {
                    lx = 0;
                    ly = 0;
                }

                var point = {
                    x: lx + px,
                    y: ly + py
                };

                // set last point
                if (isRelative || !lastPoint) {
                    lastPoint = point;
                }

                points.push(point);

                x = lx + px;
                y = ly + py;
            }
        };

        var addSegmentPoint = function(segment) {
            var segType = segment.pathSegTypeAsLetter.toUpperCase();

            // skip path ends
            if (segType === 'Z') 
                return;

            // map segment to x and y
            switch (segType) {

            case 'M':
            case 'L':
            case 'T':
            case 'C':
            case 'S':
            case 'Q':
                x = segment.x;
                y = segment.y;
                break;
            case 'H':
                x = segment.x;
                break;
            case 'V':
                y = segment.y;
                break;
            }

            addPoint(x, y, segment.pathSegType);
        };

        // ensure path is absolute
        Svg._svgPathToAbsolute(path);

        // get total length
        total = path.getTotalLength();

        // queue segments
        segments = [];
        for (i = 0; i < path.pathSegList.numberOfItems; i += 1)
            segments.push(path.pathSegList.getItem(i));

        segmentsQueue = segments.concat();

        // sample through path
        while (length < total) {
            // get segment at position
            segmentIndex = path.getPathSegAtLength(length);
            segment = segments[segmentIndex];

            // new segment
            if (segment != lastSegment) {
                while (segmentsQueue.length && segmentsQueue[0] != segment)
                    addSegmentPoint(segmentsQueue.shift());

                lastSegment = segment;
            }

            // add points in between when curving
            // TODO: adaptive sampling
            switch (segment.pathSegTypeAsLetter.toUpperCase()) {

            case 'C':
            case 'T':
            case 'S':
            case 'Q':
            case 'A':
                point = path.getPointAtLength(length);
                addPoint(point.x, point.y, 0);
                break;

            }

            // increment by sample value
            length += sampleLength;
        }

        // add remaining segments not passed by sampling
        for (i = 0, il = segmentsQueue.length; i < il; ++i)
            addSegmentPoint(segmentsQueue[i]);

        return points;
    };

    Svg._svgPathToAbsolute = function(path) {
        // http://phrogz.net/convert-svg-path-to-all-absolute-commands
        // Copyright (c) Gavin Kistner
        // http://phrogz.net/js/_ReuseLicense.txt
        // Modifications: tidy formatting and naming
        var x0, y0, x1, y1, x2, y2, segs = path.pathSegList,
            x = 0, y = 0, len = segs.numberOfItems;

        for (var i = 0; i < len; ++i) {
            var seg = segs.getItem(i),
                segType = seg.pathSegTypeAsLetter;

            if (/[MLHVCSQTA]/.test(segType)) {
                if ('x' in seg) x = seg.x;
                if ('y' in seg) y = seg.y;
            } else {
                if ('x1' in seg) x1 = x + seg.x1;
                if ('x2' in seg) x2 = x + seg.x2;
                if ('y1' in seg) y1 = y + seg.y1;
                if ('y2' in seg) y2 = y + seg.y2;
                if ('x' in seg) x += seg.x;
                if ('y' in seg) y += seg.y;

                switch (segType) {

                case 'm':
                    segs.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i);
                    break;
                case 'l':
                    segs.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i);
                    break;
                case 'h':
                    segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i);
                    break;
                case 'v':
                    segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i);
                    break;
                case 'c':
                    segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
                    break;
                case 's':
                    segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
                    break;
                case 'q':
                    segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
                    break;
                case 't':
                    segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
                    break;
                case 'a':
                    segs.replaceItem(path.createSVGPathSegArcAbs(x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag), i);
                    break;
                case 'z':
                case 'Z':
                    x = x0;
                    y = y0;
                    break;

                }
            }

            if (segType == 'M' || segType == 'm') {
                x0 = x;
                y0 = y;
            }
        }
    };

})();

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

/**
* This module has now been replaced by `Matter.Composite`.
*
* All usage should be migrated to the equivalent functions found on `Matter.Composite`.
* For example `World.add(world, body)` now becomes `Composite.add(world, body)`.
*
* The property `world.gravity` has been moved to `engine.gravity`.
*
* For back-compatibility purposes this module will remain as a direct alias to `Matter.Composite` in the short term during migration.
* Eventually this alias module will be marked as deprecated and then later removed in a future release.
*
* @class World
*/

var World = {};

module.exports = World;

var Composite = __webpack_require__(5);
var Common = __webpack_require__(0);

(function() {

    /**
     * See above, aliases for back compatibility only
     */
    World.create = Composite.create;
    World.add = Composite.add;
    World.remove = Composite.remove;
    World.clear = Composite.clear;
    World.addComposite = Composite.addComposite;
    World.addBody = Composite.addBody;
    World.addConstraint = Composite.addConstraint;

})();


/***/ })
/******/ ]);
});
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],58:[function(require,module,exports){
"use strict";

var _physic = _interopRequireDefault(require("./physic.js"));

var _stage = _interopRequireDefault(require("./stage.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class App {
  constructor() {
    this.physic = new _physic.default();
    this.stage = new _stage.default();
  }

}

new App(); // const animate = () =>{
//     app.canvas.animate();
// }
// document.getElementById('animate_button')?.addEventListener('click',animate)

},{"./physic.js":59,"./stage.js":60}],59:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _matterJs = _interopRequireDefault(require("matter-js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// module aliases
var Engine = _matterJs.default.Engine,
    Render = _matterJs.default.Render,
    Runner = _matterJs.default.Runner,
    Bodies = _matterJs.default.Bodies,
    Svg = _matterJs.default.Svg,
    Vertices = _matterJs.default.Vertices,
    Composite = _matterJs.default.Composite,
    Events = _matterJs.default.Events;

class Physic {
  constructor() {
    this.engine = Engine.create();
    this.render = Render.create({
      element: document.getElementsByTagName('a-scene')[0],
      engine: this.engine,
      options: {
        showPositions: true,
        showAngleIndicator: true,
        background: '#800000',
        wireframeBackground: 'none'
      }
    }); // create two boxes and a ground

    this.boxA = Bodies.rectangle(400, 200, 80, 80);
    var boxB = Bodies.rectangle(450, 50, 80, 80); // var boxC = Bodies.rectangle(550, 50, 80, 80);

    var ground = Bodies.rectangle(400, 610, 810, 60, {
      isStatic: true
    });
    Composite.add(this.engine.world, [this.boxA, boxB, ground]);
    this.run();
  }

  add_body(x, y, vertices) {
    let body = Bodies.fromVertices(x, y, vertices);
    console.log(body);
    Composite.add(this.engine.world, body);
  }

  run() {
    var runner;
    Render.run(this.render); // create runner

    runner = Runner.create(); // run the engine

    Runner.run(runner, this.engine);
    Events.on(this.engine, 'afterUpdate', () => {
      console.log(this.boxA.position);
    });
  }

}

exports.default = Physic;

},{"matter-js":57}],60:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _konva = _interopRequireDefault(require("konva"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Stage {
  constructor() {
    this.stage = new _konva.default.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight - 25
    });
    this.layer = new _konva.default.Layer();
    this.isPaint = false; // this.layer.add(circle);

    this.stage.add(this.layer); // this.layer.draw();

    this.stage.on('mousedown touchstart', e => {
      this.isPaint = true;
      var pos = this.stage.getPointerPosition();
      this.lastLine = new _konva.default.Line({
        stroke: '#df4b26',
        strokeWidth: 5,
        globalCompositeOperation: 'source-over',
        // round cap for smoother lines
        lineCap: 'round',
        // add point twice, so we have some drawings even on a simple click
        //@ts-ignore
        points: [pos.x, pos.y, pos.x, pos.y]
      });
      this.layer.add(this.lastLine);
    });
    this.stage.on('mouseup touchend', () => {
      this.isPaint = false;
    }); // and core function - drawing

    this.stage.on('mousemove touchmove', e => {
      console.log("herer!");

      if (!this.isPaint) {
        return;
      } // prevent scrolling on touch devices


      e.evt.preventDefault();
      const pos = this.stage.getPointerPosition(); //@ts-ignore

      var newPoints = this.lastLine.points().concat([pos.x, pos.y]);
      this.lastLine.points(newPoints);
    });
  }

}

exports.default = Stage;

},{"konva":39}]},{},[58]);
