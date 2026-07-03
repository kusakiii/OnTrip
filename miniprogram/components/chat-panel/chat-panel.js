/**
 * chat-panel — 对话面板（BottomSheet 内嵌）
 *
 * 原则：对话不抢主界面，始终在 Sheet 内
 * 快速指令按钮提供常用操作，减少打字
 */
Component({
  options: { styleIsolation: 'shared' },
  properties: {
    tripId: { type: String, value: '' },
    messages: { type: Array, value: [] },
  },
  data: {
    inputText: '',
    loading: false,
    /** 快速指令 */
    quickCommands: [
      { id: 'more_food', label: '🍜 加个餐厅', prompt: '在第1天加一个本地特色餐厅' },
      { id: 'more_spot', label: '📍 加个景点', prompt: '推荐一个冷门但值得去的景点' },
      { id: 'remove_last', label: '🗑 删最后一项', prompt: '删掉今天的最后一个活动' },
      { id: 'relax', label: '☕ 节奏放慢', prompt: '整体节奏太赶了，少去一些地方' },
    ],
  },
  methods: {
    onInput(e) {
      this.setData({ inputText: e.detail.value });
    },
    onSend() {
      const text = this.data.inputText.trim();
      if (!text) {
        return;
      }
      this.setData({ inputText: '', loading: true });
      this.triggerEvent('send', { text });
    },
    onQuickCommand(e) {
      const { prompt } = e.currentTarget.dataset;
      this.triggerEvent('send', { text: prompt });
    },
  },
});
