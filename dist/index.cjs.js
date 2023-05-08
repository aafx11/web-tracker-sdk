'use strict';

//版本
var TrackerConfig;
(function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
})(TrackerConfig || (TrackerConfig = {}));

/**
 * Event 创建自定义事件
 * dispatchEvent 派发事件
 * addEventListener 监听事件
 * removeEventListener 删除事件
 */
// PV：页面访问量，即PageView，用户每次对网站的访问均被记录
// 重写History事件， 泛型约束
const createHistoryEvnent = (type) => {
    const origin = history[type]; // 原始事件
    return function () {
        const res = origin.apply(this, arguments);
        var e = new Event(type);
        window.dispatchEvent(e);
        return res;
    };
};

const MouseEventList = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover'];
class Tracker {
    constructor(options) {
        this.data = Object.assign(this.initDef(), options);
        this.installInnerTrack();
    }
    initDef() {
        this.version = TrackerConfig.version;
        window.history['pushState'] = createHistoryEvnent("pushState");
        window.history['replaceState'] = createHistoryEvnent('replaceState');
        return {
            sdkVersion: this.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        };
    }
    setUserId(uuid) {
        this.data.uuid = uuid;
    }
    setExtra(extra) {
        this.data.extra = extra;
    }
    sendTracker(data) {
        this.reportTracker(data);
    }
    captureEvents(MouseEventList, targetKey, data) {
        MouseEventList.forEach(event => {
            window.addEventListener(event, () => {
                this.reportTracker({ event, targetKey, data });
            });
        });
    }
    installInnerTrack() {
        if (this.data.historyTracker) {
            this.captureEvents(['pushState'], 'history-pv');
            this.captureEvents(['replaceState'], 'history-pv');
            this.captureEvents(['popstate'], 'history-pv');
        }
        if (this.data.hashTracker) {
            this.captureEvents(['hashchange'], 'hash-pv');
        }
        if (this.data.domTracker) {
            this.targetKeyReport();
        }
        if (this.data.jsError) {
            this.jsError();
        }
    }
    //dom 点击上报
    targetKeyReport() {
        MouseEventList.forEach(event => {
            window.addEventListener(event, (e) => {
                const target = e.target;
                const targetValue = target.getAttribute('target-key');
                if (targetValue) {
                    this.sendTracker({
                        targetKey: targetValue,
                        event
                    });
                }
            });
        });
    }
    jsError() {
        this.errorEvent();
        this.promiseReject();
    }
    //捕获js报错
    errorEvent() {
        window.addEventListener('error', (e) => {
            this.sendTracker({
                targetKey: 'message',
                event: 'error',
                message: e.message
            });
        });
    }
    //捕获promise 错误
    promiseReject() {
        window.addEventListener('unhandledrejection', (event) => {
            event.promise.catch(error => {
                this.sendTracker({
                    targetKey: "reject",
                    event: "promise",
                    message: error
                });
            });
        });
    }
    //上报
    reportTracker(data) {
        const params = Object.assign(this.data, data, { time: new Date().getTime() });
        let headers = {
            type: 'application/x-www-form-urlencoded'
        };
        let blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon(this.data.requestUrl, blob);
    }
}

module.exports = Tracker;
