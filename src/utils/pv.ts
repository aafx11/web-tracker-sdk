/**
 * Event 创建自定义事件
 * dispatchEvent 派发事件 
 * addEventListener 监听事件
 * removeEventListener 删除事件
 */

// PV：页面访问量，即PageView，用户每次对网站的访问均被记录

// 重写History事件， 泛型约束
export const createHistoryEvnent = <T extends keyof History>(type: T): () => any => {
  const origin = history[type]; // 原始事件
  return function (this: any) {
    const res = origin.apply(this, arguments)
    var e = new Event(type)
    window.dispatchEvent(e)
    return res;
  }
}